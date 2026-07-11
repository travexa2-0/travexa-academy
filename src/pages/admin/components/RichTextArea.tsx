import { useRef } from 'react'

interface Props {
  value: string
  onChange: (next: string) => void
  placeholder?: string
  minHeight?: number
}

/**
 * Textarea de texto libre (un ítem por línea) con un botón "B" que envuelve la
 * selección en ** ** para negrita. Acepta pegar texto sin romper el formato.
 * Comparte columna con vivenciales; el render usa renderBold() de lib/richText.
 */
export default function RichTextArea({ value, onChange, placeholder, minHeight = 128 }: Props) {
  const ref = useRef<HTMLTextAreaElement>(null)

  const wrapBold = () => {
    const el = ref.current
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

  return (
    <div>
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
      <textarea
        ref={ref}
        className="textarea"
        value={value}
        placeholder={placeholder}
        onChange={e => onChange(e.target.value)}
        style={{ minHeight }}
      />
    </div>
  )
}
