import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase, supabaseWrite } from '@/lib/supabase'
import type { LessonComment, Review } from '@/types'

// Comentarios y reseñas de UN curso propio. A diferencia de la bandeja del admin, acá
// no se hace join a `profiles`: el instructor no tiene lectura sobre esa tabla. Los
// nombres llegan por RPC SECURITY DEFINER, que devuelve solo nombre y apellido.
export interface InstructorComment extends LessonComment {
  lesson?: { id: string; titulo: string } | null
}

export interface AuthorName {
  user_id: string
  nombre: string | null
  apellido: string | null
}

// La RPC cubre tanto a quien preguntó como a quien reseñó el curso. Si aun así un
// autor no está en el mapa, la UI cae al nombre genérico en vez de inventar uno.
async function fetchAuthorNames(courseId: string): Promise<Map<string, AuthorName>> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any).rpc('get_instructor_comment_author_names', { p_course_id: courseId })
  if (error) throw new Error(error.message)
  return new Map(((data ?? []) as AuthorName[]).map(a => [a.user_id, a]))
}

export function useCourseAuthorNames(courseId: string | undefined) {
  return useQuery({
    queryKey: ['instructor-comment-authors', courseId],
    queryFn:  () => fetchAuthorNames(courseId!),
    enabled:  !!courseId,
    staleTime: 1000 * 60,
  })
}

async function fetchCourseComments(courseId: string): Promise<InstructorComment[]> {
  const { data, error } = await supabase
    .from('academy_lesson_comments')
    .select('*, lesson:academy_lessons(id, titulo)')
    .eq('course_id', courseId)
    .order('publicado', { ascending: true })
    .order('created_at', { ascending: false })
  if (error) throw new Error(error.message)
  return (data ?? []) as unknown as InstructorComment[]
}

async function fetchCourseReviews(courseId: string): Promise<Review[]> {
  const { data, error } = await supabase
    .from('academy_reviews')
    .select('*')
    .eq('course_id', courseId)
    .order('publicado', { ascending: true })
    .order('created_at', { ascending: false })
  if (error) throw new Error(error.message)
  return (data ?? []) as unknown as Review[]
}

export function useCourseComments(courseId: string | undefined) {
  return useQuery({
    queryKey: ['instructor-comments', courseId],
    queryFn:  () => fetchCourseComments(courseId!),
    enabled:  !!courseId,
    staleTime: 1000 * 20,
  })
}

export function useCourseReviews(courseId: string | undefined) {
  return useQuery({
    queryKey: ['instructor-reviews', courseId],
    queryFn:  () => fetchCourseReviews(courseId!),
    enabled:  !!courseId,
    staleTime: 1000 * 20,
  })
}

// Responder = completar `respuesta`; el trigger en DB pone publicado=true solo.
export function useInstructorRespondComment() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, respuesta }: { id: string; courseId: string; respuesta: string }) => {
      const { error } = await supabaseWrite
        .from('academy_lesson_comments')
        .update({ respuesta: respuesta.trim(), respondido_at: new Date().toISOString() })
        .eq('id', id)
      if (error) throw new Error(error.message)
    },
    onSuccess: (_r, v) => { void qc.invalidateQueries({ queryKey: ['instructor-comments', v.courseId] }) },
  })
}

export function useInstructorRespondReview() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, respuesta }: { id: string; courseId: string; respuesta: string }) => {
      const { error } = await supabaseWrite
        .from('academy_reviews')
        .update({ respuesta: respuesta.trim(), respondido_at: new Date().toISOString() })
        .eq('id', id)
      if (error) throw new Error(error.message)
    },
    onSuccess: (_r, v) => { void qc.invalidateQueries({ queryKey: ['instructor-reviews', v.courseId] }) },
  })
}
