import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase, supabaseWrite } from '@/lib/supabase'
import type { AcademySetting, AdminSettings } from '@/types'

const DEFAULTS: AdminSettings = {
  tipo_cambio_usd_ars: 1500,
  comision_mp_pct: 5.5,
  meta_ingresos_mensual_ars: 0,
  inversion_marketing_mensual_ars: 0,
  mp_monto_minimo_cuotas_ars: 50000,
  dias_limite_pago_vivencial: 7,
  travexa_whatsapp_business: '',
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
    mp_monto_minimo_cuotas_ars:     toNumber(map.get('mp_monto_minimo_cuotas_ars'), DEFAULTS.mp_monto_minimo_cuotas_ars),
    dias_limite_pago_vivencial:     toNumber(map.get('dias_limite_pago_vivencial'), DEFAULTS.dias_limite_pago_vivencial),
    travexa_whatsapp_business:      typeof map.get('travexa_whatsapp_business') === 'string' ? map.get('travexa_whatsapp_business') as string : DEFAULTS.travexa_whatsapp_business,
  }
}

async function upsertSettings(patch: Partial<AdminSettings>): Promise<void> {
  const rows: AcademySetting[] = Object.entries(patch)
    .filter(([, v]) => v !== undefined)
    .map(([key, value]) => ({ key, value }))

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
