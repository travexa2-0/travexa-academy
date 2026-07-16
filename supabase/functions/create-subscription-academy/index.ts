import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'jsr:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { user_id, plan } = await req.json(); // plan: 'mensual' | 'anual'

    if (!user_id || !plan) {
      throw new Error('user_id y plan son requeridos');
    }

    if (!['mensual', 'anual'].includes(plan)) {
      throw new Error('Plan inválido. Usar: mensual o anual');
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    const mpToken = Deno.env.get('MP_ACCESS_TOKEN')!;
    const planId = plan === 'mensual'
      ? Deno.env.get('MP_PLAN_MENSUAL_ID')!
      : Deno.env.get('MP_PLAN_ANUAL_ID')!;

    if (!planId) {
      throw new Error(`Plan MP no configurado: MP_PLAN_${plan.toUpperCase()}_ID`);
    }

    // Get user profile for MP payer email
    const { data: profile } = await supabase
      .from('profiles')
      .select('email, nombre, apellido')
      .eq('id', user_id)
      .single();

    const externalReference = `ACAD-SUB-${user_id}-${plan}`;

    // Create Preapproval in MP
    const mpResponse = await fetch('https://api.mercadopago.com/preapproval', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${mpToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        preapproval_plan_id: planId,
        payer_email: profile?.email,
        external_reference: externalReference,
        back_url: 'https://academy.travexa.com.ar/pago-confirmado',
        reason: `Travexa Academy — Plan ${plan === 'mensual' ? 'Mensual' : 'Anual'}`,
      }),
    });

    const mpData = await mpResponse.json();

    if (!mpResponse.ok) {
      throw new Error(`MP error: ${JSON.stringify(mpData)}`);
    }

    // Save pending subscription
    await supabase.from('academy_subscriptions').upsert({
      user_id,
      plan_name: plan,
      status: 'pending',
      mp_preapproval_id: mpData.id,
      mp_plan_id: planId,
    }, { onConflict: 'user_id' });

    // Update academy_profile to pending
    await supabase
      .from('academy_profiles')
      .update({
        plan_name: plan,
        subscription_status: 'pending',
      })
      .eq('user_id', user_id);

    return new Response(
      JSON.stringify({ init_point: mpData.init_point, preapproval_id: mpData.id }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }
});
