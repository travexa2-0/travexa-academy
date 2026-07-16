import { useState } from 'react'
import toast from 'react-hot-toast'
import Overlay from './Overlay'
import { formatArs, formatDate } from '../format'
import { useStudentDetail, useToggleStudentActive, type StudentRow, type StudentEnrollment } from '@/hooks/admin/useAdminStudents'

interface Props {
  alumno: StudentRow | null
  open: boolean
  onClose: () => void
}

const initials = (nombre: string | null, apellido: string | null, email: string) => {
  const base = [nombre, apellido].filter(Boolean).join(' ').trim()
  if (base) return base.split(' ').map(p => p[0]).slice(0, 2).join('').toUpperCase()
  return email.slice(0, 2).toUpperCase()
}

const fullName = (a: StudentRow) => [a.nombre, a.apellido].filter(Boolean).join(' ').trim() || a.email

// Un pago que aparece en la lista siempre está en un estado FINAL (ya no existe
// "pendiente" persistido para pagos de curso). El fallback queda por si hay algún
// dato viejo, pero no debería aparecer.
function paymentEstadoBadge(estado: string) {
  if (estado === 'aprobado') return <span className="badge badge-published">Aprobado</span>
  if (estado === 'rechazado') return <span className="badge badge-archived">Rechazado</span>
  if (estado === 'cancelado') return <span className="badge badge-archived">Cancelado</span>
  if (estado === 'reembolsado') return <span className="badge badge-draft">Reembolsado</span>
  return <span className="badge badge-draft">{estado}</span>
}

const tipoCursoLabel = (tipo: string) =>
  tipo === 'vivencial' ? 'Vivencial' : tipo === 'en_vivo' ? 'En vivo' : tipo === 'ebook' ? 'Ebook' : 'Grabado'

const tipoPagoLabel = (tipo: string) =>
  tipo === 'curso' ? 'Curso' : tipo === 'vivencial' ? 'Vivencial' : tipo === 'sena' || tipo === 'seña' ? 'Seña' : tipo

// Empty state compacto, mismo lenguaje visual que .empty-state pero acotado para
// caber dentro de una card del drawer (nunca una lista/tabla vacía pelada).
function EmptyMini({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="empty-state" style={{ padding: '26px 18px' }}>
      <div className="empty-state-icon" style={{ width: 40, height: 40, marginBottom: 10, borderRadius: 11 }}>{icon}</div>
      <p style={{ margin: 0, fontSize: 12.4 }}>{text}</p>
    </div>
  )
}

