import { useMemo, useRef, useState } from 'react'
import { Loader2, Upload, ExternalLink, FileCheck2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { useInstructorsFull } from '@/hooks/admin/useAdminInstructorsFull'
import { useAdminPayouts, useCloseInstructorMonth, useRegistrarPagoInstructor, type PayoutRow } from '@/hooks/admin/useAdminPayouts'
import { signedComprobanteUrl } from '@/lib/storage'
import { formatArs } from './format'

// Primer día del mes, `offset` meses atrás. 0 = mes en curso, 1 = mes pasado.
function periodoISO(offset: number): string {
  const now = new Date()
  const d = new Date(now.getFullYear(), now.getMonth() - offset, 1)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`
}

function periodoLabel(iso: string): string {
  const [y, m] = iso.split('-').map(Number)
  return new Date(y, m - 1, 1).toLocaleDateString('es-AR', { month: 'long', year: 'numeric' })
}

function ArchivoLink({ path, label }: { path: string; label: string }) {
  const [loading, setLoading] = useState(false)
  const abrir = async () => {
    setLoading(true)
    const url = await signedComprobanteUrl(path)
    setLoading(false)
    if (!url) { toast.error('No pudimos abrir el archivo'); return }
    window.open(url, '_blank', 'noopener,noreferrer')
  }
  return (
    <button className="btn btn-ghost btn-sm" onClick={() => { void abrir() }} disabled={loading}>
      {loading ? <Loader2 className="animate-spin" /> : <ExternalLink />} {label}
    </button>
  )
}

function PagoRow({ payout }: { payout: PayoutRow }) {
  const registrar = useRegistrarPagoInstructor()
  const fileRef = useRef<HTMLInputElement>(null)
  const [monto, setMonto] = useState(String(Math.round(payout.monto_instructor_ars)))
  const [fecha, setFecha] = useState(new Date().toISOString().slice(0, 10))

  const periodo = payout.periodo.slice(0, 10)

  const onFile = (file: File | undefined) => {
    if (!file) return
    const montoNum = Number(monto)
    if (!Number.isFinite(montoNum) || montoNum <= 0) { toast.error('Cargá un monto válido'); return }
    if (!fecha) { toast.error('Cargá la fecha de pago'); return }

    registrar.mutate(
      {
        payoutId: payout.id,
        instructorId: payout.instructor_id,
        instructorUserId: payout.instructor?.user_id ?? null,
        periodo,
        montoPagadoArs: montoNum,
        fechaPago: fecha,
        file,
      },
      {
        onSuccess: () => toast.success('Pago registrado'),
        onError: e => toast.error(e instanceof Error ? e.message : 'Error al registrar el pago'),
      },
    )
  }

  return (
    <tr>
      <td style={{ fontWeight: 600, color: 'var(--ink)' }}>{payout.instructor?.nombre ?? '—'}</td>
      <td style={{ textTransform: 'capitalize' }}>{periodoLabel(periodo)}</td>
      <td className="num align-right">{payout.cantidad_ventas}</td>
      <td className="num align-right" style={{ fontWeight: 600 }}>{formatArs(payout.monto_instructor_ars)}</td>

      <td>
        {payout.factura_url
          ? <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <FileCheck2 style={{ width: 14, height: 14, color: 'var(--teal-deep)' }} />
              <ArchivoLink path={payout.factura_url} label="Ver" />
            </div>
          : <span style={{ fontSize: 12, color: 'var(--ink-faint)' }}>Sin factura</span>}
      </td>

      {payout.pagado ? (
        <>
          <td className="num">{formatArs(payout.monto_pagado_ars)}</td>
          <td className="mono" style={{ fontSize: 12 }}>
            {payout.fecha_pago ? new Date(payout.fecha_pago).toLocaleDateString('es-AR', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
          </td>
          <td>
            {payout.comprobante_pago_url && <ArchivoLink path={payout.comprobante_pago_url} label="Comprobante" />}
          </td>
          <td><span className="badge badge-published">Pagado</span></td>
        </>
      ) : (
        <>
          <td>
            <input
              className="input"
              type="number"
              min={0}
              style={{ width: 120 }}
              value={monto}
              onChange={e => setMonto(e.target.value)}
              aria-label="Monto pagado"
            />
          </td>
          <td>
            <input
              className="input"
              type="date"
              style={{ width: 150 }}
              value={fecha}
              onChange={e => setFecha(e.target.value)}
              aria-label="Fecha de pago"
            />
          </td>
          <td>
            <button className="btn btn-primary btn-sm" onClick={() => fileRef.current?.click()} disabled={registrar.isPending}>
              {registrar.isPending ? <Loader2 className="animate-spin" /> : <Upload />} Comprobante
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="application/pdf,image/jpeg,image/png,image/webp"
              style={{ display: 'none' }}
              onChange={e => { onFile(e.target.files?.[0]); e.target.value = '' }}
            />
          </td>
          <td><span className="badge badge-draft">Pendiente</span></td>
        </>
      )}
    </tr>
  )
}

export default function PagosInstructores() {
  const { data: instructores } = useInstructorsFull()
  const { data: payouts, isLoading } = useAdminPayouts()
  const close = useCloseInstructorMonth()

  const [instructorId, setInstructorId] = useState('')
  const [periodo, setPeriodo] = useState(() => periodoISO(1))

  const opcionesPeriodo = useMemo(() => [periodoISO(1), periodoISO(0)], [])
  const activos = (instructores ?? []).filter(i => i.activo)

  const cerrar = () => {
    if (!instructorId) { toast.error('Elegí un instructor'); return }
    close.mutate({ instructorId, periodo }, {
      onSuccess: () => toast.success('Mes cerrado'),
      onError: e => toast.error(e instanceof Error ? e.message : 'Error al cerrar el mes'),
    })
  }

  return (
    <>
      <div className="page-head">
        <div>
          <div className="page-eyebrow">Negocio</div>
          <h1 className="page-title">Pagos a instructores</h1>
          <p className="page-sub">
            Cerrá el mes de cada instructor y registrá lo que le pagaste. El check de "pagado"
            se marca solo al adjuntar el comprobante.
          </p>
        </div>
      </div>

      <div className="card card-pad" style={{ marginBottom: 16 }}>
        <div className="row-flex" style={{ gap: 10, flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div className="field" style={{ marginBottom: 0, minWidth: 220 }}>
            <label className="f-label" htmlFor="instructor">Instructor</label>
            <select id="instructor" className="select" value={instructorId} onChange={e => setInstructorId(e.target.value)}>
              <option value="">Elegí un instructor…</option>
              {activos.map(i => <option key={i.id} value={i.id}>{i.nombre}</option>)}
            </select>
          </div>
          <div className="field" style={{ marginBottom: 0, minWidth: 200 }}>
            <label className="f-label" htmlFor="periodo">Período</label>
            <select id="periodo" className="select" value={periodo} onChange={e => setPeriodo(e.target.value)}>
              {opcionesPeriodo.map(p => (
                <option key={p} value={p} style={{ textTransform: 'capitalize' }}>{periodoLabel(p)}</option>
              ))}
            </select>
          </div>
          <button className="btn btn-primary" onClick={cerrar} disabled={close.isPending}>
            {close.isPending ? <Loader2 className="animate-spin" /> : null} Cerrar mes
          </button>
        </div>
        <p className="f-hint" style={{ marginTop: 10 }}>
          Cerrar un mes recalcula la liquidación sobre los pagos aprobados de ese período. Se puede
          volver a correr las veces que haga falta: actualiza la fila, no la duplica.
        </p>
      </div>

      {isLoading ? (
        <div style={{ color: 'var(--ink-faint)', padding: '40px 0', textAlign: 'center' }}>Cargando…</div>
      ) : (payouts ?? []).length === 0 ? (
        <div className="grid-empty">
          <div className="empty-state">
            <div className="empty-state-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="2" y="6" width="20" height="13" rx="2" /><path d="M2 10h20M6 15h4" /></svg>
            </div>
            <h4>Todavía no cerraste ninguna liquidación</h4>
            <p>Elegí un instructor y un período arriba para generar la primera.</p>
          </div>
        </div>
      ) : (
        <div className="card">
          <div style={{ overflowX: 'auto' }}>
            <table className="tbl">
              <thead>
                <tr>
                  <th>Instructor</th><th>Período</th>
                  <th className="align-right">Ventas</th>
                  <th className="align-right">A pagar</th>
                  <th>Factura</th>
                  <th>Monto pagado</th>
                  <th>Fecha de pago</th>
                  <th>Comprobante</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
                {(payouts ?? []).map(p => <PagoRow key={p.id} payout={p} />)}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </>
  )
}
