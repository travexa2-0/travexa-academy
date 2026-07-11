import type { ModuleInput, LessonInput } from '@/hooks/admin/useAdminCourses'
import { secondsToDuration, durationToSeconds } from './wizardData'

interface Props {
  modules: ModuleInput[]
  onChange: (next: ModuleInput[]) => void
}

const Grip = () => (
  <svg className="grip" viewBox="0 0 24 24" fill="currentColor"><circle cx="8" cy="6" r="1.4" /><circle cx="8" cy="12" r="1.4" /><circle cx="8" cy="18" r="1.4" /><circle cx="16" cy="6" r="1.4" /><circle cx="16" cy="12" r="1.4" /><circle cx="16" cy="18" r="1.4" /></svg>
)
const TrashIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2m3 0l-1 14a2 2 0 01-2 2H7a2 2 0 01-2-2L4 6" /></svg>
)

const emptyLesson = (): LessonInput => ({ titulo: '', video_url: null, duracion_segundos: 0, es_preview: false, recursos: null })
const emptyModule = (): ModuleInput => ({ titulo: 'Nuevo módulo', descripcion: null, lessons: [emptyLesson()] })

export default function ModuleBuilder({ modules, onChange }: Props) {
  const updateModule = (mi: number, patch: Partial<ModuleInput>) =>
    onChange(modules.map((m, i) => (i === mi ? { ...m, ...patch } : m)))

  const updateLesson = (mi: number, li: number, patch: Partial<LessonInput>) =>
    onChange(modules.map((m, i) => i === mi ? { ...m, lessons: m.lessons.map((l, j) => (j === li ? { ...l, ...patch } : l)) } : m))

  const addModule = () => onChange([...modules, emptyModule()])
  const removeModule = (mi: number) => onChange(modules.filter((_, i) => i !== mi))
  const addLesson = (mi: number) => updateModule(mi, { lessons: [...modules[mi].lessons, emptyLesson()] })
  const removeLesson = (mi: number, li: number) => updateModule(mi, { lessons: modules[mi].lessons.filter((_, j) => j !== li) })

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
            <div style={{ padding: '0 14px 10px', display: 'flex' }}>
              <textarea
                className="textarea"
                value={mod.descripcion ?? ''}
                placeholder="Descripción del módulo (opcional) — qué se ve en este tramo"
                onChange={e => updateModule(mi, { descripcion: e.target.value || null })}
                style={{ minHeight: 44, fontSize: 12.6 }}
              />
            </div>
            {mod.lessons.map((les, li) => (
              <div className="lesson-row" key={li}>
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
            ))}
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
