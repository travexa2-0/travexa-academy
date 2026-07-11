import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

export interface PricingConfig {
  recargoTarjetaPct: number
  recargoTransferenciaPct: number
  cuotasMax: number
}

const DEFAULTS: PricingConfig = {
  recargoTarjetaPct: 23,
  recargoTransferenciaPct: 6,
  cuotasMax: 6,
}

function toNumber(value: unknown, fallback: number): number {
  const n = typeof value === 'string' ? Number(value) : (value as number)
  return Number.isFinite(n) ? n : fallback
}

async function fetchPricingConfig(): Promise<PricingConfig> {
  const { data, error } = await supabase
    .from('academy_settings')
    .select('key, value')
    .in('key', ['mp_recargo_tarjeta_pct', 'mp_recargo_transferencia_pct', 'mp_cuotas_max'])
  if (error) throw new Error(error.message)

  const map = new Map((data as { key: string; value: unknown }[]).map(r => [r.key, r.value]))
  return {
    recargoTarjetaPct:       toNumber(map.get('mp_recargo_tarjeta_pct'), DEFAULTS.recargoTarjetaPct),
    recargoTransferenciaPct: toNumber(map.get('mp_recargo_transferencia_pct'), DEFAULTS.recargoTransferenciaPct),
    cuotasMax:               toNumber(map.get('mp_cuotas_max'), DEFAULTS.cuotasMax),
  }
}

/** Config de recargos y cuotas legible públicamente (anon), cacheada. */
export function usePricingConfig() {
  return useQuery({
    queryKey: ['pricing-config'],
    queryFn: fetchPricingConfig,
    staleTime: 1000 * 60 * 10,
  })
}

/** Precio final a partir del neto y un recargo %: neto / (1 - recargo/100). */
export function grossFromNet(net: number, recargoPct: number): number {
  const factor = 1 - recargoPct / 100
  if (factor <= 0) return Math.round(net)
  return Math.round(net / factor)
}
