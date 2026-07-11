export const NIVEL_OPTIONS = [
  { value: 'principiante', label: 'Principiante' },
  { value: 'intermedio', label: 'Intermedio' },
  { value: 'avanzado', label: 'Avanzado' },
] as const

export const ACCESO_OPTIONS = [
  { value: 'pago', label: 'Pago' },
  { value: 'gratuito', label: 'Gratuito' },
] as const

// Parses "mm:ss" or "h:mm:ss" or plain minutes into seconds.
export function durationToSeconds(text: string): number {
  const t = text.trim()
  if (!t) return 0
  const parts = t.split(':').map(p => parseInt(p, 10) || 0)
  if (parts.length === 1) return parts[0] * 60
  if (parts.length === 2) return parts[0] * 60 + parts[1]
  return parts[0] * 3600 + parts[1] * 60 + parts[2]
}

export function secondsToDuration(seconds: number | null | undefined): string {
  const s = seconds ?? 0
  const m = Math.floor(s / 60)
  const rem = s % 60
  return `${m}:${String(rem).padStart(2, '0')}`
}
