import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'
import type { Course, Enrollment, VivencialPayment } from '@/types'
import { puntosSalida, puntoSalidaLabel } from '@/lib/vivencial'

// ── Datos de la liquidación ──────────────────────────────────────────────────

export interface LiquidacionPago {
  fecha: string
  metodo: string
  comprobante: string
  importe: number
  notas: string
}

export interface LiquidacionData {
  numero: string
  fechaEmision: string
  cliente: { nombre: string; dni: string; email: string; celular: string; fechaNac: string }
  fechaSalida: string
  fechaRegreso: string
  dias: number
  noches: number
  paquete: string
  destino: string
  hoteles: string
  traslado: string
  regimen: string
  puntoEmbarque: string
  precioBase: number
  impuestos: number
  gastosAdminPct: number
  total: number
  pagos: LiquidacionPago[]
  totalPagado: number
  restaPagar: number
}

// Términos de cancelación al pie (mismo criterio que la liquidación de catálogo).
const TERMINOS =
  'CANCELACIONES: Reserva sujeta a seña para confirmar el lugar; saldo antes de la fecha de salida. ' +
  'Retenciones por cancelación según antelación (a mayor cercanía a la salida, mayor retención). ' +
  'Los vivenciales no se cobran dentro de la plataforma: el pago se realiza por transferencia/depósito ' +
  'bancario coordinado con Travexa Academy. Condiciones conforme normativa turística vigente (Ley 18.829 y concordantes).'

function fmtARS(n: number): string {
  return '$ ' + new Intl.NumberFormat('es-AR', { maximumFractionDigits: 0 }).format(Math.round(n || 0))
}

