import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase, supabaseWrite } from '@/lib/supabase'
import type { Course, Category, Instructor, Enrollment, Module, Review } from '@/types'

type CourseRow = Omit<Course, 'category' | 'instructor' | 'modules'> & {
  category: Category | null
  instructor: Instructor | null
}

function normalizeCourse(row: CourseRow): Course {
  return {
    ...row,
    tipo: (row as unknown as Course).tipo ?? 'grabado',
    fotos: (row as unknown as Course).fotos ?? [],
    incluye: (row as unknown as Course).incluye ?? null,
    no_incluye: (row as unknown as Course).no_incluye ?? null,
    vivencial_itinerario: (row as unknown as Course).vivencial_itinerario ?? [],
    duracion_total_minutos: (row as unknown as Course).duracion_total_minutos ?? 0,
    total_lecciones: (row as unknown as Course).total_lecciones ?? 0,
    rating_avg: (row as unknown as Course).rating_avg ?? 0,
    rating_count: (row as unknown as Course).rating_count ?? 0,
    category: row.category ?? undefined,
    instructor: row.instructor ?? undefined,
  } as Course
}

async function fetchCourses(categoryId?: string): Promise<Course[]> {
  let query = supabase
    .from('academy_courses')
    .select(`*, category:academy_categories(*), instructor:academy_instructors(*)`)
    .eq('publicado', true)
    .eq('archivado', false)
    .order('destacado', { ascending: false })
    .order('created_at', { ascending: false })

  if (categoryId) query = query.eq('category_id', categoryId)

  const { data, error } = await query
  if (error) throw new Error(error.message)
  return (data as CourseRow[]).map(normalizeCourse)
}

async function fetchCourseBySlug(slug: string, preview = false): Promise<Course & { modules: Module[] }> {
  let query = supabase
    .from('academy_courses')
    .select(`
      *,
      category:academy_categories(*),
      instructor:academy_instructors(*),
      modules:academy_modules(*, lessons:academy_lessons(*))
    `)
    .eq('slug', slug)

  // Preview mode (admin only, gated by RLS): ver borradores/archivados sin filtrar estado.
  if (!preview) query = query.eq('publicado', true).eq('archivado', false)

  const { data, error } = await query.single()

  if (error) throw new Error(error.message)
  const course = normalizeCourse(data as CourseRow)
  return { ...course, modules: (data as CourseRow & { modules?: Module[] }).modules ?? [] } as Course & { modules: Module[] }
}

async function fetchCategories(): Promise<Category[]> {
  const { data, error } = await supabase
    .from('academy_categories')
    .select('*')
    .eq('activo', true)
    .order('orden', { ascending: true })

  if (error) throw new Error(error.message)
  return data as Category[]
}

async function fetchMyEnrollments(userId: string): Promise<Enrollment[]> {
  const { data, error } = await supabase
    .from('academy_enrollments')
    .select(`*, course:academy_courses(*, category:academy_categories(*), instructor:academy_instructors(*))`)
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) throw new Error(error.message)
  return (data ?? []) as Enrollment[]
}

async function fetchWishlist(userId: string): Promise<string[]> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from('academy_wishlists')
    .select('course_id')
    .eq('user_id', userId)

  if (error) throw new Error((error as Error).message)
  return ((data ?? []) as Array<{ course_id: string }>).map(r => r.course_id)
}

async function toggleWishlist(userId: string, courseId: string, isWishlisted: boolean): Promise<void> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any
  if (isWishlisted) {
    await db.from('academy_wishlists').delete().eq('user_id', userId).eq('course_id', courseId)
  } else {
    await db.from('academy_wishlists').insert({ user_id: userId, course_id: courseId })
  }
}

export function useCourses(categoryId?: string) {
  return useQuery({
    queryKey: ['courses', categoryId ?? 'all'],
    queryFn:  () => fetchCourses(categoryId),
    staleTime: 1000 * 60 * 5,
  })
}

