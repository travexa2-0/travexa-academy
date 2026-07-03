import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase, supabaseWrite } from '@/lib/supabase'
import type { AcademySetting, AdminSettings } from '@/types'

const DEFAULTS: AdminSettings = {
  tipo_cambio_usd_ars: 1450,
  comision_mp_pct: 5.5,
  meta_ingresos_mensual_ars: 0,
  inversion_marketing_mensual_ars: 0,
}

function toNumber(value: unknown, fallback: number): number {
  const n = typeof value === 'string' ? Number(value) : (value as number)
  return Number.isFinite(n) ? n : fallback
}

async function fetchSettings(): Promise<AdminSettings> {
  const { data, error } = await supabase.from('academy_settings').select('*')
  if (error) throw new Error(error.message)

  const map = new Map((data as AcademySetting[]).map(r => [r.key, r.value]))
  return {
    tipo_cambio_usd_ars:            toNumber(map.get('tipo_cambio_usd_ars'), DEFAULTS.tipo_cambio_usd_ars),
    comision_mp_pct:                toNumber(map.get('comision_mp_pct'), DEFAULTS.comision_mp_pct),
    meta_ingresos_mensual_ars:      toNumber(map.get('meta_ingresos_mensual_ars'), DEFAULTS.meta_ingresos_mensual_ars),
    inversion_marketing_mensual_ars: toNumber(map.get('inversion_marketing_mensual_ars'), DEFAULTS.inversion_marketing_mensual_ars),
  }
}

async function upsertSettings(patch: Partial<AdminSettings>): Promise<void> {
  const rows: AcademySetting[] = Object.entries(patch)
    .filter(([, v]) => v !== undefined)
    .map(([key, value]) => ({ key, value: value as number }))

  if (rows.length === 0) return
  const { error } = await supabaseWrite.from('academy_settings').upsert(rows, { onConflict: 'key' })
  if (error) throw new Error(error.message)
}

export function useAdminSettings() {
  return useQuery({
    queryKey: ['admin-settings'],
    queryFn:  fetchSettings,
    staleTime: 1000 * 60 * 5,
  })
}

export function useUpdateSettings() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: upsertSettings,
    onSuccess:  () => qc.invalidateQueries({ queryKey: ['admin-settings'] }),
  })
}
