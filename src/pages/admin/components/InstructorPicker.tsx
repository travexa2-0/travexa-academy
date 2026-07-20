import { useMemo } from 'react'
import { avatarGradient, initialsFrom } from '@/lib/avatar'
import type { Instructor } from '@/types'

function InstructorAvatar({ ins }: { ins: Instructor }) {
  if (ins.avatar_url) return <span className="ins-avatar" style={{ backgroundImage: `url('${ins.avatar_url}')` }} />
  return <span className="ins-avatar" style={{ background: avatarGradient(ins.id) }}>{initialsFrom(ins.nombre, null, ins.nombre)}</span>
}

// Selector múltiple de instructores. El orden de los chips es el orden en que se van
// a mostrar en la página pública (se puede reordenar con las flechas). Los instructores
// inactivos que ya estaban asignados se muestran igual, con badge, para que se decida
// si se sacan — nunca se borran solos del array.
// Compartido entre VivencialWizard (vivencial_instructor_ids) y CourseWizard (instructor_ids).
export default function InstructorPicker({
  all, selectedIds, onChange,
}: { all: Instructor[]; selectedIds: string[]; onChange: (ids: string[]) => void }) {
  const byId = useMemo(() => new Map(all.map(i => [i.id, i])), [all])
  // Chips: respetan el orden guardado; se descartan ids que ya no existen en la base.
  const selected = selectedIds.map(id => byId.get(id)).filter((i): i is Instructor => !!i)
  // Para agregar: solo activos que no estén ya elegidos.
  const available = all.filter(i => i.activo && !selectedIds.includes(i.id))
  const activeCount = all.filter(i => i.activo).length

  const add = (id: string) => { if (id && !selectedIds.includes(id)) onChange([...selectedIds, id]) }
  const remove = (id: string) => onChange(selectedIds.filter(x => x !== id))
  const move = (idx: number, dir: -1 | 1) => {
    const j = idx + dir
    if (j < 0 || j >= selectedIds.length) return
    const next = selectedIds.slice()
    ;[next[idx], next[j]] = [next[j], next[idx]]
    onChange(next)
  }

  // Sin instructores activos en la base y sin ninguno ya asignado: estado vacío con CTA.
  if (activeCount === 0 && selected.length === 0) {
    return (
      <div className="empty-state" style={{ padding: '32px 24px' }}>
        <div className="empty-state-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" /></svg></div>
        <h4>Todavía no hay instructores</h4>
        <p>Cargá instructores desde el menú <b>Instructores</b> del backoffice para poder asignarlos.</p>
        <a className="btn btn-secondary" href="/admin/instructores">Ir a Instructores</a>
      </div>
    )
  }

  return (
    <div>
      {selected.length > 0 && (
        <div className="ins-chip-list">
          {selected.map((ins, idx) => (
            <div className={`ins-chip${ins.activo ? '' : ' inactive'}`} key={ins.id}>
              <InstructorAvatar ins={ins} />
              <div className="ins-chip-info">
                <div className="ins-chip-name">{ins.nombre}{!ins.activo && <span className="ins-badge">inactivo</span>}</div>
                {ins.especialidad && <div className="ins-chip-spec">{ins.especialidad}</div>}
              </div>
              <div className="ins-chip-actions">
                <button type="button" title="Subir" disabled={idx === 0} onClick={() => move(idx, -1)}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4"><path d="M18 15l-6-6-6 6" /></svg>
                </button>
                <button type="button" title="Bajar" disabled={idx === selected.length - 1} onClick={() => move(idx, 1)}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4"><path d="M6 9l6 6 6-6" /></svg>
                </button>
                <button type="button" className="ins-chip-remove" title="Quitar" onClick={() => remove(ins.id)}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4"><path d="M18 6L6 18M6 6l12 12" /></svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
      {available.length > 0 ? (
        <select className="select" value="" style={{ marginTop: selected.length ? 10 : 0 }} onChange={e => { add(e.target.value); e.target.value = '' }}>
          <option value="">+ Agregar instructor…</option>
          {available.map(i => <option key={i.id} value={i.id}>{i.nombre}{i.especialidad ? ` — ${i.especialidad}` : ''}</option>)}
        </select>
      ) : (
        <div className="f-hint" style={{ marginTop: selected.length ? 10 : 0 }}>No quedan más instructores activos para agregar.</div>
      )}
    </div>
  )
}
