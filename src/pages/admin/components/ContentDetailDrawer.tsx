import { useState } from 'react'
import toast from 'react-hot-toast'
import Overlay from './Overlay'
import ManualEnrollmentForm from './ManualEnrollmentForm'
import VivencialInscriptoRow from './VivencialInscriptoRow'
import { formatArs, formatDate } from '../format'
import { secondsToDuration } from './wizardData'
import { useAdminCourse, useTogglePublish, useArchiveCourse, useHardDeleteCourse } from '@/hooks/admin/useAdminCourses'
import { useCourseEnrollments } from '@/hooks/admin/useAdminEnrollments'
import type { Course, ItinerarioDia } from '@/types'

interface Props {
  course: Course | null
  open: boolean
  onClose: () => void
  onEdit: (course: Course) => void
}

type Tab = 'info' | 'curriculum' | 'alumnos'

export default function ContentDetailDrawer({ course, open, onClose, onEdit }: Props) {
  const [tab, setTab] = useState<Tab>('info')
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [showManual, setShowManual] = useState(false)
  const { data: full } = useAdminCourse(open && course ? course.id : undefined)
  const { data: enrollments } = useCourseEnrollments(open && course ? course.id : undefined)
  const togglePublish = useTogglePublish()
  const archive = useArchiveCourse()
  const hardDelete = useHardDeleteCourse()

  if (!course) return null
  const c = full ?? course
  const isViv = c.tipo === 'vivencial'
  const itinerario = (c.vivencial_itinerario ?? []) as ItinerarioDia[]

  const doPublish = async (publicado: boolean) => {
    try { await togglePublish.mutateAsync({ id: c.id, publicado }); toast.success(publicado ? 'Publicado' : 'Despublicado') }
    catch (e) { toast.error((e as Error).message) }
  }
  const doArchive = async (archivado: boolean) => {
    try { await archive.mutateAsync({ id: c.id, archivado }); toast.success(archivado ? 'Archivado' : 'Restaurado') }
    catch (e) { toast.error((e as Error).message) }
  }
  const doDelete = async () => {
    try { await hardDelete.mutateAsync(c.id); toast.success('Eliminado definitivamente'); onClose() }
    catch (e) { toast.error((e as Error).message) }
    finally { setConfirmDelete(false) }
  }
  const openPreview = () => window.open(`/cursos/${c.slug}?preview=1`, '_blank')

  const statusLabel = c.archivado ? 'Archivado' : c.publicado ? 'Publicado' : 'Borrador'

  return (
    <Overlay open={open} onClose={onClose} alignRight>
      <div className="slideover">
        <div className="slideover-hero" style={{ backgroundImage: c.thumbnail_url ? `url('${c.thumbnail_url}')` : 'linear-gradient(135deg,#0A1E29,#16323F)', backgroundSize: 'cover', backgroundPosition: 'center' }}>
          <div className="slideover-hero-top">
            <button className="modal-close" style={{ background: 'rgba(10,30,41,0.4)', color: '#fff' }} onClick={onClose}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12" /></svg>
            </button>
            <span className="badge" style={{ background: 'rgba(255,255,255,0.15)', color: '#fff' }}>{statusLabel}</span>
          </div>
          <div className="slideover-hero-bottom">
            <div className="cat">{c.category?.nombre ?? '—'}</div>
            <h2>{c.titulo}</h2>
          </div>
        </div>

        <div className="slideover-tabs">
          <button className={`so-tab${tab === 'info' ? ' active' : ''}`} onClick={() => setTab('info')}>Info general</button>
          <button className={`so-tab${tab === 'curriculum' ? ' active' : ''}`} onClick={() => setTab('curriculum')}>{isViv ? 'Itinerario' : 'Currículum'}</button>
          <button className={`so-tab${tab === 'alumnos' ? ' active' : ''}`} onClick={() => setTab('alumnos')}>Inscriptos {enrollments ? `· ${enrollments.length}` : ''}</button>
        </div>

        <div className="slideover-body">
          {tab === 'info' && (
            <div className="so-panel active">
              <div className="stat-mini-grid">
                <div className="stat-mini"><div className="v">{c.tipo_acceso === 'gratuito' ? 'Gratis' : formatArs(c.precio_ars)}</div><div className="l">{c.tipo_acceso === 'gratuito' ? 'Acceso libre' : `US$ ${c.precio_usd ?? 0}`}</div></div>
                <div className="stat-mini"><div className="v">{isViv ? (c.vivencial_cupo_disponible ?? '—') : (c.total_lecciones || 0)}</div><div className="l">{isViv ? 'lugares libres' : 'lecciones'}</div></div>
                <div className="stat-mini"><div className="v">{c.total_alumnos || (enrollments?.length ?? 0)}</div><div className="l">inscriptos</div></div>
              </div>
              {c.descripcion && <p style={{ fontSize: 13, color: 'var(--ink-soft)', lineHeight: 1.65, marginBottom: 20 }}>{c.descripcion}</p>}

              {isViv && (
                <div className="card" style={{ marginBottom: 16 }}>
                  <div className="card-head"><h3 style={{ fontSize: 13 }}>Datos del vivencial</h3></div>
                  <div className="card-pad" style={{ padding: '14px 20px', fontSize: 12.6, color: 'var(--ink-soft)', display: 'grid', gap: 6 }}>
                    <div>Salida: <b>{formatDate(c.vivencial_fecha_salida)}</b> · Regreso: <b>{formatDate(c.vivencial_fecha_regreso)}</b></div>
                    <div>Desde: <b>{c.vivencial_ciudad_salida ?? '—'}</b> · Hotel: <b>{c.vivencial_hotel ?? '—'}</b></div>
                    <div>Cupo: <b>{c.vivencial_cupo_disponible ?? '—'}/{c.vivencial_cupo_maximo ?? '—'}</b> · Seña: <b>{formatArs(c.vivencial_precio_seña_ars)}</b></div>
                  </div>
                </div>
              )}

              <div className="card">
                <div className="card-head"><h3 style={{ fontSize: 13 }}>Administrar</h3></div>
                <div className="card-pad" style={{ display: 'flex', flexDirection: 'column', gap: 9, padding: '14px 18px' }}>
                  <button className="btn btn-secondary btn-sm" style={{ justifyContent: 'flex-start' }} onClick={openPreview}>
                    <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2"><path d="M2 12s4-8 10-8 10 8 10 8-4 8-10 8-10-8-10-8z" /><circle cx="12" cy="12" r="3" /></svg>Ver preview
                  </button>
                  <button className="btn btn-secondary btn-sm" style={{ justifyContent: 'flex-start' }} onClick={() => onEdit(c)}>
                    <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 20h9M16.5 3.5a2.1 2.1 0 013 3L7 19l-4 1 1-4z" /></svg>Editar
                  </button>
                  {c.publicado
                    ? <button className="btn btn-secondary btn-sm" style={{ justifyContent: 'flex-start' }} onClick={() => doPublish(false)}>Despublicar</button>
                    : <button className="btn btn-primary btn-sm" style={{ justifyContent: 'flex-start' }} onClick={() => doPublish(true)} disabled={c.archivado}>Publicar</button>}
                  {c.archivado
                    ? <button className="btn btn-secondary btn-sm" style={{ justifyContent: 'flex-start' }} onClick={() => doArchive(false)}>Restaurar de archivo</button>
                    : <button className="btn btn-secondary btn-sm" style={{ justifyContent: 'flex-start' }} onClick={() => doArchive(true)}>Archivar</button>}
                  {!confirmDelete
                    ? <button className="btn btn-danger btn-sm" style={{ justifyContent: 'flex-start' }} onClick={() => setConfirmDelete(true)}>Eliminar definitivamente</button>
                    : <div style={{ background: 'var(--clay-soft)', borderRadius: 10, padding: '10px 12px' }}>
                        <div style={{ fontSize: 12.4, color: 'var(--clay-deep)', marginBottom: 8 }}>¿Seguro? Solo se puede si no tiene inscriptos. Esta acción no se puede deshacer.</div>
                        <div style={{ display: 'flex', gap: 8 }}>
                          <button className="btn btn-danger btn-sm" onClick={doDelete} disabled={hardDelete.isPending}>Sí, eliminar</button>
                          <button className="btn btn-secondary btn-sm" onClick={() => setConfirmDelete(false)}>Cancelar</button>
                        </div>
                      </div>}
                </div>
              </div>
            </div>
          )}

          {tab === 'curriculum' && (
            <div className="so-panel active">
              {isViv
                ? (itinerario.length === 0
                    ? <div style={{ fontSize: 13, color: 'var(--ink-faint)' }}>Sin itinerario cargado.</div>
                    : itinerario.map((d, i) => (
                        <div className="module-block" key={i}>
                          <div className="module-head" style={{ padding: '11px 14px' }}><b style={{ fontFamily: 'var(--font-display)', fontSize: 13 }}>{d.dia} · {d.titulo}</b></div>
                          <div style={{ padding: '10px 14px', fontSize: 12.6, color: 'var(--ink-soft)' }}>{d.descripcion}</div>
                        </div>
                      )))
                : ((full?.modules ?? []).length === 0
                    ? <div style={{ fontSize: 13, color: 'var(--ink-faint)' }}>Sin currículum cargado todavía.</div>
                    : (full?.modules ?? []).map(m => (
                        <div className="module-block" key={m.id}>
                          <div className="module-head" style={{ padding: '11px 14px' }}><b style={{ fontFamily: 'var(--font-display)', fontSize: 13 }}>{m.titulo}</b><span className="module-count">{(m.lessons ?? []).length} lecciones</span></div>
                          {(m.lessons ?? []).map(l => (
                            <div className="lesson-row" key={l.id} style={{ paddingLeft: 14 }}>
                              <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="9" /><path d="M10 8l6 4-6 4V8z" fill="currentColor" stroke="none" /></svg>
                              <span style={{ flex: 1 }}>{l.titulo}</span>
                              {l.es_preview && <span className="chip" style={{ fontSize: 10, padding: '2px 7px' }}>Preview</span>}
                              <span className="mono" style={{ fontSize: 11.5, color: 'var(--ink-faint)' }}>{secondsToDuration(l.duracion_segundos)}</span>
                            </div>
                          ))}
                        </div>
                      )))}
            </div>
          )}

          {tab === 'alumnos' && (
            <div className="so-panel active">
              {isViv && (
                <button className="btn btn-primary btn-sm" style={{ marginBottom: 14 }} onClick={() => setShowManual(true)}>+ Cargar inscripción manual</button>
              )}
              {(enrollments ?? []).length === 0
                ? <div style={{ fontSize: 13, color: 'var(--ink-faint)' }}>Todavía no hay inscriptos.</div>
                : isViv
                  ? (enrollments ?? []).map(e => <VivencialInscriptoRow key={e.id} e={e} courseId={c.id} />)
                  : (enrollments ?? []).map(e => (
                      <div key={e.id} className="row-flex" style={{ padding: '10px 12px', background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 10, marginBottom: 7 }}>
                        <div className="tbl-avatar">{(e.profile?.nombre ?? e.profile?.email ?? '?').slice(0, 2).toUpperCase()}</div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 12.8 }}>{[e.profile?.nombre, e.profile?.apellido].filter(Boolean).join(' ') || e.profile?.email || e.user_id.slice(0, 8)}</div>
                          <div style={{ fontSize: 11, color: 'var(--ink-faint)' }}>{e.tipo_acceso}{e.seña_pagada ? ' · seña pagada' : ''}</div>
                        </div>
                      </div>
                    ))}
            </div>
          )}
        </div>
      </div>

      {showManual && (
        <ManualEnrollmentForm course={c} open={showManual} onClose={() => setShowManual(false)} />
      )}
    </Overlay>
  )
}
