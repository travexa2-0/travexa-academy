import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { Course } from '@/types'

// ── Cursos propios ────────────────────────────────────────────────
// RLS ya restringe a los cursos del instructor logueado, pero filtramos igual por
// instructor_id: la policy pública de cursos publicados también matchea, y sin el
// filtro entraría todo el catálogo.
async function fetchOwnCourses(instructorId: string): Promise<Course[]> {
  const { data, error } = await supabase
    .from('academy_courses')
    .select('*')
    .eq('instructor_id', instructorId)
    .order('created_at', { ascending: false })
  if (error) throw new Error(error.message)
  return (data ?? []) as unknown as Course[]
}

export function useOwnCourses(instructorId: string | undefined) {
  return useQuery({
    queryKey: ['instructor-courses', instructorId],
    queryFn:  () => fetchOwnCourses(instructorId!),
    enabled:  !!instructorId,
    staleTime: 1000 * 30,
  })
}

export function useOwnCourse(instructorId: string | undefined, courseId: string | undefined) {
  const { data, ...rest } = useOwnCourses(instructorId)
  return { ...rest, data: data?.find(c => c.id === courseId) ?? null }
}

// ── Ventas aprobadas de los cursos propios ────────────────────────
export interface CourseSale {
  id: string
  course_id: string
  user_id: string
  monto_ars: number
  created_at: string
}

// `academy_payments` tiene dos policies de SELECT que aplican al instructor: los pagos
// de sus cursos y los pagos que hizo él mismo como alumno. Restringimos por course_id
// para que un curso comprado a otro instructor no se cuele como venta propia.
async function fetchOwnSales(courseIds: string[]): Promise<CourseSale[]> {
  if (courseIds.length === 0) return []
  const { data, error } = await supabase
    .from('academy_payments')
    .select('id, course_id, user_id, monto_ars, created_at')
    .in('course_id', courseIds)
    .eq('tipo', 'curso')
    .eq('estado', 'aprobado')
    .order('created_at', { ascending: false })
  if (error) throw new Error(error.message)

  type Row = { id: string; course_id: string | null; user_id: string; monto_ars: number | null; created_at: string }
  return ((data as Row[] | null) ?? [])
    .filter(r => r.course_id !== null)
    .map(r => ({
      id: r.id,
      course_id: r.course_id!,
      user_id: r.user_id,
      monto_ars: r.monto_ars ?? 0,
      created_at: r.created_at,
    }))
}

export function useOwnSales(courseIds: string[] | undefined) {
  const ids = courseIds ?? []
  return useQuery({
    queryKey: ['instructor-sales', [...ids].sort()],
    queryFn:  () => fetchOwnSales(ids),
    enabled:  courseIds !== undefined,
    staleTime: 1000 * 30,
  })
}

// ── Nombres de compradores de un curso ────────────────────────────
// Vía RPC SECURITY DEFINER: devuelve solo nombre/apellido de los inscriptos activos.
// El instructor nunca lee `profiles` (ni email ni teléfono) directamente.
export interface BuyerName {
  enrollment_id: string
  nombre: string | null
  apellido: string | null
  created_at: string
}

async function fetchBuyerNames(courseId: string): Promise<BuyerName[]> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any).rpc('get_instructor_course_buyer_names', { p_course_id: courseId })
  if (error) throw new Error(error.message)
  return (data ?? []) as BuyerName[]
}

export function useCourseBuyerNames(courseId: string | undefined) {
  return useQuery({
    queryKey: ['instructor-buyers', courseId],
    queryFn:  () => fetchBuyerNames(courseId!),
    enabled:  !!courseId,
    staleTime: 1000 * 30,
  })
}

// ── Clases en vivo dentro de los cursos propios (para el calendario) ──
export interface LiveLesson {
  id: string
  course_id: string
  titulo: string
  fecha_vivo: string
}

async function fetchLiveLessons(courseIds: string[]): Promise<LiveLesson[]> {
  if (courseIds.length === 0) return []
  const { data, error } = await supabase
    .from('academy_lessons')
    .select('id, course_id, titulo, fecha_vivo')
    .in('course_id', courseIds)
    .not('fecha_vivo', 'is', null)
  if (error) throw new Error(error.message)
  return ((data as LiveLesson[] | null) ?? [])
}

export function useOwnLiveLessons(courseIds: string[] | undefined) {
  const ids = courseIds ?? []
  return useQuery({
    queryKey: ['instructor-live-lessons', [...ids].sort()],
    queryFn:  () => fetchLiveLessons(ids),
    enabled:  courseIds !== undefined,
    staleTime: 1000 * 60,
  })
}
