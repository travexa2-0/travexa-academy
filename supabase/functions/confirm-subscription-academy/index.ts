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
    const { preapproval_id, user_id } = await req.json();

    if (!preapproval_id || !user_id) {
      throw new Error('preapproval_id y user_id son requeridos');
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    const mpToken = Deno.env.get('MP_ACCESS_TOKEN')!;

    // Verify preapproval with MP
    const mpResponse = await fetch(`https://api.mercadopago.com/preapproval/${preapproval_id}`, {
      headers: { Authorization: `Bearer ${mpToken}` },
    });

    const mpData = await mpResponse.json();

    if (mpData.status !== 'authorized') {
      return new Response(
        JSON.stringify({ success: false, status: mpData.status }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    const now = new Date();
    const nextBilling = new Date(now);
    nextBilling.setMonth(nextBilling.getMonth() + 1);

    // Activate subscription
    await supabase
      .from('academy_subscriptions')
      .update({
        status: 'active',
        inicio: now.toISOString(),
        proximo_cobro: nextBilling.toISOString(),
      })
      .eq('mp_preapproval_id', preapproval_id);

    // Update academy profile
    await supabase
      .from('academy_profiles')
      .update({
        subscription_status: 'active',
        subscription_start: now.toISOString(),
        subscription_end: nextBilling.toISOString(),
        mp_subscription_id: preapproval_id,
      })
      .eq('user_id', user_id);

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }
});
