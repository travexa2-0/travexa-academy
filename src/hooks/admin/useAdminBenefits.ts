import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase, supabaseWrite } from '@/lib/supabase'
import type { Benefit, BenefitRedemption } from '@/types'

const BENEFIT_SELECT = '*, course:academy_courses(id, titulo, slug, tipo)'

export type BenefitWrite = Partial<Omit<Benefit, 'course'>>

// ── List (admin ve todo estado) ──────────────────────────────────
async function fetchAdminBenefits(): Promise<Benefit[]> {
  const { data, error } = await supabase
    .from('academy_benefits')
    .select(BENEFIT_SELECT)
    .order('created_at', { ascending: false })
  if (error) throw new Error(error.message)
  return (data ?? []) as unknown as Benefit[]
}

export function useAdminBenefits() {
  return useQuery({ queryKey: ['admin-benefits'], queryFn: fetchAdminBenefits, staleTime: 1000 * 30 })
}

// ── Single ────────────────────────────────────────────────────────
async function fetchAdminBenefit(id: string): Promise<Benefit> {
  const { data, error } = await supabase
    .from('academy_benefits')
    .select(BENEFIT_SELECT)
    .eq('id', id)
    .single()
  if (error) throw new Error(error.message)
  return data as unknown as Benefit
}

export function useAdminBenefit(id: string | undefined) {
  return useQuery({
    queryKey: ['admin-benefit', id],
    queryFn:  () => fetchAdminBenefit(id!),
    enabled:  !!id,
    staleTime: 1000 * 30,
  })
}

// ── Create / update ───────────────────────────────────────────────
async function upsertBenefit(input: BenefitWrite & { id?: string }): Promise<Benefit> {
  const { id, ...rest } = input
  if (id) {
    const { data, error } = await supabaseWrite
      .from('academy_benefits')
      .update({ ...rest, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select(BENEFIT_SELECT)
      .single()
    if (error) throw new Error(error.message)
    return data as unknown as Benefit
  }
  const { data, error } = await supabaseWrite
    .from('academy_benefits')
    .insert({ ...rest, publicado: false })
    .select(BENEFIT_SELECT)
    .single()
  if (error) throw new Error(error.message)
  return data as unknown as Benefit
}

export function useUpsertBenefit() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: upsertBenefit,
    onSuccess: (benefit) => {
      qc.invalidateQueries({ queryKey: ['admin-benefits'] })
      qc.invalidateQueries({ queryKey: ['admin-benefit', benefit.id] })
    },
  })
}

// ── Publish / archive ─────────────────────────────────────────────
export function useToggleBenefitPublish() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, publicado }: { id: string; publicado: boolean }) => {
      const { error } = await supabaseWrite.from('academy_benefits').update({ publicado }).eq('id', id)
      if (error) throw new Error(error.message)
    },
    onSuccess: (_r, { id }) => {
      qc.invalidateQueries({ queryKey: ['admin-benefits'] })
      qc.invalidateQueries({ queryKey: ['admin-benefit', id] })
    },
  })
}

export function useArchiveBenefit() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, archivado }: { id: string; archivado: boolean }) => {
      const { error } = await supabaseWrite.from('academy_benefits').update({ archivado }).eq('id', id)
      if (error) throw new Error(error.message)
    },
    onSuccess: (_r, { id }) => {
      qc.invalidateQueries({ queryKey: ['admin-benefits'] })
      qc.invalidateQueries({ queryKey: ['admin-benefit', id] })
    },
  })
}

// Hard delete solo si nadie lo canjeó todavía (un canje es dato de usuario).
export function useHardDeleteBenefit() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { count, error: countError } = await supabase
        .from('academy_credit_redemptions')
        .select('id', { count: 'exact', head: true })
        .eq('benefit_id', id)
      if (countError) throw new Error(countError.message)
      if ((count ?? 0) > 0) {
        throw new Error('No se puede eliminar: el beneficio ya tiene canjes. Archivalo en su lugar.')
      }
      const { error } = await supabaseWrite.from('academy_benefits').delete().eq('id', id)
      if (error) throw new Error(error.message)
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-benefits'] }),
  })
}

// ── Canjes de un beneficio (join a profiles en JS) ────────────────
async function fetchRedemptions(benefitId: string): Promise<BenefitRedemption[]> {
  const { data, error } = await supabase
    .from('academy_credit_redemptions')
    .select('*')
    .eq('benefit_id', benefitId)
    .order('created_at', { ascending: false })
  if (error) throw new Error(error.message)

  const rows = (data ?? []) as BenefitRedemption[]
  const userIds = [...new Set(rows.map(r => r.user_id))]
  if (userIds.length === 0) return rows

  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, nombre, apellido, email, avatar_url')
    .in('id', userIds)

  const byId = new Map((profiles as BenefitRedemption['profile'][] | null ?? []).map(p => [p!.id, p]))
  return rows.map(r => ({ ...r, profile: byId.get(r.user_id) }))
}

export function useBenefitRedemptions(benefitId: string | undefined) {
  return useQuery({
    queryKey: ['admin-benefit-redemptions', benefitId],
    queryFn:  () => fetchRedemptions(benefitId!),
    enabled:  !!benefitId,
    staleTime: 1000 * 30,
  })
}

// ── Marcar ganador (sorteo_vivencial) ─────────────────────────────
export function useMarkBenefitWinner() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, userId }: { id: string; userId: string }) => {
      const { error } = await supabaseWrite
        .from('academy_benefits')
        .update({ ganador_user_id: userId, ganador_anunciado_at: new Date().toISOString() })
        .eq('id', id)
      if (error) throw new Error(error.message)
    },
    onSuccess: (_r, { id }) => {
      qc.invalidateQueries({ queryKey: ['admin-benefit', id] })
      qc.invalidateQueries({ queryKey: ['admin-benefits'] })
    },
  })
}

// ── Opciones de curso/vivencial para el wizard ────────────────────
export interface CourseOption { id: string; titulo: string; tipo: string; slug: string }

async function fetchCourseOptions(): Promise<CourseOption[]> {
  const { data, error } = await supabase
    .from('academy_courses')
    .select('id, titulo, tipo, slug')
    .eq('archivado', false)
    .order('titulo', { ascending: true })
  if (error) throw new Error(error.message)
  return (data ?? []) as CourseOption[]
}

export function useCourseOptions() {
  return useQuery({ queryKey: ['admin-course-options'], queryFn: fetchCourseOptions, staleTime: 1000 * 60 })
}
