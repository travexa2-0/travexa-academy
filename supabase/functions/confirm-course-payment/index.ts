import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'

// CORS helpers inlineados (función self-contained: sin dependencias relativas a
// ../_shared, para que el deploy vía MCP no arrastre archivos fuera de la carpeta).
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Max-Age': '86400',
}
function handleCors(req: Request): Response | null {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  return null
}
function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
}

const MP_API = 'https://api.mercadopago.com'

// deno-lint-ignore no-explicit-any
type Admin = any

// Inscripción idempotente. La tabla tiene UNIQUE (user_id, course_id), así que
// el upsert con ignoreDuplicates se traduce a INSERT ... ON CONFLICT DO NOTHING:
// si el otro camino (webhook o redirect) ya inscribió al usuario, esta llamada
// no hace nada y no rompe. `.select()` devuelve la fila SOLO cuando este llamado
// realmente creó el enrollment, así el contador de alumnos no se infla cuando
// los dos caminos se disparan para la misma compra.
async function ensureEnrollment(supabaseAdmin: Admin, userId: string, courseId: string) {
  const { data: inserted, error: enrollError } = await supabaseAdmin
    .from('academy_enrollments')
    .upsert(
      {
        user_id: userId,
        course_id: courseId,
        tipo_acceso: 'pago',
        progreso_pct: 0,
        completado: false,
        activo: true,
      },
      { onConflict: 'user_id,course_id', ignoreDuplicates: true }
    )
    .select('id')

  if (enrollError) {
    console.error('academy_enrollments upsert (curso) error:', enrollError)
    return
  }

  // Solo se incrementa total_alumnos cuando ESTE llamado creó el enrollment.
  if (inserted && inserted.length > 0) {
    const { data: course } = await supabaseAdmin
      .from('academy_courses')
      .select('total_alumnos')
      .eq('id', courseId)
      .single()
    if (course) {
      await supabaseAdmin
        .from('academy_courses')
        .update({ total_alumnos: (course.total_alumnos ?? 0) + 1 })
        .eq('id', courseId)
    }
  }
}

Deno.serve(async (req) => {
  const corsResult = handleCors(req)
  if (corsResult) return corsResult

  try {
    const { payment_id, external_reference } = await req.json() as {
      payment_id: string
      external_reference?: string
    }
    if (!payment_id) return jsonResponse({ error: 'Falta payment_id' }, 400)

    const mpToken = (Deno.env.get('MP_ACCESS_TOKEN') ?? '').trim()
    if (!mpToken) return jsonResponse({ error: 'MP_ACCESS_TOKEN no configurado' }, 500)

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false } }
    )

    // Consultar pago en MP
    const mpRes = await fetch(`${MP_API}/v1/payments/${payment_id}`, {
      headers: { Authorization: `Bearer ${mpToken}` },
    })
    if (!mpRes.ok) return jsonResponse({ error: 'No se pudo consultar el pago en MP' }, 502)

    const mpData = await mpRes.json()
    const ref = mpData.external_reference ?? external_reference ?? ''

    if (!ref.startsWith('ACAD-COURSE-')) {
      return jsonResponse({ error: 'Referencia de pago inválida', status: mpData.status }, 400)
    }

    // Buscar pago local por external_reference
    const { data: localPayment } = await supabaseAdmin
      .from('academy_payments')
      .select('id, user_id, course_id, estado')
      .eq('mp_external_reference', ref)
      .maybeSingle()

    if (!localPayment) return jsonResponse({ error: 'Pago no encontrado en sistema' }, 404)

    // Si MP todavía no aprobó, no inscribimos.
    if (mpData.status !== 'approved') {
      return jsonResponse({ success: false, status: mpData.status })
    }

    // Marcar el pago como aprobado (idempotente: si ya estaba, no cambia nada).
    // La columna `estado` tiene un CHECK en español: se escribe 'aprobado', NO
    // 'approved' (el valor en inglés violaba el constraint y el update fallaba).
    if (localPayment.estado !== 'aprobado') {
      await supabaseAdmin
        .from('academy_payments')
        .update({ mp_payment_id: String(payment_id), mp_status: 'approved', estado: 'aprobado' })
        .eq('id', localPayment.id)
    }

    // Garantizar la inscripción SIEMPRE que el pago esté aprobado — sin importar
    // si el estado del pago ya venía en 'aprobado' desde el otro camino. Esto es
    // lo que asegura que nunca quede un pago aprobado sin curso en "Mis Cursos".
    await ensureEnrollment(supabaseAdmin, localPayment.user_id, localPayment.course_id)

    return jsonResponse({ success: true, status: 'approved' })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Error interno'
    console.error('confirm-course-payment error:', e)
    return jsonResponse({ error: msg }, 500)
  }
})
