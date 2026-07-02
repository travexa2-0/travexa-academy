import { supabase } from '@/lib/supabase'
import { createNotification } from './useNotifications'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = () => supabase as any

// ── Points config ─────────────────────────────────────────────────

export const POINTS = {
  REGISTRO:         200,
  LECCION_COMPLETA: 10,
  CURSO_COMPLETO:   200,
  RESENA:           50,
  SHARE_LOGRO:      25,
  REFERIDO:         500,
  LIVE_ASISTIR:     100,
  PRIMER_VIVENCIAL: 300,
  STREAK_7:         100,
} as const

// ── Badge conditions ──────────────────────────────────────────────

// Deben coincidir EXACTAMENTE con academy_badges.condicion en la DB
// (mismos valores que lee la edge function check-badges).
type BadgeCondicion =
  | 'first_lesson'
  | 'streak_7'
  | 'first_review'
  | 'first_vivencial'
  | 'first_referral'
  | 'streak_100'
  | 'top10_monthly'

// ── Core: award points (idempotente por referencia_id + motivo) ──

async function awardPoints(
  userId: string,
  puntos: number,
  motivo: string,
  referenciaId?: string,
): Promise<boolean> {
  if (referenciaId) {
    const { data: existing } = await db()
      .from('academy_points_transactions')
      .select('id')
      .eq('user_id', userId)
      .eq('motivo', motivo)
      .eq('referencia_id', referenciaId)
      .maybeSingle()
    if (existing) return false // ya fue otorgado
  }

  const [{ data: profile }] = await Promise.all([
    db().from('academy_profiles').select('puntos').eq('user_id', userId).single(),
  ])

  const puntosActuales = (profile?.puntos ?? 0) as number

  await Promise.all([
    db().from('academy_points_transactions').insert({
      user_id: userId,
      puntos,
      tipo: 'ganado',
      motivo,
      referencia_id: referenciaId ?? null,
    }),
    db().from('academy_profiles').update({ puntos: puntosActuales + puntos }).eq('user_id', userId),
  ])

  return true
}

// ── Badge check & award ───────────────────────────────────────────

async function checkAndAwardBadge(
  userId: string,
  condicion: BadgeCondicion,
): Promise<string | null> {
  // ¿El badge existe?
  const { data: badge } = await db()
    .from('academy_badges')
    .select('id, nombre, icono')
    .eq('condicion', condicion)
    .eq('activo', true)
    .maybeSingle()

  if (!badge) return null

  // ¿El usuario ya lo tiene?
  const { data: existing } = await db()
    .from('academy_user_badges')
    .select('id')
    .eq('user_id', userId)
    .eq('badge_id', badge.id)
    .maybeSingle()

  if (existing) return null

  // Otorgar
  await db().from('academy_user_badges').insert({ user_id: userId, badge_id: badge.id })

  // Notificación
  await createNotification(
    userId,
    'badge_desbloqueado',
    `🏆 ¡Badge desbloqueado: ${badge.nombre}!`,
    `Ganaste el badge "${badge.icono} ${badge.nombre}". ¡Seguí así!`,
    '/perfil',
  )

  return badge.nombre as string
}

// ── Update streak ─────────────────────────────────────────────────

async function updateStreak(userId: string): Promise<number> {
  const { data: profile } = await db()
    .from('academy_profiles')
    .select('streak_actual, streak_maximo, ultimo_acceso_leccion')
    .eq('user_id', userId)
    .single()

  if (!profile) return 0

  const hoy        = new Date().toISOString().split('T')[0]
  const ayer       = new Date(Date.now() - 86400000).toISOString().split('T')[0]
  const ultimoAcceso = profile.ultimo_acceso_leccion as string | null

  let nuevoStreak = profile.streak_actual as number

  if (ultimoAcceso === hoy) return nuevoStreak  // ya contado hoy
  if (ultimoAcceso === ayer) nuevoStreak += 1
  else nuevoStreak = 1  // rompió racha

  const nuevoMax = Math.max(nuevoStreak, profile.streak_maximo as number)

  await db().from('academy_profiles').update({
    streak_actual: nuevoStreak,
    streak_maximo: nuevoMax,
    ultimo_acceso_leccion: hoy,
  }).eq('user_id', userId)

  return nuevoStreak
}

// ── Count helper ──────────────────────────────────────────────────

async function countUserLessons(userId: string): Promise<number> {
  const { count } = await db()
    .from('academy_lesson_progress')
    .select('id', { count: 'exact' })
    .eq('user_id', userId)
    .eq('completada', true)
  return (count ?? 0) as number
}

// ── Public API ────────────────────────────────────────────────────

