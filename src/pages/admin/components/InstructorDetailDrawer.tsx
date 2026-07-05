import { useState } from 'react'
import toast from 'react-hot-toast'
import Overlay from './Overlay'
import { formatArs } from '../format'
import { useInstructorCourses, useToggleInstructorActive, useDeleteInstructor } from '@/hooks/admin/useAdminInstructorsFull'
import { useAdminMetrics } from '@/hooks/admin/useAdminMetrics'
import { useAdminSettings } from '@/hooks/admin/useAdminSettings'
import type { Instructor } from '@/types'

interface Props {
  instructor: Instructor | null
  open: boolean
  onClose: () => void
  onEdit: (i: Instructor) => void
}

function courseStatusBadge(c: { publicado: boolean; archivado: boolean }) {
  if (c.archivado) return <span className="badge badge-archived">Archivado</span>
  if (c.publicado) return <span className="badge badge-published">Publicado</span>
  return <span className="badge badge-draft">Borrador</span>
}

export default function InstructorDetailDrawer({ instructor, open, onClose, onEdit }: Props) {
  const [confirmDelete, setConfirmDelete] = useState(false)
  const { data: courses } = useInstructorCourses(open && instructor ? instructor.id : undefined)
  const { data: settings } = useAdminSettings()
  const { data: metrics } = useAdminMetrics(settings?.comision_mp_pct ?? 5.5)
  const toggleActive = useToggleInstructorActive()
  const del = useDeleteInstructor()

  if (!instructor) return null
  const i = instructor
  const list = courses ?? []
  const publicados = list.filter(c => c.publicado && !c.archivado).length
  const totalAlumnos = list.reduce((n, c) => n + c.total_alumnos, 0)
  const rev = (metrics?.instructors ?? []).find(r => r.instructorId === i.id)
  const redes = i.redes ?? {}
  const redesEntries = Object.entries(redes).filter(([, v]) => !!v)

  const doToggle = async () => {
    try { await toggleActive.mutateAsync({ id: i.id, activo: !i.activo }); toast.success(i.activo ? 'Instructor desactivado' : 'Instructor activado') }
    catch (e) { toast.error((e as Error).message) }
  }
  const doDelete = async () => {
    try { await del.mutateAsync(i.id); toast.success('Instructor eliminado'); onClose() }
    catch (e) { toast.error((e as Error).message) }
    finally { setConfirmDelete(false) }
  }

  return (
    <Overlay open={open} onClose={onClose} alignRight>
      <div className="slideover">
        <div className="slideover-hero" style={{ backgroundImage: i.avatar_url ? `url('${i.avatar_url}')` : 'linear-gradient(135deg,#0A1E29,#16323F)', backgroundSize: 'cover', backgroundPosition: 'center' }}>
          <div className="slideover-hero-top">
            <button className="modal-close" style={{ background: 'rgba(10,30,41,0.4)', color: '#fff' }} onClick={onClose}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12" /></svg>
            </button>
            <span className="badge" style={{ background: 'rgba(255,255,255,0.15)', color: '#fff' }}>{i.activo ? 'Activo' : 'Inactivo'}</span>
          </div>
          <div className="slideover-hero-bottom">
            <div className="cat">{i.especialidad ?? 'Instructor'}</div>
            <h2>{i.nombre}</h2>
          </div>
        </div>

        <div className="slideover-body">
          <div className="so-panel active">
            <div className="stat-mini-grid">
              <div className="stat-mini"><div className="v">{publicados}</div><div className="l">cursos publicados</div></div>
              <div className="stat-mini"><div className="v">{totalAlumnos}</div><div className="l">alumnos</div></div>
              <div className="stat-mini"><div className="v">{i.revenue_share_pct}%</div><div className="l">revenue share</div></div>
            </div>
            {i.bio && <p style={{ fontSize: 13, color: 'var(--ink-soft)', lineHeight: 1.65, marginBottom: 20 }}>{i.bio}</p>}

            <div className="card" style={{ marginBottom: 16 }}>
              <div className="card-head"><h3 style={{ fontSize: 13 }}>Contacto</h3></div>
              <div className="card-pad" style={{ padding: '14px 20px', fontSize: 12.6, color: 'var(--ink-soft)', display: 'grid', gap: 6 }}>
                <div>Email: <b>{i.email ?? '—'}</b></div>
                <div>Teléfono: <b>{i.telefono ?? '—'}</b></div>
                <div>Cuenta vinculada: <b>{i.user_id ? 'Sí' : 'No (externo)'}</b></div>
                {redesEntries.length > 0 && <div>Redes: {redesEntries.map(([k, v]) => {
                  const val = v ?? ''
                  const href = k === 'whatsapp' && !/^https?:/i.test(val) ? `https://wa.me/${val.replace(/[^\d]/g, '')}` : val
                  return <a key={k} href={href} target="_blank" rel="noreferrer" style={{ color: 'var(--teal-deep)', fontWeight: 600, marginRight: 8 }}>{k}</a>
                })}</div>}
              </div>
            </div>

            <div className="card" style={{ marginBottom: 16 }}>
              <div className="card-head"><h3 style={{ fontSize: 13 }}>Ingresos generados</h3></div>
              <div className="card-pad" style={{ padding: '14px 20px' }}>
                {rev ? (
                  <div className="stat-mini-grid" style={{ marginBottom: 0 }}>
                    <div className="stat-mini"><div className="v">{formatArs(rev.brutoArs)}</div><div className="l">bruto ({rev.ventas} ventas)</div></div>
                    <div className="stat-mini"><div className="v">{formatArs(rev.shareArs)}</div><div className="l">le corresponde ({rev.revenueSharePct}%)</div></div>
                  </div>
                ) : (
                  <div style={{ fontSize: 12.6, color: 'var(--ink-faint)' }}>Sin ventas registradas con sus cursos todavía.</div>
                )}
              </div>
            </div>

            <div className="card" style={{ marginBottom: 16 }}>
              <div className="card-head"><h3 style={{ fontSize: 13 }}>Cursos</h3></div>
              <div className="card-pad" style={{ padding: '10px 14px' }}>
                {list.length === 0
                  ? <div style={{ fontSize: 12.6, color: 'var(--ink-faint)', padding: '6px 4px' }}>Todavía no tiene cursos vinculados.</div>
                  : list.map(c => (
                      <div key={c.id} className="row-flex" style={{ padding: '9px 4px', borderBottom: '1px solid var(--line)' }}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 12.8, color: 'var(--ink)' }}>{c.titulo}</div>
                          <div style={{ fontSize: 11, color: 'var(--ink-faint)' }}>{c.tipo === 'vivencial' ? 'Vivencial' : c.tipo === 'en_vivo' ? 'En vivo' : 'Grabado'} · {c.total_alumnos} alumnos</div>
                        </div>
                        {courseStatusBadge(c)}
                      </div>
                    ))}
              </div>
            </div>

            <div className="card">
              <div className="card-head"><h3 style={{ fontSize: 13 }}>Administrar</h3></div>
              <div className="card-pad" style={{ display: 'flex', flexDirection: 'column', gap: 9, padding: '14px 18px' }}>
                <button className="btn btn-secondary btn-sm" style={{ justifyContent: 'flex-start' }} onClick={() => onEdit(i)}>
                  <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 20h9M16.5 3.5a2.1 2.1 0 013 3L7 19l-4 1 1-4z" /></svg>Editar
                </button>
                <button className="btn btn-secondary btn-sm" style={{ justifyContent: 'flex-start' }} onClick={doToggle}>{i.activo ? 'Desactivar' : 'Activar'}</button>
                {list.length === 0 ? (
                  !confirmDelete
                    ? <button className="btn btn-danger btn-sm" style={{ justifyContent: 'flex-start' }} onClick={() => setConfirmDelete(true)}>Eliminar definitivamente</button>
                    : <div style={{ background: 'var(--clay-soft)', borderRadius: 10, padding: '10px 12px' }}>
                        <div style={{ fontSize: 12.4, color: 'var(--clay-deep)', marginBottom: 8 }}>¿Seguro? Solo se puede porque no tiene cursos. Esta acción no se puede deshacer.</div>
                        <div style={{ display: 'flex', gap: 8 }}>
                          <button className="btn btn-danger btn-sm" onClick={doDelete} disabled={del.isPending}>Sí, eliminar</button>
                          <button className="btn btn-secondary btn-sm" onClick={() => setConfirmDelete(false)}>Cancelar</button>
                        </div>
                      </div>
                ) : (
                  <div style={{ fontSize: 11.5, color: 'var(--ink-faint)' }}>Tiene cursos vinculados: no se puede eliminar, solo desactivar.</div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Overlay>
  )
}
