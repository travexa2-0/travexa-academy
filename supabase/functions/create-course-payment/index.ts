import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'
import { handleCors, jsonResponse } from '../_shared/cors.ts'

const MP_API = 'https://api.mercadopago.com'
const ACADEMY_URL = 'https://academy.travexa.com.ar'
const WEBHOOK_URL = 'https://fvrwtqhkskbaixqbxami.supabase.co/functions/v1/mp-webhook-academy'

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

    // Verificar JWT y obtener user
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token)
    if (authError || !user) return jsonResponse({ error: 'Token inválido' }, 401)

    const { course_id } = await req.json() as { course_id: string }
    if (!course_id) return jsonResponse({ error: 'Falta course_id' }, 400)

    // Obtener curso
    const { data: course, error: courseError } = await supabaseAdmin
      .from('academy_courses')
      .select('id, titulo, precio_ars, tipo_acceso, publicado')
      .eq('id', course_id)
      .eq('publicado', true)
      .single()

    if (courseError || !course) return jsonResponse({ error: 'Curso no encontrado' }, 404)
    if (course.tipo_acceso === 'free') return jsonResponse({ error: 'Este curso es gratuito' }, 400)

    // Verificar que no esté ya inscripto
    const { data: existing } = await supabaseAdmin
      .from('academy_enrollments')
      .select('id')
      .eq('user_id', user.id)
      .eq('course_id', course_id)
      .maybeSingle()

    if (existing) return jsonResponse({ error: 'Ya estás inscripto en este curso' }, 409)

    const mpToken = (Deno.env.get('MP_ACCESS_TOKEN') ?? '').trim()
    if (!mpToken) return jsonResponse({ error: 'MP_ACCESS_TOKEN no configurado' }, 500)

    const externalReference = `ACAD-COURSE-${user.id}-${course_id}`

    // Crear registro de pago pendiente en DB
    const { data: payment } = await supabaseAdmin
      .from('academy_payments')
      .insert({
        user_id: user.id,
        tipo: 'curso',
        course_id,
        monto_ars: course.precio_ars,
        mp_external_reference: externalReference,
        mp_status: 'pending',
        estado: 'pending',
      })
      .select('id')
      .single()

    // Crear Preference en MP
    const mpRes = await fetch(`${MP_API}/checkout/preferences`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${mpToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        items: [{
          id: course_id,
          title: course.titulo,
          quantity: 1,
          currency_id: 'ARS',
          unit_price: course.precio_ars ?? 0,
        }],
        external_reference: externalReference,
        back_urls: {
          success: `${ACADEMY_URL}/pago-confirmado`,
          failure: `${ACADEMY_URL}/pago-error`,
          pending: `${ACADEMY_URL}/pago-confirmado`,
        },
        auto_return: 'approved',
        notification_url: WEBHOOK_URL,
        statement_descriptor: 'TRAVEXA ACADEMY',
      }),
    })

    const mpData = await mpRes.json()
    if (!mpRes.ok) {
      console.error('MP error:', mpData)
      return jsonResponse({ error: `Error Mercado Pago: ${mpData.message ?? 'Error desconocido'}` }, 502)
    }

    const initPoint = mpData.init_point ?? mpData.sandbox_init_point
    if (!initPoint) return jsonResponse({ error: 'MP no devolvió init_point' }, 502)

    // Guardar preference_id en el pago
    if (payment?.id) {
      await supabaseAdmin
        .from('academy_payments')
        .update({ mp_payment_id: mpData.id })
        .eq('id', payment.id)
    }

    return jsonResponse({ init_point: initPoint, preference_id: mpData.id })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Error interno'
    console.error('create-course-payment error:', e)
    return jsonResponse({ error: msg }, 500)
  }
})
