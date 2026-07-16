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

// external_reference de curso: `ACAD-COURSE-{userId}-{courseId}` (dos UUIDs de 36
// chars). Se parsea por longitud fija, ya no dependemos de una fila local previa.
function parseCourseRef(ref: string): { userId: string | null; courseId: string | null } {
  const rest = ref.slice('ACAD-COURSE-'.length)
  if (rest.length < 73) return { userId: null, courseId: null }
  const userId = rest.slice(0, 36)
  const courseId = rest.slice(37)
  const uuidRe = /^[0-9a-f-]{36}$/i
  if (!uuidRe.test(userId) || !uuidRe.test(courseId)) return { userId: null, courseId: null }
  return { userId, courseId }
}

// INSERT (upsert) del pago aprobado. mp_external_reference es UNIQUE y
// determinístico por (user, course): el upsert es idempotente ante reintentos y,
// si el webhook ya escribió el estado, no duplica. `aprobado` pisa cualquier
// estado previo (ej. un intento anterior rechazado).
// deno-lint-ignore no-explicit-any
async function recordApprovedCoursePayment(admin: Admin, args: {
  ref: string; userId: string; courseId: string; paymentId: string; mpData: any
}) {
  const monto = Number(args.mpData.transaction_amount) || 0
  const { data: attempt } = await admin
    .from('academy_payment_attempts')
    .select('metodo_pago')
    .eq('user_id', args.userId)
    .eq('course_id', args.courseId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  await admin
    .from('academy_payments')
    .upsert({
      user_id: args.userId,
      tipo: 'curso',
      course_id: args.courseId,
      monto_ars: monto,
      metodo_pago: attempt?.metodo_pago ?? null,
      mp_payment_id: args.paymentId,
      mp_status: 'approved',
      mp_external_reference: args.ref,
      estado: 'aprobado',
    }, { onConflict: 'mp_external_reference' })
}

// Puntos por compra de curso — vía la edge function award-points (fuente única de
// verdad, idempotente por (motivo, referencia_id=courseId)). Se llama server-side al
// aprobar el pago, así se otorga aunque el usuario cierre la pestaña. No crítico.
async function awardCursoComprado(userId: string, courseId: string) {
  try {
    const url = Deno.env.get('SUPABASE_URL') ?? ''
    const key = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    await fetch(`${url}/functions/v1/award-points`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
      body: JSON.stringify({ userId, accion: 'curso_comprado', referenciaId: courseId }),
    })
  } catch (_) { /* el pago y la inscripción ya están hechos; los puntos no son críticos */ }
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

    // El redirect solo materializa pagos APROBADOS. Los estados intermedios de MP
    // ya no se persisten, y los estados finales negativos (rechazado/cancelado/…)
    // los registra el webhook. Tampoco hay ya una fila "pendiente" que actualizar.
    if (mpData.status !== 'approved') {
      return jsonResponse({ success: false, status: mpData.status })
    }

    const { userId, courseId } = parseCourseRef(ref)
    if (!userId || !courseId) {
      return jsonResponse({ error: 'Referencia de pago malformada' }, 400)
    }

    // INSERT final del pago aprobado + inscripción (ambos idempotentes). Esto es
    // lo que asegura que nunca quede un pago aprobado sin curso en "Mis Cursos".
    await recordApprovedCoursePayment(supabaseAdmin, {
      ref, userId, courseId, paymentId: String(payment_id), mpData,
    })
    await ensureEnrollment(supabaseAdmin, userId, courseId)
    await awardCursoComprado(userId, courseId)

    return jsonResponse({ success: true, status: 'approved' })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Error interno'
    console.error('confirm-course-payment error:', e)
    return jsonResponse({ error: msg }, 500)
  }
})
