import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import InstructorFormDrawer from './components/InstructorFormDrawer'
import InstructorDetailDrawer from './components/InstructorDetailDrawer'
import ListErrorState from './components/ListErrorState'
import { useInstructorsFull } from '@/hooks/admin/useAdminInstructorsFull'
import type { Instructor } from '@/types'

type Status = 'todos' | 'activo' | 'inactivo'

export default function Instructores() {
  const { data: instructores, error, refetch } = useInstructorsFull()
  const [searchParams, setSearchParams] = useSearchParams()

  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Instructor | null>(null)
  const [detail, setDetail] = useState<Instructor | null>(null)

  const [search, setSearch] = useState('')
  const [status, setStatus] = useState<Status>('todos')

  useEffect(() => {
    if (searchParams.get('nuevo') === '1') {
      setEditing(null)
      setFormOpen(true)
      searchParams.delete('nuevo')
      setSearchParams(searchParams, { replace: true })
    }
  }, [searchParams, setSearchParams])

  const list = instructores ?? []

  const counts = useMemo(() => ({
    todos: list.length,
    activo: list.filter(i => i.activo).length,
    inactivo: list.filter(i => !i.activo).length,
  }), [list])

  const filtered = useMemo(() => list.filter(i => {
    if (status === 'activo' && !i.activo) return false
    if (status === 'inactivo' && i.activo) return false
    if (search && !i.nombre.toLowerCase().includes(search.toLowerCase()) && !(i.especialidad ?? '').toLowerCase().includes(search.toLowerCase())) return false
    return true
  }), [list, status, search])

  const openNew = () => { setEditing(null); setFormOpen(true) }
  const openEdit = (i: Instructor) => { setDetail(null); setEditing(i); setFormOpen(true) }

  const initials = (nombre: string) => nombre.split(' ').map(p => p[0]).slice(0, 2).join('').toUpperCase()

  return (
    <>
      <div className="page-head">
        <div>
          <div className="page-eyebrow">Contenido · Academy</div>
          <h1 className="page-title">Instructores</h1>
          <p className="page-sub">Quiénes dictan los cursos y vivenciales. Pueden tener cuenta en la plataforma o ser aliados externos.</p>
        </div>
        <button className="btn btn-primary" onClick={openNew}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M12 5v14M5 12h14" /></svg>
          Nuevo instructor
        </button>
      </div>

      <div className="toolbar">
        <div className="toolbar-search">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="7" /><path d="M21 21l-4.3-4.3" /></svg>
          <input type="text" placeholder="Buscar por nombre o especialidad…" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        {(['todos', 'activo', 'inactivo'] as Status[]).map(s => (
          <span key={s} className={`chip${status === s ? ' chip-active' : ''}`} style={{ cursor: 'pointer' }} onClick={() => setStatus(s)}>
            {s === 'todos' ? 'Todos' : s === 'activo' ? 'Activos' : 'Inactivos'} · {counts[s]}
          </span>
        ))}
      </div>

      {error ? (
        <ListErrorState error={error} onRetry={() => refetch()} />
      ) : filtered.length > 0 ? (
        <div className="card">
          <div style={{ overflowX: 'auto' }}>
            <table className="tbl">
              <thead><tr><th>Instructor</th><th>Contacto</th><th>Rev. share</th><th>Cursos</th><th>Estado</th></tr></thead>
              <tbody>
                {filtered.map(i => (
                  <tr key={i.id} style={{ cursor: 'pointer' }} onClick={() => setDetail(i)}>
                    <td>
                      <div className="row-flex">
                        <div className="tbl-avatar" style={i.avatar_url ? { backgroundImage: `url('${i.avatar_url}')`, backgroundSize: 'cover', backgroundPosition: 'center' } : undefined}>
                          {!i.avatar_url && initials(i.nombre)}
                        </div>
                        <div>
                          <div style={{ fontWeight: 600, color: 'var(--ink)' }}>{i.nombre}</div>
                          <div style={{ fontSize: 11.5, color: 'var(--ink-faint)' }}>{i.especialidad ?? '—'}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ fontSize: 12, color: 'var(--ink-soft)' }}>
                      <div>{i.email ?? '—'}</div>
                      <div style={{ color: 'var(--ink-faint)' }}>{i.telefono ?? ''}</div>
                    </td>
                    <td className="num">{i.revenue_share_pct}%</td>
                    <td className="num">{i.cursosPublicados}<span style={{ color: 'var(--ink-faint)' }}> / {i.cursosTotales}</span></td>
                    <td>{i.activo ? <span className="badge badge-published">Activo</span> : <span className="badge badge-archived">Inactivo</span>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="grid-empty">
          <div className="empty-state">
            <div className="empty-state-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" /></svg></div>
            <h4>{list.length === 0 ? 'Todavía no cargaste instructores' : 'Nada coincide con estos filtros'}</h4>
            <p>{list.length === 0 ? 'Creá el primero para asignarlo a tus cursos.' : 'Probá con otro nombre o cambiá el filtro.'}</p>
            {list.length === 0 && <button className="btn btn-primary btn-sm" onClick={openNew}>Nuevo instructor</button>}
          </div>
        </div>
      )}

      <InstructorDetailDrawer instructor={detail} open={!!detail} onClose={() => setDetail(null)} onEdit={openEdit} />
      <InstructorFormDrawer open={formOpen} onClose={() => setFormOpen(false)} initial={editing} />
    </>
  )
}
