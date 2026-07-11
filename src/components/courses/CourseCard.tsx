import { useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, useReducedMotion } from 'framer-motion'
import { Heart, Users, Clock, ArrowRight } from 'lucide-react'
import { usePricingConfig } from '@/hooks/usePricing'
import type { Course, NivelCurso } from '@/types'

// ── Helpers ───────────────────────────────────────────────────────

function formatARS(n: number | null): string {
  if (n === null || n === undefined) return ''
  return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(n)
}

function formatPrice(ars: number | null, tipo_acceso: string): string {
  if (tipo_acceso === 'gratuito' || ars === null || ars === 0) return 'GRATIS'
  return formatARS(ars)
}

function formatDuration(min: number): string {
  if (!min) return ''
  if (min < 60) return `${min}min`
  const h = Math.floor(min / 60)
  const m = min % 60
  return m > 0 ? `${h}h ${m}min` : `${h}h`
}

const EASE = 'cubic-bezier(0.23,1,0.32,1)'

const DIR_TRANSFORMS: Record<string, string> = {
  top:    'translateY(-100%)',
  bottom: 'translateY(100%)',
  left:   'translateX(-100%)',
  right:  'translateX(100%)',
}

function getDir(e: MouseEvent, el: HTMLElement): 'top' | 'bottom' | 'left' | 'right' {
  const r = el.getBoundingClientRect()
  const x = e.clientX - r.left
  const y = e.clientY - r.top
  const w = r.width
  const h = r.height
  const m = Math.min(y / h, (h - y) / h, x / w, (w - x) / w)
  if (m === y / h) return 'top'
  if (m === (h - y) / h) return 'bottom'
  if (m === x / w) return 'left'
  return 'right'
}

// ── Badges ────────────────────────────────────────────────────────

function TipoBadge({ tipo }: { tipo: Course['tipo'] }) {
  if (tipo === 'en_vivo') {
    return (
      <span
        className="badge-live-blink inline-flex items-center gap-1 font-mono text-[9px] font-semibold tracking-[.08em] uppercase px-2 py-[3.5px] rounded-[4px]"
        style={{ background: '#EF4444', color: '#fff', backdropFilter: 'blur(10px)' }}
      >
        <span className="w-1 h-1 rounded-full bg-white shrink-0" />
        EN VIVO
      </span>
    )
  }
  if (tipo === 'vivencial') {
    return (
      <span
        className="relative overflow-hidden inline-flex items-center gap-1 font-mono text-[9px] font-semibold tracking-[.08em] uppercase px-2 py-[3.5px] rounded-[4px]"
        style={{ background: '#C99A3A', color: '#0A1E29' }}
      >
        ✈ Vivencial
        <span className="badge-viv-sweep" />
      </span>
    )
  }
  return (
    <span
      className="inline-flex items-center gap-1 font-mono text-[9px] tracking-[.08em] uppercase px-2 py-[3.5px] rounded-[4px]"
      style={{ background: 'rgba(10,30,41,.85)', color: 'var(--text-2)', border: '1px solid rgba(245,243,236,.18)', backdropFilter: 'blur(10px)' }}
    >
      <Clock className="w-[9px] h-[9px]" />
      A tu ritmo
    </span>
  )
}

const NIVEL_STYLES: Record<NivelCurso, { bg: string; color: string; label: string }> = {
  principiante: { bg: 'rgba(14,107,92,.72)',   color: '#A8F0E4', label: 'Principiante' },
  intermedio:   { bg: 'rgba(100,140,120,.68)', color: '#D4F0E6', label: 'Intermedio' },
  avanzado:     { bg: 'rgba(239,68,68,.72)',   color: '#FECACA', label: 'Avanzado' },
}

function NivelBadge({ nivel }: { nivel: NivelCurso }) {
  const s = NIVEL_STYLES[nivel]
  return (
    <span
      className="inline-flex items-center font-mono text-[9px] tracking-[.08em] uppercase px-2 py-[3.5px] rounded-[4px]"
      style={{ background: s.bg, color: s.color, backdropFilter: 'blur(10px)' }}
    >
      {s.label}
    </span>
  )
}

// ── CourseCard ────────────────────────────────────────────────────

interface Props {
  course:          Course
  wishlisted?:     boolean
  onWishlistToggle?: (courseId: string) => void
  animDelay?:      number
}

