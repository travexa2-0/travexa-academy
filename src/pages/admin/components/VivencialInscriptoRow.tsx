import { useRef, useState } from 'react'
import toast from 'react-hot-toast'
import { FileText } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { buildLiquidacionData, downloadLiquidacionPdf } from '@/lib/liquidacionPdf'
import { formatArs, formatDate } from '../format'
import {
  useEnrollmentPaymentHistory,
  useAprobarComprobante,
  useRechazarComprobante,
  useLiberarCupo,
  useAdminCargarPago,
  signedComprobanteUrl,
} from '@/hooks/admin/useAdminVivencialPayments'
import type { Course, EnrollmentWithProfile, VivencialPayment, VivencialPaymentTipo } from '@/types'

function todayISO(): string {
  return new Date().toISOString().slice(0, 10)
}

type EstadoCalc = 'Sin pago' | 'Parcial' | 'Completo' | 'Vencido'

function calcEstado(e: EnrollmentWithProfile): EstadoCalc {
  if (e.pago_completado) return 'Completo'
  const vencido = e.fecha_limite_pago != null && e.fecha_limite_pago < new Date().toISOString().slice(0, 10)
  if (vencido) return 'Vencido'
  if ((e.monto_señado_ars ?? 0) > 0) return 'Parcial'
  return 'Sin pago'
}

const ESTADO_STYLE: Record<EstadoCalc, { color: string; bg: string }> = {
  'Sin pago':  { color: 'var(--ink-faint)', bg: 'var(--surface-2)' },
  'Parcial':   { color: 'var(--gold-deep)', bg: 'var(--gold-soft)' },
  'Completo':  { color: '#16a34a', bg: 'rgba(34,197,94,.12)' },
  'Vencido':   { color: 'var(--clay-deep)', bg: 'var(--clay-soft)' },
}

// ── Vista por viajero: 3 columnas ────────────────────────────────────────────

