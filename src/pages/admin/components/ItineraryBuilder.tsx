import type { ItinerarioDia } from '@/types'

interface Props {
  days: ItinerarioDia[]
  onChange: (next: ItinerarioDia[]) => void
}

// Renumbers the `dia` label to match position (matches the prototype's renumberItinDays).
function renumber(days: ItinerarioDia[]): ItinerarioDia[] {
  return days.map((d, i) => ({ ...d, dia: `Día ${i + 1}` }))
}

export default function ItineraryBuilder({ days, onChange }: Props) {
  const update = (i: number, patch: Partial<ItinerarioDia>) =>
    onChange(days.map((d, j) => (j === i ? { ...d, ...patch } : d)))
  const add = () => onChange(renumber([...days, { dia: '', titulo: '', descripcion: '' }]))
  const remove = (i: number) => onChange(renumber(days.filter((_, j) => j !== i)))

  return (
    <div>
      <div id="itin-builder">
        {days.map((d, i) => (
          <div className="itin-day" key={i}>
            <div className="itin-day-num">{i + 1}</div>
            <div className="itin-day-body">
              <input className="itin-title" value={d.titulo} placeholder="Título del día" onChange={e => update(i, { titulo: e.target.value })} />
              <textarea value={d.descripcion} placeholder="Qué se hace ese día" onChange={e => update(i, { descripcion: e.target.value })} />
            </div>
            <button className="itin-day-remove" onClick={() => remove(i)}>
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2m3 0l-1 14a2 2 0 01-2 2H7a2 2 0 01-2-2L4 6" /></svg>
            </button>
          </div>
        ))}
      </div>
      <button className="add-module-btn" onClick={add}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12h14" /></svg>
        Agregar día
      </button>
    </div>
  )
}
