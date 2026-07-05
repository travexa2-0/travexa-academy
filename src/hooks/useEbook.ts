import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase, supabaseWrite } from '@/lib/supabase'
import type { EbookProgress } from '@/types'

async function fetchEbookProgress(userId: string, courseId: string): Promise<EbookProgress | null> {
  const { data, error } = await supabase
    .from('academy_ebook_progress')
    .select('*')
    .eq('user_id', userId)
    .eq('course_id', courseId)
    .maybeSingle()
  if (error) return null
  return (data ?? null) as EbookProgress | null
}

export function useEbookProgress(userId: string | undefined, courseId: string | undefined) {
  return useQuery({
    queryKey: ['ebook-progress', userId, courseId],
    queryFn:  () => fetchEbookProgress(userId!, courseId!),
    enabled:  !!userId && !!courseId,
    staleTime: 1000 * 30,
  })
}

// Progreso de todos los ebooks del usuario (para "Mi biblioteca").
export function useMyEbookProgress(userId: string | undefined) {
  return useQuery({
    queryKey: ['ebook-progress', userId, 'all'],
    queryFn: async (): Promise<EbookProgress[]> => {
      const { data, error } = await supabase
        .from('academy_ebook_progress')
        .select('*')
        .eq('user_id', userId!)
      if (error) return []
      return (data ?? []) as EbookProgress[]
    },
    enabled: !!userId,
    staleTime: 1000 * 30,
  })
}

interface ProgressPatch {
  courseId: string
  ultimaPagina: number
  completado?: boolean
}

// Upsert de progreso. RLS exige enrollment.activo=true para crear la fila.
export function useUpdateEbookProgress(userId: string | undefined) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ courseId, ultimaPagina, completado }: ProgressPatch) => {
      const payload: Record<string, unknown> = {
        user_id: userId,
        course_id: courseId,
        ultima_pagina: ultimaPagina,
        updated_at: new Date().toISOString(),
      }
      if (completado) {
        payload.completado = true
        payload.completado_at = new Date().toISOString()
      }
      const { error } = await supabaseWrite
        .from('academy_ebook_progress')
        .upsert(payload, { onConflict: 'user_id,course_id' })
      if (error) throw new Error(error.message)
    },
    onSuccess: (_r, { courseId }) => {
      void qc.invalidateQueries({ queryKey: ['ebook-progress', userId, courseId] })
      void qc.invalidateQueries({ queryKey: ['ebook-progress', userId, 'all'] })
    },
  })
}
