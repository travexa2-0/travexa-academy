import { useState } from 'react'

interface Props {
  value: string[]
  onChange: (next: string[]) => void
  variant?: 'plain' | 'pos' | 'neg'
  placeholder?: string
  suggestions?: string[]
}

// Chip input with optional suggestion cloud, matching the prototype `.tag-input`
// / `.tag-pill` / `.tag-suggest-cloud` styling.
export default function TagInput({ value, onChange, variant = 'plain', placeholder = 'Agregar y Enter…', suggestions }: Props) {
  const [draft, setDraft] = useState('')
  const pillClass = variant === 'plain' ? 'tag-pill' : `tag-pill ${variant}`

  const add = (raw: string) => {
    const v = raw.trim()
    if (!v) return
    if (value.some(t => t.toLowerCase() === v.toLowerCase())) return
    onChange([...value, v])
  }
  const remove = (t: string) => onChange(value.filter(x => x !== t))

  return (
    <>
      <div className="tag-input">
        {value.map(t => (
          <span key={t} className={pillClass}>{t}<button type="button" onClick={() => remove(t)}>×</button></span>
        ))}
        <input
          type="text"
          value={draft}
          placeholder={placeholder}
          onChange={e => setDraft(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter') { e.preventDefault(); add(draft); setDraft('') }
            else if (e.key === 'Backspace' && !draft && value.length) { remove(value[value.length - 1]) }
          }}
        />
      </div>
      {suggestions && suggestions.length > 0 && (
        <>
          <div className="tag-suggest-label">Sugeridos</div>
          <div className="tag-suggest-cloud">
            {suggestions.filter(s => !value.some(v => v.toLowerCase() === s.toLowerCase())).map(s => (
              <button type="button" key={s} className="tag-suggest-chip" onClick={() => add(s)}>+ {s}</button>
            ))}
          </div>
        </>
      )}
    </>
  )
}