export function useCourseDetail(slug: string, preview = false) {
  return useQuery({
    queryKey: ['course', slug, preview ? 'preview' : 'public'],
    queryFn:  () => fetchCourseBySlug(slug, preview),
    staleTime: preview ? 0 : 1000 * 60 * 5,
    enabled:  !!slug,
  })
}

export function useCategories() {
  return useQuery({
    queryKey: ['categories'],
    queryFn:  fetchCategories,
    staleTime: 1000 * 60 * 10,
  })
}

export function useMyEnrollments(userId: string | undefined) {
  return useQuery({
    queryKey: ['enrollments', userId],
    queryFn:  () => fetchMyEnrollments(userId!),
    staleTime: 1000 * 60 * 2,
    enabled:  !!userId,
  })
}

export function useWishlist(userId: string | undefined) {
  return useQuery({
    queryKey: ['wishlist', userId],
    queryFn:  () => fetchWishlist(userId!),
    staleTime: 1000 * 60 * 5,
    enabled:  !!userId,
  })
}

const REVIEW_SELECT = '*, profile:profiles(id, nombre, apellido, avatar_url)'

async function fetchReviews(courseId: string): Promise<Review[]> {
  const { data, error } = await supabase
    .from('academy_reviews')
    .select(REVIEW_SELECT)
    .eq('course_id', courseId)
    .eq('publicado', true)
    .order('created_at', { ascending: false })
  if (error) return []
  return (data ?? []) as unknown as Review[]
}

export function useReviews(courseId: string | undefined) {
  return useQuery({
    queryKey: ['reviews', courseId],
    queryFn:  () => fetchReviews(courseId!),
    staleTime: 1000 * 60 * 5,
    enabled:  !!courseId,
  })
}

// La reseña propia del usuario para un curso (puede estar pendiente de publicación).
async function fetchMyReview(userId: string, courseId: string): Promise<Review | null> {
  const { data, error } = await supabase
    .from('academy_reviews')
    .select('*')
    .eq('user_id', userId)
    .eq('course_id', courseId)
    .maybeSingle()
  if (error) return null
  return (data ?? null) as unknown as Review | null
}

export function useMyReview(userId: string | undefined, courseId: string | undefined) {
  return useQuery({
    queryKey: ['my-review', userId, courseId],
    queryFn:  () => fetchMyReview(userId!, courseId!),
    enabled:  !!userId && !!courseId,
    staleTime: 1000 * 60,
  })
}

// Inserta la reseña obligatoria de cierre de curso. RLS exige enrollment.completado=true.
// El backend valida el mínimo de 5 palabras; validamos también en el cliente antes de llamar.
export function useSubmitReview(userId: string | undefined) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ courseId, rating, comentario }: { courseId: string; rating: number; comentario: string }) => {
      const { error } = await supabaseWrite
        .from('academy_reviews')
        .insert({ user_id: userId, course_id: courseId, rating, comentario: comentario.trim() })
      if (error) throw new Error(error.message)
    },
    onSuccess: (_r, { courseId }) => {
      void qc.invalidateQueries({ queryKey: ['my-review', userId, courseId] })
      void qc.invalidateQueries({ queryKey: ['reviews', courseId] })
    },
  })
}

export function useToggleWishlist(userId: string | undefined) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ courseId, isWishlisted }: { courseId: string; isWishlisted: boolean }) =>
      toggleWishlist(userId!, courseId, isWishlisted),
    onMutate: async ({ courseId, isWishlisted }) => {
      await qc.cancelQueries({ queryKey: ['wishlist', userId] })
      const prev = qc.getQueryData<string[]>(['wishlist', userId]) ?? []
      qc.setQueryData<string[]>(['wishlist', userId], isWishlisted
        ? prev.filter(id => id !== courseId)
        : [...prev, courseId])
      return { prev }
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) qc.setQueryData(['wishlist', userId], ctx.prev)
    },
    onSettled: () => qc.invalidateQueries({ queryKey: ['wishlist', userId] }),
  })
}
