import { useState } from 'react'
import { MessageCircleQuestion, Star, Trash2, Send, Clock3, CheckCircle2, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'
import {
  useModComments, useModReviews,
  useRespondComment, useRespondReview,
  useDeleteComment, useDeleteReview,
  type ModComment, type ModReview,
} from '@/hooks/admin/useModeration'
import { displayName } from '@/lib/utils'

type Tab = 'preguntas' | 'resenas'

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString('es-AR', { day: 'numeric', month: 'short', year: 'numeric' })
}

// ── Card genérica de moderación ──────────────────────────────────
function ModItemCard({
  autor, contexto, fecha, texto, extra, respuesta,
  onRespond, onDelete, respondPending, deletePending,
}: {
  autor: string
  contexto: string
  fecha: string
  texto: string
  extra?: React.ReactNode
  respuesta: string | null
  onRespond: (text: string) => void
  onDelete: () => void
  respondPending: boolean
  deletePending: boolean
}) {
  const [draft, setDraft] = useState('')
  const answered = !!respuesta

  return (
    <div className="card card-pad" style={{ marginBottom: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'flex-start' }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--ink)' }}>{autor}</div>
          <div className="mono" style={{ fontSize: 11.5, color: 'var(--ink-faint)', marginTop: 2 }}>{contexto}</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
          {answered ? (
            <span className="badge" style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: 'var(--teal-soft)', color: 'var(--teal-deep)' }}>
              <CheckCircle2 style={{ width: 12, height: 12 }} /> Publicado
            </span>
          ) : (
            <span className="badge" style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: 'var(--gold-soft)', color: 'var(--gold-deep)' }}>
              <Clock3 style={{ width: 12, height: 12 }} /> Pendiente
            </span>
          )}
          <span className="mono" style={{ fontSize: 11, color: 'var(--ink-faint)' }}>{fecha}</span>
        </div>
      </div>

      {extra}

      <p style={{ fontSize: 14, lineHeight: 1.6, color: 'var(--ink)', marginTop: 10, whiteSpace: 'pre-wrap' }}>{texto}</p>

      {answered ? (
        <div style={{ marginTop: 12, paddingLeft: 12, borderLeft: '2px solid var(--teal)' }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--teal-deep)', marginBottom: 2 }}>Respuesta de Yesica</div>
          <p style={{ fontSize: 13.5, lineHeight: 1.55, color: 'var(--ink-soft)', whiteSpace: 'pre-wrap' }}>{respuesta}</p>
          <button
            className="btn btn-danger btn-sm"
            style={{ marginTop: 10 }}
            onClick={onDelete}
            disabled={deletePending}
          >
            <Trash2 /> Borrar
          </button>
        </div>
      ) : (
        <div style={{ marginTop: 12 }}>
          <textarea
            className="textarea"
            rows={2}
            placeholder="Escribí la respuesta… (al responder se publica automáticamente)"
            value={draft}
            onChange={e => setDraft(e.target.value)}
          />
          <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
            <button
              className="btn btn-primary btn-sm"
              disabled={!draft.trim() || respondPending}
              onClick={() => onRespond(draft.trim())}
            >
              {respondPending ? <Loader2 className="animate-spin" /> : <Send />} Responder y publicar
            </button>
            <button className="btn btn-danger btn-sm" onClick={onDelete} disabled={deletePending}>
              <Trash2 /> Borrar
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function PreguntasPanel() {
  const { data: comments = [], isLoading } = useModComments()
  const respond = useRespondComment()
  const del = useDeleteComment()

  if (isLoading) return <PanelLoading />
  if (comments.length === 0) return <PanelEmpty label="No hay preguntas de alumnos todavía." />

  return (
    <div>
      {comments.map((c: ModComment) => (
        <ModItemCard
          key={c.id}
          autor={displayName(c.profile)}
          contexto={`${c.course?.titulo ?? 'Curso'} · ${c.lesson?.titulo ?? 'Lección'}`}
          fecha={fmtDate(c.created_at)}
          texto={c.comentario}
          respuesta={c.respuesta}
          respondPending={respond.isPending}
          deletePending={del.isPending}
          onRespond={text => respond.mutate({ id: c.id, respuesta: text }, {
            onSuccess: () => toast.success('Respuesta publicada'),
            onError: e => toast.error(e instanceof Error ? e.message : 'Error al responder'),
          })}
          onDelete={() => del.mutate(c.id, {
            onSuccess: () => toast.success('Comentario borrado'),
            onError: e => toast.error(e instanceof Error ? e.message : 'Error al borrar'),
          })}
        />
      ))}
    </div>
  )
}

function ResenasPanel() {
  const { data: reviews = [], isLoading } = useModReviews()
  const respond = useRespondReview()
  const del = useDeleteReview()

  if (isLoading) return <PanelLoading />
  if (reviews.length === 0) return <PanelEmpty label="No hay reseñas de cursos todavía." />

  return (
    <div>
      {reviews.map((r: ModReview) => (
        <ModItemCard
          key={r.id}
          autor={displayName(r.profile)}
          contexto={r.course?.titulo ?? 'Curso'}
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
          respondPending={respond.isPending}
          deletePending={del.isPending}
          onRespond={text => respond.mutate({ id: r.id, respuesta: text }, {
            onSuccess: () => toast.success('Reseña publicada'),
            onError: e => toast.error(e instanceof Error ? e.message : 'Error al responder'),
          })}
          onDelete={() => del.mutate(r.id, {
            onSuccess: () => toast.success('Reseña borrada'),
            onError: e => toast.error(e instanceof Error ? e.message : 'Error al borrar'),
          })}
        />
      ))}
    </div>
  )
}

function PanelLoading() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--ink-faint)', padding: '40px 0', justifyContent: 'center' }}>
      <Loader2 className="animate-spin" /> Cargando…
    </div>
  )
}

function PanelEmpty({ label }: { label: string }) {
  return (
    <div className="empty-state">
      <div className="empty-state-icon"><MessageCircleQuestion /></div>
      <h4>Bandeja vacía</h4>
      <p>{label}</p>
    </div>
  )
}

export default function Comentarios() {
  const [tab, setTab] = useState<Tab>('preguntas')

  return (
    <div style={{ maxWidth: 820 }}>
      <div style={{ marginBottom: 18 }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 22, color: 'var(--ink)' }}>Moderación</h1>
        <p style={{ fontSize: 13, color: 'var(--ink-soft)', marginTop: 2 }}>
          Preguntas de clase y reseñas de curso. Al responder, se publican automáticamente.
        </p>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        <button className={`chip${tab === 'preguntas' ? ' chip-active' : ''}`} onClick={() => setTab('preguntas')}>
          Preguntas de clase
        </button>
        <button className={`chip${tab === 'resenas' ? ' chip-active' : ''}`} onClick={() => setTab('resenas')}>
          Reseñas de curso
        </button>
      </div>

      {tab === 'preguntas' ? <PreguntasPanel /> : <ResenasPanel />}
    </div>
  )
}
