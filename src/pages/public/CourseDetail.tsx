import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowLeft, Copy, CheckCircle2, Users, Clock,
  Play, Lock, X, Check, MapPin, Hotel, CalendarDays,
  Loader2, Heart, AlertCircle, BookOpen,
} from 'lucide-react'
import Header from '@/components/layout/Header'
import { useCourseDetail, useWishlist, useToggleWishlist, useMyEnrollments, useReviews } from '@/hooks/useCourses'
import { useAuth } from '@/contexts/AuthContext'
import { useCoursePayment, type MetodoPago } from '@/hooks/usePayment'
import { usePricingConfig } from '@/hooks/usePricing'
import { richTextLines, hasRichText, renderBold } from '@/lib/richText'
import { courseLiveState } from '@/lib/liveState'
import { displayName, loginRedirect } from '@/lib/utils'
import { liveLessonState } from '@/types'
import type { Course, Module, Lesson, NivelCurso } from '@/types'

// ── Helpers ───────────────────────────────────────────────────────

function formatARS(n: number | null | undefined): string {
  if (!n) return ''
  return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(n)
}

function formatDuration(min: number): string {
  if (!min) return ''
  const h = Math.floor(min / 60)
  const m = min % 60
  return m > 0 ? `${h}h ${m}min` : `${h}h`
}

function stars(r: number): string {
  if (!r) return ''
  return '★'.repeat(Math.min(5, Math.round(r)))
}

// ── FAQ data ──────────────────────────────────────────────────────

const FAQ_ITEMS = [
  { q: '¿Cómo accedo al contenido después de comprar?', a: 'Inmediatamente después de confirmar el pago tenés acceso de por vida desde tu dashboard. Sin esperas.' },
  { q: '¿Puedo ver los cursos en mi celular?', a: 'Sí, la plataforma está optimizada para mobile y tablet. El contenido se adapta a cualquier pantalla.' },
  { q: '¿Los cursos se actualizan?', a: 'Sí. Cuando los instructores actualicen el contenido, tenés acceso automático sin costo extra.' },
  { q: '¿Puedo ver parte del contenido antes de comprar?', a: 'Sí, la primera lección de cada curso tiene preview gratuita. También podés leer el programa completo antes de decidir.' },
  { q: '¿Cómo funciona el fam trip (vivencial)?', a: 'Son experiencias grupales de 3–5 días. Se reserva con una seña (50% del total) y el saldo se abona antes del viaje. El cupo es limitado.' },
  { q: '¿Qué pasa si un live se superpone con mi horario?', a: 'La grabación queda disponible 48 horas después del live para todos los inscriptos, sin costo extra.' },
  { q: '¿Puedo regalar un curso?', a: 'Sí, usá el botón Regalar en el detalle del curso para comprar un acceso como regalo.' },
]

// ── Tab types ─────────────────────────────────────────────────────

type TabKey = 'desc' | 'cont' | 'inst' | 'revs' | 'trl'

// ── Nivel badge ───────────────────────────────────────────────────

const NIVEL_STYLES: Record<NivelCurso, { bg: string; color: string; label: string }> = {
  principiante: { bg: 'rgba(14,107,92,.72)',   color: '#A8F0E4', label: 'Principiante' },
  intermedio:   { bg: 'rgba(100,140,120,.68)', color: '#D4F0E6', label: 'Intermedio' },
  avanzado:     { bg: 'rgba(239,68,68,.72)',   color: '#FECACA', label: 'Avanzado' },
}

// ── WhatsApp Float ────────────────────────────────────────────────

function WhatsAppFloat() {
  return (
    <motion.a
      href="https://wa.me/5491112345678"
      target="_blank"
      rel="noopener noreferrer"
      aria-label="WhatsApp"
      className="fixed bottom-[22px] right-[22px] z-[500] w-[52px] h-[52px] rounded-full flex items-center justify-center group"
      style={{ background: '#25D366', boxShadow: '0 4px 18px rgba(37,211,102,.38)' }}
      initial={{ opacity: 0, scale: .6, y: 16 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ delay: 1.2, duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.95 }}
    >
      <span
        className="absolute right-[calc(100%+9px)] bottom-1/2 translate-y-1/2 whitespace-nowrap rounded-lg px-[11px] py-[5px] text-xs pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity"
        style={{ background: 'var(--bg-2)', border: '1px solid var(--line-s)', color: 'var(--text-1)', boxShadow: '0 4px 16px rgba(0,0,0,.3)' }}
      >
        Consultas? Escribinos
      </span>
      <svg viewBox="0 0 24 24" fill="#fff" className="w-[26px] h-[26px]">
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z" />
      </svg>
    </motion.a>
  )
}

// ── Toast ─────────────────────────────────────────────────────────

function Toast({ msg, visible }: { msg: string; visible: boolean }) {
  return (
    <motion.div
      className="fixed bottom-7 left-1/2 -translate-x-1/2 z-[600] font-medium rounded-[10px] border px-4 py-[9px] text-[13px] whitespace-nowrap pointer-events-none"
      style={{ background: 'var(--bg-2)', borderColor: 'var(--line-s)', color: 'var(--text-1)', boxShadow: '0 8px 24px rgba(0,0,0,.4)' }}
      initial={{ opacity: 0, y: 16, x: '-50%' }}
      animate={{ opacity: visible ? 1 : 0, y: visible ? 0 : 16, x: '-50%' }}
      transition={{ duration: 0.17, ease: [0.23, 1, 0.32, 1] }}
    >
      {msg}
    </motion.div>
  )
}

// ── FAQ Modal ─────────────────────────────────────────────────────

