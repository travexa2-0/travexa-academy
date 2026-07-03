import { useNavigate } from 'react-router-dom'
import Overlay from './Overlay'

interface Props {
  open: boolean
  onClose: () => void
  onOpenSettings: () => void
}

const PlusIcon = () => (
  <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12h14" /></svg>
)

export default function CommandPalette({ open, onClose, onOpenSettings }: Props) {
  const navigate = useNavigate()

  const go = (path: string) => { onClose(); navigate(path) }

  return (
    <Overlay open={open} onClose={onClose}>
      <div className="modal modal-narrow" style={{ maxWidth: 520, alignSelf: 'flex-start', marginTop: '12vh' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '16px 18px', borderBottom: '1px solid var(--line)' }}>
          <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: 'var(--ink-faint)' }}><circle cx="11" cy="11" r="7" /><path d="M21 21l-4.3-4.3" /></svg>
          <input autoFocus type="text" placeholder="Buscar curso, vivencial, alumno, o escribí un comando…"
            style={{ border: 'none', flex: 1, fontSize: 14, background: 'transparent' }} />
          <kbd className="mono" style={{ fontSize: 10, color: 'var(--ink-faint)', border: '1px solid var(--line)', borderRadius: 5, padding: '2px 6px' }}>esc</kbd>
        </div>
        <div style={{ padding: 8, maxHeight: 340, overflowY: 'auto' }}>
          <div className="cmdk-group">Acciones rápidas</div>
          <button className="btn btn-ghost btn-block" style={{ justifyContent: 'flex-start', gap: 11 }} onClick={() => go('/admin/cursos?nuevo=1')}><PlusIcon />Nuevo curso</button>
          <button className="btn btn-ghost btn-block" style={{ justifyContent: 'flex-start', gap: 11 }} onClick={() => go('/admin/vivenciales?nuevo=1')}><PlusIcon />Nuevo vivencial</button>
          <button className="btn btn-ghost btn-block" style={{ justifyContent: 'flex-start', gap: 11 }} onClick={() => { onClose(); onOpenSettings() }}>
            <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.7 1.7 0 00.34 1.87" /></svg>
            Abrir configuración
          </button>
          <div className="cmdk-group" style={{ paddingTop: 12 }}>Ir a</div>
          <button className="btn btn-ghost btn-block" style={{ justifyContent: 'flex-start', gap: 11 }} onClick={() => go('/admin/resumen')}>Resumen</button>
          <button className="btn btn-ghost btn-block" style={{ justifyContent: 'flex-start', gap: 11 }} onClick={() => go('/admin/cursos')}>Cursos</button>
          <button className="btn btn-ghost btn-block" style={{ justifyContent: 'flex-start', gap: 11 }} onClick={() => go('/admin/vivenciales')}>Vivenciales</button>
          <button className="btn btn-ghost btn-block" style={{ justifyContent: 'flex-start', gap: 11 }} onClick={() => go('/admin/metricas')}>Métricas</button>
        </div>
      </div>
    </Overlay>
  )
}
