// Shared formatting helpers for the backoffice (es-AR).

export function formatArs(value: number | null | undefined): string {
  return '$' + new Intl.NumberFormat('es-AR', { maximumFractionDigits: 0 }).format(Math.round(value ?? 0))
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
