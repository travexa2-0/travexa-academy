import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'
import { handleCors, jsonResponse } from '../_shared/cors.ts'

const MP_API = 'https://api.mercadopago.com'

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
    if (localPayment.estado === 'approved') {
      return jsonResponse({ success: true, already_confirmed: true })
    }

    if (mpData.status !== 'approved') {
      return jsonResponse({ success: false, status: mpData.status })
    }

    // Actualizar pago
    await supabaseAdmin
      .from('academy_payments')
      .update({ mp_payment_id: String(payment_id), mp_status: 'approved', estado: 'approved' })
      .eq('id', localPayment.id)

    // Verificar enrollment previo (idempotente)
    const { data: existingEnrollment } = await supabaseAdmin
      .from('academy_enrollments')
      .select('id')
      .eq('user_id', localPayment.user_id)
      .eq('course_id', localPayment.course_id)
      .maybeSingle()

    if (!existingEnrollment) {
      await supabaseAdmin.from('academy_enrollments').insert({
        user_id: localPayment.user_id,
        course_id: localPayment.course_id,
        tipo_acceso: 'paid',
        progreso_pct: 0,
        completado: false,
      })

      // Incrementar total_alumnos
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

    return jsonResponse({ success: true, status: 'approved' })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Error interno'
    console.error('confirm-course-payment error:', e)
    return jsonResponse({ error: msg }, 500)
  }
})
