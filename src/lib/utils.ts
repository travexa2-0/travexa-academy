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

// Clave donde stasheamos el destino post-login antes del round-trip de Google OAuth
// (el redirectTo de OAuth es fijo a /auth/callback, así que el ?redirect= se perdería).
export const POST_LOGIN_REDIRECT_KEY = 'postLoginRedirect'

// ── Gate de login ──────────────────────────────────────────────────────────
// Cualquier acción que exige sesión (comprar/reservar/anotarme) manda al usuario
// deslogueado a /login?redirect=<url actual>, para devolverlo al mismo lugar
// después de loguearse. `target` default: la ruta+query actual del navegador.
export function loginRedirect(target?: string): string {
  const to = target ?? window.location.pathname + window.location.search
  return `/login?redirect=${encodeURIComponent(to)}`
}

// Valida que un redirect sea una ruta interna (evita open-redirect a otro dominio).
// Solo se aceptan paths que empiezan con "/" y no con "//".
export function safeRedirectPath(raw: string | null | undefined): string | null {
  if (!raw) return null
  if (!raw.startsWith('/') || raw.startsWith('//')) return null
  return raw
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
