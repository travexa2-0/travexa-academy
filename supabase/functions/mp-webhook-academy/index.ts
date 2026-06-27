import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'

// Webhook público — sin JWT. MP no manda Authorization header.
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const MP_API = 'https://api.mercadopago.com'

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
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

    // ── PAGO ÚNICO (curso) ──────────────────────────────────────────
    if (type === 'payment') {
      const mpRes = await fetch(`${MP_API}/v1/payments/${resourceId}`, {
        headers: { Authorization: `Bearer ${mpToken}` },
      })
      if (!mpRes.ok) return json({ ok: true, error: 'mp_query_failed' })

      const mpData = await mpRes.json()
      const ref: string = mpData.external_reference ?? ''

      if (!ref.startsWith('ACAD-COURSE-')) return json({ ok: true, ignored: true, reason: 'not_academy_course' })

      const { data: localPayment } = await supabaseAdmin
        .from('academy_payments')
        .select('id, user_id, course_id, estado')
        .eq('mp_external_reference', ref)
        .maybeSingle()

      if (!localPayment || localPayment.estado === 'approved') return json({ ok: true, already_done: true })

      await supabaseAdmin
        .from('academy_payments')
        .update({ mp_payment_id: String(resourceId), mp_status: mpData.status, estado: mpData.status })
        .eq('id', localPayment.id)

      if (mpData.status === 'approved') {
        const { data: exists } = await supabaseAdmin
          .from('academy_enrollments')
          .select('id')
          .eq('user_id', localPayment.user_id)
          .eq('course_id', localPayment.course_id)
          .maybeSingle()

        if (!exists) {
          await supabaseAdmin.from('academy_enrollments').insert({
            user_id: localPayment.user_id,
            course_id: localPayment.course_id,
            tipo_acceso: 'paid',
            progreso_pct: 0,
            completado: false,
          })
          const { data: course } = await supabaseAdmin
            .from('academy_courses')
            .select('total_alumnos')
            .eq('id', localPayment.course_id)
            .single()
          if (course) {
            await supabaseAdmin
              .from('academy_courses')
              .update({ total_alumnos: (course.total_alumnos ?? 0) + 1 })
              .eq('id', localPayment.course_id)
          }
        }
      }

      return json({ ok: true, status: mpData.status })
    }

    // ── SUSCRIPCIÓN (preapproval) ───────────────────────────────────
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
