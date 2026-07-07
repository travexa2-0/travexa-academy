import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'
import { handleCors, jsonResponse } from '../_shared/cors.ts'

const MP_API = 'https://api.mercadopago.com'
const ACADEMY_URL = 'https://academy.travexa.com.ar'
const WEBHOOK_URL = 'https://fvrwtqhkskbaixqbxami.supabase.co/functions/v1/mp-webhook-academy'
const MAX_INSTALLMENTS = 12

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

    // Verificar JWT y obtener user (no confiar en user_id del body)
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token)
    if (authError || !user) return jsonResponse({ error: 'Token inválido' }, 401)

    const { course_id } = await req.json() as { course_id: string }
    if (!course_id) return jsonResponse({ error: 'Falta course_id' }, 400)

    // Reservar cupo (idempotente) usando el JWT del usuario, para respetar auth.uid()
    const supabaseUser = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } }, auth: { persistSession: false } }
    )
    const { data: enrollmentId, error: reserveError } = await supabaseUser
      .rpc('academy_reserve_vivencial_spot', { p_course_id: course_id })
    if (reserveError || !enrollmentId) {
      return jsonResponse({ error: reserveError?.message ?? 'No se pudo reservar el cupo' }, 400)
    }

    // Curso: precio total y precio en cuotas
    const { data: course, error: courseError } = await supabaseAdmin
      .from('academy_courses')
      .select('id, titulo, precio_ars, vivencial_precio_cuotas_ars, tipo')
      .eq('id', course_id)
      .single()
    if (courseError || !course) return jsonResponse({ error: 'Vivencial no encontrado' }, 404)
    if (course.vivencial_precio_cuotas_ars == null) {
      return jsonResponse({ error: 'Este vivencial no tiene cuotas habilitadas' }, 400)
    }
    const precioArs = Number(course.precio_ars)
    if (!(precioArs > 0)) return jsonResponse({ error: 'El vivencial no tiene precio cargado' }, 400)

    // Enrollment: saldo pendiente (fallback a total cuando aún no hay pagos aprobados)
    const { data: enrollment } = await supabaseAdmin
      .from('academy_enrollments')
      .select('monto_total_ars, monto_pendiente_ars')
      .eq('id', enrollmentId)
      .single()
    const pendiente = Number(enrollment?.monto_pendiente_ars ?? enrollment?.monto_total_ars ?? precioArs)
    if (!(pendiente > 0)) return jsonResponse({ error: 'Este viaje ya está pagado' }, 400)

    // Mínimo para habilitar cuotas
    const { data: minSetting } = await supabaseAdmin
      .from('academy_settings')
      .select('value')
      .eq('key', 'mp_monto_minimo_cuotas_ars')
      .maybeSingle()
    const minCuotas = Number(minSetting?.value ?? 0)
    if (pendiente < minCuotas) {
      return jsonResponse({ error: `El saldo debe ser al menos $${minCuotas.toLocaleString('es-AR')} para pagar en cuotas` }, 400)
    }

    // Recargo proporcional SIEMPRE sobre el saldo pendiente
    const monto = Math.round((Number(course.vivencial_precio_cuotas_ars) / precioArs) * pendiente)
    if (!(monto > 0)) return jsonResponse({ error: 'Monto de cuotas inválido' }, 400)

    const mpToken = (Deno.env.get('MP_ACCESS_TOKEN') ?? '').trim()
    if (!mpToken) return jsonResponse({ error: 'MP_ACCESS_TOKEN no configurado' }, 500)

    const externalReference = `ACAD-VIV-${enrollmentId}-${Date.now()}`

    // Registro de pago pendiente
    const { data: payment } = await supabaseAdmin
      .from('academy_payments')
      .insert({
        user_id: user.id,
        tipo: 'vivencial_cuotas',
        course_id,
        enrollment_id: enrollmentId,
        monto_ars: monto,
        mp_external_reference: externalReference,
        mp_status: 'pending',
        estado: 'pendiente',
      })
      .select('id')
      .single()

    // Preference MP con tope de cuotas
    const mpRes = await fetch(`${MP_API}/checkout/preferences`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${mpToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        items: [{
          id: course_id,
          title: `${course.titulo} - Saldo en cuotas`,
          quantity: 1,
          currency_id: 'ARS',
          unit_price: monto,
        }],
        payment_methods: { installments: MAX_INSTALLMENTS },
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

    if (payment?.id) {
      await supabaseAdmin
        .from('academy_payments')
        .update({ mp_preference_id: String(mpData.id) })
        .eq('id', payment.id)
    }

    return jsonResponse({ init_point: initPoint, preference_id: mpData.id, monto })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Error interno'
    console.error('create-vivencial-cuotas-payment error:', e)
    return jsonResponse({ error: msg }, 500)
  }
})
