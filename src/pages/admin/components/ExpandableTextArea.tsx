import { useEffect, useState } from 'react'

interface Props {
  value: string
  onChange: (next: string) => void
  placeholder?: string
  minHeight?: number
  fontSize?: number
  // Título del modal expandido.
  label?: string
}

const ExpandIcon = () => (
  <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" />
  </svg>
)
const CloseIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12" /></svg>
)

/**
 * Textarea con un botón "expandir" que abre un modal grande con scroll para
 * cargar textos largos cómodamente. El value es compartido (edita el mismo
 * estado en línea y en el modal). Cierra por backdrop o botón — a propósito no
 * escucha Escape global, para no cerrar también el wizard que lo contiene.
 */
export default function ExpandableTextArea({ value, onChange, placeholder, minHeight = 88, fontSize, label = 'Editar texto' }: Props) {
  const [open, setOpen] = useState(false)

  // Escape cierra solo este modal (captura antes que el listener del wizard, que si no
  // cerraría todo el wizard y perdería lo cargado).
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') { e.stopPropagation(); setOpen(false) } }
    document.addEventListener('keydown', onKey, true)
    return () => document.removeEventListener('keydown', onKey, true)
  }, [open])

  return (
    <div style={{ position: 'relative' }}>
      <textarea
        className="textarea"
        value={value}
        placeholder={placeholder}
        onChange={e => onChange(e.target.value)}
        style={{ minHeight, fontSize, paddingRight: 36 }}
      />
      <button
        type="button"
        title="Expandir para escribir más cómodo"
        onClick={() => setOpen(true)}
        style={{
          position: 'absolute', top: 8, right: 8,
          width: 26, height: 26, borderRadius: 7,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'var(--surface-2, rgba(0,0,0,0.04))', color: 'var(--ink-soft)',
          border: '1px solid var(--line)',
        }}
      >
        <ExpandIcon />
      </button>

      {open && (
        <div
          className="overlay open"
          style={{ zIndex: 140 }}
          onMouseDown={e => { if (e.target === e.currentTarget) setOpen(false) }}
        >
          <div className="modal" style={{ maxWidth: 760, width: '92vw' }} onMouseDown={e => e.stopPropagation()}>
            <div className="modal-head">
              <div><h2>{label}</h2></div>
              <button className="modal-close" onClick={() => setOpen(false)}><CloseIcon /></button>
            </div>
            <div className="modal-body">
              <textarea
                className="textarea"
                autoFocus
                value={value}
                placeholder={placeholder}
                onChange={e => onChange(e.target.value)}
                style={{ minHeight: '55vh', fontSize: 14.5, lineHeight: 1.6, width: '100%' }}
              />
            </div>
            <div className="modal-foot">
              <span className="f-hint" style={{ margin: 0 }}>Los cambios se guardan solos</span>
              <button className="btn btn-primary" onClick={() => setOpen(false)}>Listo</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
