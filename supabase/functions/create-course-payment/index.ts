import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'jsr:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Producción actual (dominio propio academy.travexa.com.ar aún no tiene cutover — ver backlog).
const SITE_URL = 'https://travexa-academy.vercel.app';

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { course_id, user_id, metodo_pago } = await req.json();

    if (!course_id || !user_id) {
      throw new Error('course_id y user_id son requeridos');
    }
    if (metodo_pago !== 'transferencia' && metodo_pago !== 'tarjeta') {
      throw new Error("metodo_pago debe ser 'transferencia' o 'tarjeta'");
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    // Check if already enrolled
    const { data: existing } = await supabase
      .from('academy_enrollments')
      .select('id')
      .eq('user_id', user_id)
      .eq('course_id', course_id)
      .eq('activo', true)
      .maybeSingle();

    if (existing) {
      throw new Error('El usuario ya está inscripto en este curso');
    }

    // Precios ya calculados y guardados por el admin al crear/editar el curso
    // (ver academy_courses.precio_neto_ars / precio_ars / precio_transferencia_ars).
    const { data: course, error: courseError } = await supabase
      .from('academy_courses')
      .select('id, slug, titulo, precio_ars, precio_usd, precio_transferencia_ars')
      .eq('id', course_id)
      .eq('publicado', true)
      .single();

    if (courseError || !course) {
      throw new Error('Curso no encontrado');
    }

    // Nunca confiar en un precio que venga del frontend: se recalcula acá según
    // el método elegido, a partir de lo que el admin guardó en el curso.
    const monto = metodo_pago === 'transferencia' ? course.precio_transferencia_ars : course.precio_ars;
    if (!monto || Number(monto) <= 0) {
      throw new Error(`El curso no tiene precio configurado para el método ${metodo_pago}`);
    }

    // Techo de cuotas configurado globalmente (solo aplica a tarjeta)
    let cuotasMax = 6;
    if (metodo_pago === 'tarjeta') {
      const { data: setting } = await supabase
        .from('academy_settings')
        .select('value')
        .eq('key', 'mp_cuotas_max')
        .maybeSingle();
      if (setting?.value) cuotasMax = Number(setting.value);
    }

    const mpToken = Deno.env.get('MP_ACCESS_TOKEN')!;
    const externalReference = `ACAD-COURSE-${user_id}-${course_id}`;

    const backUrls = {
      success: `${SITE_URL}/cursos/${course.slug}/aprender?payment=success`,
      failure: `${SITE_URL}/cursos/${course.slug}?payment=error`,
      pending: `${SITE_URL}/cursos/${course.slug}?payment=pending`,
    };

    // Dos preferencias distintas según método: cada una con su propio precio y
    // restringida a los medios de pago que corresponden a ese precio.
    const paymentMethods = metodo_pago === 'transferencia'
      ? {
          excluded_payment_types: [
            { id: 'credit_card' },
            { id: 'debit_card' },
            { id: 'prepaid_card' },
          ],
        }
      : {
          excluded_payment_types: [
            { id: 'ticket' },
            { id: 'bank_transfer' },
          ],
          installments: cuotasMax,
          default_installments: cuotasMax,
        };

    // Create MP Preference
    const mpResponse = await fetch('https://api.mercadopago.com/checkout/preferences', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${mpToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        items: [{
          title: course.titulo,
          quantity: 1,
          unit_price: Number(monto),
          currency_id: 'ARS',
        }],
        external_reference: externalReference,
        back_urls: backUrls,
        auto_return: 'approved',
        notification_url: `${Deno.env.get('SUPABASE_URL')}/functions/v1/mp-webhook-academy`,
        payment_methods: paymentMethods,
      }),
    });

    const mpData = await mpResponse.json();

    if (!mpResponse.ok) {
      throw new Error(`MP error: ${JSON.stringify(mpData)}`);
    }

    // Solo se loguea el INTENTO de pago. academy_payments ya no guarda "pendiente":
    // un pago de curso o está aprobado / rechazado / cancelado / reembolsado (lo
    // inserta confirm-course-payment o mp-webhook-academy cuando MP devuelve un
    // estado FINAL) o no existe. Un checkout abandonado no deja registro de pago,
    // solo este intento, útil para métricas.
    await supabase.from('academy_payment_attempts').insert({
      user_id,
      course_id,
      metodo_pago,
      mp_preference_id: mpData.id,
    });

    return new Response(
      JSON.stringify({ init_point: mpData.init_point, preference_id: mpData.id }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }
});
