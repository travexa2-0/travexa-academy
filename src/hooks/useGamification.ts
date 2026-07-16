import { supabase } from '@/lib/supabase'
import { createNotification } from './useNotifications'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = () => supabase as any

// ── Acciones de puntos ────────────────────────────────────────────
// Deben existir en la edge function award-points (única fuente de verdad).
export type AccionPuntos =
  | 'registro'
  | 'perfil_completado'
  | 'curso_comprado'
  | 'leccion_completada'
  | 'curso_completado'
  | 'vivencial_reservado'
  | 'vivencial_completado'
  | 'resena_publicada'
  | 'racha_30_dias'
  | 'clase_en_vivo_asistida'
  | 'referido_registrado'
  | 'referido_compra'
  | 'logro_compartido'

interface AwardResult {
  awarded: boolean   // true si ESTE llamado otorgó (false si ya estaba, por idempotencia)
  xp: number
  creditos: number
  badges: string[]
}

// Única vía para otorgar puntos desde el cliente. La edge function award-points es
// la fuente de verdad: aplica la tabla de puntos (XP + Créditos), garantiza
// idempotencia por (motivo, referencia_id) y dispara el chequeo de badges. El front
// ya no inserta transacciones ni actualiza totales a mano.
async function awardViaEdge(userId: string, accion: AccionPuntos, referenciaId?: string): Promise<AwardResult> {
  try {
    const { data, error } = await supabase.functions.invoke('award-points', {
      body: { userId, accion, referenciaId },
    })
    if (error) return { awarded: false, xp: 0, creditos: 0, badges: [] }
    const d = (data ?? {}) as { success?: boolean; already_awarded?: boolean; xp?: number; creditos?: number; badges?: string[] }
    return {
      awarded: !!d.success && !d.already_awarded,
      xp: d.xp ?? 0,
      creditos: d.creditos ?? 0,
      badges: d.badges ?? [],
    }
  } catch {
    return { awarded: false, xp: 0, creditos: 0, badges: [] }
  }
}

// ── Racha (ventana de 30 días, ligada a formación) ────────────────
const STREAK_WINDOW_DAYS = 30
const DAY_MS = 86_400_000

interface StreakResult { streak: number; leveledUp: boolean }