function fmtDate(d: string | null): string {
  if (!d) return '—'
  const [y, m, day] = d.split('-').map(Number)
  if (!y) return d
  return new Date(y, m - 1, day).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

// ── Builder desde el dominio ─────────────────────────────────────────────────

interface BuildInput {
  course: Course
  enrollment: Enrollment
  payments: VivencialPayment[]
  cliente?: { nombre?: string; dni?: string; email?: string; celular?: string; fechaNac?: string | null }
}

export function buildLiquidacionData({ course, enrollment, payments, cliente }: BuildInput): LiquidacionData {
  const salida = course.vivencial_fecha_salida
  const regreso = course.vivencial_fecha_regreso
  let dias = 0
  if (salida && regreso) {
    const [y1, m1, d1] = salida.split('-').map(Number)
    const [y2, m2, d2] = regreso.split('-').map(Number)
    dias = Math.max(0, Math.round((new Date(y2, m2 - 1, d2).getTime() - new Date(y1, m1 - 1, d1).getTime()) / 86400000) + 1)
  }

  const puntoElegido = enrollment.punto_salida_elegido
    ?? (puntosSalida(course)[0] ? puntoSalidaLabel(puntosSalida(course)[0]) : '')
  const hoteles = (course.vivencial_hoteles ?? []).map(h => `${h.nombre}${h.noches ? ` (${h.noches} noches)` : ''}`).join(', ')
    || course.vivencial_hotel || '—'

  // Solo pagos aprobados cuentan como "recibidos".
  const aprobados = payments.filter(p => p.estado === 'aprobado')
  const pagos: LiquidacionPago[] = aprobados.map(p => ({
    fecha: fmtDate(p.fecha_declarada),
    metodo: p.metodo ? (p.metodo === 'deposito' ? 'Depósito' : 'Transferencia') : (p.tipo === 'sena' ? 'Seña' : 'Transferencia'),
    comprobante: p.cupon_numero ?? '—',
    importe: p.monto_aprobado_ars ?? p.monto_declarado_ars,
    notas: p.notas_admin ?? '',
  }))
  const total = enrollment.monto_total_ars ?? course.precio_ars ?? 0
  const totalPagado = aprobados.reduce((s, p) => s + (p.monto_aprobado_ars ?? p.monto_declarado_ars), 0)

  return {
    numero: enrollment.numero_reserva ?? '—',
    fechaEmision: new Date().toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' }),
    cliente: {
      nombre: cliente?.nombre ?? '—',
      dni: cliente?.dni ?? '—',
      email: cliente?.email ?? '—',
      celular: cliente?.celular ?? '—',
      fechaNac: cliente?.fechaNac ? fmtDate(cliente.fechaNac) : '—',
    },
    fechaSalida: fmtDate(salida),
    fechaRegreso: fmtDate(regreso),
    dias,
    noches: Math.max(0, dias - 1),
    paquete: course.titulo,
    destino: [course.vivencial_pais, ...(course.vivencial_localidades ?? [])].filter(Boolean).join(' · ') || '—',
    hoteles,
    traslado: (course.vivencial_tipo_traslado ?? []).join(', ') || '—',
    regimen: (course.vivencial_regimen_alimentos ?? []).join(', ') || '—',
    puntoEmbarque: puntoElegido || '—',
    precioBase: course.vivencial_precio_base_ars ?? 0,
    impuestos: course.vivencial_impuestos_ars ?? 0,
    gastosAdminPct: course.vivencial_gastos_admin_pct ?? 0,
    total,
    pagos,
    totalPagado,
    restaPagar: Math.max(0, total - totalPagado),
  }
}

// ── Render HTML → PDF (client-side) ──────────────────────────────────────────

const TEAL = '#0E6B5C'

function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

function block(title: string, inner: string): string {
  return `<div style="margin-bottom:12px">
    <h3 style="color:${TEAL};border-bottom:1px solid #d0d8d6;font-size:11px;font-weight:700;margin:0 0 6px;padding-bottom:3px;letter-spacing:.02em">${title}</h3>
    ${inner}</div>`
}

function kv(label: string, value: string): string {
  return `<div style="display:flex;justify-content:space-between;gap:12px;font-size:10.5px;padding:1.5px 0"><span style="color:#6a8590">${esc(label)}</span><span style="color:#0a1e29;font-weight:600;text-align:right">${esc(value)}</span></div>`
}

function buildHtml(d: LiquidacionData): HTMLElement {
  const el = document.createElement('div')
  el.style.cssText = 'position:fixed;left:-10000px;top:0;width:760px;background:#fff;color:#0a1e29;font-family:Inter,Arial,sans-serif;padding:34px 38px'

  const pagosRows = d.pagos.length
    ? d.pagos.map(p => `<tr>
        <td style="border:1px solid #d0d8d6;padding:4px 6px">${esc(p.fecha)}</td>
        <td style="border:1px solid #d0d8d6;padding:4px 6px">${esc(p.metodo)}</td>
        <td style="border:1px solid #d0d8d6;padding:4px 6px">${esc(p.comprobante)}</td>
        <td style="border:1px solid #d0d8d6;padding:4px 6px;text-align:right">${esc(fmtARS(p.importe))}</td>
        <td style="border:1px solid #d0d8d6;padding:4px 6px">${esc(p.notas)}</td></tr>`).join('')
    : `<tr><td colspan="5" style="border:1px solid #d0d8d6;padding:6px;color:#6a8590;text-align:center">Sin pagos recibidos todavía</td></tr>`

  el.innerHTML = `
    <div style="display:flex;justify-content:space-between;align-items:flex-start;border-bottom:2px solid ${TEAL};padding-bottom:10px;margin-bottom:14px">
      <div>
        <div style="font-size:18px;font-weight:800;letter-spacing:-.01em">Pencom <span style="color:${TEAL}">Travexa</span></div>
        <div style="font-size:9.5px;color:#6a8590;margin-top:2px">Travexa Academy · Liquidación de Reserva</div>
      </div>
      <div style="text-align:right">
        <div style="font-size:9px;color:#6a8590;text-transform:uppercase;letter-spacing:.08em">Liquidación N°</div>
        <div style="font-size:15px;font-weight:800;color:${TEAL}">${esc(d.numero)}</div>
        <div style="font-size:9px;color:#6a8590;margin-top:2px">Emitida ${esc(d.fechaEmision)}</div>
      </div>
    </div>

    <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:16px;margin-bottom:6px">
      <div>${block('OPERADOR / PROVEEDOR', kv('Razón social', 'Pencom Travexa SAS') + kv('Producto', 'Travexa Academy') + kv('Rubro', 'Viaje vivencial'))}</div>
      <div>${block('PASAJERO RESPONSABLE', kv('Nombre', d.cliente.nombre) + kv('DNI', d.cliente.dni) + kv('Email', d.cliente.email) + kv('Celular', d.cliente.celular))}</div>
      <div>${block('FECHAS Y CONDICIONES', kv('Salida', d.fechaSalida) + kv('Regreso', d.fechaRegreso) + kv('Duración', d.dias ? `${d.dias} días / ${d.noches} noches` : '—') + kv('Fecha nac.', d.cliente.fechaNac))}</div>
    </div>

    ${block('DETALLE DE PASAJEROS', `
      <table style="width:100%;border-collapse:collapse;font-size:10.5px">
        <thead><tr style="background:#f2f5f4">
          <th style="border:1px solid #d0d8d6;padding:4px 6px;text-align:left">Pasajero</th>
          <th style="border:1px solid #d0d8d6;padding:4px 6px;text-align:left">DNI</th>
          <th style="border:1px solid #d0d8d6;padding:4px 6px;text-align:left">Punto de embarque</th>
        </tr></thead>
        <tbody><tr>
          <td style="border:1px solid #d0d8d6;padding:4px 6px">${esc(d.cliente.nombre)}</td>
          <td style="border:1px solid #d0d8d6;padding:4px 6px">${esc(d.cliente.dni)}</td>
          <td style="border:1px solid #d0d8d6;padding:4px 6px">${esc(d.puntoEmbarque)}</td>
        </tr></tbody>
      </table>`)}

    ${block('SERVICIOS CONTRATADOS', kv('Paquete', d.paquete) + kv('Destino', d.destino) + kv('Alojamiento', d.hoteles) + kv('Traslado', d.traslado) + kv('Régimen', d.regimen))}

    ${block('CUENTA DE LA RESERVA', kv('Precio base', fmtARS(d.precioBase)) + kv('Impuestos', fmtARS(d.impuestos)) + kv('Gastos administrativos', d.gastosAdminPct ? `${d.gastosAdminPct}%` : '—') +
      `<div style="display:flex;justify-content:space-between;border-top:1px solid #d0d8d6;margin-top:4px;padding-top:5px;font-size:12px;font-weight:800"><span>TOTAL</span><span style="color:${TEAL}">${esc(fmtARS(d.total))}</span></div>`)}

    ${block('DETALLE DE PAGOS RECIBIDOS', `
      <table style="width:100%;border-collapse:collapse;font-size:10.5px">
        <thead><tr style="background:#f2f5f4">
          <th style="border:1px solid #d0d8d6;padding:4px 6px;text-align:left">Fecha</th>
          <th style="border:1px solid #d0d8d6;padding:4px 6px;text-align:left">Método</th>
          <th style="border:1px solid #d0d8d6;padding:4px 6px;text-align:left">Comprobante</th>
          <th style="border:1px solid #d0d8d6;padding:4px 6px;text-align:right">Importe</th>
          <th style="border:1px solid #d0d8d6;padding:4px 6px;text-align:left">Notas</th>
        </tr></thead>
        <tbody>${pagosRows}
          <tr><td colspan="3" style="border:1px solid #d0d8d6;padding:4px 6px;font-weight:700">Total Pagado</td><td style="border:1px solid #d0d8d6;padding:4px 6px;text-align:right;font-weight:700;color:#16a34a">${esc(fmtARS(d.totalPagado))}</td><td style="border:1px solid #d0d8d6"></td></tr>
          <tr><td colspan="3" style="border:1px solid #d0d8d6;padding:4px 6px;font-weight:700">Resta Pagar</td><td style="border:1px solid #d0d8d6;padding:4px 6px;text-align:right;font-weight:700;color:#d97706">${esc(fmtARS(d.restaPagar))}</td><td style="border:1px solid #d0d8d6"></td></tr>
        </tbody>
      </table>`)}

    <div style="margin-top:10px;font-size:8px;color:#6a8590;line-height:1.5;border-top:1px solid #eee;padding-top:8px">${esc(TERMINOS)}</div>
  `
  return el
}

/** Genera y descarga el PDF de liquidación (client-side, jsPDF + html2canvas). */
export async function downloadLiquidacionPdf(data: LiquidacionData): Promise<void> {
  const node = buildHtml(data)
  document.body.appendChild(node)
  try {
    const canvas = await html2canvas(node, { scale: 2, backgroundColor: '#ffffff' })
    const img = canvas.toDataURL('image/png')
    const pdf = new jsPDF({ unit: 'mm', format: 'a4' })
    const pageW = pdf.internal.pageSize.getWidth()
    const pageH = pdf.internal.pageSize.getHeight()
    const imgW = pageW
    const imgH = (canvas.height * imgW) / canvas.width
    let heightLeft = imgH
    let position = 0
    pdf.addImage(img, 'PNG', 0, position, imgW, imgH)
    heightLeft -= pageH
    while (heightLeft > 0) {
      position -= pageH
      pdf.addPage()
      pdf.addImage(img, 'PNG', 0, position, imgW, imgH)
      heightLeft -= pageH
    }
    pdf.save(`Liquidacion_${data.numero.replace(/[^\w-]/g, '')}.pdf`)
  } finally {
    document.body.removeChild(node)
  }
}
