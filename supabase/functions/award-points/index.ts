import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'

// CORS helpers inlineados (función self-contained: sin dependencias relativas a
// ../_shared, para que el deploy vía MCP no arrastre archivos fuera de la carpeta).
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

// POST { userId, accion, referenciaId? }
// Grants XP + Créditos for a given action via award_points_and_credits(),
// then triggers check-badges. Idempotent when referenciaId is provided.
// Fuente ÚNICA de verdad de puntos (XP + Créditos) de toda la plataforma. Todo
// trigger del cliente llama a esta función; ya no hay tablas de puntos paralelas.
// Regla: el XP solo lo dan acciones de formación/vivencial, salvo `registro` (bono
// de bienvenida a propósito). Ver Bloque 3.
const TABLA_ACCIONES: Record<string, { xp: number; creditos: number; motivo: string }> = {
  registro:               { xp: 20,  creditos: 20,  motivo: 'registro' },
  perfil_completado:      { xp: 0,   creditos: 50,  motivo: 'perfil_completado' },
  curso_comprado:         { xp: 30,  creditos: 20,  motivo: 'curso_comprado' },
  leccion_completada:     { xp: 10,  creditos: 5,   motivo: 'leccion_completada' },
  curso_completado:       { xp: 100, creditos: 40,  motivo: 'curso_completado' },
  vivencial_reservado:    { xp: 50,  creditos: 30,  motivo: 'vivencial_reservado' },
  vivencial_completado:   { xp: 300, creditos: 300, motivo: 'vivencial_completado' },
  resena_publicada:       { xp: 0,   creditos: 15,  motivo: 'resena_publicada' },
  racha_30_dias:          { xp: 50,  creditos: 100, motivo: 'racha_30_dias' },
  clase_en_vivo_asistida: { xp: 20,  creditos: 15,  motivo: 'clase_en_vivo_asistida' },
  referido_registrado:    { xp: 0,   creditos: 20,  motivo: 'referido_registrado' },
  referido_compra:        { xp: 0,   creditos: 100, motivo: 'referido_compra' },
  logro_compartido:       { xp: 0,   creditos: 15,  motivo: 'logro_compartido' },
}

Deno.serve(async (req) => {
  const corsResult = handleCors(req)
  if (corsResult) return corsResult

  try {
    const { userId, accion, referenciaId } = await req.json() as {
      userId?: string
      accion?: string
      referenciaId?: string
    }
    if (!userId || !accion) return jsonResponse({ error: 'Faltan userId o accion' }, 400)

    const cfg = TABLA_ACCIONES[accion]
    if (!cfg) return jsonResponse({ error: `Acción desconocida: ${accion}` }, 400)

    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const serviceKey  = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    const admin = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } })

    // Idempotency guard when a reference is provided
    if (referenciaId) {
      const { data: existing } = await admin
        .from('academy_points_transactions')
        .select('id')
        .eq('user_id', userId)
        .eq('motivo', cfg.motivo)
        .eq('referencia_id', referenciaId)
        .limit(1)
      if (existing && existing.length > 0) {
        return jsonResponse({ success: true, already_awarded: true, badges: [] })
      }
    }

    const { error: rpcErr } = await admin.rpc('award_points_and_credits', {
      p_user_id:       userId,
      p_xp:            cfg.xp,
      p_creditos:      cfg.creditos,
      p_tipo:          'ganado',
      p_motivo:        cfg.motivo,
      p_referencia_id: referenciaId ?? null,
    })
    if (rpcErr) return jsonResponse({ error: rpcErr.message }, 500)

    // Trigger badge evaluation (non-fatal on failure)
    let badges: string[] = []
    try {
      const res = await fetch(`${supabaseUrl}/functions/v1/check-badges`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${serviceKey}` },
        body:    JSON.stringify({ userId }),
      })
      if (res.ok) {
        const j = await res.json() as { badges?: string[] }
        badges = j.badges ?? []
      }
    } catch (_) {
      // ignore — points were already awarded
    }

    return jsonResponse({ success: true, xp: cfg.xp, creditos: cfg.creditos, badges })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Error interno'
    console.error('award-points error:', e)
    return jsonResponse({ error: msg }, 500)
  }
})
