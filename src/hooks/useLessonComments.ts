import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase, supabaseWrite } from '@/lib/supabase'
import type { LessonComment } from '@/types'

const COMMENT_SELECT = '*, profile:profiles(id, nombre, apellido, avatar_url)'

// RLS: el alumno ve los comentarios publicados de la lección + los propios (aunque estén pendientes).
async function fetchLessonComments(lessonId: string): Promise<LessonComment[]> {
  const { data, error } = await supabase
    .from('academy_lesson_comments')
    .select(COMMENT_SELECT)
    .eq('lesson_id', lessonId)
    .order('created_at', { ascending: false })
  if (error) return []
  return (data ?? []) as unknown as LessonComment[]
}

export function useLessonComments(lessonId: string | undefined) {
  return useQuery({
    queryKey: ['lesson-comments', lessonId],
    queryFn:  () => fetchLessonComments(lessonId!),
    enabled:  !!lessonId,
    staleTime: 1000 * 30,
  })
}

// El alumno manda su pregunta. Queda `publicado=false` hasta que Yesica responda (trigger en DB).
export function useAddLessonComment(userId: string | undefined) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ lessonId, courseId, comentario }: { lessonId: string; courseId: string; comentario: string }) => {
      const { error } = await supabaseWrite
        .from('academy_lesson_comments')
        .insert({ lesson_id: lessonId, course_id: courseId, user_id: userId, comentario: comentario.trim() })
      if (error) throw new Error(error.message)
    },
    onSuccess: (_r, { lessonId }) => {
      void qc.invalidateQueries({ queryKey: ['lesson-comments', lessonId] })
    },
  })
}
