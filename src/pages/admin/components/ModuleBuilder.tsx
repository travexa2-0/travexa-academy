import { useState } from 'react'
import toast from 'react-hot-toast'
import type { ModuleInput, LessonInput } from '@/hooks/admin/useAdminCourses'
import { secondsToDuration, durationToSeconds } from './wizardData'
import ExpandableTextArea from './ExpandableTextArea'

interface Props {
  modules: ModuleInput[]
  onChange: (next: ModuleInput[]) => void
  // Default para lecciones nuevas: un curso "En vivo" arranca sus clases como en vivo.
  // Cada lección puede igual alternarse entre grabada / en vivo, sea cual sea el tipo de curso.
  isLive: boolean
  // Sube la portada de la lección al bucket y devuelve la URL pública.
  onUploadThumb: (file: File) => Promise<string>
}

const Grip = () => (
  <svg className="grip" viewBox="0 0 24 24" fill="currentColor"><circle cx="8" cy="6" r="1.4" /><circle cx="8" cy="12" r="1.4" /><circle cx="8" cy="18" r="1.4" /><circle cx="16" cy="6" r="1.4" /><circle cx="16" cy="12" r="1.4" /><circle cx="16" cy="18" r="1.4" /></svg>
)
const TrashIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2m3 0l-1 14a2 2 0 01-2 2H7a2 2 0 01-2-2L4 6" /></svg>
)

// Una lección se considera "en vivo" si tiene fecha o link de vivo cargados.
// El marcador vacío ('' en live_url) permite marcarla en vivo antes de cargar la fecha.
const lessonIsLive = (l: LessonInput): boolean => l.fecha_vivo != null || l.live_url != null

const emptyLesson = (live = false): LessonInput => ({ titulo: '', descripcion: null, video_url: null, duracion_segundos: 0, es_preview: false, recursos: null, live_url: live ? '' : null, fecha_vivo: null, thumbnail_url: null })
const emptyModule = (live = false): ModuleInput => ({ titulo: 'Nuevo módulo', descripcion: null, lessons: [emptyLesson(live)] })

// ISO ↔ input datetime-local (hora local del admin).
function toLocalInput(iso: string | null): string {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}
function fromLocalInput(v: string): string | null {
  if (!v) return null
  const d = new Date(v)
  return Number.isNaN(d.getTime()) ? null : d.toISOString()
}

