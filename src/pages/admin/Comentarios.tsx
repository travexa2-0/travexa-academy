import { useState } from 'react'
import { MessageCircleQuestion, Star, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'
import {
  useModComments, useModReviews,
  useRespondComment, useRespondReview,
  useDeleteComment, useDeleteReview,
  type ModComment, type ModReview,
} from '@/hooks/admin/useModeration'
import ModItemCard from '@/components/shared/ModItemCard'
import { displayName } from '@/lib/utils'

type Tab = 'preguntas' | 'resenas'

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString('es-AR', { day: 'numeric', month: 'short', year: 'numeric' })
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
