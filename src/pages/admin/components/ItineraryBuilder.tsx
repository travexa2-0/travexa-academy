import { useState } from 'react'
import toast from 'react-hot-toast'
import type { ItinerarioDia } from '@/types'
import { uploadMedia } from '@/hooks/admin/useAdminCourses'

interface Props {
  days: ItinerarioDia[]
  onChange: (next: ItinerarioDia[]) => void
  courseKey: string   // slug o clave para la ruta del bucket academy-media
}

// Renumbers the `dia` label to match position (matches the prototype's renumberItinDays).
function renumber(days: ItinerarioDia[]): ItinerarioDia[] {
  return days.map((d, i) => ({ ...d, dia: `Día ${i + 1}` }))
}

export default function ItineraryBuilder({ days, onChange, courseKey }: Props) {
  const [uploadingIdx, setUploadingIdx] = useState<number | null>(null)

  const update = (i: number, patch: Partial<ItinerarioDia>) =>
    onChange(days.map((d, j) => (j === i ? { ...d, ...patch } : d)))
  const add = () => onChange(renumber([...days, { dia: '', titulo: '', descripcion: '' }]))
  const remove = (i: number) => onChange(renumber(days.filter((_, j) => j !== i)))

  // Foto del día: mismo patrón y bucket (academy-media) que la foto de los hoteles.
  const onPickFile = async (i: number, file: File) => {
    setUploadingIdx(i)
    try {
      const url = await uploadMedia(courseKey || 'nuevo', file, `itinerario-${i + 1}`)
      update(i, { foto_url: url })
      toast.success('Foto del día subida')
    } catch (e) { toast.error((e as Error).message) }
    finally { setUploadingIdx(null) }
  }

  return (
    <div>
      <div id="itin-builder">
        {days.map((d, i) => (
          <div className="itin-day" key={i}>
            <div className="itin-day-num">{i + 1}</div>
            <div className="itin-day-body">
              <input className="itin-title" value={d.titulo} placeholder="Título del día" onChange={e => update(i, { titulo: e.target.value })} />
              <textarea value={d.descripcion} placeholder="Qué se hace ese día" onChange={e => update(i, { descripcion: e.target.value })} />
              <div className="field" style={{ marginBottom: 0, marginTop: 10 }}>
                <label className="f-label">Foto del día <span className="opt">(opcional)</span></label>
                <div className="hotel-photo-row">
                  {d.foto_url
                    ? <img src={d.foto_url} alt={d.titulo || `Día ${i + 1}`} className="hotel-photo-thumb" />
                    : <div className="hotel-photo-thumb hotel-photo-empty">Sin foto</div>}
                  {/* Input de archivo propio de este día: sin ref compartido ni dataset.idx. */}
                  <label className="btn btn-secondary btn-sm" style={{ cursor: uploadingIdx === i ? 'default' : 'pointer' }}>
                    {uploadingIdx === i ? 'Subiendo…' : d.foto_url ? 'Cambiar foto' : 'Subir foto'}
                    <input
                      type="file"
                      accept="image/*"
                      hidden
                      disabled={uploadingIdx === i}
                      onChange={e => {
                        const f = e.target.files?.[0]
                        if (f) void onPickFile(i, f)
                        e.target.value = ''
                      }}
                    />
                  </label>
                  {d.foto_url && (
                    <button className="btn btn-ghost btn-sm" onClick={() => update(i, { foto_url: null })}>Quitar</button>
                  )}
                </div>
                <div className="f-hint">Se muestra dentro del día en la página del vivencial.</div>
              </div>
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
