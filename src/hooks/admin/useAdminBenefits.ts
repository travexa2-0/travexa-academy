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

// ── Sync curso → beneficio (CourseWizard) ─────────────────────────
// Un curso canjeable mantiene UNA fila en academy_benefits con origen='curso'.
// El índice único uq_benefit_curso_activo garantiza una sola activa por (curso,
// tipo); acá archivamos la de otro tipo antes de crear/actualizar. Nunca se borra.
export interface CourseBenefitRow { id: string; tipo: string; costo_creditos: number; descuento_valor: number | null }

async function fetchCourseBenefits(courseId: string): Promise<CourseBenefitRow[]> {
  const { data, error } = await supabase
    .from('academy_benefits')
    .select('id, tipo, costo_creditos, descuento_valor')
    .eq('course_id', courseId)
    .eq('origen', 'curso')
    .eq('archivado', false)
  if (error) throw new Error(error.message)
  return (data ?? []) as CourseBenefitRow[]
}

export function useCourseBenefits(courseId: string | undefined) {
  return useQuery({
    queryKey: ['course-benefits', courseId],
    queryFn: () => fetchCourseBenefits(courseId!),
    enabled: !!courseId,
    staleTime: 1000 * 30,
  })
}

export interface CourseBenefitSync {
  courseId: string
  titulo: string
  thumbnailUrl: string | null
  publicado: boolean
  canjeable: boolean
  tipo: 'curso_gratis' | 'descuento_pct' | null
  costoCreditos: number
  descuentoPct: number | null
}

async function syncCourseBenefit(input: CourseBenefitSync): Promise<void> {
  const { data, error } = await supabase
    .from('academy_benefits')
    .select('id, tipo')
    .eq('course_id', input.courseId)
    .eq('origen', 'curso')
    .eq('archivado', false)
  if (error) throw new Error(error.message)
  const rows = (data ?? []) as { id: string; tipo: string }[]
  const now = new Date().toISOString()
  const archive = (id: string) =>
    supabaseWrite.from('academy_benefits').update({ archivado: true, publicado: false, updated_at: now }).eq('id', id)

  // Curso ya no canjeable → archivar todo lo activo (nunca delete).
  if (!input.canjeable || !input.tipo) {
    for (const r of rows) await archive(r.id)
    return
  }

  // Archivar la fila del OTRO tipo (ej. cambió de total a parcial).
  for (const r of rows) if (r.tipo !== input.tipo) await archive(r.id)

  const titulo = input.tipo === 'descuento_pct'
    ? `${input.descuentoPct ?? 0}% OFF en ${input.titulo}`
    : input.titulo
  const payload = {
    titulo,
    tipo: input.tipo,
    origen: 'curso',
    course_id: input.courseId,
    costo_creditos: input.costoCreditos,
    descuento_valor: input.tipo === 'descuento_pct' ? input.descuentoPct : null,
    imagen_url: input.thumbnailUrl,
    publicado: input.publicado,
    archivado: false,
    updated_at: now,
  }
  const same = rows.find(r => r.tipo === input.tipo)
  if (same) {
    const { error: e } = await supabaseWrite.from('academy_benefits').update(payload).eq('id', same.id)
    if (e) throw new Error(e.message)
  } else {
    const { error: e } = await supabaseWrite.from('academy_benefits').insert({ ...payload, descripcion: null })
    if (e) throw new Error(e.message)
  }
}

export function useSyncCourseBenefit() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: syncCourseBenefit,
    onSuccess: (_r, input) => {
      qc.invalidateQueries({ queryKey: ['admin-benefits'] })
      qc.invalidateQueries({ queryKey: ['public-benefits'] })
      qc.invalidateQueries({ queryKey: ['course-benefits', input.courseId] })
    },
  })
}

// ── Realizar sorteo (edge function draw-benefit-winner) ───────────
export function useDrawBenefitWinner() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (benefitId: string) => {
      const { data, error } = await supabase.functions.invoke('draw-benefit-winner', { body: { benefitId } })
      if (error) {
        let msg = 'No pudimos realizar el sorteo. Intentá de nuevo.'
        try { const body = await (error as { context?: Response }).context?.json(); if (body?.error) msg = body.error } catch { /* */ }
        throw new Error(msg)
      }
      if (data?.error) throw new Error(data.error)
      return data as { success: true; ganador_user_id: string; total_chances: number }
    },
    onSuccess: (_r, benefitId) => {
      qc.invalidateQueries({ queryKey: ['admin-benefits'] })
      qc.invalidateQueries({ queryKey: ['admin-benefit', benefitId] })
      qc.invalidateQueries({ queryKey: ['admin-benefit-redemptions', benefitId] })
    },
  })
}

// ── Marcar canje 'otro' como entregado (RPC admin-only) ───────────
export function useMarkRedemptionDelivered() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ redemptionId }: { redemptionId: string; benefitId: string }) => {
      const { error } = await supabaseWrite.rpc('mark_redemption_delivered', { p_redemption_id: redemptionId })
      if (error) throw new Error(error.message)
    },
    onSuccess: (_r, { benefitId }) => {
      qc.invalidateQueries({ queryKey: ['admin-benefit-redemptions', benefitId] })
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
