import type { Course } from '@/types'
import type { CourseSale } from '@/hooks/instructor/useInstructorCourses'

// Un curso "ya se dio" solo si es en vivo y su fecha quedó atrás. Los grabados y los
// ebooks no tienen fecha de corte: siguen vendiéndose indefinidamente.
export function yaSeDio(course: Pick<Course, 'tipo' | 'live_date'>): boolean {
  if (course.tipo !== 'en_vivo' || !course.live_date) return false
  return new Date(course.live_date) < new Date()
}

// La ganancia siempre sale de los pagos aprobados reales, nunca de precio × inscriptos:
// el precio de un curso puede haber cambiado después de una venta.
export function gananciaArs(brutoArs: number, sharePct: number): number {
  return Math.round((brutoArs * sharePct) / 100)
}

export function brutoDe(sales: CourseSale[]): number {
  return sales.reduce((acc, s) => acc + s.monto_ars, 0)
}

// Clave 'YYYY-MM' para agrupar por mes calendario.
export function periodKey(iso: string): string {
  return iso.slice(0, 7)
}

export function periodLabel(key: string): string {
  const [y, m] = key.split('-').map(Number)
  return new Date(y, m - 1, 1).toLocaleDateString('es-AR', { month: 'long', year: 'numeric' })
}

export function currentPeriodKey(): string {
  return new Date().toISOString().slice(0, 7)
}

export function estadoCurso(course: Pick<Course, 'tipo' | 'live_date' | 'publicado' | 'archivado'>): string {
  if (course.archivado) return 'Archivado'
  if (!course.publicado) return 'Borrador'
  if (course.tipo === 'en_vivo') return yaSeDio(course) ? 'Dado' : 'Próximo'
  return 'Publicado'
}
