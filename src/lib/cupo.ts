export type CupoClase = 'ok' | 'low' | 'full'

export interface CupoEstado {
  cls: CupoClase
  urgent: boolean
  label: string
}

// Single source of truth for cupo status.
// > 5 → ok (green), 1-5 → low/últimos lugares (orange), 0 → full/agotado (red)
export function cupoEstado(disponible: number): CupoEstado {
  if (disponible <= 0) return { cls: 'full', urgent: true, label: 'Agotado' }
  if (disponible <= 5) {
    const s = disponible === 1 ? '' : 'es'
    return { cls: 'low', urgent: true, label: `Últimos ${disponible} lugar${s}` }
  }
  return { cls: 'ok', urgent: false, label: `${disponible} lugares disponibles` }
}
