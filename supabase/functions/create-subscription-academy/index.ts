import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'
import { handleCors, jsonResponse } from '../_shared/cors.ts'

const MP_API = 'https://api.mercadopago.com'
const ACADEMY_URL = 'https://academy.travexa.com.ar'

Deno.serve(async (req) => {
  const corsResult = handleCors(req)
  if (corsResult) return corsResult

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) return jsonResponse({ error: 'No autorizado' }, 401)

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false } }
    )

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token)
    if (authError || !user) return jsonResponse({ error: 'Token inválido' }, 401)

    const { plan } = await req.json() as { plan: 'mensual' | 'anual' }
    if (!plan || !['mensual', 'anual'].includes(plan)) {
      return jsonResponse({ error: 'Plan inválido. Opciones: mensual, anual' }, 400)
    }

    const mpToken = (Deno.env.get('MP_ACCESS_TOKEN') ?? '').trim()
    if (!mpToken) return jsonResponse({ error: 'MP_ACCESS_TOKEN no configurado' }, 500)

    const planIdEnvKey = plan === 'mensual' ? 'MP_PLAN_MENSUAL_ID' : 'MP_PLAN_ANUAL_ID'
    const mpPlanId = Deno.env.get(planIdEnvKey)
    if (!mpPlanId) {
      return jsonResponse({ error: `${planIdEnvKey} no configurado en Supabase Secrets` }, 500)
    }

    const externalReference = `ACAD-SUB-${user.id}-${plan}`
    const userEmail = user.email ?? ''

    // POST /preapproval con external_reference (crítico — lección del bug de B2B)
    const mpRes = await fetch(`${MP_API}/preapproval`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${mpToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        preapproval_plan_id: mpPlanId,
        payer_email: userEmail,
        external_reference: externalReference,
        back_url: `${ACADEMY_URL}/pago-confirmado`,
        reason: `Suscripción Travexa Academy — Plan ${plan}`,
      }),
    })

    const mpData = await mpRes.json()
    if (!mpRes.ok) {
      console.error('MP preapproval error:', mpData)
      return jsonResponse({ error: `Error Mercado Pago: ${mpData.message ?? 'Error desconocido'}` }, 502)
    }

    const initPoint = mpData.init_point ?? mpData.sandbox_init_point
    if (!initPoint) return jsonResponse({ error: 'MP no devolvió init_point' }, 502)

    // Registrar suscripción pendiente
    const { data: existingSub } = await supabaseAdmin
      .from('academy_subscriptions')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle()

    const subPayload = {
      user_id: user.id,
      plan_name: plan,
      status: 'pending',
      mp_preapproval_id: mpData.id,
      mp_plan_id: mpPlanId,
    }

    if (existingSub) {
      await supabaseAdmin.from('academy_subscriptions').update(subPayload).eq('id', existingSub.id)
    } else {
      await supabaseAdmin.from('academy_subscriptions').insert(subPayload)
    }

    return jsonResponse({ init_point: initPoint, preapproval_id: mpData.id })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Error interno'
    console.error('create-subscription-academy error:', e)
    return jsonResponse({ error: msg }, 500)
  }
})
