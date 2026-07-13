import { useEffect, useRef, useState } from 'react'

interface Props {
  value: string
  onChange: (next: string) => void
  placeholder?: string
  minHeight?: number
  // Título del modal expandido.
  label?: string
}

const ExpandIcon = () => (
  <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" />
  </svg>
)
const CloseIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12" /></svg>
)

/**
 * Textarea de texto libre (un ítem por línea) con un botón "B" que envuelve la
 * selección en ** ** para negrita, y un botón "expandir" que abre un modal con
 * scroll para textos largos. Acepta pegar texto sin romper el formato.
 * Comparte columna con vivenciales; el render usa renderBold() de lib/richText.
 */
export default function RichTextArea({ value, onChange, placeholder, minHeight = 128, label = 'Editar texto' }: Props) {
  const inlineRef = useRef<HTMLTextAreaElement>(null)
  const modalRef = useRef<HTMLTextAreaElement>(null)
  const [open, setOpen] = useState(false)

  // Escape cierra solo este modal (captura antes que el listener del wizard).
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') { e.stopPropagation(); setOpen(false) } }
    document.addEventListener('keydown', onKey, true)
    return () => document.removeEventListener('keydown', onKey, true)
  }, [open])

  // Negrita sobre el textarea que está activo (modal si está abierto, si no el inline).
  const wrapBold = () => {
    const el = open ? modalRef.current : inlineRef.current
    if (!el) return
    const { selectionStart: start, selectionEnd: end } = el
    if (start === end) return // sin selección, no hacemos nada
    const next = `${value.slice(0, start)}**${value.slice(start, end)}**${value.slice(end)}`
    onChange(next)
    requestAnimationFrame(() => {
      el.focus()
      el.setSelectionRange(start + 2, end + 2)
    })
  }

  const Toolbar = () => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
      <button
        type="button"
        className="btn btn-ghost btn-sm"
        onMouseDown={e => e.preventDefault()} // no perder la selección al hacer click
        onClick={wrapBold}
        title="Negrita — envuelve la selección en **"
        style={{ fontWeight: 800, minWidth: 32, fontFamily: 'var(--font-display)' }}
      >
        B
      </button>
      <span className="f-hint" style={{ margin: 0 }}>Un ítem por línea · seleccioná texto y tocá B para negrita</span>
    </div>
  )

  return (
    <div>
      <Toolbar />
      <div style={{ position: 'relative' }}>
        <textarea
          ref={inlineRef}
          className="textarea"
          value={value}
          placeholder={placeholder}
          onChange={e => onChange(e.target.value)}
          style={{ minHeight, paddingRight: 36 }}
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
      </div>

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
              <Toolbar />
              <textarea
                ref={modalRef}
                className="textarea"
                autoFocus
                value={value}
                placeholder={placeholder}
                onChange={e => onChange(e.target.value)}
                style={{ minHeight: '52vh', fontSize: 14.5, lineHeight: 1.6, width: '100%' }}
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
