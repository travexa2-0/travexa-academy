import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Cuenta palabras reales (para el mínimo de 5 palabras que exige la DB en reseñas/comentarios).
export function countWords(text: string): number {
  const trimmed = text.trim()
  if (!trimmed) return 0
  return trimmed.split(/\s+/).length
}

// Nombre visible a partir de un perfil embebido (join). Cae a un fallback amable.
export function displayName(
  profile: { nombre: string | null; apellido: string | null } | null | undefined,
  fallback = 'Alumno/a',
): string {
  if (!profile) return fallback
  const full = [profile.nombre, profile.apellido].filter(Boolean).join(' ').trim()
  return full || fallback
}
