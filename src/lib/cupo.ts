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

// ── HARDCODE TEMPORAL: cupos de display, pedido de Nico (sesión jul-2026) ──────
// El número de "anotados" que se muestra al PÚBLICO en los vivenciales es FICTICIO
// por decisión de negocio (prueba social): NO refleja vivencial_cupo_disponible real.
// Esto NO es un bug — no lo "corrijas" pensando que sí.
//
// Sólo afecta lo que se RENDERIZA en las páginas públicas (hero, price card, barra
// flotante, cards de listado, home). La lógica real de reservas / agotado / pagos
// sigue usando vivencial_cupo_disponible de la DB, que NO se toca.
//
// El denominador ("de Y") y la barra de progreso usan el cupo_maximo REAL de la DB;
// sólo el numerador de anotados (y el "disponible" derivado) sale de acá.
export const ANOTADOS_HARDCODEADOS: Record<string, number> = {
  'capacitacion-vivencial-brasil': 15,
}

// Fallback para cualquier vivencial que no esté en el mapa (ej: el próximo que cargue
// Yesica): muestra este valor sin tener que tocar código de nuevo.
export const ANOTADOS_HARDCODE_DEFAULT = 20

// Anotados de DISPLAY (ficticio) para un vivencial. Clampeado a [0, cupoMaximo].
export function anotadosDisplay(slug: string | null | undefined, cupoMaximo: number): number {
  const raw = (slug != null ? ANOTADOS_HARDCODEADOS[slug] : undefined) ?? ANOTADOS_HARDCODE_DEFAULT
  return Math.max(0, Math.min(cupoMaximo, raw))
}

// Cupo "disponible" de DISPLAY = cupo_maximo real − anotados ficticios. Clampeado a
// [0, cupoMaximo]. Usar SÓLO para mostrar; nunca para decidir si se puede reservar.
export function cupoDisponibleDisplay(slug: string | null | undefined, cupoMaximo: number): number {
  return Math.max(0, cupoMaximo - anotadosDisplay(slug, cupoMaximo))
}
