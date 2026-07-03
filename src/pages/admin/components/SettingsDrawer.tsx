import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import Overlay from './Overlay'
import { useAdminSettings, useUpdateSettings } from '@/hooks/admin/useAdminSettings'
import { useCategories } from '@/hooks/useCourses'
import { useAdminInstructors, useCreateInstructor, useCreateCategory } from '@/hooks/admin/useAdminCourses'

interface Props { open: boolean; onClose: () => void }

const CloseIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12" /></svg>
)

export default function SettingsDrawer({ open, onClose }: Props) {
  const { data: settings } = useAdminSettings()
  const { data: categories } = useCategories()
  const { data: instructors } = useAdminInstructors()
  const updateSettings = useUpdateSettings()
  const createCategory = useCreateCategory()
  const createInstructor = useCreateInstructor()

  const [tc, setTc] = useState('')
  const [comision, setComision] = useState('')
  const [meta, setMeta] = useState('')
  const [marketing, setMarketing] = useState('')

  useEffect(() => {
    if (settings) {
      setTc(String(settings.tipo_cambio_usd_ars))
      setComision(String(settings.comision_mp_pct))
      setMeta(String(settings.meta_ingresos_mensual_ars))
      setMarketing(String(settings.inversion_marketing_mensual_ars))
    }
  }, [settings])

  const save = async () => {
    try {
      await updateSettings.mutateAsync({
        tipo_cambio_usd_ars: Number(tc) || 0,
        comision_mp_pct: Number(comision) || 0,
        meta_ingresos_mensual_ars: Number(meta) || 0,
        inversion_marketing_mensual_ars: Number(marketing) || 0,
      })
      toast.success('Configuración guardada')
      onClose()
    } catch (e) {
      toast.error((e as Error).message)
    }
  }

  const addCategory = async () => {
    const nombre = window.prompt('Nombre de la nueva categoría')?.trim()
    if (!nombre) return
    try { await createCategory.mutateAsync({ nombre }); toast.success('Categoría agregada') }
    catch (e) { toast.error((e as Error).message) }
  }

  const addInstructor = async () => {
    const nombre = window.prompt('Nombre del instructor')?.trim()
    if (!nombre) return
    const shareStr = window.prompt('Revenue share % (0-100)', '0')?.trim()
    try {
      await createInstructor.mutateAsync({ nombre, revenue_share_pct: Number(shareStr) || 0 })
      toast.success('Instructor agregado')
    } catch (e) { toast.error((e as Error).message) }
  }

  const initials = (name: string) => name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()

  return (
    <Overlay open={open} onClose={onClose} alignRight>
      <div className="drawer">
        <div className="modal-head">
          <div>
            <h2 style={{ fontSize: '1.05rem' }}>Configuración</h2>
            <div className="sub">Usado para calcular equivalencias y rentabilidad</div>
          </div>
          <button className="modal-close" onClick={onClose}><CloseIcon /></button>
        </div>

        <div className="modal-body">
          <div className="field">
            <label className="f-label">Tipo de cambio USD → ARS</label>
            <div className="input-prefix-wrap"><span className="input-prefix">$</span>
              <input className="input" type="number" value={tc} onChange={e => setTc(e.target.value)} />
            </div>
            <div className="f-hint">Se usa para mostrar el equivalente en pesos en cursos y vivenciales.</div>
          </div>
          <div className="field">
            <label className="f-label">Comisión de Mercado Pago</label>
            <div className="input-prefix-wrap"><span className="input-prefix">%</span>
              <input className="input" type="number" step="0.1" value={comision} onChange={e => setComision(e.target.value)} />
            </div>
          </div>
          <div className="field">
            <label className="f-label">Meta de ingresos mensual</label>
            <div className="input-prefix-wrap"><span className="input-prefix">$</span>
              <input className="input" type="number" placeholder="0" value={meta} onChange={e => setMeta(e.target.value)} />
            </div>
            <div className="f-hint">Se muestra como barra de progreso en Resumen.</div>
          </div>
          <div className="field">
            <label className="f-label">Inversión en marketing este mes</label>
            <div className="input-prefix-wrap"><span className="input-prefix">$</span>
              <input className="input" type="number" placeholder="0" value={marketing} onChange={e => setMarketing(e.target.value)} />
            </div>
            <div className="f-hint">Se usa para calcular el ROI de marketing en Métricas.</div>
          </div>

          <div className="field" style={{ marginTop: 26, paddingTop: 20, borderTop: '1px solid var(--line)' }}>
            <label className="f-label">Categorías</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
              {(categories ?? []).map(c => <span key={c.id} className="chip">{c.nombre}</span>)}
              <button className="chip" style={{ borderStyle: 'dashed' }} onClick={addCategory}>+ Nueva</button>
            </div>
          </div>

          <div className="field">
            <label className="f-label">Instructores</label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {(instructors ?? []).map(i => (
                <div key={i.id} className="row-flex" style={{ padding: '8px 10px', background: 'var(--surface-2)', borderRadius: 9 }}>
                  <div className="tbl-avatar">{initials(i.nombre)}</div>
                  <span style={{ fontSize: 12.6 }}>{i.nombre}</span>
                  <span className="mono" style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--ink-faint)' }}>{i.revenue_share_pct}% share</span>
                </div>
              ))}
              {(instructors ?? []).length === 0 && (
                <div style={{ fontSize: 12.4, color: 'var(--ink-faint)' }}>Todavía no cargaste instructores.</div>
              )}
            </div>
            <button className="btn btn-ghost btn-sm" style={{ marginTop: 8, color: 'var(--teal-deep)' }} onClick={addInstructor}>+ Agregar instructor</button>
          </div>
        </div>

        <div className="modal-foot">
          <span />
          <button className="btn btn-primary" onClick={save} disabled={updateSettings.isPending}>
            {updateSettings.isPending ? 'Guardando…' : 'Guardar cambios'}
          </button>
        </div>
      </div>
    </Overlay>
  )
}
