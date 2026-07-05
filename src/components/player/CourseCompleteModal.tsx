import { useEffect, useState } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { Star, Award, X, Loader2, PlaneLanding } from 'lucide-react'
import confetti from 'canvas-confetti'
import toast from 'react-hot-toast'
import { useSubmitReview } from '@/hooks/useCourses'
import { countWords } from '@/lib/utils'
import { scaleIn } from '@/lib/motion'

interface Props {
  courseId: string
  courseTitle: string
  userId: string | undefined
  alreadyReviewed: boolean
  onClose: () => void
}

const MIN_WORDS = 5

function celebrate(reduce: boolean) {
  if (reduce) return
  confetti({ particleCount: 140, spread: 85, origin: { y: 0.6 }, colors: ['#0E6B5C', '#C99A3A', '#4ECDB8', '#F5F3EC'] })
}

// Modal de cierre de curso — "Llegaste al destino". La reseña es obligatoria: no se puede
// cerrar ni ver el certificado sin dejarla (salvo que ya exista una reseña previa).
export default function CourseCompleteModal({ courseId, courseTitle, userId, alreadyReviewed, onClose }: Props) {
  const shouldReduce = useReducedMotion()
  const [step, setStep] = useState<'review' | 'done'>(alreadyReviewed ? 'done' : 'review')
  const [rating, setRating] = useState(0)
  const [hover, setHover] = useState(0)
  const [comentario, setComentario] = useState('')
  const { mutate: submit, isPending } = useSubmitReview(userId)

  useEffect(() => {
    if (step === 'done') celebrate(!!shouldReduce)
  }, [step, shouldReduce])

  const words = countWords(comentario)
  const valid = rating >= 1 && rating <= 5 && words >= MIN_WORDS

  const handleSubmit = () => {
    if (!valid || isPending) return
    submit(
      { courseId, rating, comentario },
      {
        onSuccess: () => setStep('done'),
        onError: (e: unknown) => toast.error(e instanceof Error ? e.message : 'No se pudo guardar tu reseña'),
      },
    )
  }

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(6,13,20,.85)', backdropFilter: 'blur(12px)' }}
      {...scaleIn}
    >
      <div
        className="relative rounded-2xl border p-7 max-w-md w-full"
        style={{ background: 'var(--bg-2)', borderColor: 'var(--gold)', boxShadow: '0 0 48px rgba(201,154,58,.2)' }}
      >
        {/* Cerrar: solo disponible cuando ya está la reseña */}
        {step === 'done' && (
          <button onClick={onClose} className="absolute top-4 right-4" style={{ color: 'var(--text-3)' }} aria-label="Cerrar">
            <X className="h-5 w-5" />
          </button>
        )}

        {/* Encabezado aviación */}
        <div className="text-center mb-5">
          <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3" style={{ background: 'var(--gold-soft)' }}>
            {step === 'done'
              ? <Award className="h-8 w-8" style={{ color: 'var(--gold)' }} />
              : <PlaneLanding className="h-8 w-8" style={{ color: 'var(--gold)' }} />}
          </div>
          <p className="font-mono text-[10px] tracking-[.18em] uppercase mb-1" style={{ color: 'var(--primary-l)' }}>
            Llegaste al destino
          </p>
          <h2 className="font-display font-bold text-2xl" style={{ color: 'var(--text-1)' }}>
            {step === 'done' ? '¡Curso completado!' : '¡Casi listo!'}
          </h2>
          <p className="text-sm mt-1.5" style={{ color: 'var(--text-2)' }}>
            Completaste <strong style={{ color: 'var(--text-1)' }}>{courseTitle}</strong>
            {step === 'review' ? '. Contanos cómo te fue para desbloquear tu certificado.' : '. ¡Sos increíble!'}
          </p>
        </div>

        {step === 'review' ? (
          <div className="space-y-4">
            {/* Estrellas */}
            <div>
              <p className="text-xs font-medium mb-2 text-center" style={{ color: 'var(--text-3)' }}>Tu puntaje</p>
              <div className="flex items-center justify-center gap-1.5">
                {[1, 2, 3, 4, 5].map(n => {
                  const active = (hover || rating) >= n
                  return (
                    <button
                      key={n}
                      onMouseEnter={() => setHover(n)}
                      onMouseLeave={() => setHover(0)}
                      onClick={() => setRating(n)}
                      aria-label={`${n} estrella${n > 1 ? 's' : ''}`}
                      className="p-1"
                    >
                      <Star
                        className="h-7 w-7 transition-transform"
                        style={{
                          color: active ? 'var(--gold)' : 'var(--text-3)',
                          fill: active ? 'var(--gold)' : 'transparent',
                          transform: active ? 'scale(1.08)' : 'scale(1)',
                        }}
                      />
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Comentario */}
            <div>
              <textarea
                value={comentario}
                onChange={e => setComentario(e.target.value)}
                placeholder="¿Qué te llevás del curso? Escribí al menos 5 palabras…"
                rows={3}
                className="td-input"
                style={{ resize: 'vertical', minHeight: 84 }}
              />
              <p className="text-[11px] mt-1" style={{ color: words > 0 && words < MIN_WORDS ? 'var(--pending)' : 'var(--text-3)' }}>
                {words < MIN_WORDS ? `Mínimo ${MIN_WORDS} palabras (${words}/${MIN_WORDS})` : `${words} palabras`}
              </p>
            </div>

            <motion.button
              whileTap={{ scale: valid ? 0.97 : 1 }}
              onClick={handleSubmit}
              disabled={!valid || isPending}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-semibold disabled:opacity-45"
              style={{ background: 'var(--primary)', color: 'var(--text-1)' }}
            >
              {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Enviar reseña y ver certificado
            </motion.button>
            <p className="text-center text-[11px]" style={{ color: 'var(--text-3)' }}>
              Se publica cuando Yesica la responde.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            <button className="w-full py-3 rounded-xl font-semibold flex items-center justify-center gap-2" style={{ background: 'var(--gold)', color: 'var(--bg-deep)' }}>
              <Award className="h-4 w-4" /> Ver mi certificado
            </button>
            <button
              onClick={onClose}
              className="w-full py-2.5 rounded-xl text-sm border"
              style={{ borderColor: 'var(--line)', color: 'var(--text-2)' }}
            >
              Seguir explorando
            </button>
          </div>
        )}
      </div>
    </motion.div>
  )
}
