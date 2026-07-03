import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'
import { handleCors, jsonResponse } from '../_shared/cors.ts'

// POST { userId, accion, referenciaId? }
// Grants XP + Créditos for a given action via award_points_and_credits(),
// then triggers check-badges. Idempotent when referenciaId is provided.
const TABLA_ACCIONES: Record<string, { xp: number; creditos: number; motivo: string }> = {
  resena_publicada:     { xp: 20,  creditos: 10,  motivo: 'resena_publicada' },
  referido_registrado:  { xp: 30,  creditos: 20,  motivo: 'referido_registrado' },
  curso_completado:     { xp: 100, creditos: 40,  motivo: 'curso_completado' },
  vivencial_completado: { xp: 300, creditos: 300, motivo: 'vivencial_completado' },
  bono_bienvenida:      { xp: 0,   creditos: 50,  motivo: 'bono_bienvenida' },
  perfil_completado:    { xp: 50,  creditos: 50,  motivo: 'perfil_completado' },
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
    } catch {
      // ignore — points were already awarded
    }

    return jsonResponse({ success: true, xp: cfg.xp, creditos: cfg.creditos, badges })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Error interno'
    console.error('award-points error:', e)
    return jsonResponse({ error: msg }, 500)
  }
})