/** Llamar después de marcar una lección como completa. */
export async function onLessonComplete(
  userId: string,
  lessonId: string,
  courseId: string,
  courseTitle: string,
  allLessonsCount: number,
  completedLessonsCount: number,  // después de marcar esta
): Promise<{ puntosGanados: number; badgeGanado: string | null; cursoCompleto: boolean }> {
  let puntosGanados = 0
  let badgeGanado: string | null = null
  let cursoCompleto = false

  // 1. Puntos por lección
  const awarded = await awardPoints(userId, POINTS.LECCION_COMPLETA, 'leccion_completa', lessonId)
  if (awarded) puntosGanados += POINTS.LECCION_COMPLETA

  // 2. Actualizar streak
  const streak = await updateStreak(userId)

  // 3. Primera lección ever → badge
  const totalLecciones = await countUserLessons(userId)
  if (totalLecciones === 1) {
    badgeGanado = await checkAndAwardBadge(userId, 'first_lesson')
  }

  // 4. Streak 7 días
  if (streak === 7) {
    await awardPoints(userId, POINTS.STREAK_7, 'streak_7', `streak_7_${userId}`)
    puntosGanados += POINTS.STREAK_7
    const b = await checkAndAwardBadge(userId, 'streak_7')
    if (b) badgeGanado = b
    await createNotification(userId, 'streak', '🔥 ¡7 días seguidos!', '+100 puntos bonus. ¡Sos una máquina!', '/perfil')
  }

  // 5. Streak peligro notif (los sábados/domingos para motivar) — simple: si streak > 3, recuerda
  // (simplificado para MVP)

  // 6. Curso completo
  if (completedLessonsCount >= allLessonsCount && allLessonsCount > 0) {
    cursoCompleto = true

    const courseAwarded = await awardPoints(userId, POINTS.CURSO_COMPLETO, 'curso_completo', courseId)
    if (courseAwarded) {
      puntosGanados += POINTS.CURSO_COMPLETO

      // Actualizar contador en profile
      const { data: profile } = await db()
        .from('academy_profiles')
        .select('total_cursos_completados')
        .eq('user_id', userId)
        .single()
      const total = ((profile?.total_cursos_completados ?? 0) as number) + 1
      await db().from('academy_profiles').update({ total_cursos_completados: total }).eq('user_id', userId)

      // Enrollment: marcar completado
      await db()
        .from('academy_enrollments')
        .update({ completado: true, progreso_pct: 100, fecha_completado: new Date().toISOString() })
        .eq('user_id', userId)
        .eq('course_id', courseId)

      // Certificado
      await db().from('academy_certificates').insert({
        user_id: userId,
        course_id: courseId,
        enrollment_id: courseId,  // aproximado; idealmente obtener enrollment_id real
      })

      // Notificación de curso completo
      await createNotification(
        userId,
        'curso_completado',
        `🎓 ¡Completaste "${courseTitle}"!`,
        `Ganaste ${POINTS.CURSO_COMPLETO} puntos. Tu certificado ya está disponible.`,
        '/perfil?tab=certificados',
      )
    }
  } else {
    // Actualizar progreso del enrollment
    const pct = Math.round((completedLessonsCount / allLessonsCount) * 100)
    await db()
      .from('academy_enrollments')
      .update({ progreso_pct: pct })
      .eq('user_id', userId)
      .eq('course_id', courseId)
  }

  return { puntosGanados, badgeGanado, cursoCompleto }
}

/** Llamar al primer vivencial completado. */
export async function onPrimerVivencial(userId: string): Promise<void> {
  await awardPoints(userId, POINTS.PRIMER_VIVENCIAL, 'primer_vivencial', `vivencial_${userId}`)
  await checkAndAwardBadge(userId, 'first_vivencial')

  const { data: p } = await db().from('academy_profiles').select('total_vivenciales').eq('user_id', userId).single()
  const total = ((p?.total_vivenciales ?? 0) as number) + 1
  await db().from('academy_profiles').update({ total_vivenciales: total }).eq('user_id', userId)

  await createNotification(userId, 'vivencial_completo', '✈️ ¡Primer viaje vivencial!', '+300 puntos. Bienvenido al mundo de los fam trips.', '/perfil')
}

/** Llamar cuando un referido completa su primera compra. */
export async function onReferralComplete(referrerId: string, referredId: string): Promise<void> {
  await awardPoints(referrerId, POINTS.REFERIDO, 'referido_exitoso', referredId)
  await checkAndAwardBadge(referrerId, 'first_referral')
  await createNotification(referrerId, 'referido_registrado', '👥 ¡Referido exitoso!', '+500 puntos. Tu colega se sumó a Travexa Academy.', '/perfil?tab=referidos')
}

/** Puntos por compartir un logro. */
export async function onShareLogro(userId: string, referenciaId: string): Promise<void> {
  await awardPoints(userId, POINTS.SHARE_LOGRO, 'share_logro', referenciaId)
}
