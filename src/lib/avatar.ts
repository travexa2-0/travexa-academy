// Helpers de avatar: iniciales + color determinístico derivado del id del usuario.
// Se usan como fallback cuando profiles.avatar_url está vacío (nunca un ícono roto).

function hashId(id: string): number {
  let h = 0
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) | 0
  return Math.abs(h)
}

// Gradiente oscuro determinístico (combina con el dark cinematic del alumno).
export function avatarGradient(id: string | undefined | null): string {
  const h = hashId(id || 'travexa')
  const hue = h % 360
  const hue2 = (hue + 42) % 360
  return `linear-gradient(135deg, hsl(${hue} 42% 30%), hsl(${hue2} 48% 20%))`
}

// Iniciales de nombre + apellido; cae al email o '?' si no hay datos.
export function initialsFrom(
  nombre?: string | null,
  apellido?: string | null,
  fallback?: string | null,
): string {
  const a = (nombre ?? '').trim()[0] ?? ''
  const b = (apellido ?? '').trim()[0] ?? ''
  const ini = (a + b).toUpperCase()
  if (ini) return ini
  return ((fallback ?? '').trim()[0] ?? '?').toUpperCase()
}