export default function AlumnoDetailDrawer({ alumno, open, onClose }: Props) {
  const { data: detail, isLoading } = useStudentDetail(open && alumno ? alumno.id : undefined)
  const toggleActive = useToggleStudentActive()
  const [confirmBaja, setConfirmBaja] = useState(false)

  if (!alumno) return null
  const a = alumno

  const doToggle = async () => {
    try {
      await toggleActive.mutateAsync({ id: a.id, activo: !a.activo })
      toast.success(a.activo ? 'Alumno dado de baja' : 'Alumno reactivado')
      onClose()
    } catch (e) {
      toast.error((e as Error).message)
    } finally {
      setConfirmBaja(false)
    }
  }
  const g = detail?.gamification ?? null
  const enrollments = detail?.enrollments ?? []
  const cursos = enrollments.filter(e => e.tipo !== 'vivencial')
  const vivenciales = enrollments.filter(e => e.tipo === 'vivencial')
  const payments = detail?.payments ?? []

  const hasGami = !!g && (g.puntos > 0 || g.nivel > 0 || g.streak_maximo > 0 || g.creditos > 0)

  return (
    <Overlay open={open} onClose={onClose} alignRight>
      <div className="slideover">
        {/* Close flotante: queda siempre accesible aunque el contenido scrollee. */}
        <button className="modal-close" style={{ position: 'absolute', top: 14, right: 14, zIndex: 5, background: 'rgba(10,30,41,0.55)', color: '#fff' }} onClick={onClose} aria-label="Cerrar">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12" /></svg>
        </button>

        <div className="slideover-body">
          <div className="so-panel active">
            {/* Header de persona: avatar circular grande + nombre superpuesto abajo a
                la izquierda. Va DENTRO del área scrolleable (a diferencia de
                .slideover-hero), así todo el bloque scrollea junto con el contenido. */}
            <div style={{ margin: '-22px -22px 16px', padding: '26px 22px 18px', background: 'linear-gradient(135deg,#0A1E29,#16323F)', position: 'relative' }}>
              {(!a.activo || g?.tipo_cuenta) && (
                <div style={{ position: 'absolute', top: 16, right: 54, display: 'flex', gap: 6 }}>
                  {!a.activo && <span className="badge badge-archived">Dado de baja</span>}
                  {g?.tipo_cuenta && <span className="badge" style={{ background: 'rgba(255,255,255,0.15)', color: '#fff', textTransform: 'capitalize' }}>{g.tipo_cuenta}</span>}
                </div>
              )}
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: 16 }}>
                <div style={{ width: 128, height: 128, borderRadius: '50%', overflow: 'hidden', border: '3px solid rgba(245,243,236,0.92)', boxShadow: '0 12px 30px -8px rgba(0,0,0,0.65)', background: 'rgba(255,255,255,0.14)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  {a.avatar_url
                    ? <img src={a.avatar_url} alt={fullName(a)} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    : <span style={{ color: '#fff', fontWeight: 700, fontSize: 38, fontFamily: 'var(--font-display)' }}>{initials(a.nombre, a.apellido, a.email)}</span>}
                </div>
                <div style={{ minWidth: 0, paddingBottom: 6 }}>
                  <h2 style={{ color: 'var(--white)', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.3rem', lineHeight: 1.15 }}>{fullName(a)}</h2>
                  <div style={{ color: 'rgba(245,243,236,0.7)', fontSize: 12.5, marginTop: 3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.email}</div>
                </div>
              </div>
            </div>

            {/* Datos */}
            <div className="card" style={{ marginBottom: 16 }}>
              <div className="card-head"><h3 style={{ fontSize: 13 }}>Datos</h3></div>
              <div className="card-pad" style={{ padding: '14px 20px', fontSize: 12.6, color: 'var(--ink-soft)', display: 'grid', gap: 6 }}>
                <div>Email: <b>{a.email}</b></div>
                <div>Teléfono: <b>{a.telefono ?? '—'}</b></div>
                <div>Ciudad / País: <b>{[a.ciudad, a.pais].filter(Boolean).join(', ') || '—'}</b></div>
                <div>DNI: <b>{g?.dni ?? '—'}</b></div>
                <div>Registrado: <b>{formatDate(a.created_at)}</b></div>
                <div>Último ingreso: <b>{a.ultimo_ingreso ? formatDate(a.ultimo_ingreso) : '—'}</b></div>
              </div>
            </div>

            {/* Gamificación — solo si hay datos reales */}
            {hasGami && g && (
              <div className="card" style={{ marginBottom: 16 }}>
                <div className="card-head"><h3 style={{ fontSize: 13 }}>Gamificación</h3></div>
                <div className="card-pad" style={{ padding: '14px 20px' }}>
                  <div className="stat-mini-grid" style={{ marginBottom: 0 }}>
                    <div className="stat-mini"><div className="v">{g.puntos}</div><div className="l">puntos</div></div>
                    <div className="stat-mini"><div className="v">{g.nivel}</div><div className="l">nivel</div></div>
                    <div className="stat-mini"><div className="v">{g.streak_actual} / {g.streak_maximo}</div><div className="l">streak actual / máx</div></div>
                  </div>
                </div>
              </div>
            )}

            {/* Cursos inscriptos */}
            <div className="card" style={{ marginBottom: 16 }}>
              <div className="card-head"><h3 style={{ fontSize: 13 }}>Cursos inscriptos</h3></div>
              <div className="card-pad" style={{ padding: '10px 14px' }}>
                {isLoading
                  ? <div style={{ fontSize: 12.6, color: 'var(--ink-faint)', padding: '6px 4px' }}>Cargando…</div>
                  : cursos.length === 0
                    ? <EmptyMini text="Todavía no se inscribió a ningún curso." icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M4 5.5C4 4.7 4.7 4 5.5 4H12v16H5.5A1.5 1.5 0 014 18.5v-13z" /><path d="M20 5.5c0-.8-.7-1.5-1.5-1.5H12v16h6.5a1.5 1.5 0 001.5-1.5v-13z" /></svg>} />
                    : cursos.map(c => (
                        <div key={c.id} className="row-flex" style={{ padding: '9px 4px', borderBottom: '1px solid var(--line)' }}>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: 12.8, color: 'var(--ink)' }}>{c.titulo}</div>
                            <div style={{ fontSize: 11, color: 'var(--ink-faint)' }}>{tipoCursoLabel(c.tipo)} · inscripto {formatDate(c.created_at)}</div>
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            {c.completado
                              ? <span className="badge badge-published">Completado</span>
                              : <span style={{ fontSize: 12, color: 'var(--ink-soft)' }}>{c.progreso_pct}%</span>}
                          </div>
                        </div>
                      ))}
              </div>
            </div>

            {/* Vivenciales inscriptos */}
            <div className="card" style={{ marginBottom: 16 }}>
              <div className="card-head"><h3 style={{ fontSize: 13 }}>Vivenciales inscriptos</h3></div>
              <div className="card-pad" style={{ padding: '10px 14px' }}>
                {isLoading
                  ? <div style={{ fontSize: 12.6, color: 'var(--ink-faint)', padding: '6px 4px' }}>Cargando…</div>
                  : vivenciales.length === 0
                    ? <EmptyMini text="Todavía no reservó ningún vivencial." icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M3 11l18-7-7 18-2.5-7L3 11z" strokeLinejoin="round" /></svg>} />
                    : vivenciales.map((v: StudentEnrollment) => (
                        <div key={v.id} style={{ padding: '10px 4px', borderBottom: '1px solid var(--line)' }}>
                          <div className="row-flex">
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ fontSize: 12.8, color: 'var(--ink)' }}>{v.titulo}</div>
                              <div style={{ fontSize: 11, color: 'var(--ink-faint)' }}>{v.numero_reserva ? `Reserva ${v.numero_reserva}` : 'Sin nº de reserva'} · inscripto {formatDate(v.created_at)}</div>
                            </div>
                            {v.pago_completado
                              ? <span className="badge badge-published">Pago completo</span>
                              : v.seña_pagada
                                ? <span className="badge badge-draft">Seña pagada</span>
                                : <span className="badge badge-archived">Sin pago</span>}
                          </div>
                          <div style={{ display: 'flex', gap: 14, marginTop: 6, fontSize: 11.5, color: 'var(--ink-soft)' }}>
                            <span>Total: <b>{formatArs(v.monto_total_ars)}</b></span>
                            <span>Señado: <b>{formatArs(v.monto_señado_ars)}</b></span>
                            <span>Pendiente: <b>{formatArs(v.monto_pendiente_ars)}</b></span>
                          </div>
                        </div>
                      ))}
              </div>
            </div>

            {/* Pagos */}
            <div className="card" style={{ marginBottom: 16 }}>
              <div className="card-head"><h3 style={{ fontSize: 13 }}>Pagos</h3></div>
              <div className="card-pad" style={{ padding: '10px 14px' }}>
                {isLoading
                  ? <div style={{ fontSize: 12.6, color: 'var(--ink-faint)', padding: '6px 4px' }}>Cargando…</div>
                  : payments.length === 0
                    ? <EmptyMini text="Todavía no registró pagos." icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="2" y="6" width="20" height="13" rx="2" /><path d="M2 10h20M6 15h4" /></svg>} />
                    : payments.map(p => (
                        <div key={p.id} className="row-flex" style={{ padding: '9px 4px', borderBottom: '1px solid var(--line)' }}>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: 12.8, color: 'var(--ink)' }}>{tipoPagoLabel(p.tipo)} · {formatArs(p.monto_ars)}</div>
                            <div style={{ fontSize: 11, color: 'var(--ink-faint)' }}>
                              {formatDate(p.created_at)}
                              {p.comprobante_url && <> · <a href={p.comprobante_url} target="_blank" rel="noreferrer" style={{ color: 'var(--teal-deep)', fontWeight: 600 }}>ver comprobante</a></>}
                            </div>
                          </div>
                          {paymentEstadoBadge(p.estado)}
                        </div>
                      ))}
              </div>
            </div>

            {/* Administrar — baja/reactivar (soft-delete, no bloquea login) */}
            <div className="card">
              <div className="card-head"><h3 style={{ fontSize: 13 }}>Administrar</h3></div>
              <div className="card-pad" style={{ display: 'flex', flexDirection: 'column', gap: 9, padding: '14px 18px' }}>
                {a.activo ? (
                  !confirmBaja ? (
                    <button className="btn btn-danger btn-sm" style={{ justifyContent: 'flex-start' }} onClick={() => setConfirmBaja(true)}>Dar de baja</button>
                  ) : (
                    <div style={{ background: 'var(--clay-soft)', borderRadius: 10, padding: '10px 12px' }}>
                      <div style={{ fontSize: 12.4, color: 'var(--clay-deep)', marginBottom: 8 }}>Lo marca como dado de baja (flag interno del equipo). No borra datos ni bloquea su acceso a la plataforma. Podés reactivarlo cuando quieras.</div>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button className="btn btn-danger btn-sm" onClick={doToggle} disabled={toggleActive.isPending}>Sí, dar de baja</button>
                        <button className="btn btn-secondary btn-sm" onClick={() => setConfirmBaja(false)}>Cancelar</button>
                      </div>
                    </div>
                  )
                ) : (
                  <button className="btn btn-secondary btn-sm" style={{ justifyContent: 'flex-start' }} onClick={doToggle} disabled={toggleActive.isPending}>Reactivar</button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Overlay>
  )
}
