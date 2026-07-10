import { useState } from 'react'
import { Trash2, Send, Clock3, CheckCircle2, Loader2 } from 'lucide-react'

// Card de moderación compartida entre /admin/comentarios y el portal de instructores.
// `onDelete` es opcional: el instructor puede responder pero no borrar (no tiene
// policy de DELETE), así que en su vista el botón no se renderiza.
export default function ModItemCard({
  autor, contexto, fecha, texto, extra, respuesta,
  onRespond, onDelete, respondPending, deletePending = false,
}: {
  autor: string
  contexto: string
  fecha: string
  texto: string
  extra?: React.ReactNode
  respuesta: string | null
  onRespond: (text: string) => void
  onDelete?: () => void
  respondPending: boolean
  deletePending?: boolean
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
          <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--teal-deep)', marginBottom: 2 }}>Respuesta del equipo</div>
          <p style={{ fontSize: 13.5, lineHeight: 1.55, color: 'var(--ink-soft)', whiteSpace: 'pre-wrap' }}>{respuesta}</p>
          {onDelete && (
            <button className="btn btn-danger btn-sm" style={{ marginTop: 10 }} onClick={onDelete} disabled={deletePending}>
              <Trash2 /> Borrar
            </button>
          )}
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
            {onDelete && (
              <button className="btn btn-danger btn-sm" onClick={onDelete} disabled={deletePending}>
                <Trash2 /> Borrar
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