function InfoCard({ title, rows }: { title: string; rows: { label: string; value: string }[] }) {
  return (
    <div style={{ background: 'var(--surface-2)', border: '1px solid var(--line)', borderRadius: 10, padding: 12 }}>
      <div className="mono" style={{ fontSize: 9.5, letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--ink-faint)', marginBottom: 8 }}>{title}</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {rows.map((r, i) => (
          <div key={i} style={{ display: 'flex', justifyContent: 'space-between', gap: 10, fontSize: 11.5 }}>
            <span style={{ color: 'var(--ink-faint)' }}>{r.label}</span>
            <span style={{ color: 'var(--ink)', textAlign: 'right', fontWeight: 500 }}>{r.value}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function ComprobanteReview({ p, courseId, enrollmentId }: { p: VivencialPayment; courseId: string; enrollmentId: string }) {
  const aprobar = useAprobarComprobante()
  const rechazar = useRechazarComprobante()
  const [monto, setMonto] = useState(String(p.monto_declarado_ars))
  const [nota, setNota] = useState('')
  const busy = aprobar.isPending || rechazar.isPending

  const verComprobante = async () => {
    const url = await signedComprobanteUrl(p.comprobante_url)
    if (url) window.open(url, '_blank')
    else toast.error('No se pudo abrir el comprobante')
  }

  const doAprobar = async () => {
    try { await aprobar.mutateAsync({ paymentId: p.id, courseId, enrollmentId, montoAprobadoArs: Number(monto), notas: nota }); toast.success('Comprobante aprobado') }
    catch (e) { toast.error((e as Error).message) }
  }
  const doRechazar = async () => {
    try { await rechazar.mutateAsync({ paymentId: p.id, courseId, enrollmentId, notas: nota }); toast.success('Comprobante rechazado') }
    catch (e) { toast.error((e as Error).message) }
  }

  // Datos declarados por el viajero en "Informar transferencia".
  const datos = [
    p.metodo ? (p.metodo === 'deposito' ? 'Depósito' : 'Transferencia') : null,
    p.depositante_nombre ? `Depositante: ${p.depositante_nombre}` : null,
    p.depositante_dni ? `DNI: ${p.depositante_dni}` : null,
    p.cupon_numero ? `Cupón: ${p.cupon_numero}` : null,
    p.cuenta_destino ? `Cuenta: ${p.cuenta_destino}` : null,
  ].filter(Boolean).join(' · ')

  return (
    <div style={{ background: 'var(--surface-2)', borderRadius: 9, padding: 10, marginTop: 6 }}>
      <div style={{ fontSize: 10.5, color: 'var(--gold-deep)', marginBottom: 6, fontWeight: 600 }}>
        Subido por el viajero · esperando tu aprobación
      </div>
      <div className="row-flex" style={{ justifyContent: 'space-between', marginBottom: 8 }}>
        <div style={{ fontSize: 11.5, color: 'var(--ink-soft)' }}>
          {p.tipo === 'sena' ? 'Seña' : 'Transferencia'} · declaró <b>{formatArs(p.monto_declarado_ars)}</b> · {formatDate(p.fecha_declarada)}
        </div>
        <button className="btn btn-secondary btn-sm" onClick={() => void verComprobante()}>Ver comprobante</button>
      </div>
      {datos && <div style={{ fontSize: 11, color: 'var(--ink-faint)', marginBottom: 8 }}>{datos}</div>}
      <div className="field" style={{ marginBottom: 8 }}>
        <label className="f-label">Monto a aprobar</label>
        <div className="input-prefix-wrap"><span className="input-prefix">$</span>
          <input className="input" type="number" value={monto} onChange={e => setMonto(e.target.value)} />
        </div>
      </div>
      <textarea className="input" placeholder="Nota (opcional)" value={nota} onChange={e => setNota(e.target.value)} style={{ minHeight: 54, marginBottom: 8 }} />
      <div style={{ display: 'flex', gap: 8 }}>
        <button className="btn btn-primary btn-sm" onClick={() => void doAprobar()} disabled={busy}>Aprobar</button>
        <button className="btn btn-danger btn-sm" onClick={() => void doRechazar()} disabled={busy}>Rechazar</button>
      </div>
    </div>
  )
}

function CargarPagoForm({ e, courseId, onDone }: { e: EnrollmentWithProfile; courseId: string; onDone: () => void }) {
  const cargar = useAdminCargarPago()
  const fileRef = useRef<HTMLInputElement>(null)
  const [tipo, setTipo] = useState<VivencialPaymentTipo>('sena')
  const [monto, setMonto] = useState('')
  const [fecha, setFecha] = useState(todayISO())
  const [file, setFile] = useState<File | null>(null)

  const total = e.monto_total_ars ?? 0
  const cobrado = e.monto_señado_ars ?? 0
  const saldo = Math.max(0, total - cobrado)

  const pickFile = (f: File | undefined) => {
    if (!f) return
    if (!/^(image\/|application\/pdf)/.test(f.type)) { toast.error('Subí una imagen o un PDF.'); return }
    setFile(f)
  }

  const submit = async () => {
    if (!file) { toast.error('Adjuntá el comprobante.'); return }
    try {
      await cargar.mutateAsync({
        enrollmentId: e.id,
        userId: e.user_id,
        courseId,
        tipo,
        montoArs: Number(monto),
        fecha,
        file,
      })
      toast.success('Pago cargado')
      onDone()
    } catch (err) { toast.error((err as Error).message) }
  }

  return (
    <div style={{ background: 'var(--surface-2)', borderRadius: 9, padding: 10, marginTop: 8 }}>
      <div style={{ fontSize: 11.5, fontWeight: 600, marginBottom: 8, color: 'var(--ink)' }}>Cargar pago aprobado</div>
      {/* Resumen Total / Cobrado / Saldo */}
      <div className="row-flex" style={{ justifyContent: 'space-between', gap: 10, marginBottom: 10, fontSize: 11 }}>
        <span style={{ color: 'var(--ink-faint)' }}>Total viaje <b style={{ color: 'var(--ink)' }}>{formatArs(total)}</b></span>
        <span style={{ color: 'var(--ink-faint)' }}>Cobrado <b style={{ color: '#16a34a' }}>{formatArs(cobrado)}</b></span>
        <span style={{ color: 'var(--ink-faint)' }}>Saldo <b style={{ color: 'var(--gold-deep)' }}>{formatArs(saldo)}</b></span>
      </div>
      <div className="field-row cols-2" style={{ marginBottom: 8 }}>
        <div className="field" style={{ marginBottom: 0 }}>
          <label className="f-label">Tipo</label>
          <select className="select" value={tipo} onChange={ev => setTipo(ev.target.value as VivencialPaymentTipo)}>
            <option value="sena">Seña</option>
            <option value="transferencia">Transferencia</option>
          </select>
        </div>
        <div className="field" style={{ marginBottom: 0 }}>
          <label className="f-label">Monto (ARS)</label>
          <div className="input-prefix-wrap"><span className="input-prefix">$</span>
            <input className="input" type="number" value={monto} onChange={ev => setMonto(ev.target.value)} />
          </div>
        </div>
      </div>
      <div className="field" style={{ marginBottom: 8 }}>
        <label className="f-label">Fecha de la transferencia</label>
        <input className="input" type="date" value={fecha} max={todayISO()} onChange={ev => setFecha(ev.target.value)} />
      </div>
      <div className="field" style={{ marginBottom: 10 }}>
        <label className="f-label">Comprobante / captura (imagen o PDF)</label>
        <input ref={fileRef} type="file" accept="image/*,application/pdf" hidden onChange={ev => pickFile(ev.target.files?.[0])} />
        <button className="btn btn-secondary btn-sm" style={{ width: '100%', justifyContent: 'flex-start' }} onClick={() => fileRef.current?.click()}>
          {file ? file.name : 'Subir comprobante'}
        </button>
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <button className="btn btn-primary btn-sm" onClick={() => void submit()} disabled={cargar.isPending}>
          {cargar.isPending ? 'Guardando…' : 'Guardar pago'}
        </button>
        <button className="btn btn-secondary btn-sm" onClick={onDone} disabled={cargar.isPending}>Cancelar</button>
      </div>
    </div>
  )
}

export default function VivencialInscriptoRow({ e, course }: { e: EnrollmentWithProfile; course: Course }) {
  const courseId = course.id
  const [open, setOpen] = useState(false)
  const [confirmLiberar, setConfirmLiberar] = useState(false)
  const [showCargar, setShowCargar] = useState(false)
  const { data: history } = useEnrollmentPaymentHistory(e.id, open)
  const liberar = useLiberarCupo()

  const estado = calcEstado(e)
  const est = ESTADO_STYLE[estado]
  const nombre = [e.profile?.nombre, e.profile?.apellido].filter(Boolean).join(' ') || e.profile?.email || e.user_id.slice(0, 8)
  const pagado = e.monto_señado_ars ?? 0
  const total = e.monto_total_ars ?? 0
  const saldo = Math.max(0, total - pagado)
  const pct = total > 0 ? Math.min(100, Math.round((pagado / total) * 100)) : 0

  // Liquidación PDF (punto 6) — client-side jsPDF + html2canvas.
  const [pdfBusy, setPdfBusy] = useState(false)
  const descargarLiquidacion = async () => {
    if (pdfBusy) return
    setPdfBusy(true)
    try {
      const { data } = await supabase.from('academy_vivencial_payments').select('*').eq('enrollment_id', e.id)
      const payments = (data ?? []) as VivencialPayment[]
      const liq = buildLiquidacionData({
        course, enrollment: e, payments,
        cliente: { nombre, dni: e.dni ?? '', email: e.profile?.email ?? '', celular: e.profile?.telefono ?? '', fechaNac: e.fecha_nacimiento ?? '' },
      })
      await downloadLiquidacionPdf(liq)
    } catch (err) { toast.error((err as Error).message) }
    finally { setPdfBusy(false) }
  }

  const gastosAdmin = course.vivencial_gastos_admin_pct != null ? `${course.vivencial_gastos_admin_pct}%` : '—'

  const doLiberar = async () => {
    try { await liberar.mutateAsync({ enrollmentId: e.id, courseId }); toast.success('Cupo liberado') }
    catch (err) { toast.error((err as Error).message) }
    finally { setConfirmLiberar(false) }
  }

  return (
    <div style={{ background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 10, marginBottom: 7, overflow: 'hidden' }}>
      {/* Header */}
      <div className="row-flex" style={{ padding: '10px 12px', gap: 10 }}>
        <div className="tbl-avatar">{(e.profile?.nombre ?? e.profile?.email ?? '?').slice(0, 2).toUpperCase()}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 12.8 }}>{nombre}</div>
          <div style={{ fontSize: 11, color: 'var(--ink-faint)' }}>
            {e.numero_reserva ? `${e.numero_reserva} · ` : ''}{formatArs(pagado)} / {formatArs(total)}
            {e.fecha_limite_pago && !e.pago_completado ? ` · límite ${formatDate(e.fecha_limite_pago)}` : ''}
          </div>
        </div>
        <span className="mono" style={{ fontSize: 10.5, padding: '3px 8px', borderRadius: 6, color: est.color, background: est.bg }}>{estado}</span>
        <button className="btn btn-secondary btn-sm" title="Descargar liquidación PDF" onClick={() => void descargarLiquidacion()} disabled={pdfBusy} style={{ padding: '5px 8px' }}>
          <FileText size={14} />
        </button>
        <button className="btn btn-secondary btn-sm" onClick={() => setOpen(o => !o)}>{open ? 'Ocultar' : 'Ver detalle'}</button>
      </div>

      {open && (
        <div style={{ padding: '0 12px 12px' }}>
          {/* Barra Pagado / Total con Saldo a la derecha */}
          <div style={{ marginBottom: 12 }}>
            <div className="row-flex" style={{ justifyContent: 'space-between', fontSize: 11.5, marginBottom: 5 }}>
              <span style={{ color: 'var(--ink-soft)' }}>Pagado <b style={{ color: '#16a34a' }}>{formatArs(pagado)}</b> de {formatArs(total)}</span>
              <span style={{ color: 'var(--ink-soft)' }}>Saldo <b style={{ color: saldo > 0 ? 'var(--gold-deep)' : '#16a34a' }}>{formatArs(saldo)}</b></span>
            </div>
            <div style={{ height: 6, borderRadius: 4, background: 'var(--surface-2)', overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${pct}%`, borderRadius: 4, background: pct >= 100 ? '#16a34a' : 'var(--gold)' }} />
            </div>
          </div>

          {/* Columnas (sin "Detalles del paquete": ya estamos dentro del paquete) */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: 10, marginBottom: 12 }}>
            <InfoCard
              title="Precios (comisiones N/A)"
              rows={[
                { label: 'Precio base', value: formatArs(course.vivencial_precio_base_ars) },
                { label: 'Impuestos', value: formatArs(course.vivencial_impuestos_ars) },
                { label: 'Gastos admin', value: gastosAdmin },
                { label: 'Total', value: formatArs(total) },
                { label: 'Saldo', value: formatArs(saldo) },
              ]}
            />
            <InfoCard
              title="Datos del cliente"
              rows={[
                { label: 'Nombre', value: nombre },
                { label: 'DNI', value: e.dni ?? '—' },
                { label: 'Email', value: e.profile?.email ?? '—' },
                { label: 'Celular', value: e.profile?.telefono ?? '—' },
                { label: 'Fecha nac.', value: e.fecha_nacimiento ? formatDate(e.fecha_nacimiento) : '—' },
              ]}
            />
          </div>
          <div className="mono" style={{ fontSize: 9.5, color: 'var(--ink-faint)', marginBottom: 10 }}>
            Comisiones/revenue-share no aplican a vivenciales de Academy (es del flujo de instructores). El DNI se toma del onboarding del cliente; "observaciones" todavía no existe en el schema.
          </div>

          {!e.pago_completado && (
            showCargar
              ? <CargarPagoForm e={e} courseId={courseId} onDone={() => setShowCargar(false)} />
              : <button className="btn btn-primary btn-sm" style={{ marginBottom: 4 }} onClick={() => setShowCargar(true)}>+ Cargar pago</button>
          )}
          {!history ? (
            <div style={{ fontSize: 12, color: 'var(--ink-faint)' }}>Cargando…</div>
          ) : (history.comprobantes.length === 0 && history.cuotas.length === 0) ? (
            <div style={{ fontSize: 12, color: 'var(--ink-faint)' }}>Sin pagos declarados todavía.</div>
          ) : (
            <>
              {history.comprobantes.map(p => (
                <div key={p.id}>
                  {p.estado === 'pendiente' ? (
                    <ComprobanteReview p={p} courseId={courseId} enrollmentId={e.id} />
                  ) : (
                    <div className="row-flex" style={{ justifyContent: 'space-between', padding: '8px 10px', background: 'var(--surface-2)', borderRadius: 9, marginTop: 6, fontSize: 11.5, color: 'var(--ink-soft)' }}>
                      <span>{p.tipo === 'sena' ? 'Seña' : 'Transferencia'} · {formatDate(p.fecha_declarada)}</span>
                      <span>
                        {p.estado === 'aprobado' ? formatArs(p.monto_aprobado_ars ?? p.monto_declarado_ars) : formatArs(p.monto_declarado_ars)}
                        {' · '}
                        <b style={{ color: p.estado === 'aprobado' ? '#16a34a' : 'var(--clay-deep)' }}>{p.estado}</b>
                      </span>
                    </div>
                  )}
                </div>
              ))}
              {history.cuotas.map(c => (
                <div key={c.id} className="row-flex" style={{ justifyContent: 'space-between', padding: '8px 10px', background: 'var(--surface-2)', borderRadius: 9, marginTop: 6, fontSize: 11.5, color: 'var(--ink-soft)' }}>
                  <span>Cuotas MP · {formatDate(c.created_at)}</span>
                  <span>{formatArs(c.monto_ars)} · <b style={{ color: c.estado === 'aprobado' ? '#16a34a' : 'var(--ink-faint)' }}>{c.estado}</b></span>
                </div>
              ))}
            </>
          )}

          {estado === 'Vencido' && (
            <div style={{ marginTop: 10 }}>
              {!confirmLiberar ? (
                <button className="btn btn-danger btn-sm" onClick={() => setConfirmLiberar(true)}>Liberar cupo</button>
              ) : (
                <div style={{ background: 'var(--clay-soft)', borderRadius: 10, padding: '10px 12px' }}>
                  <div style={{ fontSize: 12.2, color: 'var(--clay-deep)', marginBottom: 8 }}>
                    Esto libera el lugar pero <b>no reembolsa nada</b>. Avisale a Yesica que tiene que hacer la devolución manual.
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button className="btn btn-danger btn-sm" onClick={() => void doLiberar()} disabled={liberar.isPending}>Sí, liberar</button>
                    <button className="btn btn-secondary btn-sm" onClick={() => setConfirmLiberar(false)}>Cancelar</button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
