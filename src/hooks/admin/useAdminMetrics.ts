import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { Payment, Profile } from '@/types'

export interface BuyerRow {
  userId: string
  nombre: string
  compras: number
  totalArs: number
}
export interface InstructorRow {
  instructorId: string
  nombre: string
  revenueSharePct: number
  ventas: number
  brutoArs: number
  shareArs: number
}
export interface OnboardingFunnel {
  registrados: number
  conPerfil: number       // completó datos de asesor (tipo_vendedor / experiencia)
  completos: number       // onboarding_completo = true
}
export interface MetricsResult {
  ingresoBrutoArs: number
  comisionMpArs: number
  pagoInstructoresArs: number
  netoArs: number
  buyers: BuyerRow[]
  instructors: InstructorRow[]
  funnel: OnboardingFunnel
  leccionesCompletadas: number
  leccionesTotales: number
  enrollmentsCompletados: number
  enrollmentsTotales: number
}

interface CourseLite { id: string; instructor_id: string | null }
interface InstructorLite { id: string; nombre: string; revenue_share_pct: number }
type ProfileLite = Pick<Profile, 'id' | 'nombre' | 'apellido'>

async function fetchMetrics(comisionMpPct: number): Promise<MetricsResult> {
  const [payRes, courseRes, instrRes, lpRes, enrRes, apRes] = await Promise.all([
    supabase.from('academy_payments').select('user_id, course_id, monto_ars, estado').eq('estado', 'aprobado'),
    supabase.from('academy_courses').select('id, instructor_id'),
    supabase.from('academy_instructors').select('id, nombre, revenue_share_pct'),
    supabase.from('academy_lesson_progress').select('completada'),
    supabase.from('academy_enrollments').select('completado'),
    supabase.from('academy_profiles').select('onboarding_completo, tipo_vendedor'),
  ])

  const payments = (payRes.data as Pick<Payment, 'user_id' | 'course_id' | 'monto_ars'>[] | null) ?? []
  const courses = (courseRes.data as CourseLite[] | null) ?? []
  const instructors = (instrRes.data as InstructorLite[] | null) ?? []
  const courseInstructor = new Map(courses.map(c => [c.id, c.instructor_id]))
  const instructorById = new Map(instructors.map(i => [i.id, i]))

  let ingresoBrutoArs = 0
  let pagoInstructoresArs = 0
  const buyerMap = new Map<string, BuyerRow>()
  const instrAgg = new Map<string, InstructorRow>()

  for (const p of payments) {
    const monto = p.monto_ars ?? 0
    ingresoBrutoArs += monto

    // Buyer aggregation
    const b = buyerMap.get(p.user_id) ?? { userId: p.user_id, nombre: p.user_id.slice(0, 8), compras: 0, totalArs: 0 }
    b.compras += 1
    b.totalArs += monto
    buyerMap.set(p.user_id, b)

    // Instructor aggregation + revenue share
    const instrId = p.course_id ? courseInstructor.get(p.course_id) ?? null : null
    if (instrId) {
      const instr = instructorById.get(instrId)
      const sharePct = instr?.revenue_share_pct ?? 0
      const shareArs = monto * (sharePct / 100)
      pagoInstructoresArs += shareArs
      const row = instrAgg.get(instrId) ?? {
        instructorId: instrId, nombre: instr?.nombre ?? '—', revenueSharePct: sharePct, ventas: 0, brutoArs: 0, shareArs: 0,
      }
      row.ventas += 1
      row.brutoArs += monto
      row.shareArs += shareArs
      instrAgg.set(instrId, row)
    }
  }

  const comisionMpArs = ingresoBrutoArs * (comisionMpPct / 100)
  const netoArs = ingresoBrutoArs - comisionMpArs - pagoInstructoresArs

  // Resolve buyer names
  const buyerIds = [...buyerMap.keys()]
  if (buyerIds.length > 0) {
    const { data: profiles } = await supabase.from('profiles').select('id, nombre, apellido').in('id', buyerIds)
    const byId = new Map((profiles as ProfileLite[] | null ?? []).map(p => [p.id, p]))
    for (const [id, row] of buyerMap) {
      const p = byId.get(id)
      if (p) row.nombre = [p.nombre, p.apellido].filter(Boolean).join(' ') || row.nombre
    }
  }

  const lps = (lpRes.data as { completada: boolean }[] | null) ?? []
  const enrs = (enrRes.data as { completado: boolean }[] | null) ?? []
  const aps = (apRes.data as { onboarding_completo: boolean; tipo_vendedor: string | null }[] | null) ?? []

  const funnel: OnboardingFunnel = {
    registrados: aps.length,
    conPerfil: aps.filter(a => !!a.tipo_vendedor).length,
    completos: aps.filter(a => a.onboarding_completo).length,
  }

  return {
    ingresoBrutoArs,
    comisionMpArs,
    pagoInstructoresArs,
    netoArs,
    buyers: [...buyerMap.values()].sort((a, b) => b.totalArs - a.totalArs).slice(0, 20),
    instructors: [...instrAgg.values()].sort((a, b) => b.brutoArs - a.brutoArs),
    funnel,
    leccionesCompletadas: lps.filter(l => l.completada).length,
    leccionesTotales: lps.length,
    enrollmentsCompletados: enrs.filter(e => e.completado).length,
    enrollmentsTotales: enrs.length,
  }
}

export function useAdminMetrics(comisionMpPct: number) {
  return useQuery({
    queryKey: ['admin-metrics', comisionMpPct],
    queryFn:  () => fetchMetrics(comisionMpPct),
    staleTime: 1000 * 60,
  })
}
