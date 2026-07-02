import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'
import { handleCors, jsonResponse } from '../_shared/cors.ts'

// POST { userId }
// Evaluates deterministic badge conditions against the user's current state,
// awards any newly-earned active badges, and returns their names.
// Condition strings match academy_badges.condicion in the DB:
//   first_lesson · first_review · first_vivencial · first_referral · streak_7 · streak_100
// (top10_monthly is ranking-based and evaluated elsewhere — not handled here.)
Deno.serve(async (req) => {
  const corsResult = handleCors(req)
  if (corsResult) return corsResult

  try {
    const { userId } = await req.json() as { userId?: string }
    if (!userId) return jsonResponse({ error: 'Falta userId' }, 400)

    const admin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false } }
    )

    // Gather the metrics that drive the deterministic conditions.
    const [profileRes, lessonsRes, reviewsRes, referralsRes] = await Promise.all([
      admin.from('academy_profiles')
        .select('streak_actual, total_vivenciales')
        .eq('user_id', userId)
        .maybeSingle(),
      admin.from('academy_lesson_progress')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('completada', true),
      admin.from('academy_reviews')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId),
      admin.from('academy_referrals')
        .select('id', { count: 'exact', head: true })
        .eq('referrer_id', userId)
        .eq('creditos_otorgados', true),
    ])

    const streak      = (profileRes.data?.streak_actual as number | null) ?? 0
    const vivenciales = (profileRes.data?.total_vivenciales as number | null) ?? 0
    const lessons     = lessonsRes.count ?? 0
    const reviews     = reviewsRes.count ?? 0
    const referrals   = referralsRes.count ?? 0

    const met = new Set<string>()
    if (lessons >= 1)     met.add('first_lesson')
    if (reviews >= 1)     met.add('first_review')
    if (vivenciales >= 1) met.add('first_vivencial')
    if (referrals >= 1)   met.add('first_referral')
    if (streak >= 7)      met.add('streak_7')
    if (streak >= 100)    met.add('streak_100')

    if (met.size === 0) return jsonResponse({ success: true, badges: [] })

    const { data: badges } = await admin
      .from('academy_badges')
      .select('id, nombre, condicion')
      .eq('activo', true)
      .in('condicion', Array.from(met))

    if (!badges || badges.length === 0) return jsonResponse({ success: true, badges: [] })

    const { data: owned } = await admin
      .from('academy_user_badges')
      .select('badge_id')
      .eq('user_id', userId)
    const ownedIds = new Set((owned ?? []).map((b: { badge_id: string }) => b.badge_id))

    const toAward = badges.filter((b: { id: string }) => !ownedIds.has(b.id))
    const nuevas: string[] = []

    for (const b of toAward) {
      const { error } = await admin
        .from('academy_user_badges')
        .insert({ user_id: userId, badge_id: b.id })
      if (!error) {
        nuevas.push(b.nombre as string)
        await admin.from('academy_notifications').insert({
          user_id: userId,
          tipo:    'badge_desbloqueado',
          titulo:  `🏆 ¡Badge desbloqueado: ${b.nombre}!`,
          mensaje: `Ganaste el badge "${b.nombre}". ¡Seguí así!`,
          url:     '/perfil',
        })
      }
    }

    return jsonResponse({ success: true, badges: nuevas })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Error interno'
    console.error('check-badges error:', e)
    return jsonResponse({ error: msg }, 500)
  }
})
