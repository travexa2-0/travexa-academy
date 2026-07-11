import type { ReactNode } from 'react'

/** Texto libre → líneas no vacías (cada línea = un bullet). */
export function richTextLines(text: string | null | undefined): string[] {
  if (!text) return []
  return text.split(/\r?\n/).map(l => l.trim()).filter(Boolean)
}

/** ¿El texto tiene al menos un ítem? Usar para ocultar secciones vacías. */
export function hasRichText(text: string | null | undefined): boolean {
  return richTextLines(text).length > 0
}

/**
 * Parseo mínimo de markdown: **texto** → <strong>. Devuelve nodos React
 * (no inyecta HTML), así que es seguro con contenido pegado por el usuario.
 */
export function renderBold(text: string, keyPrefix = ''): ReactNode[] {
  return text
    .split(/(\*\*[^*]+\*\*)/g)
    .filter(part => part !== '')
    .map((part, i) =>
      part.length >= 4 && part.startsWith('**') && part.endsWith('**')
        ? <strong key={`${keyPrefix}b${i}`}>{part.slice(2, -2)}</strong>
        : <span key={`${keyPrefix}t${i}`}>{part}</span>,
    )
}