function FAQModal({ onClose }: { onClose: () => void }) {
  const [openIdx, setOpenIdx] = useState<number | null>(null)

  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  return (
    <motion.div
      className="fixed inset-0 z-[400] flex items-center justify-center p-5"
      style={{ background: 'rgba(4,10,15,.82)', backdropFilter: 'blur(6px)' }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className="w-full max-w-[580px] max-h-[84vh] overflow-y-auto rounded-[20px] border p-7"
        style={{ background: '#0C1E2C', borderColor: 'var(--line-s)' }}
        initial={{ opacity: 0, scale: .95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: .95 }}
        transition={{ duration: 0.26, ease: [0.23, 1, 0.32, 1] }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-[22px]">
          <h2 className="font-display font-bold text-xl" style={{ color: 'var(--text-1)' }}>Preguntas frecuentes</h2>
          <button
            onClick={onClose}
            className="w-[30px] h-[30px] rounded-lg flex items-center justify-center transition-colors"
            style={{ color: 'var(--text-3)' }}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Accordion */}
        {FAQ_ITEMS.map((item, i) => (
          <div
            key={i}
            className="rounded-[11px] border mb-[7px] overflow-hidden transition-colors"
            style={{ borderColor: openIdx === i ? 'var(--line-s)' : 'var(--line)' }}
          >
            <button
              className="w-full flex items-center justify-between px-4 py-3 text-left min-h-12 transition-colors"
              style={{ background: openIdx === i ? 'rgba(255,255,255,.05)' : 'var(--card)' }}
              onClick={() => setOpenIdx(openIdx === i ? null : i)}
            >
              <span className="font-display font-semibold text-sm" style={{ color: 'var(--text-1)' }}>{item.q}</span>
              <ChevronIcon open={openIdx === i} />
            </button>
            <AnimatePresence initial={false}>
              {openIdx === i && (
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: 'auto' }}
                  exit={{ height: 0 }}
                  transition={{ duration: 0.28, ease: [0.23, 1, 0.32, 1] }}
                  className="overflow-hidden"
                >
                  <p className="px-4 py-[14px] text-sm leading-[1.7]" style={{ color: 'var(--text-2)' }}>
                    {item.a}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}
      </motion.div>
    </motion.div>
  )
}

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      className="w-[14px] h-[14px] shrink-0 transition-transform duration-[220ms]"
      style={{ color: 'var(--text-3)', transform: open ? 'rotate(180deg)' : 'rotate(0deg)', transitionTimingFunction: 'cubic-bezier(0.23,1,0.32,1)' }}
      viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"
    >
      <polyline points="6 9 12 15 18 9" />
    </svg>
  )
}

// ── Curriculum Accordion ──────────────────────────────────────────

function CurriculumAccordion({ modules, isVivencial }: { modules: Module[]; isVivencial: boolean }) {
  const [openIdx, setOpenIdx] = useState<number>(0)
  const unit = isVivencial ? 'actividades' : 'lecciones'

  return (
    <div>
      {[...modules].sort((a, b) => a.orden - b.orden).map((mod, mi) => (
        <div
          key={mod.id}
          className="rounded-[11px] border mb-[7px] overflow-hidden transition-colors"
          style={{ borderColor: openIdx === mi ? '#C5D4D8' : '#E2EAEC' }}
        >
          <button
            className="w-full flex items-center justify-between px-4 py-3 text-left min-h-12 transition-colors"
            style={{ background: openIdx === mi ? 'rgba(0,0,0,.025)' : 'transparent' }}
            onClick={() => setOpenIdx(openIdx === mi ? -1 : mi)}
          >
            <div>
              <div className="font-display font-bold text-sm" style={{ color: '#0A1E29' }}>{mod.titulo}</div>
              {mod.descripcion && (
                <div className="text-xs mt-[3px]" style={{ color: 'var(--text-3)', lineHeight: 1.5 }}>{mod.descripcion}</div>
              )}
              <div className="font-mono mt-[2px]" style={{ fontSize: '9px', color: 'var(--text-3)' }}>
                {(mod.lessons ?? []).length} {unit}
              </div>
            </div>
            <ChevronIcon open={openIdx === mi} />
          </button>
          <AnimatePresence initial={false}>
            {openIdx === mi && (
              <motion.div
                initial={{ height: 0 }}
                animate={{ height: 'auto' }}
                exit={{ height: 0 }}
                transition={{ duration: 0.28, ease: [0.23, 1, 0.32, 1] }}
                className="overflow-hidden"
              >
                {[...(mod.lessons ?? [])].sort((a, b) => a.orden - b.orden).map((lesson, li) => (
                  <LessonRow key={lesson.id} lesson={lesson} isFirst={mi === 0 && li === 0} />
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      ))}
    </div>
  )
}

// Estado de una lección en vivo para el badge del listado (solo si tiene fecha programada).
function LiveLessonBadge({ lesson }: { lesson: Lesson }) {
  if (!lesson.fecha_vivo) return null
  const st = liveLessonState(lesson)
  if (st === 'en_vivo') {
    return <span className="font-mono text-[8.5px] tracking-[.05em] px-1.5 py-0.5 rounded" style={{ background: 'rgba(239,68,68,0.14)', color: '#DC2626' }}>EN VIVO AHORA</span>
  }
  if (st === 'programada') {
    const f = new Date(lesson.fecha_vivo).toLocaleDateString('es-AR', { day: 'numeric', month: 'short' })
    return <span className="font-mono text-[8.5px] tracking-[.05em] px-1.5 py-0.5 rounded" style={{ background: 'var(--primary-s)', color: 'var(--primary-l)' }}>PRÓXIMO · {f}</span>
  }
  if (st === 'grabacion_pendiente') {
    return <span className="font-mono text-[8.5px] tracking-[.05em]" style={{ color: 'var(--text-3)' }}>GRABACIÓN PRONTO</span>
  }
  return <span className="font-mono text-[8.5px] tracking-[.05em]" style={{ color: 'var(--text-3)' }}>GRABADO DISPONIBLE</span>
}

function LessonRow({ lesson, isFirst }: { lesson: Lesson; isFirst: boolean }) {
  const dur = lesson.duracion_segundos ? `${Math.floor(lesson.duracion_segundos / 60)} min` : ''
  return (
    <div className="flex items-center gap-[10px] px-4 py-[9px] min-h-10 transition-colors hover:bg-black/[.025]">
      <div className="w-[14px] h-[14px] shrink-0 flex items-center justify-center">
        {isFirst || lesson.es_preview
          ? <Play className="w-[13px] h-[13px]" style={{ color: 'var(--primary-l)' }} />
          : <Lock className="w-[13px] h-[13px]" style={{ color: 'var(--text-3)' }} />
        }
      </div>
      <span className="flex-1 text-sm" style={{ color: '#1A3040' }}>{lesson.titulo}</span>
      <LiveLessonBadge lesson={lesson} />
      {(isFirst || lesson.es_preview) && (
        <span className="font-mono text-[8.5px] tracking-[.05em]" style={{ color: 'var(--primary-l)' }}>GRATIS</span>
      )}
      {dur && <span className="font-mono text-xs shrink-0" style={{ color: 'var(--text-3)' }}>{dur}</span>}
    </div>
  )
}

// ── Reviews (reseñas reales, desplegable con promedio) ───────────

function initialsOf(name: string): string {
  return name.split(' ').filter(Boolean).slice(0, 2).map(w => w[0]?.toUpperCase() ?? '').join('') || 'A'
}

function Reviews({ course }: { course: Course }) {
  const { data: reviews = [], isLoading } = useReviews(course.id)
  const [open, setOpen] = useState(true)
  const avg = course.rating_avg || 0
  const count = course.rating_count || reviews.length

  if (!isLoading && reviews.length === 0) {
    return (
      <p className="text-sm" style={{ color: 'var(--text-3)' }}>
        Todavía no hay reseñas publicadas. Sé la primera persona en dejar la tuya al completar el curso.
      </p>
    )
  }

  return (
    <div>
      {/* Resumen desplegable */}
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between rounded-[11px] border px-4 py-3 mb-[9px]"
        style={{ borderColor: '#E2EAEC', background: 'rgba(0,0,0,.02)' }}
      >
        <div className="flex items-center gap-3">
          <span className="font-display font-bold text-2xl" style={{ color: '#0A1E29' }}>{avg.toFixed(1)}</span>
          <div className="text-left">
            <div style={{ color: 'var(--gold)', fontSize: '13px' }}>{'★'.repeat(Math.round(avg))}<span style={{ color: '#C5D4D8' }}>{'★'.repeat(5 - Math.round(avg))}</span></div>
            <div className="font-mono text-[10px] tracking-[.05em] uppercase" style={{ color: 'var(--text-3)' }}>
              {count} {count === 1 ? 'reseña' : 'reseñas'}
            </div>
          </div>
        </div>
        <ChevronIcon open={open} />
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.28, ease: [0.23, 1, 0.32, 1] }}
            className="overflow-hidden"
          >
            <div className="space-y-[9px] pt-1">
              {reviews.map(r => {
                const name = displayName(r.profile)
                return (
                  <div key={r.id} className="rounded-[11px] border p-4" style={{ background: 'rgba(0,0,0,.03)', borderColor: '#E2EAEC' }}>
                    <div className="flex items-center gap-[9px] mb-[9px]">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center font-display font-bold text-[11px] shrink-0" style={{ background: 'var(--primary)', color: '#0A1E29' }}>
                        {initialsOf(name)}
                      </div>
                      <div>
                        <div className="font-semibold text-sm" style={{ color: '#0A1E29' }}>{name}</div>
                        <div style={{ color: 'var(--gold)', fontSize: '11px' }}>{'★'.repeat(r.rating)}</div>
                      </div>
                    </div>
                    {r.comentario && <p className="text-sm leading-[1.65]" style={{ color: '#1A3040' }}>{r.comentario}</p>}
                    {r.respuesta && (
                      <div className="mt-3 pl-3 border-l-2" style={{ borderColor: 'var(--primary)' }}>
                        <div className="font-semibold text-xs mb-0.5" style={{ color: 'var(--primary)' }}>Respuesta de Yesica</div>
                        <p className="text-sm leading-[1.6]" style={{ color: '#1A3040' }}>{r.respuesta}</p>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ── CTA Card ──────────────────────────────────────────────────────

interface CTACardProps {
  course:         Course
  enrolled:       boolean
  paymentLoading: boolean
  paymentError:   string | null
  wishlisted:     boolean
  cuotasMax:      number
  onEnroll:       () => void
  onWishlist:     () => void
  onGift:         () => void
  onFAQ:          () => void
}

function CTACard({ course, enrolled, paymentLoading, paymentError, wishlisted, cuotasMax, onEnroll, onWishlist, onGift, onFAQ }: CTACardProps) {
  const isVivencial = course.tipo === 'vivencial'
  const liveState   = courseLiveState(course)
  const isLive      = liveState === 'upcoming' || liveState === 'live'  // en vivo real; ya grabado = curso normal
  const isFree      = course.tipo_acceso === 'gratuito' || course.precio_ars === 0

  const precioTarjeta = Number(course.precio_ars) || 0
  const precioTransf  = Number(course.precio_transferencia_ars) || 0
  const cuotaValor    = cuotasMax > 0 ? Math.round(precioTarjeta / cuotasMax) : 0

  const ctaLabel = enrolled ? 'Continuar aprendiendo'
    : isFree      ? 'Acceder gratis'
    : isVivencial ? 'Reservar con seña'
    : isLive      ? 'Reservar'
    : 'Comprar curso'

  return (
    <div
      className="rounded-[18px] border p-[22px]"
      style={{
        background:   'var(--bg-2)',
        borderColor:  'var(--line-s)',
        boxShadow:    '0 0 0 1px rgba(245,243,236,.05),0 4px 16px rgba(0,0,0,.32),0 20px 56px rgba(0,0,0,.5),0 0 72px rgba(14,107,92,.07)',
      }}
    >
      {/* Price */}
      {isFree ? (
        <div>
          <div className="font-display font-bold" style={{ fontSize: '1.95rem', color: 'var(--primary-l)', letterSpacing: '-.02em', lineHeight: 1.1 }}>GRATIS</div>
          <p className="text-xs mt-[3px] mb-3" style={{ color: 'var(--text-3)' }}>Sin costo, sin tarjeta</p>
        </div>
      ) : isVivencial && course.vivencial_precio_seña_ars ? (
        <div>
          <div className="font-display font-bold" style={{ fontSize: '1.7rem', color: 'var(--text-1)' }}>
            Seña {formatARS(course.vivencial_precio_seña_ars)}
          </div>
          <p className="text-xs mt-[3px] mb-3" style={{ color: 'var(--text-3)' }}>
            Total: <strong style={{ color: 'var(--text-2)' }}>{formatARS(course.precio_ars)}</strong>
          </p>
        </div>
      ) : (
        <div className="mb-3">
          {precioTarjeta > precioTransf && (
            <div className="font-mono text-sm" style={{ color: 'var(--text-3)', textDecoration: 'line-through' }}>
              {formatARS(precioTarjeta)}
            </div>
          )}
          <div className="font-display font-bold" style={{ fontSize: '1.95rem', color: 'var(--text-1)', letterSpacing: '-.02em', lineHeight: 1.1 }}>
            {formatARS(precioTransf || precioTarjeta)}
          </div>
          <p className="text-xs mt-[3px]" style={{ color: 'var(--primary-l)' }}>Pagando por transferencia</p>
          {cuotaValor > 0 && (
            <p className="text-xs mt-[2px]" style={{ color: 'var(--text-3)' }}>
              o en {cuotasMax} cuotas de {formatARS(cuotaValor)} sin interés
            </p>
          )}
        </div>
      )}

      {/* Buy */}
      <motion.button
        whileTap={{ scale: 0.97 }}
        onClick={onEnroll}
        disabled={paymentLoading}
        className="w-full flex items-center justify-center font-semibold rounded-[10px] min-h-12 text-sm transition-all"
        style={{ background: 'var(--neon)', color: '#0A1E29', fontSize: '14.5px' }}
      >
        {paymentLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : ctaLabel}
      </motion.button>

      {paymentError && (
        <p className="text-xs text-center mt-2" style={{ color: 'rgb(248 113 113)' }}>{paymentError}</p>
      )}

      {/* Gift */}
      <motion.button
        whileTap={{ scale: 0.97 }}
        onClick={onGift}
        className="w-full flex items-center justify-center gap-2 min-h-[42px] rounded-[10px] border text-[13px] font-medium mt-[7px] transition-colors"
        style={{ background: 'transparent', borderColor: 'var(--line-s)', color: 'var(--text-2)' }}
      >
        🎁 Regalar este curso
      </motion.button>

      {/* FAQ */}
      <motion.button
        whileTap={{ scale: 0.98 }}
        onClick={onFAQ}
        className="w-full flex items-center justify-center gap-2 min-h-11 rounded-[10px] border text-[13px] font-medium mt-[10px] transition-colors"
        style={{ background: 'var(--card)', borderColor: 'var(--line)', color: 'var(--text-2)' }}
      >
        Preguntas frecuentes
      </motion.button>

      <p className="text-center mt-2" style={{ fontSize: '.73rem', color: 'var(--text-3)' }}>
        ¿Sin cuenta?{' '}
        <span
          className="cursor-pointer underline"
          style={{ color: 'var(--primary-l)' }}
          onClick={() => window.location.href = '/registro'}
        >
          Registrate gratis
        </span>
      </p>

      {/* Separator */}
      <div className="my-[14px]" style={{ height: '1px', background: 'var(--line)' }} />

      {/* Features */}
      {[
        'Acceso de por vida',
        'Recursos descargables',
        'Certificado al completar',
      ].map(f => (
        <div key={f} className="flex items-center gap-2 text-sm mb-[7px]" style={{ color: 'var(--text-2)' }}>
          <Check className="w-[13px] h-[13px] shrink-0" style={{ color: 'var(--primary-l)' }} strokeWidth={2.5} />
          {f}
        </div>
      ))}

      {/* Wishlist */}
      <motion.button
        whileTap={{ scale: 0.9 }}
        onClick={onWishlist}
        className="w-full flex items-center justify-center gap-[6px] min-h-9 rounded-[10px] border text-xs font-medium mt-3 transition-all"
        style={{
          borderColor: wishlisted ? '#ef4444' : 'var(--line)',
          background:  wishlisted ? 'rgba(239,68,68,.1)' : 'transparent',
          color:       wishlisted ? '#ef4444' : 'var(--text-3)',
        }}
      >
        <Heart className="w-3.5 h-3.5" style={{ fill: wishlisted ? '#ef4444' : 'none' }} />
        {wishlisted ? 'Guardado en favoritos' : 'Guardar en favoritos'}
      </motion.button>
    </div>
  )
}

// ── Payment method modal ──────────────────────────────────────────

function PaymentMethodModal({ course, cuotasMax, loading, onSelect, onClose }: {
  course: Course
  cuotasMax: number
  loading: boolean
  onSelect: (metodo: MetodoPago) => void
  onClose: () => void
}) {
  const precioTarjeta = Number(course.precio_ars) || 0
  const precioTransf  = Number(course.precio_transferencia_ars) || 0
  const cuotaValor    = cuotasMax > 0 ? Math.round(precioTarjeta / cuotasMax) : 0

  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  return (
    <motion.div
      className="fixed inset-0 z-[400] flex items-center justify-center p-5"
      style={{ background: 'rgba(4,10,15,.82)', backdropFilter: 'blur(6px)' }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className="w-full max-w-[440px] rounded-[20px] border p-7"
        style={{ background: '#0C1E2C', borderColor: 'var(--line-s)' }}
        initial={{ opacity: 0, scale: .95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: .95 }}
        transition={{ duration: 0.24, ease: [0.23, 1, 0.32, 1] }}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-1">
          <h2 className="font-display font-bold text-lg" style={{ color: 'var(--text-1)' }}>Elegí cómo pagar</h2>
          <button onClick={onClose} aria-label="Cerrar" className="w-[30px] h-[30px] rounded-lg flex items-center justify-center" style={{ color: 'var(--text-3)' }}>
            <X className="w-4 h-4" />
          </button>
        </div>
        <p className="text-sm mb-5" style={{ color: 'var(--text-3)' }}>{course.titulo}</p>

        <div className="space-y-3">
          {/* Transferencia */}
          <button
            onClick={() => onSelect('transferencia')}
            disabled={loading}
            className="w-full text-left rounded-[14px] border p-4 transition-colors disabled:opacity-60"
            style={{ borderColor: 'var(--primary)', background: 'rgba(14,107,92,.08)' }}
          >
            <div className="flex items-center justify-between">
              <span className="font-display font-semibold text-sm" style={{ color: 'var(--text-1)' }}>Transferencia</span>
              <span className="font-mono text-[10px] px-2 py-[3px] rounded-full" style={{ background: 'rgba(14,107,92,.2)', color: 'var(--primary-l)' }}>MEJOR PRECIO</span>
            </div>
            <div className="font-display font-bold mt-1" style={{ fontSize: '1.4rem', color: 'var(--text-1)' }}>{formatARS(precioTransf || precioTarjeta)}</div>
            <div className="text-xs mt-0.5" style={{ color: 'var(--text-3)' }}>Pago único</div>
          </button>

          {/* Tarjeta */}
          <button
            onClick={() => onSelect('tarjeta')}
            disabled={loading}
            className="w-full text-left rounded-[14px] border p-4 transition-colors disabled:opacity-60"
            style={{ borderColor: 'var(--line-s)', background: 'var(--card)' }}
          >
            <span className="font-display font-semibold text-sm" style={{ color: 'var(--text-1)' }}>Tarjeta</span>
            <div className="font-display font-bold mt-1" style={{ fontSize: '1.4rem', color: 'var(--text-1)' }}>{cuotasMax}x {formatARS(cuotaValor)}</div>
            <div className="text-xs mt-0.5" style={{ color: 'var(--text-3)' }}>Sin interés · total {formatARS(precioTarjeta)}</div>
          </button>
        </div>

        {loading && (
          <div className="flex items-center justify-center gap-2 mt-5 text-sm" style={{ color: 'var(--text-3)' }}>
            <Loader2 className="w-4 h-4 animate-spin" /> Redirigiendo a Mercado Pago…
          </div>
        )}
      </motion.div>
    </motion.div>
  )
}

// ── Main CourseDetail ─────────────────────────────────────────────

export default function CourseDetail() {
  const { slug } = useParams<{ slug: string }>()
  const [searchParams, setSearchParams] = useSearchParams()
  const preview = searchParams.get('preview') === '1'
  const { user } = useAuth()
  const navigate  = useNavigate()

  const [activeTab, setActiveTab]   = useState<TabKey>('desc')
  const [showFAQ, setShowFAQ]       = useState(false)
  const [copiedLink, setCopiedLink] = useState(false)
  const [toast, setToast]           = useState<{ msg: string; visible: boolean }>({ msg: '', visible: false })
  const [paymentBanner, setPaymentBanner] = useState<'pending' | 'error' | null>(null)

  const { data: course, isLoading, error } = useCourseDetail(slug ?? '', preview)
  const { data: wishlist = [] }            = useWishlist(user?.id)
  const { mutate: toggleWishlist }         = useToggleWishlist(user?.id)
  const { data: enrollments = [] }         = useMyEnrollments(user?.id)
  const { data: pricing }                  = usePricingConfig()
  const { initiate, loading: paymentLoading, error: paymentError } = useCoursePayment()

  const [showPayModal, setShowPayModal] = useState(false)
  const cuotasMax = pricing?.cuotasMax ?? 6

  const wishlisted = course ? wishlist.includes(course.id) : false
  const enrolled   = course ? enrollments.some(e => e.course_id === course.id && e.activo) : false

  const showToast = (msg: string) => {
    setToast({ msg, visible: true })
    setTimeout(() => setToast(prev => ({ ...prev, visible: false })), 2400)
  }

  const handleEnroll = useCallback(() => {
    // Gate de compra: sin sesión, al login con retorno al mismo curso.
    if (!user) { navigate(loginRedirect(`/cursos/${slug}`)); return }
    if (course?.tipo_acceso === 'gratuito' || enrolled) { navigate(`/cursos/${slug}/aprender`); return }
    // Curso pago: elegir método de pago antes de ir a Mercado Pago.
    setShowPayModal(true)
  }, [user, course, enrolled, slug, navigate])

  const startPayment = useCallback(async (metodo: MetodoPago) => {
    if (!course) return
    const initPoint = await initiate(course.id, metodo)
    if (initPoint) window.location.href = initPoint
  }, [course, initiate])

  const handleWishlist = useCallback(() => {
    if (!user) { navigate('/login'); return }
    toggleWishlist({ courseId: course!.id, isWishlisted: wishlisted })
  }, [user, course, wishlisted, navigate, toggleWishlist])

  const handleCopyLink = async () => {
    await navigator.clipboard.writeText(`${window.location.origin}/cursos/${slug}`)
    setCopiedLink(true)
    showToast('Link copiado!')
    setTimeout(() => setCopiedLink(false), 2000)
  }

  const handleGift = () => showToast('Función de regalo próxima!')

  // Vuelta desde Mercado Pago sin acreditar: mostrar banner acorde y limpiar los params.
  useEffect(() => {
    const p = searchParams.get('payment')
    if (p !== 'pending' && p !== 'error') return
    setPaymentBanner(p)
    setSearchParams(prev => {
      const next = new URLSearchParams(prev)
      for (const k of ['payment', 'payment_id', 'collection_id', 'status', 'collection_status', 'external_reference', 'preference_id', 'payment_type', 'merchant_order_id', 'site_id', 'processing_mode', 'merchant_account_id']) next.delete(k)
      return next
    }, { replace: true })
  }, [searchParams, setSearchParams])

  // Derive tab list based on course type
  const tabs: { key: TabKey; label: string }[] = [
    { key: 'desc', label: 'Descripción' },
    { key: 'cont', label: 'Programa' },
    { key: 'inst', label: 'Instructor' },
    { key: 'revs', label: 'Reseñas' },
    ...(course?.trailer_url ? [{ key: 'trl' as TabKey, label: 'Trailer' }] : []),
  ]

  // ── Loading ──
  if (isLoading) {
    return (
      <div className="min-h-screen" style={{ background: 'var(--bg)' }}>
        <Header />
        <div className="flex items-center justify-center py-40">
          <div className="w-8 h-8 border-2 rounded-full animate-spin" style={{ borderColor: 'var(--primary)', borderTopColor: 'transparent' }} />
        </div>
      </div>
    )
  }

  // ── Error ──
  if (error || !course) {
    return (
      <div className="min-h-screen" style={{ background: 'var(--bg)' }}>
        <Header />
        <div className="flex flex-col items-center justify-center py-32 text-center">
          <p className="text-lg mb-4" style={{ color: 'var(--text-3)' }}>Curso no encontrado</p>
          <button onClick={() => navigate('/cursos')} className="text-sm font-medium" style={{ color: 'var(--primary-l)' }}>
            Ver todos los cursos
          </button>
        </div>
      </div>
    )
  }

  const isVivencial = course.tipo === 'vivencial'
  const isEbook     = course.tipo === 'ebook'
  const liveState   = courseLiveState(course)
  const isLive      = liveState === 'upcoming' || liveState === 'live'
  const isFree      = course.tipo_acceso === 'gratuito' || course.precio_ars === 0
  // Fallback seguro: nivel null (ej. vivencial) o no contemplado → sin badge, sin romper el render.
  const nivelStyle  = course.nivel ? NIVEL_STYLES[course.nivel] : undefined
  const precioTarjeta = Number(course.precio_ars) || 0
  const precioTransf  = Number(course.precio_transferencia_ars) || 0

  const totalLessons = course.modules?.reduce((a, m) => a + (m.lessons?.length ?? 0), 0) ?? 0
  const contentUnit  = isVivencial ? 'actividades' : 'lecciones'

  const ctaLabel = enrolled ? 'Continuar aprendiendo'
    : isFree      ? 'Acceder gratis'
    : isVivencial ? 'Reservar con seña'
    : isLive      ? 'Reservar'
    : 'Comprar'

  const ctaProps: CTACardProps = {
    course, enrolled, paymentLoading,
    paymentError,
    wishlisted,
    cuotasMax,
    onEnroll:  handleEnroll,
    onWishlist: handleWishlist,
    onGift:    handleGift,
    onFAQ:     () => setShowFAQ(true),
  }

  return (
    <div className="min-h-screen pb-24 md:pb-0" style={{ background: 'var(--bg)' }}>
      <Header />

      {preview && (
        <div style={{ position: 'sticky', top: 0, zIndex: 60, background: '#C99A3A', color: '#0A1E29', textAlign: 'center', padding: '8px 16px', fontSize: 13, fontWeight: 600, fontFamily: 'var(--font-body, Inter, sans-serif)' }}>
          Modo preview — así se va a ver el curso publicado. {!course.publicado && 'Todavía está en borrador.'}
        </div>
      )}

      {paymentBanner && (
        <div
          className="flex items-center gap-3 px-4 py-3 max-w-[1200px] mx-auto mt-4 rounded-xl border"
          style={
            paymentBanner === 'pending'
              ? { background: 'rgba(201,154,58,.1)', borderColor: 'rgba(201,154,58,.35)' }
              : { background: 'rgba(239,68,68,.08)', borderColor: 'rgba(239,68,68,.35)' }
          }
        >
          {paymentBanner === 'pending'
            ? <Loader2 className="w-[18px] h-[18px] shrink-0 animate-spin" style={{ color: 'var(--gold)' }} />
            : <AlertCircle className="w-[18px] h-[18px] shrink-0" style={{ color: '#f87171' }} />
          }
          <p className="flex-1 text-sm" style={{ color: 'var(--text-2)' }}>
            {paymentBanner === 'pending'
              ? 'Tu pago está siendo procesado. Te avisamos apenas se acredite.'
              : 'Hubo un problema con el pago.'}
          </p>
          {paymentBanner === 'error' && (
            <button
              onClick={() => { setPaymentBanner(null); void handleEnroll() }}
              disabled={paymentLoading}
              className="shrink-0 font-semibold rounded-lg px-4 py-2 text-[13px]"
              style={{ background: 'var(--neon)', color: '#0A1E29' }}
            >
              Reintentar compra
            </button>
          )}
          <button
            onClick={() => setPaymentBanner(null)}
            aria-label="Cerrar"
            className="shrink-0 w-7 h-7 flex items-center justify-center rounded-lg"
            style={{ color: 'var(--text-3)' }}
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ── Hero ── */}
      <div className="relative overflow-hidden" style={{ height: 'clamp(240px,40vw,400px)' }}>
        {course.thumbnail_url && (
          <img
            src={course.thumbnail_url}
            alt={course.titulo}
            className="w-full h-full object-cover block"
            style={{ background: '#162F3E' }}
          />
        )}
        <div
          className="absolute inset-0"
          style={{ background: 'linear-gradient(to bottom,rgba(6,13,20,.2) 0%,rgba(6,13,20,.6) 55%,rgba(6,13,20,.97) 100%)' }}
        />

        <div className="absolute bottom-[28px] left-0 right-0 max-w-[1200px] mx-auto px-[22px]">
          {/* Back */}
          <motion.button
            onClick={() => navigate('/cursos')}
            className="inline-flex items-center gap-[6px] mb-[11px] py-[5px] transition-colors group"
            style={{ fontFamily: 'var(--font-mono)', fontSize: '9.5px', letterSpacing: '.06em', textTransform: 'uppercase', color: 'var(--text-3)' }}
            whileTap={{ scale: 0.97 }}
          >
            <ArrowLeft className="w-[13px] h-[13px] transition-transform group-hover:-translate-x-[3px]" />
            Volver a cursos
          </motion.button>

          {/* Title */}
          <h1
            className="font-display font-bold leading-[1.06] tracking-[-0.02em] max-w-[700px]"
            style={{ fontSize: 'clamp(1.45rem,4vw,2.4rem)', color: 'var(--text-1)' }}
          >
            {course.titulo}
          </h1>

          {/* Meta */}
          <div className="flex items-center gap-[14px] mt-[9px] flex-wrap">
            {course.rating_avg > 0 && (
              <div className="flex items-center gap-1 font-mono" style={{ fontSize: '10px', color: 'var(--text-2)' }}>
                <span style={{ color: 'var(--text-1)', fontSize: '11px' }}>{stars(course.rating_avg)}</span>
                <span className="ml-1">{course.rating_avg.toFixed(1)}</span>
              </div>
            )}
            {course.total_alumnos > 0 && (
              <div className="flex items-center gap-1 font-mono" style={{ fontSize: '10px', color: 'var(--text-2)' }}>
                <Users className="w-3 h-3" />
                {course.total_alumnos} alumnos
              </div>
            )}
            {isEbook ? (
              course.total_paginas ? (
                <div className="flex items-center gap-1 font-mono" style={{ fontSize: '10px', color: 'var(--text-2)' }}>
                  <BookOpen className="w-3 h-3" />
                  {course.total_paginas} páginas
                </div>
              ) : null
            ) : course.duracion_total_minutos > 0 ? (
              <div className="flex items-center gap-1 font-mono" style={{ fontSize: '10px', color: 'var(--text-2)' }}>
                <Clock className="w-3 h-3" />
                {formatDuration(course.duracion_total_minutos)}
              </div>
            ) : null}
            {course.instructor && (
              <div className="font-mono" style={{ fontSize: '10px', color: 'var(--text-2)' }}>
                Instructor: <strong style={{ color: 'var(--text-1)', marginLeft: '3px' }}>{course.instructor.nombre}</strong>
              </div>
            )}
            {/* Nivel badge */}
            {nivelStyle && (
              <span
                className="font-mono text-[9px] tracking-[.07em] uppercase px-[8px] py-[3px] rounded-[4px]"
                style={{ background: nivelStyle.bg, color: nivelStyle.color }}
              >
                {nivelStyle.label}
              </span>
            )}
          </div>

          {/* Copy link */}
          <div className="flex items-center gap-[7px] mt-3">
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={() => { void handleCopyLink() }}
              className="flex items-center gap-[5px] py-[5px] px-[10px] rounded-[6px] border transition-colors"
              style={{
                fontFamily: 'var(--font-mono)', fontSize: '9px', letterSpacing: '.06em', textTransform: 'uppercase',
                color: copiedLink ? 'var(--primary-l)' : 'var(--text-3)',
                borderColor: copiedLink ? 'var(--primary-l)' : 'var(--line)',
                background: 'rgba(6,13,20,.5)', backdropFilter: 'blur(8px)',
              }}
            >
              {copiedLink
                ? <><CheckCircle2 className="w-3 h-3" />Copiado</>
                : <><Copy className="w-3 h-3" />Copiar link</>
              }
            </motion.button>
          </div>
        </div>
      </div>

      {/* ── White content section ── */}
      <div style={{ background: '#F2F5F4', paddingBottom: 0 }}>
        <div className="max-w-[1200px] mx-auto px-0 md:px-[22px]">
          <div
            className="rounded-t-2xl p-5 md:p-7"
            style={{ background: '#fff', minHeight: '480px' }}
          >
            {/* Two-column layout */}
            <div className="grid grid-cols-1 md:grid-cols-[1fr_296px] gap-10 items-start">
              {/* Left: Tabs */}
              <div>
                {/* Tab bar with sliding indicator */}
                <div className="relative flex overflow-x-auto mb-5" style={{ borderBottom: '1px solid #E2EAEC', scrollbarWidth: 'none' }}>
                  {tabs.map(tab => (
                    <button
                      key={tab.key}
                      onClick={() => setActiveTab(tab.key)}
                      className="relative font-medium whitespace-nowrap min-h-11 px-[17px] py-[10px] border-none bg-transparent cursor-pointer transition-colors"
                      style={{ fontSize: '13px', color: activeTab === tab.key ? 'var(--primary)' : '#6A8590' }}
                    >
                      {tab.label}
                      {activeTab === tab.key && (
                        <motion.div
                          layoutId="tab-indicator"
                          className="absolute bottom-[-1px] left-0 right-0 h-[2px] rounded-full"
                          style={{ background: 'var(--primary)' }}
                          transition={{ duration: 0.22, ease: [0.23, 1, 0.32, 1] }}
                        />
                      )}
                    </button>
                  ))}
                </div>

                {/* Tab content */}
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeTab}
                    initial={{ opacity: 0, y: 7 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.24, ease: [0.23, 1, 0.32, 1] }}
                  >
                    {/* Descripción */}
                    {activeTab === 'desc' && (
                      <div>
                        {/* Clase en vivo — Próxima / En vivo ahora. Si ya pasó y hay grabación, no se muestra (curso normal). */}
                        {(liveState === 'upcoming' || liveState === 'live') && course.live_date && (
                          <div className="mb-4 rounded-xl border p-4 flex items-center gap-3" style={{ borderColor: 'rgba(239,68,68,.3)', background: 'rgba(239,68,68,.04)' }}>
                            {liveState === 'live'
                              ? <span className="w-2.5 h-2.5 rounded-full shrink-0 animate-pulse" style={{ background: '#EF4444', boxShadow: '0 0 0 4px rgba(239,68,68,.18)' }} />
                              : <CalendarDays className="w-5 h-5 shrink-0" style={{ color: '#EF4444' }} />}
                            <div>
                              <p className="font-mono text-[10px] tracking-[.08em] uppercase mb-0.5" style={{ color: '#EF4444', fontWeight: 600 }}>
                                {liveState === 'live' ? 'En vivo ahora' : 'Próxima clase en vivo'}
                              </p>
                              <p className="font-display font-bold" style={{ color: '#0A1E29' }}>
                                {new Date(course.live_date).toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' })}
                              </p>
                              <p className="font-mono text-xs mt-0.5" style={{ color: 'var(--text-3)' }}>
                                {new Date(course.live_date).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}h
                                {course.live_duration_minutes ? ` · ${formatDuration(course.live_duration_minutes)}` : ''}
                              </p>
                            </div>
                          </div>
                        )}

                        {/* Vivencial dates */}
                        {isVivencial && (course.vivencial_fecha_salida || course.vivencial_ciudad_salida) && (
                          <div className="mb-4 grid grid-cols-2 gap-3">
                            {course.vivencial_fecha_salida && (
                              <div className="rounded-lg border p-3" style={{ borderColor: '#E2EAEC', background: '#FAFBFC' }}>
                                <p className="font-mono text-[9px] tracking-[.06em] uppercase mb-1" style={{ color: 'var(--text-3)' }}>Salida</p>
                                <p className="font-semibold text-sm" style={{ color: '#0A1E29' }}>
                                  {new Date(course.vivencial_fecha_salida).toLocaleDateString('es-AR', { day: 'numeric', month: 'long' })}
                                </p>
                              </div>
                            )}
                            {course.vivencial_fecha_regreso && (
                              <div className="rounded-lg border p-3" style={{ borderColor: '#E2EAEC', background: '#FAFBFC' }}>
                                <p className="font-mono text-[9px] tracking-[.06em] uppercase mb-1" style={{ color: 'var(--text-3)' }}>Regreso</p>
                                <p className="font-semibold text-sm" style={{ color: '#0A1E29' }}>
                                  {new Date(course.vivencial_fecha_regreso).toLocaleDateString('es-AR', { day: 'numeric', month: 'long' })}
                                </p>
                              </div>
                            )}
                            {course.vivencial_ciudad_salida && (
                              <div className="rounded-lg border p-3 flex gap-2" style={{ borderColor: '#E2EAEC', background: '#FAFBFC' }}>
                                <MapPin className="w-4 h-4 shrink-0 mt-0.5" style={{ color: 'var(--gold)' }} />
                                <div>
                                  <p className="font-mono text-[9px] tracking-[.06em] uppercase mb-1" style={{ color: 'var(--text-3)' }}>Salida desde</p>
                                  <p className="font-semibold text-sm" style={{ color: '#0A1E29' }}>{course.vivencial_ciudad_salida}</p>
                                </div>
                              </div>
                            )}
                            {course.vivencial_hotel && (
                              <div className="rounded-lg border p-3 flex gap-2" style={{ borderColor: '#E2EAEC', background: '#FAFBFC' }}>
                                <Hotel className="w-4 h-4 shrink-0 mt-0.5" style={{ color: 'var(--gold)' }} />
                                <div>
                                  <p className="font-mono text-[9px] tracking-[.06em] uppercase mb-1" style={{ color: 'var(--text-3)' }}>Hotel</p>
                                  <p className="font-semibold text-sm" style={{ color: '#0A1E29' }}>{course.vivencial_hotel}</p>
                                </div>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Cupo disponible */}
                        {isVivencial && course.vivencial_cupo_maximo && (
                          <div className="mb-4">
                            <div className="flex justify-between mb-1">
                              <span className="text-sm font-medium" style={{ color: '#0A1E29' }}>Cupo disponible</span>
                              <span className="font-mono text-sm font-bold" style={{ color: 'var(--primary)' }}>
                                {course.vivencial_cupo_disponible ?? course.vivencial_cupo_maximo} de {course.vivencial_cupo_maximo}
                              </span>
                            </div>
                            <div className="h-1.5 rounded-full overflow-hidden" style={{ background: '#E2EAEC' }}>
                              <div
                                className="h-full rounded-full"
                                style={{
                                  background: 'var(--primary)',
                                  width: `${Math.round(((course.vivencial_cupo_maximo - (course.vivencial_cupo_disponible ?? course.vivencial_cupo_maximo)) / course.vivencial_cupo_maximo) * 100)}%`,
                                }}
                              />
                            </div>
                          </div>
                        )}

                        {/* Description */}
                        {course.descripcion && (
                          <p style={{ color: '#1A3040', lineHeight: 1.75, fontSize: '.92rem' }}>
                            {course.descripcion}
                          </p>
                        )}

                        {/* Incluye / No incluye — texto libre; la sección se oculta si está vacía */}
                        {(hasRichText(course.incluye) || hasRichText(course.no_incluye)) && (
                          <div className="grid sm:grid-cols-2 gap-5 mt-5">
                            {hasRichText(course.incluye) && (
                              <div>
                                <h3 className="font-display font-bold mb-3 flex items-center gap-2" style={{ color: '#0A1E29' }}>
                                  <CheckCircle2 className="w-4 h-4" style={{ color: 'var(--success)' }} /> Incluye
                                </h3>
                                <ul className="space-y-2">
                                  {richTextLines(course.incluye).map((item, i) => (
                                    <li key={i} className="flex items-start gap-2 text-sm" style={{ color: '#1A3040' }}>
                                      <Check className="w-3.5 h-3.5 shrink-0 mt-0.5" style={{ color: 'var(--success)' }} />
                                      <span>{renderBold(item, `inc${i}`)}</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}
                            {hasRichText(course.no_incluye) && (
                              <div>
                                <h3 className="font-display font-bold mb-3 flex items-center gap-2" style={{ color: '#0A1E29' }}>
                                  <X className="w-4 h-4 text-red-400" /> No incluye
                                </h3>
                                <ul className="space-y-2">
                                  {richTextLines(course.no_incluye).map((item, i) => (
                                    <li key={i} className="flex items-start gap-2 text-sm" style={{ color: '#1A3040' }}>
                                      <X className="w-3.5 h-3.5 shrink-0 mt-0.5 text-red-400" />
                                      <span>{renderBold(item, `ninc${i}`)}</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Lo que vas a aprender */}
                        {!isVivencial && course.modules && course.modules.length > 0 && (
                          <div className="mt-5">
                            <div className="font-mono text-[9px] tracking-[.14em] uppercase mb-[10px]" style={{ color: 'var(--primary-l)' }}>
                              Lo que vas a aprender
                            </div>
                            <ul className="flex flex-col gap-[9px]">
                              {course.modules.slice(0, 1).flatMap(m => (m.lessons ?? []).slice(0, 4)).map((l, i) => (
                                <li key={i} className="flex items-start gap-[9px] text-sm" style={{ color: '#1A3040' }}>
                                  <Check className="w-[14px] h-[14px] shrink-0 mt-[2px]" style={{ color: 'var(--primary-l)' }} strokeWidth={2.5} />
                                  {l.titulo}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Programa */}
                    {activeTab === 'cont' && (
                      <div>
                        <p className="font-mono text-sm mb-3" style={{ color: 'var(--text-3)' }}>
                          {isEbook
                            ? (course.total_paginas ? `${course.total_paginas} páginas` : 'Ebook en PDF')
                            : `${totalLessons} ${contentUnit} · ${course.modules?.length ?? 0} módulos · ${formatDuration(course.duracion_total_minutos)}`}
                        </p>
                        {course.modules && course.modules.length > 0 ? (
                          <CurriculumAccordion modules={course.modules} isVivencial={isVivencial} />
                        ) : (
                          <p className="text-sm" style={{ color: 'var(--text-3)' }}>
                            {isEbook ? 'Este ebook se lee completo desde tu panel al acceder.' : 'Contenido próximamente.'}
                          </p>
                        )}
                      </div>
                    )}

                    {/* Instructor */}
                    {activeTab === 'inst' && course.instructor && (
                      <div className="flex gap-[18px] items-start">
                        {course.instructor.avatar_url ? (
                          <img
                            src={course.instructor.avatar_url}
                            alt={course.instructor.nombre}
                            className="w-[58px] h-[58px] rounded-full object-cover shrink-0"
                          />
                        ) : (
                          <div
                            className="w-[58px] h-[58px] rounded-full shrink-0 flex items-center justify-center font-display font-bold text-[17px]"
                            style={{ background: 'linear-gradient(135deg,var(--gold),var(--gold-deep))', color: '#0A1E29' }}
                          >
                            {course.instructor.nombre[0]}
                          </div>
                        )}
                        <div>
                          <h3 className="font-display font-bold" style={{ color: '#0A1E29', fontSize: '1rem' }}>
                            {course.instructor.nombre}
                          </h3>
                          <p className="text-sm leading-[1.7] mt-[7px]" style={{ color: '#1A3040' }}>
                            {course.instructor.bio ?? 'Instructor especializado en turismo argentino.'}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Reseñas */}
                    {activeTab === 'revs' && <Reviews course={course} />}

                    {/* Trailer */}
                    {activeTab === 'trl' && course.trailer_url && (
                      <div>
                        <div className="aspect-video rounded-xl overflow-hidden bg-black">
                          <iframe
                            src={course.trailer_url.replace('watch?v=', 'embed/').replace('youtu.be/', 'www.youtube-nocookie.com/embed/')}
                            title="Trailer"
                            className="w-full h-full"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                          />
                        </div>
                        <p className="text-sm mt-3" style={{ color: 'var(--text-3)' }}>Vista previa del curso</p>
                      </div>
                    )}
                  </motion.div>
                </AnimatePresence>
              </div>

              {/* Right: CTA sticky (desktop only) */}
              <div
                className="hidden md:block"
                style={{ position: 'sticky', top: 'calc(58px + 14px)' }}
              >
                <CTACard {...ctaProps} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Mobile CTA bar ── */}
      <div
        className="fixed bottom-0 left-0 right-0 z-[200] md:hidden border-t flex items-center justify-between gap-3 px-[18px]"
        style={{
          background:   'rgba(9,18,26,.95)',
          backdropFilter: 'blur(24px)',
          borderColor:  'var(--line-s)',
          paddingTop:   '11px',
          paddingBottom: 'calc(11px + env(safe-area-inset-bottom, 0px))',
        }}
      >
        <div>
          <div className="font-display font-bold" style={{ fontSize: '1.25rem', color: 'var(--text-1)' }}>
            {isFree ? 'GRATIS' : isVivencial && course.vivencial_precio_seña_ars ? formatARS(course.vivencial_precio_seña_ars) : formatARS(precioTransf || precioTarjeta)}
          </div>
          <div className="text-xs font-mono" style={{ color: 'var(--text-3)' }}>
            {isFree ? 'Sin costo' : isVivencial ? 'Seña' : 'Transferencia'}
          </div>
        </div>
        <div className="flex gap-2">
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={handleGift}
            className="flex items-center justify-center rounded-xl border min-h-11 px-[13px] text-xs"
            style={{ minHeight: '44px', borderColor: 'var(--line-s)', color: 'var(--text-2)' }}
          >
            🎁
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={() => { void handleEnroll() }}
            disabled={paymentLoading}
            className="flex items-center justify-center font-semibold rounded-xl min-h-11 px-5 text-sm"
            style={{ background: 'var(--neon)', color: '#0A1E29', minHeight: '44px', fontSize: '13px' }}
          >
            {paymentLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : ctaLabel}
          </motion.button>
        </div>
      </div>

      {/* ── FAQ Modal ── */}
      <AnimatePresence>
        {showFAQ && <FAQModal onClose={() => setShowFAQ(false)} />}
      </AnimatePresence>

      {/* ── Modal método de pago ── */}
      <AnimatePresence>
        {showPayModal && (
          <PaymentMethodModal
            course={course}
            cuotasMax={cuotasMax}
            loading={paymentLoading}
            onSelect={(metodo) => { void startPayment(metodo) }}
            onClose={() => setShowPayModal(false)}
          />
        )}
      </AnimatePresence>

      {/* ── WhatsApp float ── */}
      <WhatsAppFloat />

      {/* ── Toast ── */}
      <Toast msg={toast.msg} visible={toast.visible} />
    </div>
  )
}
