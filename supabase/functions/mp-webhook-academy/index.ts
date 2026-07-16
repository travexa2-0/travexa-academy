import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'

// Webhook público — sin JWT. MP no manda Authorization header.
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const MP_API = 'https://api.mercadopago.com'

// El status crudo de MP viene en inglés; la columna `estado` tiene un CHECK que
// solo acepta español. Mapear siempre antes de escribir en `estado`.
const ESTADO_MAP: Record<string, string> = {
  approved: 'aprobado',
  pending: 'pendiente',
  in_process: 'pendiente',
  authorized: 'pendiente',
  rejected: 'rechazado',
  cancelled: 'rechazado',
  refunded: 'rechazado',
  charged_back: 'rechazado',
}

function toEstado(mpStatus: string): string {
  return ESTADO_MAP[mpStatus] ?? 'pendiente'
}

// Pagos de curso: academy_payments SOLO guarda estados FINALES. Los intermedios de
// MP (pending/in_process/authorized) devuelven null y no se persisten — el intento
// ya quedó logueado en academy_payment_attempts desde create-course-payment.
const FINAL_ESTADO: Record<string, string> = {
  approved: 'aprobado',
  rejected: 'rechazado',
  cancelled: 'cancelado',
  refunded: 'reembolsado',
  charged_back: 'reembolsado',
}
function finalEstado(mpStatus: string): string | null {
  return FINAL_ESTADO[mpStatus] ?? null
}

// external_reference de curso: `ACAD-COURSE-{userId}-{courseId}` (dos UUIDs de 36 chars).
function parseCourseRef(ref: string): { userId: string | null; courseId: string | null } {
  const rest = ref.slice('ACAD-COURSE-'.length)
  if (rest.length < 73) return { userId: null, courseId: null }
  const userId = rest.slice(0, 36)
  const courseId = rest.slice(37)
  const uuidRe = /^[0-9a-f-]{36}$/i
  if (!uuidRe.test(userId) || !uuidRe.test(courseId)) return { userId: null, courseId: null }
  return { userId, courseId }
}

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

// deno-lint-ignore no-explicit-any
type Admin = any

// INSERT (upsert) del pago de curso con su estado FINAL. mp_external_reference es
// UNIQUE y determinístico por (user, course), así que hay a lo sumo una fila por
// compra: el upsert es idempotente ante reintentos de webhook. Un `aprobado` nunca
// se degrada (ej. si llega tarde el webhook de un intento rechazado anterior).
// deno-lint-ignore no-explicit-any
async function recordFinalCoursePayment(admin: Admin, args: {
  ref: string; userId: string; courseId: string; paymentId: string; estado: string; mpData: any
}) {
  if (args.estado !== 'aprobado') {
    const { data: existing } = await admin
      .from('academy_payments')
      .select('estado')
      .eq('mp_external_reference', args.ref)
      .maybeSingle()
    if (existing?.estado === 'aprobado') return
  }
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
      mp_status: args.mpData.status,
      mp_external_reference: args.ref,
      estado: args.estado,
    }, { onConflict: 'mp_external_reference' })
}

// Puntos por compra de curso — vía la edge function award-points (fuente única de
// verdad, idempotente por (motivo, referencia_id=courseId)). No crítico.
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

