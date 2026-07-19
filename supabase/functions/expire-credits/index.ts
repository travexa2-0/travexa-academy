import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Max-Age': '86400',
}
function handleCors(req: Request): Response | null {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  return null
}
function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
}

// POST (sin JWT de usuario — pensada para cron/pg_cron).
// Protegida comparando el header Authorization contra la SERVICE_ROLE_KEY del
// propio proyecto (único secreto disponible sin configuración extra). El cron
// debe llamar con: Authorization: Bearer <SUPABASE_SERVICE_ROLE_KEY>.
// Vence créditos con más de 1 año (FIFO) vía expire_credits_run(). Ver ESPEC §6.

Deno.serve(async (req) => {
  const corsResult = handleCors(req)
  if (corsResult) return corsResult
  if (req.method !== 'POST') return jsonResponse({ error: 'Método no permitido' }, 405)

  try {
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    const authHeader = req.headers.get('Authorization') ?? ''
    const token = authHeader.replace(/^Bearer\s+/i, '').trim()

    if (!serviceKey || token !== serviceKey) {
      return jsonResponse({ error: 'No autorizado' }, 401)
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const admin = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } })

    const { data, error } = await admin.rpc('expire_credits_run')
    if (error) {
      console.error('expire-credits rpc error:', error.message)
      return jsonResponse({ error: error.message }, 500)
    }

    console.log('expire-credits run:', data)
    return jsonResponse({ success: true, ...data })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Error interno'
    console.error('expire-credits error:', e)
    return jsonResponse({ error: msg }, 500)
  }
})