export default function CourseCard({ course, wishlisted = false, onWishlistToggle, animDelay = 0 }: Props) {
  const navigate    = useNavigate()
  const shouldReduce = useReducedMotion()
  const cardRef     = useRef<HTMLElement>(null)
  const dahRef      = useRef<HTMLDivElement>(null)

  const { data: pricing } = usePricingConfig()

  const isLive     = course.tipo === 'en_vivo'
  const isVivencial = course.tipo === 'vivencial'
  const isFree     = course.tipo_acceso === 'gratuito' || course.precio_ars === 0
  const cupoLow    = isVivencial && course.vivencial_cupo_disponible !== null && course.vivencial_cupo_disponible <= 5

  const cuotasMax  = pricing?.cuotasMax ?? 6
  const precioTarjeta = Number(course.precio_ars) || 0
  const precioTransf  = Number(course.precio_transferencia_ars) || 0
  const cuotaValor    = cuotasMax > 0 ? Math.round(precioTarjeta / cuotasMax) : 0

  const handleMouseEnter = useCallback((e: React.MouseEvent<HTMLElement>) => {
    if (shouldReduce || !dahRef.current || !cardRef.current) return
    if (!matchMedia('(hover:hover) and (pointer:fine)').matches) return
    const dir = getDir(e.nativeEvent, cardRef.current)
    const ov  = dahRef.current
    ov.style.transition = 'none'
    ov.style.transform  = DIR_TRANSFORMS[dir]
    ov.style.opacity    = '0'
    ov.getBoundingClientRect()
    ov.style.transition = `opacity 250ms ${EASE}, transform 250ms ${EASE}`
    ov.style.transform  = 'translate(0,0)'
    ov.style.opacity    = '1'
  }, [shouldReduce])

  const handleMouseLeave = useCallback((e: React.MouseEvent<HTMLElement>) => {
    if (shouldReduce || !dahRef.current || !cardRef.current) return
    const dir = getDir(e.nativeEvent, cardRef.current)
    const ov  = dahRef.current
    ov.style.transition = `opacity 250ms ${EASE}, transform 250ms ${EASE}`
    ov.style.transform  = DIR_TRANSFORMS[dir]
    ov.style.opacity    = '0'
  }, [shouldReduce])

  const handleWishlist = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    onWishlistToggle?.(course.id)
  }

  const dahLabel = isVivencial ? 'Reservar lugar' : isLive ? 'Reservar' : 'Ver curso'

  return (
    <motion.article
      ref={cardRef as React.RefObject<HTMLElement>}
      onClick={() => navigate(course.tipo === 'vivencial' ? `/vivencial/${course.slug}` : `/cursos/${course.slug}`)}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1], delay: animDelay }}
      whileHover={shouldReduce ? undefined : { y: -5 }}
      className={`rounded-2xl overflow-hidden border cursor-pointer relative${isLive ? ' live-ring' : ''}`}
      style={{
        background:   'var(--bg-2)',
        borderColor:  isLive ? 'rgba(239,68,68,.4)' : isVivencial ? 'rgba(201,154,58,.45)' : 'var(--line)',
        transition:   'border-color 260ms ease, box-shadow 260ms ease',
      }}
    >
      {/* Thumbnail */}
      <div className="relative aspect-video overflow-hidden" style={{ background: '#162F3E' }}>
        {course.thumbnail_url ? (
          <img
            src={course.thumbnail_url}
            alt={course.titulo}
            loading="lazy"
            className="w-full h-full object-cover transition-transform duration-500"
            style={{ transitionTimingFunction: EASE }}
            onError={e => { (e.currentTarget as HTMLImageElement).style.visibility = 'hidden' }}
          />
        ) : (
          <div className="w-full h-full" style={{ background: '#162F3E' }} />
        )}

        {/* Gradient overlay */}
        <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom,rgba(6,13,20,.03) 0%,rgba(6,13,20,.2) 38%,rgba(6,13,20,.9) 100%)', zIndex: 1 }} />

        {/* Badges top-left */}
        <div className="absolute top-[9px] left-[9px] right-9 flex items-start gap-1 flex-wrap" style={{ zIndex: 4 }}>
          <TipoBadge tipo={course.tipo} />
          <NivelBadge nivel={course.nivel} />
        </div>

        {/* Wishlist top-right */}
        <motion.button
          type="button"
          onClick={handleWishlist}
          whileTap={{ scale: 0.88 }}
          className="absolute top-[9px] right-[9px] w-[30px] h-[30px] rounded-full flex items-center justify-center border transition-colors"
          style={{
            background:   'rgba(6,13,20,.65)',
            backdropFilter: 'blur(8px)',
            borderColor:  'rgba(255,255,255,.14)',
            zIndex:       10,
          }}
          aria-label="Guardar en favoritos"
        >
          <Heart
            className="w-[13px] h-[13px] transition-all"
            style={{ color: wishlisted ? '#EF4444' : '#C9D3D6', fill: wishlisted ? '#EF4444' : 'none', strokeWidth: 2 }}
          />
        </motion.button>

        {/* Cupo bajo */}
        {cupoLow && (
          <span
            className="absolute top-9 left-3 font-mono text-[9px] px-[7px] py-[3px] rounded-[4px]"
            style={{ background: 'rgba(232,133,58,.14)', color: '#FCA86A', zIndex: 4 }}
          >
            ⚡ {course.vivencial_cupo_disponible} lugares
          </span>
        )}

        {/* Title overlay */}
        <div className="absolute bottom-[9px] left-[13px] right-[13px]" style={{ zIndex: 3 }}>
          <h3 className="font-display font-bold leading-[1.24] tracking-[-0.01em] text-white line-clamp-2" style={{ fontSize: '.93rem', textShadow: '0 1px 5px rgba(0,0,0,.5)' }}>
            {course.titulo}
          </h3>
          {course.instructor && (
            <p className="font-mono mt-[3px]" style={{ fontSize: '9px', color: 'rgba(201,211,214,.72)', letterSpacing: '.04em' }}>
              {course.instructor.nombre}
            </p>
          )}
        </div>

        {/* DAH overlay — pointer-events:none, purely decorative */}
        <div
          ref={dahRef}
          className="absolute inset-0 flex flex-col justify-center items-start p-[18px]"
          style={{
            zIndex:        5,
            background:    'linear-gradient(135deg,rgba(6,13,20,.95),rgba(14,107,92,.22))',
            backdropFilter:'blur(4px)',
            opacity:       0,
            transform:     DIR_TRANSFORMS['bottom'],
            pointerEvents: 'none',
          }}
        >
          <p className="line-clamp-3 mb-3" style={{ fontSize: '.79rem', color: 'var(--text-2)', lineHeight: 1.6 }}>
            {course.descripcion}
          </p>
          <span
            className="inline-flex items-center gap-[6px] font-semibold rounded-[7px]"
            style={{ background: 'var(--neon)', color: '#0A1E29', fontSize: '12px', padding: '8px 16px' }}
          >
            {dahLabel}
            <ArrowRight className="w-[11px] h-[11px]" />
          </span>
        </div>
      </div>

      {/* Footer */}
      <div className="px-[14px] py-[13px]">
        <div className="flex items-center justify-between gap-2">
          {/* Price */}
          {isFree ? (
            <span className="font-display font-bold" style={{ fontSize: '1.12rem', color: 'var(--neon)', letterSpacing: '-.01em' }}>
              GRATIS
            </span>
          ) : isVivencial && course.vivencial_precio_seña_ars ? (
            <span style={{ fontSize: '.83rem', color: 'var(--text-3)' }}>
              Seña <strong style={{ color: 'var(--text-1)', fontSize: '.92rem', fontWeight: 700 }}>{formatARS(course.vivencial_precio_seña_ars)}</strong>
            </span>
          ) : precioTransf > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              {precioTarjeta > precioTransf && (
                <span style={{ fontSize: '.72rem', color: 'var(--text-3)', textDecoration: 'line-through' }}>
                  {formatARS(precioTarjeta)}
                </span>
              )}
              <span className="font-display font-bold" style={{ fontSize: '1.12rem', color: 'var(--text-1)', letterSpacing: '-.01em', lineHeight: 1.1 }}>
                {formatARS(precioTransf)}
              </span>
              {cuotaValor > 0 && (
                <span style={{ fontSize: '.68rem', color: 'var(--text-3)' }}>
                  o {cuotasMax}x {formatARS(cuotaValor)} sin interés
                </span>
              )}
            </div>
          ) : (
            <span className="font-display font-bold" style={{ fontSize: '1.12rem', color: 'var(--text-1)', letterSpacing: '-.01em' }}>
              {formatPrice(course.precio_ars, course.tipo_acceso)}
            </span>
          )}
        </div>

        {/* Stats */}
        <div className="flex items-center gap-[9px] mt-2">
          {course.rating_avg > 0 && (
            <span className="font-mono flex items-center gap-[3px]" style={{ fontSize: '10.5px', color: 'var(--text-3)' }}>
              <span style={{ color: 'var(--text-1)', fontSize: '11.5px', letterSpacing: '.5px' }}>
                {'★'.repeat(Math.min(5, Math.round(course.rating_avg)))}
              </span>
              {course.rating_avg.toFixed(1)}
            </span>
          )}
          {course.duracion_total_minutos > 0 && (
            <span className="font-mono flex items-center gap-[3px]" style={{ fontSize: '10.5px', color: 'var(--text-3)' }}>
              <Clock className="w-[11px] h-[11px]" />
              {formatDuration(course.duracion_total_minutos)}
            </span>
          )}
          {course.total_alumnos > 0 && (
            <span className="font-mono flex items-center gap-[3px]" style={{ fontSize: '10.5px', color: 'var(--text-3)' }}>
              <Users className="w-[11px] h-[11px]" />
              {course.total_alumnos}
            </span>
          )}
        </div>

        {/* Live date — solo si hay fecha y duración */}
        {isLive && course.live_date && course.live_duration_minutes && (
          <div className="font-mono flex items-center gap-[5px] mt-[6px]" style={{ fontSize: '9.5px', color: '#EF4444' }}>
            <span className="live-stat-dot w-[5px] h-[5px] rounded-full shrink-0" style={{ background: '#EF4444' }} />
            {new Date(course.live_date).toLocaleDateString('es-AR', { weekday: 'short', day: 'numeric', month: 'short' })}
          </div>
        )}

        {/* Cupo vivencial */}
        {isVivencial && course.vivencial_cupo_disponible !== null && !cupoLow && (
          <div className="font-mono mt-[6px] inline-block rounded-[4px] px-[7px] py-[3px]" style={{ fontSize: '9px', color: '#FCA86A', background: 'rgba(232,133,58,.14)' }}>
            {course.vivencial_cupo_disponible} lugares disponibles
          </div>
        )}
      </div>
    </motion.article>
  )
}
