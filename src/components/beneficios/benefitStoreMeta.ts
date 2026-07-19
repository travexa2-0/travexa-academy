import type { CSSProperties } from 'react'
import type { Benefit, BenefitRedemption, BenefitTipo } from '@/types'

// ── Categoría de filtro (agrupa los dos descuentos) ───────────────
export type FilterCat = 'todos' | 'curso_gratis' | 'descuento' | 'sorteo_vivencial' | 'otro'

export function filterCatOf(tipo: BenefitTipo): Exclude<FilterCat, 'todos'> {
  if (tipo === 'descuento_pct' || tipo === 'descuento_fijo') return 'descuento'
  if (tipo === 'curso_gratis') return 'curso_gratis'
  if (tipo === 'sorteo_vivencial') return 'sorteo_vivencial'
  return 'otro'
}

// ── Badge por tipo ────────────────────────────────────────────────
export function badgeInfo(tipo: BenefitTipo): { cls: string; label: string } {
  const cat = filterCatOf(tipo)
  if (cat === 'curso_gratis') return { cls: 'curso', label: 'Curso completo' }
  if (cat === 'descuento') return { cls: 'descuento', label: 'Descuento' }
  if (cat === 'sorteo_vivencial') return { cls: 'sorteo', label: 'Sorteo' }
  return { cls: 'otro', label: 'Beneficio' }
}

// ── Arte de fondo: imagen del beneficio → curso → gradiente por índice ─
const ART_GRADIENTS = [
  'linear-gradient(120deg,#0e4f43,#12776a 45%,#0a2f30)',
  'linear-gradient(120deg,#233a72,#3b5bb0 50%,#131f45)',
  'linear-gradient(120deg,#7a5a1c,#b98a2e 45%,#4a3410)',
  'linear-gradient(120deg,#0f5c50,#1d8f76 55%,#083330)',
  'linear-gradient(120deg,#2c2a5e,#4d3f96 50%,#1a1840)',
  'linear-gradient(120deg,#155e63,#2b8f96 55%,#0a3437)',
  'linear-gradient(120deg,#6b4a17,#a4762b 50%,#3d2c0d)',
  'linear-gradient(120deg,#144a52,#20707d 55%,#0a2b30)',
  'linear-gradient(120deg,#57391f,#8a5c2f 50%,#33220f)',
]

export function benefitImage(b: Benefit): string | null {
  return b.imagen_url || b.course?.thumbnail_url || null
}

// Estilo de fondo listo para aplicar a `.art` / `.bart` / `.m-art`.
export function artStyle(b: Benefit, index: number): CSSProperties {
  const img = benefitImage(b)
  if (img) return { backgroundImage: `url(${img})` }
  return { background: ART_GRADIENTS[index % ART_GRADIENTS.length] }
}

// ── Formato de créditos / pesos ───────────────────────────────────
export const fmt = (n: number) => Math.round(n).toLocaleString('es-AR')
export const fmtArs = (n: number) => '$' + Math.round(n).toLocaleString('es-AR')

// ── Bloque de valor grande (créditos / % / por chance) ────────────
export interface ValueBlock { big: string; lbl: string; sub?: string; extra?: string }

export function valueBlock(b: Benefit): ValueBlock {
  const precio = b.course?.precio_ars ?? null
  if (b.tipo === 'descuento_pct') {
    const final = precio != null && b.descuento_valor != null ? precio - (precio * b.descuento_valor) / 100 : null
    return {
      big: `${b.descuento_valor ?? 0}%`,
      lbl: 'de descuento',
      sub: `por ${fmt(b.costo_creditos)} créditos`,
      extra: precio != null && final != null ? `${fmtArs(precio)} → ${fmtArs(final)}` : undefined,
    }
  }
  if (b.tipo === 'descuento_fijo') {
    const final = precio != null && b.descuento_valor != null ? Math.max(0, precio - b.descuento_valor) : null
    return {
      big: b.descuento_valor != null ? fmtArs(b.descuento_valor) : '—',
      lbl: 'de descuento',
      sub: `por ${fmt(b.costo_creditos)} créditos`,
      extra: precio != null && final != null ? `${fmtArs(precio)} → ${fmtArs(final)}` : undefined,
    }
  }
  if (b.tipo === 'sorteo_vivencial') {
    return {
      big: fmt(b.costo_creditos),
      lbl: 'créditos / chance',
      extra: b.fecha_vencimiento ? `Sorteo: ${sorteoDate(b.fecha_vencimiento)}` : undefined,
    }
  }
  // curso_gratis / otro
  return {
    big: fmt(b.costo_creditos),
    lbl: 'créditos',
    extra: b.tipo === 'curso_gratis' && precio != null ? `Valor del curso: ${fmtArs(precio)}` : undefined,
  }
}

export function sorteoDate(iso: string): string {
  return new Date(iso).toLocaleDateString('es-AR', { day: 'numeric', month: 'long' })
}

// ── Estado del beneficio para el usuario ──────────────────────────
export interface BenefitUserState {
  soldOut: boolean
  owned: boolean          // ya tiene el curso vinculado (enrollment activo)
  redeemedNonSorteo: boolean
  sorteoChances: number   // chances activas del usuario en este sorteo
  costoTotal: (chances: number) => number
}

export function computeUserState(
  b: Benefit,
  redemptions: BenefitRedemption[],
  enrolledCourseIds: Set<string>,
): BenefitUserState {
  const soldOut = b.cupo_maximo != null && b.cupo_usado >= b.cupo_maximo
  const owned = !!b.course_id && enrolledCourseIds.has(b.course_id) &&
    (b.tipo === 'curso_gratis' || b.tipo === 'descuento_pct' || b.tipo === 'descuento_fijo')
  const mine = redemptions.filter(r => r.benefit_id === b.id)
  const redeemedNonSorteo = b.tipo !== 'sorteo_vivencial' && mine.length > 0
  const sorteoChances = b.tipo === 'sorteo_vivencial'
    ? mine.filter(r => r.estado === 'activo').reduce((s, r) => s + (r.cantidad_chances ?? 0), 0)
    : 0
  return {
    soldOut,
    owned,
    redeemedNonSorteo,
    sorteoChances,
    costoTotal: (chances: number) => b.costo_creditos * (b.tipo === 'sorteo_vivencial' ? Math.max(1, chances) : 1),
  }
}

// Chip de estado para la grilla. Devuelve texto + clase de color.
export function stateChip(
  b: Benefit,
  st: BenefitUserState,
  logged: boolean,
  saldo: number,
): { cls: 'ok' | 'no' | 'owned'; text: string } {
  if (st.owned) return { cls: 'owned', text: 'Ya tenés este curso' }
  if (st.soldOut) return { cls: 'no', text: 'Cupo agotado' }
  if (!logged) return { cls: 'ok', text: 'Ingresá para canjear' }
  if (b.tipo === 'sorteo_vivencial' && st.sorteoChances > 0) {
    return { cls: 'ok', text: `Tenés ${st.sorteoChances} chance${st.sorteoChances > 1 ? 's' : ''}` }
  }
  if (st.redeemedNonSorteo) return { cls: 'owned', text: 'Ya lo canjeaste ✓' }
  const costo = st.costoTotal(1)
  if (saldo < costo) return { cls: 'no', text: `Te faltan ${fmt(costo - saldo)}` }
  return { cls: 'ok', text: 'Canjeable ✓' }
}
