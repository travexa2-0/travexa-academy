import { useState } from 'react'
import toast from 'react-hot-toast'
import type { VivencialHotel } from '@/types'
import { uploadMedia } from '@/hooks/admin/useAdminCourses'

interface Props {
  hoteles: VivencialHotel[]
  onChange: (next: VivencialHotel[]) => void
  courseKey: string   // slug o clave para la ruta del bucket academy-media
}

// Repeatable list of hotels: { nombre, noches, link, foto_url }.
// Photos upload to the existing academy-media bucket (never a new one).
// `id` es client-side (key estable + no persiste). Cada fila tiene su propio
// input de archivo (sin ref compartido ni dataset.idx).
export default function HotelesBuilder({ hoteles, onChange, courseKey }: Props) {
  const [uploadingIdx, setUploadingIdx] = useState<number | null>(null)

  const update = (i: number, patch: Partial<VivencialHotel>) =>
    onChange(hoteles.map((h, j) => (j === i ? { ...h, ...patch } : h)))
  const add = () => onChange([...hoteles, { nombre: '', noches: 1, link: '', foto_url: null, id: crypto.randomUUID() }])
  const remove = (i: number) => onChange(hoteles.filter((_, j) => j !== i))

  const onPickFile = async (i: number, file: File) => {
    setUploadingIdx(i)
    try {
      const url = await uploadMedia(courseKey || 'hotel', file, 'gallery')
      update(i, { foto_url: url })
      toast.success('Foto del hotel subida')
    } catch (e) { toast.error((e as Error).message) }
    finally { setUploadingIdx(null) }
  }

  return (
    <div>
      {hoteles.map((h, i) => (
        <div className="repeat-row" key={h.id ?? i}>
          <div className="repeat-row-body">
            <div className="field-row cols-2" style={{ marginBottom: 10 }}>
              <div className="field" style={{ marginBottom: 0 }}>
                <label className="f-label">Nombre del hotel</label>
                <input className="input" type="text" placeholder="Ej: Palacio del Inka" value={h.nombre} onChange={e => update(i, { nombre: e.target.value })} />
              </div>
              <div className="field" style={{ marginBottom: 0 }}>
                <label className="f-label">Noches</label>
                <input className="input" type="number" min={0} value={h.noches} onChange={e => update(i, { noches: Number(e.target.value) || 0 })} />
              </div>
            </div>
            <div className="field" style={{ marginBottom: 10 }}>
              <label className="f-label">Link del hotel <span className="opt">(opcional)</span></label>
              <input className="input" type="text" placeholder="https://…" value={h.link} onChange={e => update(i, { link: e.target.value })} />
            </div>
            <div className="field" style={{ marginBottom: 0 }}>
              <label className="f-label">Foto <span className="opt">(opcional)</span></label>
              <div className="hotel-photo-row">
                {h.foto_url
                  ? <img src={h.foto_url} alt={h.nombre} className="hotel-photo-thumb" />
                  : <div className="hotel-photo-thumb hotel-photo-empty">Sin foto</div>}
                {/* Input de archivo propio de esta fila: sin ref compartido ni dataset.idx. */}
                <label className="btn btn-secondary btn-sm" style={{ cursor: uploadingIdx === i ? 'default' : 'pointer' }}>
                  {uploadingIdx === i ? 'Subiendo…' : h.foto_url ? 'Cambiar foto' : 'Subir foto'}
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
                {h.foto_url && (
                  <button className="btn btn-ghost btn-sm" onClick={() => update(i, { foto_url: null })}>Quitar</button>
                )}
              </div>
            </div>
          </div>
          <button className="itin-day-remove" onClick={() => remove(i)} title="Quitar hotel">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2m3 0l-1 14a2 2 0 01-2 2H7a2 2 0 01-2-2L4 6" /></svg>
          </button>
        </div>
      ))}
      <button className="add-module-btn" onClick={add}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12h14" /></svg>
        Agregar hotel
      </button>
    </div>
  )
}