// Inscripción idempotente. La tabla tiene UNIQUE (user_id, course_id), así que
// el upsert con ignoreDuplicates se traduce a INSERT ... ON CONFLICT DO NOTHING:
// si el otro camino (redirect o webhook) ya inscribió al usuario, esta llamada
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
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const mpToken = (Deno.env.get('MP_ACCESS_TOKEN') ?? '').trim()
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false } }
    )

    // Parsear notificación de MP
    const url = new URL(req.url)
    let type: string = url.searchParams.get('type') ?? url.searchParams.get('topic') ?? ''
    let resourceId: string = url.searchParams.get('id') ?? url.searchParams.get('data.id') ?? ''

    if (req.method === 'POST') {
      try {
        const body = await req.json()
        type = body.type ?? body.topic ?? type
        resourceId = body.data?.id ?? body.resource ?? resourceId
      } catch { /* body vacío — usar query params */ }
    }

    console.log('mp-webhook-academy:', { type, resourceId })
    if (!type || !resourceId) return json({ ok: true, ignored: true })

    // ── PAGO ÚNICO (curso) ──
    if (type === 'payment') {
      const mpRes = await fetch(`${MP_API}/v1/payments/${resourceId}`, {
        headers: { Authorization: `Bearer ${mpToken}` },
      })
      if (!mpRes.ok) return json({ ok: true, error: 'mp_query_failed' })

      const mpData = await mpRes.json()
      const ref: string = mpData.external_reference ?? ''

      // ── VIVENCIAL — saldo en cuotas ──
      if (ref.startsWith('ACAD-VIV-')) {
        // Mapeo de estado MP → español (el trigger recalcula el balance con 'aprobado')
        const estado = toEstado(mpData.status)

        const { data: vivPayment } = await supabaseAdmin
          .from('academy_payments')
          .select('id, estado')
          .eq('mp_external_reference', ref)
          .maybeSingle()

        if (!vivPayment) return json({ ok: true, no_local_payment: true })
        if (vivPayment.estado === 'aprobado') return json({ ok: true, already_done: true })

        // El trigger academy_trg_payment_change_vivencial recalcula el saldo solo.
        const { error: vivUpdateError } = await supabaseAdmin
          .from('academy_payments')
          .update({ mp_payment_id: String(resourceId), mp_status: mpData.status, estado })
          .eq('id', vivPayment.id)
        if (vivUpdateError) console.error('academy_payments update (vivencial) error:', vivUpdateError)

        return json({ ok: true, status: mpData.status, vivencial: true })
      }

      if (!ref.startsWith('ACAD-COURSE-')) return json({ ok: true, ignored: true, reason: 'not_academy_course' })

      // Solo se persisten estados FINALES. Los intermedios de MP no dejan fila.
      const estado = finalEstado(mpData.status)
      if (!estado) return json({ ok: true, status: mpData.status, not_final: true })

      const { userId, courseId } = parseCourseRef(ref)
      if (!userId || !courseId) return json({ ok: true, bad_ref: true })

      // INSERT final del pago (aprobado o negativo). Idempotente ante reintentos.
      await recordFinalCoursePayment(supabaseAdmin, {
        ref, userId, courseId, paymentId: String(resourceId), estado, mpData,
      })

      // Inscripción + puntos solo si aprobó. Idempotente: reintentos de webhook no
      // duplican ni inflan el contador de alumnos, ni re-otorgan puntos.
      if (estado === 'aprobado') {
        await ensureEnrollment(supabaseAdmin, userId, courseId)
        await awardCursoComprado(userId, courseId)
      }

      return json({ ok: true, status: mpData.status, estado })
    }

    // ── SUSCRIPCIÓN (preapproval) ──
    const isSubEvent =
      type.includes('preapproval') ||
      type.includes('subscription') ||
      type.includes('authorized_payment')

    if (!isSubEvent) return json({ ok: true, ignored: true, type })

    // Para authorized_payment → resolver preapproval_id
    let preapprovalId = String(resourceId)
    if (type.includes('authorized_payment')) {
      const payRes = await fetch(`${MP_API}/authorized_payments/${resourceId}`, {
        headers: { Authorization: `Bearer ${mpToken}` },
      })
      if (payRes.ok) {
        const payData = await payRes.json()
        preapprovalId = payData.preapproval_id ?? preapprovalId
      }
    }

    const subRes = await fetch(`${MP_API}/preapproval/${preapprovalId}`, {
      headers: { Authorization: `Bearer ${mpToken}` },
    })
    if (!subRes.ok) return json({ ok: true, error: 'mp_preapproval_query_failed' })

    const subData = await subRes.json()
    const mpStatus: string = subData.status ?? 'pending'
    const externalRef: string = subData.external_reference ?? ''

    // Buscar suscripción local — primero por preapproval_id (funciona para renovaciones)
    let localSub: { id: string; user_id: string; plan_name: string } | null = null
    const { data: byPreapproval } = await supabaseAdmin
      .from('academy_subscriptions')
      .select('id, user_id, plan_name')
      .eq('mp_preapproval_id', preapprovalId)
      .maybeSingle()

    if (byPreapproval) {
      localSub = byPreapproval
    } else if (externalRef.startsWith('ACAD-SUB-')) {
      // Fallback por external_reference (primera activación)
      const parts = externalRef.split('-')
      const plan = parts[parts.length - 1] // 'mensual' | 'anual'
      const userId = parts.slice(2, parts.length - 1).join('-') // reconstruir UUID
      const { data: byRef } = await supabaseAdmin
        .from('academy_subscriptions')
        .select('id, user_id, plan_name')
        .eq('user_id', userId)
        .order('inicio', { ascending: false })
        .limit(1)
        .maybeSingle()
      if (byRef) {
        localSub = byRef
        // Guardar el preapproval_id para futuras renovaciones
        await supabaseAdmin
          .from('academy_subscriptions')
          .update({ mp_preapproval_id: preapprovalId, mp_plan_id: subData.preapproval_plan_id ?? null })
          .eq('id', byRef.id)
      } else {
        // No encontrada — insertar nueva si viene external_reference válido
        const { data: newSub } = await supabaseAdmin
          .from('academy_subscriptions')
          .insert({
            user_id: userId,
            plan_name: plan,
            status: 'pending',
            mp_preapproval_id: preapprovalId,
            mp_plan_id: subData.preapproval_plan_id ?? null,
          })
          .select('id, user_id, plan_name')
          .single()
        if (newSub) localSub = newSub
      }
    }

    if (!localSub) return json({ ok: true, no_local_sub: true })

    // Actualizar subscription según estado MP
    if (mpStatus === 'authorized') {
      const now = new Date()
      const proximoCobro = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)

      await supabaseAdmin
        .from('academy_subscriptions')
        .update({ status: 'active', inicio: now.toISOString(), proximo_cobro: proximoCobro.toISOString() })
        .eq('id', localSub.id)

      await supabaseAdmin
        .from('academy_profiles')
        .update({
          plan_name: localSub.plan_name,
          subscription_status: 'active',
          subscription_start: now.toISOString(),
          subscription_end: proximoCobro.toISOString(),
          mp_subscription_id: preapprovalId,
        })
        .eq('user_id', localSub.user_id)

    } else if (mpStatus === 'cancelled' || mpStatus === 'paused') {
      await supabaseAdmin
        .from('academy_subscriptions')
        .update({ status: mpStatus })
        .eq('id', localSub.id)

      await supabaseAdmin
        .from('academy_profiles')
        .update({ plan_name: 'free', subscription_status: mpStatus === 'cancelled' ? 'cancelled' : 'free' })
        .eq('user_id', localSub.user_id)
    }

    return json({ ok: true, status: mpStatus })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Error interno'
    console.error('mp-webhook-academy error:', e)
    return json({ error: msg }, 200) // 200 para que MP no reintente
  }
})
