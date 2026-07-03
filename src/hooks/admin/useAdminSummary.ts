import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { AdminSummaryKpis, Payment, Enrollment } from '@/types'

function monthStart(offset = 0): Date {
  const d = new Date()
  return new Date(d.getFullYear(), d.getMonth() - offset, 1)
}

async function fetchSummary(): Promise<AdminSummaryKpis> {
  const startISO = monthStart().toISOString()

  const [payRes, profRes, courseRes] = await Promise.all([
    supabase.from('academy_payments').select('monto_ars, estado, created_at').eq('estado', 'aprobado').gte('created_at', startISO),
    supabase.from('profiles').select('id', { count: 'exact', head: true }).gte('created_at', startISO),
    supabase.from('academy_courses').select('publicado, archivado, tipo, vivencial_cupo_disponible'),
  ])

  const payments = (payRes.data as Pick<Payment, 'monto_ars'>[] | null) ?? []
  const ingresosMesArs = payments.reduce((sum, p) => sum + (p.monto_ars ?? 0), 0)

  const courses = (courseRes.data as { publicado: boolean; archivado: boolean; tipo: string; vivencial_cupo_disponible: number | null }[] | null) ?? []
  const activos = courses.filter(c => !c.archivado)
  const cursosPublicados = activos.filter(c => c.publicado).length
  const cursosBorrador = activos.filter(c => !c.publicado).length
  const vivencialesCupoAbierto = activos.filter(c => c.tipo === 'vivencial' && c.publicado && (c.vivencial_cupo_disponible ?? 0) > 0).length

  return {
    ingresosMesArs,
    ventasMes: payments.length,
    alumnosNuevosMes: profRes.count ?? 0,
    cursosPublicados,
    cursosBorrador,
    vivencialesCupoAbierto,
  }
}

export function useAdminSummary() {
  return useQuery({ queryKey: ['admin-summary'], queryFn: fetchSummary, staleTime: 1000 * 30 })
}

// ── Revenue series (last 6 months) for the chart ─────────────────
export interface MonthPoint { label: string; ars: number; ventas: number }

async function fetchRevenueSeries(): Promise<MonthPoint[]> {
  const start = monthStart(5).toISOString()
  const { data } = await supabase
    .from('academy_payments')
    .select('monto_ars, created_at, estado')
    .eq('estado', 'aprobado')
    .gte('created_at', start)

  const payments = (data as Pick<Payment, 'monto_ars' | 'created_at'>[] | null) ?? []
  const months: MonthPoint[] = []
  for (let i = 5; i >= 0; i--) {
    const d = monthStart(i)
    months.push({ label: d.toLocaleDateString('es-AR', { month: 'short' }), ars: 0, ventas: 0 })
  }
  const indexOf = (iso: string) => {
    const d = new Date(iso)
    const now = new Date()
    return 5 - ((now.getFullYear() - d.getFullYear()) * 12 + (now.getMonth() - d.getMonth()))
  }
  for (const p of payments) {
    const idx = indexOf(p.created_at)
    if (idx >= 0 && idx < 6) {
      months[idx].ars += p.monto_ars ?? 0
      months[idx].ventas += 1
    }
  }
  return months
}

export function useRevenueSeries() {
  return useQuery({ queryKey: ['admin-revenue-series'], queryFn: fetchRevenueSeries, staleTime: 1000 * 60 })
}

// ── Recent activity (latest payments + enrollments) ──────────────
export interface ActivityItem {
  id: string
  kind: 'pago' | 'inscripcion'
  at: string
  montoArs: number | null
}

async function fetchRecentActivity(): Promise<ActivityItem[]> {
  const [payRes, enrRes] = await Promise.all([
    supabase.from('academy_payments').select('id, monto_ars, created_at, estado').order('created_at', { ascending: false }).limit(8),
    supabase.from('academy_enrollments').select('id, created_at, monto_total_ars').order('created_at', { ascending: false }).limit(8),
  ])
  const pagos = ((payRes.data as (Pick<Payment, 'id' | 'monto_ars' | 'created_at'>)[] | null) ?? [])
    .map<ActivityItem>(p => ({ id: p.id, kind: 'pago', at: p.created_at, montoArs: p.monto_ars }))
  const insc = ((enrRes.data as (Pick<Enrollment, 'id' | 'created_at' | 'monto_total_ars'>)[] | null) ?? [])
    .map<ActivityItem>(e => ({ id: e.id, kind: 'inscripcion', at: e.created_at, montoArs: e.monto_total_ars }))
  return [...pagos, ...insc].sort((a, b) => (a.at < b.at ? 1 : -1)).slice(0, 10)
}

export function useRecentActivity() {
  return useQuery({ queryKey: ['admin-activity'], queryFn: fetchRecentActivity, staleTime: 1000 * 30 })
}
