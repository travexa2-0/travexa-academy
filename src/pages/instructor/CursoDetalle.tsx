import { useMemo, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Star, Loader2, MessageCircleQuestion } from 'lucide-react'
import toast from 'react-hot-toast'
import NumberFlow from '@number-flow/react'
import { useInstructorSelf } from '@/hooks/useInstructorSelf'
import { useOwnCourses, useOwnSales, useCourseBuyerNames } from '@/hooks/instructor/useInstructorCourses'
import {
  useCourseComments, useCourseReviews,
  useInstructorRespondComment, useInstructorRespondReview,
  type InstructorComment,
} from '@/hooks/instructor/useInstructorModeration'
import ModItemCard from '@/components/shared/ModItemCard'
import { displayName } from '@/lib/utils'
import { brutoDe, estadoCurso, gananciaArs, yaSeDio } from './earnings'
import type { Review } from '@/types'

type Tab = 'resumen' | 'comentarios'

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString('es-AR', { day: 'numeric', month: 'short', year: 'numeric' })
}

// ── Tab: Resumen ──────────────────────────────────────────────────
function ResumenTab({ courseId, sharePct, dado, liveDate }: {
  courseId: string
  sharePct: number
  dado: boolean
  liveDate: string | null
}) {
  const { data: sales } = useOwnSales(useMemo(() => [courseId], [courseId]))
  const { data: buyers } = useCourseBuyerNames(courseId)

  const propias = sales ?? []
  const bruto = brutoDe(propias)
  const ganancia = gananciaArs(bruto, sharePct)

  // "Ventas nuevas" = inscripciones posteriores a la fecha en que se dictó el curso.
  const posteriores = useMemo(() => {
    if (!dado || !liveDate) return []
    return (buyers ?? []).filter(b => new Date(b.created_at) > new Date(liveDate))
  }, [buyers, dado, liveDate])

  return (
    <>
      <div className="kpi-grid" style={{ marginBottom: 16 }}>
        <div className="kpi-card">
          <div className="kpi-top"><span className="kpi-label">Inscriptos pagos</span></div>
          <div className="kpi-value"><NumberFlow value={propias.length} /></div>
          <div className="kpi-foot"><span className="kpi-period">pagos aprobados</span></div>
        </div>
        <div className="kpi-card">
          <div className="kpi-top"><span className="kpi-label">Facturado</span></div>
          <div className="kpi-value"><NumberFlow value={bruto} prefix="$" /><span className="unit">ARS</span></div>
          <div className="kpi-foot"><span className="kpi-period">bruto del curso</span></div>
        </div>
        <div className="kpi-card">
          <div className="kpi-top"><span className="kpi-label">{dado ? 'Tu ganancia final' : 'Tu ganancia proyectada'}</span></div>
          <div className="kpi-value"><NumberFlow value={ganancia} prefix="$" /><span className="unit">ARS</span></div>
          <div className="kpi-foot"><span className="kpi-period">{sharePct}% de lo vendido</span></div>
        </div>
      </div>

      {!dado && (
        <div className="card card-pad" style={{ marginBottom: 16 }}>
          <p style={{ fontSize: 13, color: 'var(--ink-soft)', margin: 0 }}>
            La proyección se calcula sobre las ventas aprobadas hasta hoy. Si entran más
            inscripciones antes de que se dicte el curso, el número sube.
          </p>
        </div>
      )}

      {dado && (
        <div className="card">
          <div className="card-head">
            <div>
              <h3>Ventas posteriores al curso</h3>
              <div className="sub">Gente que se inscribió después de la fecha en que lo diste</div>
            </div>
          </div>
          <div className="card-pad">
            {posteriores.length === 0 ? (
              <div style={{ fontSize: 13, color: 'var(--ink-faint)', padding: '8px 0' }}>
                Todavía no entraron ventas después de la fecha del curso.
              </div>
            ) : (
              <table className="tbl">
                <thead><tr><th>Alumno</th><th>Se inscribió</th></tr></thead>
                <tbody>
                  {posteriores.map(b => (
                    <tr key={b.enrollment_id}>
                      <td style={{ fontWeight: 600, color: 'var(--ink)' }}>{displayName(b)}</td>
                      <td className="mono" style={{ fontSize: 12, color: 'var(--ink-faint)' }}>{fmtDate(b.created_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}
    </>
  )
}

// ── Tab: Comentarios ──────────────────────────────────────────────
function ComentariosTab({ courseId }: { courseId: string }) {
  const [sub, setSub] = useState<'preguntas' | 'resenas'>('preguntas')
  const { data: comments = [], isLoading: loadingC } = useCourseComments(courseId)
  const { data: reviews = [], isLoading: loadingR } = useCourseReviews(courseId)
  const respondComment = useInstructorRespondComment()
  const respondReview = useInstructorRespondReview()

  const loading = sub === 'preguntas' ? loadingC : loadingR
  const empty = sub === 'preguntas' ? comments.length === 0 : reviews.length === 0

  return (
    <div style={{ maxWidth: 820 }}>
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        <button className={`chip${sub === 'preguntas' ? ' chip-active' : ''}`} onClick={() => setSub('preguntas')}>
          Preguntas de clase
        </button>
        <button className={`chip${sub === 'resenas' ? ' chip-active' : ''}`} onClick={() => setSub('resenas')}>
          Reseñas del curso
        </button>
      </div>

      {loading && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--ink-faint)', padding: '40px 0', justifyContent: 'center' }}>
          <Loader2 className="animate-spin" /> Cargando…
        </div>
      )}

      {!loading && empty && (
        <div className="empty-state">
          <div className="empty-state-icon"><MessageCircleQuestion /></div>
          <h4>Bandeja vacía</h4>
          <p>{sub === 'preguntas' ? 'Todavía no hay preguntas en este curso.' : 'Todavía no hay reseñas de este curso.'}</p>
        </div>
      )}

      {!loading && sub === 'preguntas' && comments.map((c: InstructorComment) => (
        <ModItemCard
          key={c.id}
          autor={displayName(null)}
          contexto={c.lesson?.titulo ?? 'Lección'}
          fecha={fmtDate(c.created_at)}
          texto={c.comentario}
          respuesta={c.respuesta}
          respondPending={respondComment.isPending}
          onRespond={text => respondComment.mutate({ id: c.id, courseId, respuesta: text }, {
            onSuccess: () => toast.success('Respuesta publicada'),
            onError: e => toast.error(e instanceof Error ? e.message : 'Error al responder'),
          })}
        />
      ))}

      {!loading && sub === 'resenas' && reviews.map((r: Review) => (
        <ModItemCard
          key={r.id}
          autor={displayName(null)}
          contexto="Reseña del curso"
          fecha={fmtDate(r.created_at)}
          texto={r.comentario ?? ''}
          extra={
            <div style={{ display: 'flex', gap: 2, marginTop: 8, color: 'var(--gold)' }}>
              {[1, 2, 3, 4, 5].map(n => (
                <Star key={n} style={{ width: 14, height: 14, fill: n <= r.rating ? 'var(--gold)' : 'transparent', color: n <= r.rating ? 'var(--gold)' : 'var(--line-strong)' }} />
              ))}
            </div>
          }
          respuesta={r.respuesta}
          respondPending={respondReview.isPending}
          onRespond={text => respondReview.mutate({ id: r.id, courseId, respuesta: text }, {
            onSuccess: () => toast.success('Reseña publicada'),
            onError: e => toast.error(e instanceof Error ? e.message : 'Error al responder'),
          })}
        />
      ))}
    </div>
  )
}

export default function InstructorCursoDetalle() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [tab, setTab] = useState<Tab>('resumen')

  const { instructor } = useInstructorSelf()
  const { data: cursos, isLoading } = useOwnCourses(instructor?.id)
  const curso = cursos?.find(c => c.id === id) ?? null

  if (isLoading) {
    return <div style={{ color: 'var(--ink-faint)', padding: '40px 0', textAlign: 'center' }}>Cargando…</div>
  }

  if (!curso || !id) {
    return (
      <div className="empty-state">
        <h4>No encontramos ese curso</h4>
        <p>Puede que no esté asignado a tu nombre.</p>
        <button className="btn btn-secondary btn-sm" onClick={() => navigate('/instructor/cursos')}>Volver a mis cursos</button>
      </div>
    )
  }

  const dado = yaSeDio(curso)

  return (
    <>
      <div className="page-head">
        <div>
          <button className="btn btn-ghost btn-sm" style={{ marginBottom: 8 }} onClick={() => navigate('/instructor/cursos')}>
            <ArrowLeft /> Mis cursos
          </button>
          <div className="page-eyebrow">{estadoCurso(curso)}</div>
          <h1 className="page-title">{curso.titulo}</h1>
          {curso.live_date && (
            <p className="page-sub">
              {dado ? 'Se dictó el ' : 'Se dicta el '}
              {new Date(curso.live_date).toLocaleDateString('es-AR', { day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
          )}
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        <button className={`chip${tab === 'resumen' ? ' chip-active' : ''}`} onClick={() => setTab('resumen')}>Resumen</button>
        <button className={`chip${tab === 'comentarios' ? ' chip-active' : ''}`} onClick={() => setTab('comentarios')}>Comentarios</button>
      </div>

      {tab === 'resumen'
        ? <ResumenTab courseId={id} sharePct={instructor?.revenue_share_pct ?? 0} dado={dado} liveDate={curso.live_date} />
        : <ComentariosTab courseId={id} />}
    </>
  )
}
