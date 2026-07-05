import type { BenefitTipo } from '@/types'

export interface BenefitTypeMeta {
  value: BenefitTipo
  label: string
  hint: string
  soft: string
  deep: string
  icon: React.ReactNode
}

// 4 familias de color sobre la paleta ya definida (teal / gold / clay + neutro).
// Los dos descuentos comparten la familia dorada pero con tonos distintos
// (--gold-deep vs --gold) + ícono propio (% vs $) para distinguirlos de un vistazo.
export const BENEFIT_TYPES: BenefitTypeMeta[] = [
  {
    value: 'curso_gratis', label: 'Curso gratis', hint: 'Canjean créditos por acceso completo a un curso',
    soft: 'var(--teal-soft)', deep: 'var(--teal-deep)',
    icon: <svg viewBox="0 0 24 24" width="1em" height="1em" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M4 5.5C4 4.7 4.7 4 5.5 4H12v16H5.5A1.5 1.5 0 014 18.5v-13z" /><path d="M20 5.5c0-.8-.7-1.5-1.5-1.5H12v16h6.5a1.5 1.5 0 001.5-1.5v-13z" /></svg>,
  },
  {
    value: 'descuento_pct', label: 'Descuento %', hint: 'Un porcentaje de descuento sobre un curso o vivencial',
    soft: 'var(--gold-soft)', deep: 'var(--gold-deep)',
    icon: <svg viewBox="0 0 24 24" width="1em" height="1em" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M19 5L5 19" /><circle cx="7" cy="7" r="2.2" /><circle cx="17" cy="17" r="2.2" /></svg>,
  },
  {
    // Misma familia dorada que descuento_pct pero tono más claro (--gold) para
    // distinguir de un vistazo el descuento fijo ($) del porcentual (%) en la lista.
    value: 'descuento_fijo', label: 'Descuento fijo', hint: 'Un monto fijo de descuento en pesos',
    soft: 'var(--gold-soft)', deep: 'var(--gold)',
    icon: <svg viewBox="0 0 24 24" width="1em" height="1em" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M12 1v22M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" /></svg>,
  },
  {
    value: 'sorteo_vivencial', label: 'Sorteo vivencial', hint: 'Rifa de un lugar en un vivencial entre quienes canjean',
    soft: 'var(--clay-soft)', deep: 'var(--clay-deep)',
    icon: <svg viewBox="0 0 24 24" width="1em" height="1em" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M3 11l18-7-7 18-2.5-7L3 11z" strokeLinejoin="round" /></svg>,
  },
  {
    value: 'otro', label: 'Otro', hint: 'Beneficio libre sin curso ni descuento asociado',
    soft: '#F0EFE9', deep: 'var(--ink-faint)',
    icon: <svg viewBox="0 0 24 24" width="1em" height="1em" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M20.6 8.4l-8.6 8.6a5 5 0 01-7-7l8.5-8.6a3.5 3.5 0 015 5l-8.6 8.5a2 2 0 01-2.8-2.8l7.9-7.9" /></svg>,
  },
]

export function benefitTypeMeta(tipo: BenefitTipo): BenefitTypeMeta {
  return BENEFIT_TYPES.find(t => t.value === tipo) ?? BENEFIT_TYPES[BENEFIT_TYPES.length - 1]
}

export const needsCourse = (t: BenefitTipo) =>
  t === 'curso_gratis' || t === 'descuento_pct' || t === 'descuento_fijo' || t === 'sorteo_vivencial'

export const isDescuento = (t: BenefitTipo) => t === 'descuento_pct' || t === 'descuento_fijo'

// Etiqueta corta del valor de un beneficio (para cards / detalle).
export function benefitValueLabel(tipo: BenefitTipo, descuentoValor: number | null): string | null {
  if (tipo === 'descuento_pct') return descuentoValor ? `${descuentoValor}% OFF` : null
  if (tipo === 'descuento_fijo') return descuentoValor ? `$${descuentoValor.toLocaleString('es-AR')} OFF` : null
  return null
}
