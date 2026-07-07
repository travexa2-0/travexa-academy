import { useState } from 'react'
import toast from 'react-hot-toast'
import Overlay from './Overlay'
import { supabase } from '@/lib/supabase'
import { useManualEnrollment } from '@/hooks/admin/useAdminEnrollments'
import type { Course, TipoAccesoEnrollment } from '@/types'

interface Props { course: Course; open: boolean; onClose: () => void }

const ACCESO: { value: TipoAccesoEnrollment; label: string }[] = [
  { value: 'pago', label: 'Pago' },
  { value: 'regalo', label: 'Regalo' },
  { value: 'gratuito', label: 'Gratuito' },
  { value: 'b2b', label: 'B2B' },
]

export default function ManualEnrollmentForm({ course, open, onClose }: Props) {
  const isViv = course.tipo === 'vivencial'
  const manual = useManualEnrollment()
  const [email, setEmail] = useState('')
  const [tipoAcceso, setTipoAcceso] = useState<TipoAccesoEnrollment>('pago')
  const [montoTotal, setMontoTotal] = useState(isViv && course.precio_ars ? String(course.precio_ars) : '')

  const submit = async () => {
    const mail = email.trim().toLowerCase()
    if (!mail) { toast.error('Ingresá el email del alumno.'); return }
    const { data, error } = await supabase.from('profiles').select('id').eq('email', mail).maybeSingle<{ id: string }>()
    if (error) { toast.error(error.message); return }
    if (!data) { toast.error('No hay ningún usuario con ese email.'); return }
    try {
      await manual.mutateAsync({
        courseId: course.id,
        userId: data.id,
        tipoAcceso,
        isVivencial: isViv,
        montoTotalArs: montoTotal ? Number(montoTotal) : null,
      })
      toast.success('Inscripción cargada' + (isViv ? ' · cupo actualizado' : ''))
      onClose()
    } catch (e) { toast.error((e as Error).message) }
  }

  return (
    <Overlay open={open} onClose={onClose}>
      <div className="modal modal-narrow" style={{ maxWidth: 460 }}>
        <div className="modal-head">
          <div><h2 style={{ fontSize: '1.05rem' }}>Cargar inscripción manual</h2><div className="sub">{course.titulo}</div></div>
          <button className="modal-close" onClick={onClose}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12" /></svg></button>
        </div>
        <div className="modal-body">
          <div className="field">
            <label className="f-label">Email del alumno</label>
            <input className="input" type="email" placeholder="alumno@email.com" value={email} onChange={e => setEmail(e.target.value)} />
            <div className="f-hint">El usuario ya tiene que estar registrado en Academy.</div>
          </div>
          <div className="field">
            <label className="f-label">Tipo de acceso</label>
            <select className="select" value={tipoAcceso} onChange={e => setTipoAcceso(e.target.value as TipoAccesoEnrollment)}>
              {ACCESO.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
          {isViv && (
            <div className="field">
              <label className="f-label">Monto total (ARS)</label>
              <div className="input-prefix-wrap"><span className="input-prefix">$</span><input className="input" type="number" value={montoTotal} onChange={e => setMontoTotal(e.target.value)} /></div>
              <div className="f-hint">La seña y los pagos se cargan después, con comprobante, desde la ficha del inscripto.</div>
            </div>
          )}
        </div>
        <div className="modal-foot">
          <span />
          <button className="btn btn-primary" onClick={submit} disabled={manual.isPending}>{manual.isPending ? 'Cargando…' : 'Cargar inscripción'}</button>
        </div>
      </div>
    </Overlay>
  )
}
