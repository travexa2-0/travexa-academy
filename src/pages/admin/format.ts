// Shared formatting helpers for the backoffice (es-AR).

// Moneda ARS: "$ 1.234.567". El espacio evita que el símbolo se pegue al número
// (era el origen del bug visual del desglose de precio).
export function formatArs(value: number | null | undefined): string {
  return '$ ' + new Intl.NumberFormat('es-AR', { maximumFractionDigits: 0 }).format(Math.round(value ?? 0))
}

// Moneda USD: "US$ 1.234". Usa siempre este helper en el backoffice en vez de
// prefijar "US$" a mano + número crudo (que producía saltos/símbolos pegados).
export function formatUsd(value: number | null | undefined): string {
  return 'US$ ' + new Intl.NumberFormat('es-AR', { maximumFractionDigits: 0 }).format(Math.round(value ?? 0))
}

export function formatNum(value: number | null | undefined): string {
  return new Intl.NumberFormat('es-AR', { maximumFractionDigits: 0 }).format(value ?? 0)
}

export function formatDate(iso: string | null | undefined): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('es-AR', { day: 'numeric', month: 'short' })
}

export function daysBetween(from: string, to: Date = new Date()): number {
  return Math.floor((to.getTime() - new Date(from).getTime()) / (1000 * 60 * 60 * 24))
}
