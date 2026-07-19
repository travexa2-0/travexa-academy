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

// POST { benefitId }  (requiere JWT de un usuario admin en Authorization)
// Solo admin (is_academy_admin()). Elige ganador al azar ponderado por chances
// vía draw_benefit_winner() (SQL, SECURITY DEFINER). Ver ESPEC §5.4.

const ERROR_MESSAGES: Record<string, string> = {
  BENEFICIO_INEXISTENTE: 'Este beneficio ya no existe.',
  NO_ES_SORTEO: 'Este beneficio no es un sorteo.',
  SORTEO_YA_REALIZADO: 'Este sorteo ya se realizó.',
  SIN_PARTICIPANTES: 'Todavía no hay participantes en este sorteo.',
}

Deno.serve(async (req) => {
  const corsResult = handleCors(req)
  if (corsResult) return corsResult
  if (req.method !== 'POST') return jsonResponse({ error: 'Método no permitido' }, 405)

  try {
    const authHeader = req.headers.get('Authorization') ?? ''
    if (!authHeader) return jsonResponse({ error: 'No autenticado' }, 401)

    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
      auth: { persistSession: false },
    })
    const { data: userData, error: userErr } = await userClient.auth.getUser()
    if (userErr || !userData?.user) return jsonResponse({ error: 'No autenticado' }, 401)

    // Chequeo de admin en el contexto del propio usuario (RLS/auth.uid() real)
    const { data: isAdmin, error: adminErr } = await userClient.rpc('is_academy_admin')
    if (adminErr || !isAdmin) return jsonResponse({ error: 'No autorizado' }, 403)

    const body = await req.json().catch(() => ({})) as { benefitId?: string }
    const { benefitId } = body
    if (!benefitId) return jsonResponse({ error: 'Falta benefitId' }, 400)

    const admin = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } })
    const { data, error } = await admin.rpc('draw_benefit_winner', { p_benefit_id: benefitId })

    if (error) {
      const code = (error.message || '').split(':')[0].trim().toUpperCase()
      const friendly = ERROR_MESSAGES[code] ?? 'No pudimos realizar el sorteo. Intentá de nuevo.'
      console.error('draw-benefit-winner rpc error:', error.message)
      return jsonResponse({ error: friendly, code }, 400)
    }

    return jsonResponse({ success: true, ...data })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Error interno'
    console.error('draw-benefit-winner error:', e)
    return jsonResponse({ error: msg }, 500)
  }
})
