import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { Benefit, BenefitRedemption, RedeemResult } from '@/types'

// ── Catálogo público ──────────────────────────────────────────────
// SELECT directo; la RLS pública ya filtra solo vigentes (publicado, no
// archivado, fechas OK, cupo disponible). Trae el curso vinculado para imagen,
// slug y precio. Ordena destacados primero, luego por costo.
const STORE_SELECT =
  '*, course:academy_courses(id, titulo, slug, tipo, thumbnail_url, precio_ars)'

async function fetchPublicBenefits(): Promise<Benefit[]> {
  const { data, error } = await supabase
    .from('academy_benefits')
    .select(STORE_SELECT)
    .order('destacado', { ascending: false })
    .order('costo_creditos', { ascending: true })
  if (error) throw new Error(error.message)
  return (data ?? []) as unknown as Benefit[]
}

export function usePublicBenefits() {
  return useQuery({
    queryKey: ['public-benefits'],
    queryFn: fetchPublicBenefits,
    staleTime: 1000 * 30,
  })
}

// ── Canjes del usuario (RLS: solo propios) ────────────────────────
async function fetchMyRedemptions(userId: string): Promise<BenefitRedemption[]> {
  const { data, error } = await supabase
    .from('academy_credit_redemptions')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
  if (error) throw new Error(error.message)
  return (data ?? []) as unknown as BenefitRedemption[]
}

export function useMyRedemptions(userId: string | undefined) {
  return useQuery({
    queryKey: ['my-redemptions', userId],
    queryFn: () => fetchMyRedemptions(userId!),
    enabled: !!userId,
    staleTime: 1000 * 30,
  })
}

// ── Enrollments activos del usuario (para "Ya tenés este curso") ───
async function fetchMyEnrolledCourseIds(userId: string): Promise<Set<string>> {
  const { data, error } = await supabase
    .from('academy_enrollments')
    .select('course_id')
    .eq('user_id', userId)
    .eq('activo', true)
  if (error) throw new Error(error.message)
  return new Set((data ?? []).map((r: { course_id: string }) => r.course_id))
}

export function useMyEnrolledCourseIds(userId: string | undefined) {
  return useQuery({
    queryKey: ['my-enrolled-course-ids', userId],
    queryFn: () => fetchMyEnrolledCourseIds(userId!),
    enabled: !!userId,
    staleTime: 1000 * 30,
  })
}

// ── Canje: SIEMPRE vía edge function redeem-benefit ───────────────
// El front nunca escribe canjes/créditos/cupos: todo pasa por la función.
export class RedeemError extends Error {
  code?: string
  constructor(message: string, code?: string) {
    super(message)
    this.code = code
  }
}

async function invokeRedeem(benefitId: string, cantidadChances = 1): Promise<RedeemResult> {
  const { data, error } = await supabase.functions.invoke('redeem-benefit', {
    body: { benefitId, cantidadChances },
  })
  // La edge function devuelve 400 con { error, code } en fallo de negocio;
  // supabase-js lo entrega como FunctionsHttpError con el body en context.
  if (error) {
    let msg = 'No pudimos completar el canje. Intentá de nuevo.'
    let code: string | undefined
    try {
      const body = await (error as { context?: Response }).context?.json()
      if (body?.error) msg = body.error
      if (body?.code) code = body.code
    } catch { /* sin body legible */ }
    throw new RedeemError(msg, code)
  }
  if (data?.error) throw new RedeemError(data.error, data.code)
  return data as RedeemResult
}

export function useRedeemBenefit(userId: string | undefined) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ benefitId, cantidadChances }: { benefitId: string; cantidadChances?: number }) =>
      invokeRedeem(benefitId, cantidadChances && cantidadChances > 0 ? cantidadChances : 1),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['public-benefits'] })
      qc.invalidateQueries({ queryKey: ['my-redemptions', userId] })
      qc.invalidateQueries({ queryKey: ['my-enrolled-course-ids', userId] })
      qc.invalidateQueries({ queryKey: ['academy-profile', userId] })
    },
  })
}
