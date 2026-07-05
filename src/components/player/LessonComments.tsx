import { useState } from 'react'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import { MessageCircleQuestion, ChevronDown, Send, Clock3, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { useLessonComments, useAddLessonComment } from '@/hooks/useLessonComments'
import { displayName } from '@/lib/utils'
import { EASE_OUT } from '@/lib/motion'
import type { LessonComment } from '@/types'

const INSTRUCTOR_NAME = 'Yesica'

interface Props {
  lessonId: string
  courseId: string
  userId: string | undefined
  canComment: boolean
}

function initials(name: string): string {
  return name.split(' ').filter(Boolean).slice(0, 2).map(w => w[0]?.toUpperCase() ?? '').join('') || 'A'
}

function CommentThread({ c, isOwn }: { c: LessonComment; isOwn: boolean }) {
  const name = isOwn ? 'Vos' : displayName(c.profile)
  const answered = !!c.respuesta
  return (
    <div className="flex gap-3">
      <div
        className="w-8 h-8 rounded-full flex items-center justify-center font-display font-bold text-[11px] shrink-0"
        style={{ background: 'var(--card-solid)', color: 'var(--primary-l)' }}
      >
        {initials(name)}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-sm" style={{ color: 'var(--text-1)' }}>{name}</span>
          {isOwn && !answered && (
            <span className="flex items-center gap-1 font-mono text-[9px] tracking-[.05em] uppercase px-1.5 py-0.5 rounded-full" style={{ background: 'var(--pending-s)', color: 'var(--pending)' }}>
              <Clock3 className="h-2.5 w-2.5" /> Pendiente
            </span>
          )}
        </div>
        <p className="text-sm leading-relaxed mt-0.5 whitespace-pre-wrap" style={{ color: 'var(--text-2)' }}>{c.comentario}</p>

        {answered && (
          <div className="mt-3 pl-3 border-l-2" style={{ borderColor: 'var(--primary)' }}>
            <div className="flex items-center gap-1.5 mb-0.5">
              <span className="font-semibold text-xs" style={{ color: 'var(--primary-l)' }}>Respuesta de {INSTRUCTOR_NAME}</span>
            </div>
            <p className="text-sm leading-relaxed whitespace-pre-wrap" style={{ color: 'var(--text-2)' }}>{c.respuesta}</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default function LessonComments({ lessonId, courseId, userId, canComment }: Props) {
  const shouldReduce = useReducedMotion()
  const [open, setOpen] = useState(false)
  const [draft, setDraft] = useState('')
  const { data: comments = [], isLoading } = useLessonComments(lessonId)
  const { mutate: add, isPending } = useAddLessonComment(userId)

  const visibleCount = comments.filter(c => c.publicado).length

  const handleSend = () => {
    const text = draft.trim()
    if (!text || isPending || !userId) return
    add(
      { lessonId, courseId, comentario: text },
      {
        onSuccess: () => {
          setDraft('')
          toast('Tu pregunta quedó enviada. Vas a verla acá cuando Yesica responda.', {
            icon: '✈️',
            style: { background: 'var(--bg-2)', color: 'var(--text-1)', border: '1px solid var(--line)', borderRadius: '12px' },
            duration: 3500,
          })
        },
        onError: (e: unknown) => toast.error(e instanceof Error ? e.message : 'No se pudo enviar la pregunta'),
      },
    )
  }

  return (
    <div className="rounded-2xl border overflow-hidden" style={{ borderColor: 'var(--line)', background: 'var(--bg-2)' }}>
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center gap-2.5 px-4 py-3.5 text-left"
        aria-expanded={open}
      >
        <MessageCircleQuestion className="h-4 w-4 shrink-0" style={{ color: 'var(--primary-l)' }} />
        <span className="font-display font-semibold text-sm" style={{ color: 'var(--text-1)' }}>Preguntas de esta clase</span>
        {visibleCount > 0 && (
          <span className="font-mono text-[10px] px-1.5 py-0.5 rounded-full" style={{ background: 'var(--primary-s)', color: 'var(--primary-l)' }}>
            {visibleCount}
          </span>
        )}
        <ChevronDown
          className="h-4 w-4 ml-auto shrink-0 transition-transform"
          style={{ color: 'var(--text-3)', transform: open ? 'rotate(180deg)' : 'rotate(0)', transitionTimingFunction: 'cubic-bezier(0.23,1,0.32,1)' }}
        />
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: shouldReduce ? 0 : 0.28, ease: EASE_OUT }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 border-t" style={{ borderColor: 'var(--line)' }}>
              {/* Composer */}
              {canComment ? (
                <div className="pt-4">
                  <textarea
                    value={draft}
                    onChange={e => setDraft(e.target.value)}
                    placeholder="¿Tenés una duda sobre esta clase? Preguntale a Yesica…"
                    rows={2}
                    className="td-input"
                    style={{ resize: 'vertical', minHeight: 60 }}
                  />
                  <div className="flex items-center justify-between mt-2">
                    <p className="text-[11px]" style={{ color: 'var(--text-3)' }}>
                      Tu pregunta aparece publicada recién cuando la responden.
                    </p>
                    <motion.button
                      whileTap={{ scale: 0.96 }}
                      onClick={handleSend}
                      disabled={isPending || !draft.trim()}
                      className="flex items-center gap-1.5 text-sm font-semibold px-3.5 py-2 rounded-xl disabled:opacity-45"
                      style={{ background: 'var(--primary)', color: 'var(--text-1)' }}
                    >
                      {isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
                      Enviar
                    </motion.button>
                  </div>
                </div>
              ) : (
                <p className="pt-4 text-sm" style={{ color: 'var(--text-3)' }}>
                  Inscribite en el curso para hacer preguntas.
                </p>
              )}

              {/* Thread list */}
              <div className="mt-5 space-y-5">
                {isLoading ? (
                  <div className="flex items-center gap-2 text-sm" style={{ color: 'var(--text-3)' }}>
                    <Loader2 className="h-4 w-4 animate-spin" /> Cargando preguntas…
                  </div>
                ) : comments.length === 0 ? (
                  <p className="text-sm" style={{ color: 'var(--text-3)' }}>
                    Todavía no hay preguntas en esta clase. ¡Sé la primera persona en preguntar!
                  </p>
                ) : (
                  comments.map(c => <CommentThread key={c.id} c={c} isOwn={c.user_id === userId} />)
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
