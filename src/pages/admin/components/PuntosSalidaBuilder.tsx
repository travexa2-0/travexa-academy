import type { VivencialPuntoSalida } from '@/types'

interface Props {
  puntos: VivencialPuntoSalida[]
  onChange: (next: VivencialPuntoSalida[]) => void
}

// Repeatable list of departure points. `detalle_encuentro` is free text that
// carries both the boarding point and the meeting instructions (no separate field).
export default function PuntosSalidaBuilder({ puntos, onChange }: Props) {
  const update = (i: number, patch: Partial<VivencialPuntoSalida>) =>
    onChange(puntos.map((p, j) => (j === i ? { ...p, ...patch } : p)))
  const add = () => onChange([...puntos, { ciudad: '', detalle_encuentro: '', id: crypto.randomUUID() }])
  const remove = (i: number) => onChange(puntos.filter((_, j) => j !== i))

  return (
    <div>
      {puntos.map((p, i) => (
        <div className="repeat-row" key={p.id ?? i}>
          <div className="repeat-row-body">
            <div className="field-row cols-2" style={{ marginBottom: 0 }}>
              <div className="field" style={{ marginBottom: 0 }}>
                <label className="f-label">Ciudad de salida</label>
                <input className="input" type="text" placeholder="Ej: Buenos Aires" value={p.ciudad} onChange={e => update(i, { ciudad: e.target.value })} />
              </div>
              <div className="field" style={{ marginBottom: 0 }}>
                <label className="f-label">Punto de encuentro / embarque</label>
                <input className="input" type="text" placeholder="Ej: Terminal 2, mostrador Aerolíneas Argentinas, 3hs antes" value={p.detalle_encuentro} onChange={e => update(i, { detalle_encuentro: e.target.value })} />
              </div>
            </div>
          </div>
          <button className="itin-day-remove" onClick={() => remove(i)} title="Quitar punto de salida">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2m3 0l-1 14a2 2 0 01-2 2H7a2 2 0 01-2-2L4 6" /></svg>
          </button>
        </div>
      ))}
      <button className="add-module-btn" onClick={add}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12h14" /></svg>
        Agregar punto de salida
      </button>
    </div>
  )
}
