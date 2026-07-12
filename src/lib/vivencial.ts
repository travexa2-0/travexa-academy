import type { Course, CuentaTransferencia, VivencialPuntoSalida } from '@/types'

// Puntos de salida del vivencial, con fallback a las columnas legacy
// (vivencial_ciudad_salida / vivencial_punto_encuentro) cuando la migración v2
// todavía no se aplicó o el curso es viejo. Fuente única para detalle, reserva y perfil.
export function puntosSalida(course: Course): VivencialPuntoSalida[] {
  if (course.vivencial_puntos_salida?.length) return course.vivencial_puntos_salida
  if (course.vivencial_ciudad_salida) {
    return [{ ciudad: course.vivencial_ciudad_salida, detalle_encuentro: course.vivencial_punto_encuentro ?? '' }]
  }
  return []
}

// Etiqueta legible de un punto de salida, para guardar en el enrollment y mostrar
// en confirmación/mail/perfil/backoffice/PDF.
export function puntoSalidaLabel(p: VivencialPuntoSalida): string {
  return p.detalle_encuentro ? `${p.ciudad} — ${p.detalle_encuentro}` : p.ciudad
}

// Normaliza travexa_datos_transferencia a un array de cuentas: acepta el objeto
// único actual {cbu,alias,banco,titular} o un futuro array de cuentas. Descarta
// cuentas vacías (todas las claves en blanco).
export function normalizeCuentas(value: unknown): CuentaTransferencia[] {
  const toCuenta = (o: Record<string, unknown>): CuentaTransferencia => ({
    titular: typeof o.titular === 'string' ? o.titular : '',
    banco:   typeof o.banco === 'string' ? o.banco : '',
    cbu:     typeof o.cbu === 'string' ? o.cbu : '',
    alias:   typeof o.alias === 'string' ? o.alias : '',
  })
  const raw = Array.isArray(value) ? value : value ? [value] : []
  return raw
    .filter((o): o is Record<string, unknown> => typeof o === 'object' && o !== null)
    .map(toCuenta)
    .filter(c => c.titular || c.banco || c.cbu || c.alias)
}

// Meses enteros restantes desde hoy hasta la fecha de salida (mínimo 0).
export function mesesHastaSalida(fechaSalida: string | null, from: Date = new Date()): number {
  if (!fechaSalida) return 0
  const [y, m, d] = fechaSalida.split('-').map(Number)
  const salida = new Date(y, m - 1, d)
  if (salida <= from) return 0
  let months = (salida.getFullYear() - from.getFullYear()) * 12 + (salida.getMonth() - from.getMonth())
  if (salida.getDate() < from.getDate()) months -= 1
  return Math.max(0, months)
}

// Cuota mensual ESTIMADA e INFORMATIVA (los vivenciales no se cobran en la
// plataforma — regla de negocio). total_final / meses restantes hasta la salida.
// Devuelve null si falta menos de 1 mes o la fecha ya pasó → mostrar "pago único".
export function cuotaEstimadaArs(course: Course, from: Date = new Date()): number | null {
  const total = course.precio_ars ?? 0
  const meses = mesesHastaSalida(course.vivencial_fecha_salida, from)
  if (total <= 0 || meses < 1) return null
  return Math.round(total / meses)
}
