import { useRef, useState } from 'react'
import { Upload, FileCheck2, ExternalLink, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { useInstructorSelf } from '@/hooks/useInstructorSelf'
import { useOwnPayouts, useUploadFactura } from '@/hooks/instructor/useInstructorPayouts'
import { signedComprobanteUrl } from '@/lib/storage'
import { useAuth } from '@/contexts/AuthContext'
import { formatArs } from '../admin/format'
import { periodLabel } from './earnings'
import type { InstructorPayout } from '@/types'

// El bucket es privado: para ver un archivo hay que pedir una URL firmada al momento.
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

function PayoutRow({ payout, userId }: { payout: InstructorPayout; userId: string }) {
  const fileRef = useRef<HTMLInputElement>(null)
  const upload = useUploadFactura()

  const periodo = payout.periodo.slice(0, 10)

  const onFile = (file: File | undefined) => {
    if (!file) return
    upload.mutate(
      { payoutId: payout.id, instructorId: payout.instructor_id, userId, periodo, file },
      {
        onSuccess: () => toast.success('Factura subida'),
        onError: e => toast.error(e instanceof Error ? e.message : 'Error al subir la factura'),
      },
    )
  }

  return (
    <tr>
      <td style={{ fontWeight: 600, color: 'var(--ink)', textTransform: 'capitalize' }}>
        {periodLabel(payout.periodo.slice(0, 7))}
      </td>
      <td className="num align-right">{payout.cantidad_ventas}</td>
      <td className="num align-right" style={{ fontWeight: 600 }}>{formatArs(payout.monto_instructor_ars)}</td>

      <td>
        {payout.factura_url ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <FileCheck2 style={{ width: 14, height: 14, color: 'var(--teal-deep)' }} />
            <ArchivoLink path={payout.factura_url} label="Ver" />
            <button className="btn btn-ghost btn-sm" onClick={() => fileRef.current?.click()} disabled={upload.isPending}>
              Reemplazar
            </button>
          </div>
        ) : (
          <button className="btn btn-secondary btn-sm" onClick={() => fileRef.current?.click()} disabled={upload.isPending}>
            {upload.isPending ? <Loader2 className="animate-spin" /> : <Upload />} Subir factura
          </button>
        )}
        <input
          ref={fileRef}
          type="file"
          accept="application/pdf,image/jpeg,image/png,image/webp"
          style={{ display: 'none' }}
          onChange={e => { onFile(e.target.files?.[0]); e.target.value = '' }}
        />
      </td>

      <td>
        {payout.comprobante_pago_url
          ? <ArchivoLink path={payout.comprobante_pago_url} label="Ver comprobante" />
          : <span style={{ fontSize: 12, color: 'var(--ink-faint)' }}>—</span>}
      </td>

      <td>
        {payout.pagado
          ? <span className="badge badge-published">Pagado{payout.fecha_pago ? ` · ${new Date(payout.fecha_pago).toLocaleDateString('es-AR', { day: 'numeric', month: 'short' })}` : ''}</span>
          : <span className="badge badge-draft">Pendiente</span>}
      </td>
    </tr>
  )
}

export default function InstructorPagos() {
  const { user } = useAuth()
  const { instructor } = useInstructorSelf()
  const { data: payouts, isLoading } = useOwnPayouts(instructor?.id)

  if (isLoading) {
    return <div style={{ color: 'var(--ink-faint)', padding: '40px 0', textAlign: 'center' }}>Cargando…</div>
  }

  const list = payouts ?? []

  return (
    <>
      <div className="page-head">
        <div>
          <div className="page-eyebrow">Negocio</div>
          <h1 className="page-title">Pagos</h1>
          <p className="page-sub">
            Tus liquidaciones cerradas. Subí la factura del período y, cuando Travexa te pague,
            vas a ver acá el comprobante.
          </p>
        </div>
      </div>

      {list.length === 0 ? (
        <div className="grid-empty">
          <div className="empty-state">
            <div className="empty-state-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="2" y="6" width="20" height="13" rx="2" /><path d="M2 10h20M6 15h4" /></svg>
            </div>
            <h4>Todavía no hay liquidaciones</h4>
            <p>Cuando Travexa cierre tu primer mes con ventas, la liquidación va a aparecer acá.</p>
          </div>
        </div>
      ) : (
        <div className="card">
          <div style={{ overflowX: 'auto' }}>
            <table className="tbl">
              <thead>
                <tr>
                  <th>Período</th>
                  <th className="align-right">Ventas</th>
                  <th className="align-right">Tu monto</th>
                  <th>Tu factura</th>
                  <th>Comprobante de Travexa</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
                {user && list.map(p => <PayoutRow key={p.id} payout={p} userId={user.id} />)}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </>
  )
}
