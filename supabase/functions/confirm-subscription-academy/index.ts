import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'
import { handleCors, jsonResponse } from '../_shared/cors.ts'

const MP_API = 'https://api.mercadopago.com'

Deno.serve(async (req) => {
  const corsResult = handleCors(req)
  if (corsResult) return corsResult

  try {
    const { preapproval_id } = await req.json() as { preapproval_id: string }
    if (!preapproval_id) return jsonResponse({ error: 'Falta preapproval_id' }, 400)

    const mpToken = (Deno.env.get('MP_ACCESS_TOKEN') ?? '').trim()
    if (!mpToken) return jsonResponse({ error: 'MP_ACCESS_TOKEN no configurado' }, 500)

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false } }
    )

    // Consultar preapproval en MP
    const mpRes = await fetch(`${MP_API}/preapproval/${preapproval_id}`, {
      headers: { Authorization: `Bearer ${mpToken}` },
    })
    if (!mpRes.ok) return jsonResponse({ error: 'No se pudo consultar MP' }, 502)

    const mpData = await mpRes.json()
    const mpStatus: string = mpData.status ?? 'pending'

    // Buscar suscripción local por preapproval_id
    const { data: sub } = await supabaseAdmin
      .from('academy_subscriptions')
      .select('id, user_id, plan_name')
      .eq('mp_preapproval_id', preapproval_id)
      .maybeSingle()

    if (!sub) return jsonResponse({ error: 'Suscripción no encontrada' }, 404)

    if (mpStatus === 'authorized') {
      const now = new Date()
      const proximoCobro = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)

      await supabaseAdmin
        .from('academy_subscriptions')
        .update({
          status: 'active',
          inicio: now.toISOString(),
          proximo_cobro: proximoCobro.toISOString(),
        })
        .eq('id', sub.id)

      await supabaseAdmin
        .from('academy_profiles')
        .update({
          plan_name: sub.plan_name,
          subscription_status: 'active',
          subscription_start: now.toISOString(),
          subscription_end: proximoCobro.toISOString(),
          mp_subscription_id: preapproval_id,
        })
        .eq('user_id', sub.user_id)

      return jsonResponse({ success: true, status: 'authorized' })
    }

    return jsonResponse({ success: false, status: mpStatus })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Error interno'
    console.error('confirm-subscription-academy error:', e)
    return jsonResponse({ error: msg }, 500)
  }
})
