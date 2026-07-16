import { useMemo, useState } from 'react'
import AlumnoDetailDrawer from './components/AlumnoDetailDrawer'
import { formatDate } from './format'
import { useAdminStudents, type StudentRow } from '@/hooks/admin/useAdminStudents'

const fullName = (a: StudentRow) => [a.nombre, a.apellido].filter(Boolean).join(' ').trim() || '—'
const initials = (a: StudentRow) => {
  const base = [a.nombre, a.apellido].filter(Boolean).join(' ').trim()
  if (base) return base.split(' ').map(p => p[0]).slice(0, 2).join('').toUpperCase()
  return a.email.slice(0, 2).toUpperCase()
}

export default function Alumnos() {
  const { data: alumnos } = useAdminStudents()
  const [detail, setDetail] = useState<StudentRow | null>(null)
  const [search, setSearch] = useState('')
  const [showInactive, setShowInactive] = useState(false)

  const list = alumnos ?? []
  const bajaCount = useMemo(() => list.filter(a => !a.activo).length, [list])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return list.filter(a => {
      if (!showInactive && !a.activo) return false
      if (!q) return true
      return (
        (a.nombre ?? '').toLowerCase().includes(q) ||
        (a.apellido ?? '').toLowerCase().includes(q) ||
        a.email.toLowerCase().includes(q)
      )
    })
  }, [list, search, showInactive])

  return (
    <>
      <div className="page-head">
        <div>
          <div className="page-eyebrow">Contenido · Academy</div>
          <h1 className="page-title">Alumnos</h1>
          <p className="page-sub">Usuarios de la plataforma con sus cursos y vivenciales tomados. Los administradores no se listan acá.</p>
        </div>
      </div>

      <div className="toolbar">
        <div className="toolbar-search">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="7" /><path d="M21 21l-4.3-4.3" /></svg>
          <input type="text" placeholder="Buscar por nombre, apellido o email…" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        {bajaCount > 0 && (
          <span
            className={`chip${showInactive ? ' chip-active' : ''}`}
            style={{ cursor: 'pointer', marginLeft: 'auto' }}
            onClick={() => setShowInactive(v => !v)}
          >
            Mostrar dados de baja · {bajaCount}
          </span>
        )}
      </div>

      {filtered.length > 0 ? (
        <div className="card">
          <div style={{ overflowX: 'auto' }}>
            <table className="tbl">
              <thead><tr><th>Alumno</th><th>Ciudad / País</th><th>Registrado</th><th className="num">Cursos</th><th className="num">Vivenciales</th><th>Último ingreso</th></tr></thead>
              <tbody>
                {filtered.map(a => (
                  <tr key={a.id} style={{ cursor: 'pointer' }} onClick={() => setDetail(a)}>
                    <td>
                      <div className="row-flex">
                        <div className="tbl-avatar" style={a.avatar_url ? { backgroundImage: `url('${a.avatar_url}')`, backgroundSize: 'cover', backgroundPosition: 'center' } : undefined}>
                          {!a.avatar_url && initials(a)}
                        </div>
                        <div>
                          <div className="row-flex" style={{ gap: 8 }}>
                            <span style={{ fontWeight: 600, color: 'var(--ink)' }}>{fullName(a)}</span>
                            {!a.activo && <span className="badge badge-archived">Dado de baja</span>}
                          </div>
                          <div style={{ fontSize: 11.5, color: 'var(--ink-faint)' }}>{a.email}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ fontSize: 12, color: 'var(--ink-soft)' }}>{[a.ciudad, a.pais].filter(Boolean).join(', ') || '—'}</td>
                    <td style={{ fontSize: 12, color: 'var(--ink-soft)' }}>{formatDate(a.created_at)}</td>
                    <td className="num">{a.cursosCount}</td>
                    <td className="num">{a.vivencialesCount}</td>
                    <td style={{ fontSize: 12, color: 'var(--ink-soft)' }}>{a.ultimo_ingreso ? formatDate(a.ultimo_ingreso) : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="grid-empty show">
          <div className="empty-state">
            <div className="empty-state-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" /></svg></div>
            <h4>{list.length === 0 ? 'Todavía no hay alumnos' : 'Nada coincide con la búsqueda'}</h4>
            <p>{list.length === 0 ? 'Cuando se registren usuarios en la plataforma van a aparecer acá.' : 'Probá con otro nombre, apellido o email.'}</p>
          </div>
        </div>
      )}

      <AlumnoDetailDrawer alumno={detail} open={!!detail} onClose={() => setDetail(null)} />
    </>
  )
}
