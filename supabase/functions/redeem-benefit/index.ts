import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'

// CORS helpers inlineados (self-contained, mismo patrón que award-points).
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

// POST { benefitId, cantidadChances? }  (requiere JWT del usuario en Authorization)
// Canje atómico de un beneficio por créditos. Toda la lógica (validaciones,
// descuento de saldo, creación de enrollment si corresponde, cupo, notificación)
// vive en la función SQL redeem_benefit() (SECURITY DEFINER, solo service_role).
// Ver ESPEC_Beneficios_Academy.md §5.1.

const ERROR_MESSAGES: Record<string, string> = {
  BENEFICIO_INEXISTENTE: 'Este beneficio ya no existe.',
  BENEFICIO_NO_DISPONIBLE: 'Este beneficio no está disponible.',
  BENEFICIO_NO_VIGENTE: 'Este beneficio todavía no está vigente.',
  BENEFICIO_VENCIDO: 'Este beneficio ya venció.',
  SORTEO_YA_REALIZADO: 'Este sorteo ya se realizó.',
  CUPO_AGOTADO: 'Se agotó el cupo de este beneficio.',
  YA_CANJEADO: 'Ya canjeaste este beneficio antes.',
  CURSO_YA_ADQUIRIDO: 'Ya tenés este curso.',
  PERFIL_INEXISTENTE: 'No encontramos tu perfil. Completá el onboarding primero.',
  SALDO_INSUFICIENTE: 'No tenés créditos suficientes para este canje.',
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

    // Cliente con el JWT del usuario, solo para identificarlo (auth.getUser)
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
      auth: { persistSession: false },
    })
    const { data: userData, error: userErr } = await userClient.auth.getUser()
    if (userErr || !userData?.user) return jsonResponse({ error: 'No autenticado' }, 401)
    const userId = userData.user.id

    const body = await req.json().catch(() => ({})) as { benefitId?: string; cantidadChances?: number }
    const { benefitId, cantidadChances } = body
    if (!benefitId) return jsonResponse({ error: 'Falta benefitId' }, 400)

    const admin = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } })
    const { data, error } = await admin.rpc('redeem_benefit', {
      p_user_id: userId,
      p_benefit_id: benefitId,
      p_cantidad_chances: cantidadChances && cantidadChances > 0 ? Math.floor(cantidadChances) : 1,
    })

    if (error) {
      // Los mensajes de la función SQL vienen como RAISE EXCEPTION 'CODIGO'
      const code = (error.message || '').split(':')[0].trim().toUpperCase()
      const friendly = ERROR_MESSAGES[code] ?? 'No pudimos completar el canje. Intentá de nuevo.'
      console.error('redeem-benefit rpc error:', error.message)
      return jsonResponse({ error: friendly, code }, 400)
    }

    return jsonResponse({ success: true, ...data })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Error interno'
    console.error('redeem-benefit error:', e)
    return jsonResponse({ error: msg }, 500)
  }
})