export default function ModuleBuilder({ modules, onChange, isLive, onUploadThumb }: Props) {
  const [uploadingKey, setUploadingKey] = useState<string | null>(null)

  const updateModule = (mi: number, patch: Partial<ModuleInput>) =>
    onChange(modules.map((m, i) => (i === mi ? { ...m, ...patch } : m)))

  const updateLesson = (mi: number, li: number, patch: Partial<LessonInput>) =>
    onChange(modules.map((m, i) => i === mi ? { ...m, lessons: m.lessons.map((l, j) => (j === li ? { ...l, ...patch } : l)) } : m))

  const addModule = () => onChange([...modules, emptyModule(isLive)])
  const removeModule = (mi: number) => onChange(modules.filter((_, i) => i !== mi))
  const addLesson = (mi: number) => updateModule(mi, { lessons: [...modules[mi].lessons, emptyLesson(isLive)] })
  const removeLesson = (mi: number, li: number) => updateModule(mi, { lessons: modules[mi].lessons.filter((_, j) => j !== li) })

  // Alterna una lección entre grabada y en vivo, moviendo los datos correspondientes.
  const setLessonLive = (mi: number, li: number, live: boolean) => {
    const l = modules[mi].lessons[li]
    if (live) updateLesson(mi, li, { video_url: null, live_url: l.live_url ?? '' })
    else updateLesson(mi, li, { live_url: null, fecha_vivo: null })
  }

  const handleThumb = async (mi: number, li: number, file: File) => {
    const key = `${mi}-${li}`
    setUploadingKey(key)
    try {
      const url = await onUploadThumb(file)
      updateLesson(mi, li, { thumbnail_url: url })
      toast.success('Portada subida')
    } catch (e) { toast.error((e as Error).message) }
    finally { setUploadingKey(null) }
  }

  return (
    <div>
      <div id="module-builder">
        {modules.map((mod, mi) => (
          <div className="module-block" key={mi}>
            <div className="module-head">
              <Grip />
              <input value={mod.titulo} placeholder="Nombre del módulo" style={{ fontFamily: 'var(--font-display)', fontWeight: 700 }} onChange={e => updateModule(mi, { titulo: e.target.value })} />
              <span className="module-count">{mod.lessons.length} {mod.lessons.length === 1 ? 'lección' : 'lecciones'}</span>
              <button className="module-del-btn" title="Borrar módulo" onClick={() => removeModule(mi)}><TrashIcon /></button>
            </div>
            <div style={{ padding: '0 14px 10px' }}>
              <ExpandableTextArea
                value={mod.descripcion ?? ''}
                onChange={v => updateModule(mi, { descripcion: v || null })}
                placeholder="Descripción del módulo (opcional) — qué se ve en este tramo"
                minHeight={44}
                fontSize={12.6}
                label="Descripción del módulo"
              />
            </div>
            {mod.lessons.map((les, li) => {
              const key = `${mi}-${li}`
              const live = lessonIsLive(les)
              return (
                <div className="lesson-item" key={li} style={{ padding: '2px 14px 12px' }}>
                  <div className="lesson-row" style={{ padding: 0 }}>
                    <Grip />
                    <input className="les-title" value={les.titulo} placeholder="Título de la lección" onChange={e => updateLesson(mi, li, { titulo: e.target.value })} />
                    <span
                      className={`chip${les.es_preview ? ' chip-active' : ''}`}
                      style={{ fontSize: 10.4, padding: '3px 8px', flexShrink: 0, cursor: 'pointer' }}
                      onClick={() => updateLesson(mi, li, { es_preview: !les.es_preview })}
                      title="Marcar como preview gratis"
                    >Preview</span>
                    <input className="les-dur" value={secondsToDuration(les.duracion_segundos)} placeholder="0:00"
                      onChange={e => updateLesson(mi, li, { duracion_segundos: durationToSeconds(e.target.value) })} />
                    <div className="lesson-actions">
                      <button className="lesson-del-btn" title="Borrar lección" onClick={() => removeLesson(mi, li)}><TrashIcon /></button>
                    </div>
                  </div>

                  {/* Detalle de la lección: modalidad (grabada/vivo) + video o vivo + descripción + portada */}
                  <div style={{ display: 'grid', gap: 8, marginTop: 8, paddingLeft: 26 }}>
                    {/* Modalidad por lección — una clase grabada puede convivir con una en vivo en el mismo curso */}
                    <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                      <span className="f-hint" style={{ margin: 0, marginRight: 2 }}>Modalidad:</span>
                      <span
                        className={`chip${!live ? ' chip-active' : ''}`}
                        style={{ fontSize: 10.4, padding: '3px 10px', cursor: 'pointer' }}
                        onClick={() => setLessonLive(mi, li, false)}
                      >Grabada</span>
                      <span
                        className={`chip${live ? ' chip-active' : ''}`}
                        style={{ fontSize: 10.4, padding: '3px 10px', cursor: 'pointer' }}
                        onClick={() => setLessonLive(mi, li, true)}
                      >En vivo</span>
                    </div>

                    {live ? (
                      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 8 }}>
                        <input
                          className="input" type="text"
                          placeholder="Link del vivo (YouTube no listado) — opcional, se puede cargar después"
                          value={les.live_url ?? ''}
                          onChange={e => updateLesson(mi, li, { live_url: e.target.value })}
                        />
                        <input
                          className="input" type="datetime-local"
                          value={toLocalInput(les.fecha_vivo)}
                          onChange={e => updateLesson(mi, li, { fecha_vivo: fromLocalInput(e.target.value) })}
                        />
                      </div>
                    ) : (
                      <input
                        className="input" type="text"
                        placeholder="URL del video (YouTube no listado)"
                        value={les.video_url ?? ''}
                        onChange={e => updateLesson(mi, li, { video_url: e.target.value || null })}
                      />
                    )}

                    {/* Detalle de la clase: Objetivo / Contenidos / Caso práctico / Te llevás (texto libre) */}
                    <ExpandableTextArea
                      value={les.descripcion ?? ''}
                      onChange={v => updateLesson(mi, li, { descripcion: v || null })}
                      placeholder={'Detalle de la clase (opcional):\nObjetivo · Contenidos · Caso práctico · Qué te llevás'}
                      minHeight={44}
                      fontSize={12.6}
                      label="Detalle de la clase"
                    />

                    {/* Portada de la lección (opcional; cae al thumbnail del curso). */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      {les.thumbnail_url && (
                        <div style={{ width: 64, height: 36, borderRadius: 6, backgroundImage: `url('${les.thumbnail_url}')`, backgroundSize: 'cover', backgroundPosition: 'center', flexShrink: 0 }} />
                      )}
                      <label className="btn btn-ghost btn-sm" style={{ cursor: 'pointer', color: 'var(--teal-deep)' }}>
                        {uploadingKey === key ? 'Subiendo…' : les.thumbnail_url ? 'Cambiar portada' : '+ Portada de la lección'}
                        <input type="file" accept="image/*" hidden disabled={uploadingKey === key}
                          onChange={e => { const f = e.target.files?.[0]; if (f) void handleThumb(mi, li, f); e.target.value = '' }} />
                      </label>
                      {les.thumbnail_url && (
                        <button className="btn btn-ghost btn-sm" style={{ color: 'var(--text-3)' }} onClick={() => updateLesson(mi, li, { thumbnail_url: null })}>Quitar</button>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
            <div className="lesson-add-row">
              <button className="btn btn-ghost btn-sm" onClick={() => addLesson(mi)} style={{ color: 'var(--teal-deep)' }}>+ Agregar lección</button>
            </div>
          </div>
        ))}
      </div>
      <button className="add-module-btn" onClick={addModule}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12h14" /></svg>
        Agregar módulo
      </button>
    </div>
  )
}