// Se llama SOLO desde acciones de formación/vivencial (nunca desde un login).
// Unidad mínima = 30 días (no existe racha de 7):
//  · Más de 30 días sin actividad → la racha se reinicia (streak = 1).
//  · Cada ventana de 30 días completada manteniendo actividad → streak_actual +1.
// Es una sola racha por alumno, basada en su actividad de formación más reciente,
// sin importar de qué curso. `ultimo_acceso_leccion` = última actividad;
// `streak_window_start` = ancla de la ventana actual (hacen falta ambos para
// distinguir "cruzó una ventana" de "hubo un gap > 30 días").
async function updateStreak(userId: string): Promise<StreakResult> {
  const { data: profile } = await db()
    .from('academy_profiles')
    .select('streak_actual, streak_maximo, ultimo_acceso_leccion, streak_window_start')
    .eq('user_id', userId)
    .single()

  if (!profile) return { streak: 0, leveledUp: false }

  const now          = Date.now()
  const lastActivity = profile.ultimo_acceso_leccion ? new Date(profile.ultimo_acceso_leccion).getTime() : null
  const windowStart  = profile.streak_window_start ? new Date(profile.streak_window_start).getTime() : null
  const streakActual = (profile.streak_actual as number) ?? 0
  const gapDays      = lastActivity != null ? (now - lastActivity) / DAY_MS : Infinity

  let streak: number
  let newWindowStart: number
  let leveledUp = false

  if (windowStart == null || lastActivity == null || gapDays > STREAK_WINDOW_DAYS) {
    // Primera actividad, o gap mayor a 30 días → racha nueva desde 1.
    streak = 1
    newWindowStart = now
  } else if ((now - windowStart) / DAY_MS >= STREAK_WINDOW_DAYS) {
    // Se completó una ventana de 30 días manteniendo actividad → sube un nivel.
    streak = streakActual + 1
    newWindowStart = now
    leveledUp = true
  } else {
    // Dentro de la ventana actual: sigue viva, sin cambio de nivel.
    streak = streakActual > 0 ? streakActual : 1
    newWindowStart = windowStart
  }

  const nuevoMax = Math.max(streak, (profile.streak_maximo as number) ?? 0)
  await db().from('academy_profiles').update({
    streak_actual: streak,
    streak_maximo: nuevoMax,
    ultimo_acceso_leccion: new Date(now).toISOString(),
    streak_window_start: new Date(newWindowStart).toISOString(),
  }).eq('user_id', userId)

  return { streak, leveledUp }
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
  let puntosGanados = 0  // XP para el toast
  let badgeGanado: string | null = null
  let cursoCompleto = false

  // 1. Puntos por lección (edge). El badge de primera lección lo evalúa check-badges.
  const leccion = await awardViaEdge(userId, 'leccion_completada', lessonId)
  puntosGanados += leccion.xp
  if (leccion.badges[0]) badgeGanado = leccion.badges[0]

  // 2. Racha de formación. Si cruza una ventana de 30 días → bono racha_30_dias.
  const { streak, leveledUp } = await updateStreak(userId)
  if (leveledUp) {
    const racha = await awardViaEdge(userId, 'racha_30_dias', `racha_${userId}_${streak}`)
    puntosGanados += racha.xp
    if (racha.badges[0]) badgeGanado = racha.badges[0]
    await createNotification(
      userId,
      'streak',
      `🔥 ¡Racha de ${streak} ${streak === 1 ? 'mes' : 'meses'}!`,
      `Sumaste ${racha.xp} XP y ${racha.creditos} créditos. ¡Seguí así!`,
      '/perfil',
    )
  }

  // 3. Curso completo
  if (completedLessonsCount >= allLessonsCount && allLessonsCount > 0) {
    cursoCompleto = true

    const curso = await awardViaEdge(userId, 'curso_completado', courseId)
    puntosGanados += curso.xp
    if (curso.badges[0]) badgeGanado = curso.badges[0]

    // Efectos "una sola vez" solo cuando ESTE llamado marcó el curso como completo.
    if (curso.awarded) {
      const { data: profile } = await db()
        .from('academy_profiles')
        .select('total_cursos_completados')
        .eq('user_id', userId)
        .single()
      const total = ((profile?.total_cursos_completados ?? 0) as number) + 1
      await db().from('academy_profiles').update({ total_cursos_completados: total }).eq('user_id', userId)

      await db()
        .from('academy_enrollments')
        .update({ completado: true, progreso_pct: 100, fecha_completado: new Date().toISOString() })
        .eq('user_id', userId)
        .eq('course_id', courseId)

      await db().from('academy_certificates').insert({
        user_id: userId,
        course_id: courseId,
        enrollment_id: courseId,  // aproximado; idealmente obtener enrollment_id real
      })

      await createNotification(
        userId,
        'curso_completado',
        `🎓 ¡Completaste "${courseTitle}"!`,
        `Sumaste ${curso.xp} XP y ${curso.creditos} créditos. Tu certificado ya está disponible.`,
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

/** Llamar cuando el usuario completa un vivencial. */
export async function onVivencialCompletado(userId: string): Promise<void> {
  const res = await awardViaEdge(userId, 'vivencial_completado', `vivencial_completado_${userId}`)
  if (!res.awarded) return

  const { data: p } = await db().from('academy_profiles').select('total_vivenciales').eq('user_id', userId).single()
  const total = ((p?.total_vivenciales ?? 0) as number) + 1
  await db().from('academy_profiles').update({ total_vivenciales: total }).eq('user_id', userId)

  await createNotification(userId, 'vivencial_completo', '✈️ ¡Viaje vivencial completado!', `Sumaste ${res.xp} XP y ${res.creditos} créditos.`, '/perfil')
}

/** Llamar al confirmar la reserva de un vivencial. */
export async function onVivencialReservado(userId: string, enrollmentId: string): Promise<void> {
  await awardViaEdge(userId, 'vivencial_reservado', enrollmentId)
}

/** Llamar cuando un referido completa su primera compra. */
export async function onReferralComplete(referrerId: string, referredId: string): Promise<void> {
  await awardViaEdge(referrerId, 'referido_compra', referredId)
}

/** Puntos por compartir un logro. */
export async function onShareLogro(userId: string, referenciaId: string): Promise<void> {
  await awardViaEdge(userId, 'logro_compartido', referenciaId)
}
