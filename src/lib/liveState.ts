import type { Course } from '@/types'

export type CourseLiveState = 'none' | 'upcoming' | 'live' | 'recorded'

/**
 * Estado de una clase en vivo a nivel curso:
 * - 'none': no es en_vivo, o no tiene fecha/duración cargadas → no mostrar bloque en vivo.
 * - 'upcoming': la fecha es futura → "Próxima".
 * - 'live': el momento actual cae dentro de [live_date, live_date + duración] → "En vivo ahora".
 * - 'recorded': ya pasó y hay link de grabación (live_url) → se comporta como un curso grabado normal.
 *   (Si pasó y no hay grabación, devolvemos 'none': no se muestra el bloque en vivo.)
 */
export function courseLiveState(
  course: Pick<Course, 'tipo' | 'live_date' | 'live_duration_minutes' | 'live_url'>,
): CourseLiveState {
  if (course.tipo !== 'en_vivo') return 'none'
  if (!course.live_date || !course.live_duration_minutes) return 'none'
  const start = new Date(course.live_date).getTime()
  if (Number.isNaN(start)) return 'none'
  const end = start + course.live_duration_minutes * 60_000
  const now = Date.now()
  if (now < start) return 'upcoming'
  if (now <= end) return 'live'
  return course.live_url ? 'recorded' : 'none'
}
