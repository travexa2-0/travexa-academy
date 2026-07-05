import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase, supabaseWrite } from '@/lib/supabase'
import type { LessonComment, Review } from '@/types'

// ── Tipos enriquecidos para la bandeja ───────────────────────────
export interface ModComment extends LessonComment {
  lesson?: { id: string; titulo: string } | null
  course?: { id: string; titulo: string; slug: string } | null
}
export interface ModReview extends Review {
  course?: { id: string; titulo: string; slug: string } | null
}

const COMMENT_SELECT =
  '*, profile:profiles(id, nombre, apellido, avatar_url), lesson:academy_lessons(id, titulo), course:academy_courses(id, titulo, slug)'
const REVIEW_SELECT =
  '*, profile:profiles(id, nombre, apellido, avatar_url), course:academy_courses(id, titulo, slug)'

// Pendientes primero (publicado=false = sin responder), luego por fecha.
async function fetchModComments(): Promise<ModComment[]> {
  const { data, error } = await supabase
    .from('academy_lesson_comments')
    .select(COMMENT_SELECT)
    .order('publicado', { ascending: true })
    .order('created_at', { ascending: false })
  if (error) throw new Error(error.message)
  return (data ?? []) as unknown as ModComment[]
}

async function fetchModReviews(): Promise<ModReview[]> {
  const { data, error } = await supabase
    .from('academy_reviews')
    .select(REVIEW_SELECT)
    .order('publicado', { ascending: true })
    .order('created_at', { ascending: false })
  if (error) throw new Error(error.message)
  return (data ?? []) as unknown as ModReview[]
}

export function useModComments() {
  return useQuery({ queryKey: ['mod-comments'], queryFn: fetchModComments, staleTime: 1000 * 20 })
}

export function useModReviews() {
  return useQuery({ queryKey: ['mod-reviews'], queryFn: fetchModReviews, staleTime: 1000 * 20 })
}

// Contador de pendientes (comentarios + reseñas sin responder) para el badge del nav.
export function useModerationPendingCount() {
  return useQuery({
    queryKey: ['mod-pending-count'],
    queryFn: async (): Promise<number> => {
      const [c, r] = await Promise.all([
        supabase.from('academy_lesson_comments').select('id', { count: 'exact', head: true }).eq('publicado', false),
        supabase.from('academy_reviews').select('id', { count: 'exact', head: true }).eq('publicado', false),
      ])
      return (c.count ?? 0) + (r.count ?? 0)
    },
    staleTime: 1000 * 30,
  })
}

// Responder = completar `respuesta`; el trigger en DB pone publicado=true solo.
export function useRespondComment() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, respuesta }: { id: string; respuesta: string }) => {
      const { error } = await supabaseWrite
        .from('academy_lesson_comments')
        .update({ respuesta: respuesta.trim(), respondido_at: new Date().toISOString() })
        .eq('id', id)
      if (error) throw new Error(error.message)
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['mod-comments'] })
      void qc.invalidateQueries({ queryKey: ['mod-pending-count'] })
    },
  })
}

export function useRespondReview() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, respuesta }: { id: string; respuesta: string }) => {
      const { error } = await supabaseWrite
        .from('academy_reviews')
        .update({ respuesta: respuesta.trim(), respondido_at: new Date().toISOString() })
        .eq('id', id)
      if (error) throw new Error(error.message)
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['mod-reviews'] })
      void qc.invalidateQueries({ queryKey: ['mod-pending-count'] })
    },
  })
}

export function useDeleteComment() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabaseWrite.from('academy_lesson_comments').delete().eq('id', id)
      if (error) throw new Error(error.message)
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['mod-comments'] })
      void qc.invalidateQueries({ queryKey: ['mod-pending-count'] })
    },
  })
}

export function useDeleteReview() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabaseWrite.from('academy_reviews').delete().eq('id', id)
      if (error) throw new Error(error.message)
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['mod-reviews'] })
      void qc.invalidateQueries({ queryKey: ['mod-pending-count'] })
    },
  })
}
