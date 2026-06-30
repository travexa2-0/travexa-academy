import { motion } from 'framer-motion'
import { MapPin, Heart } from 'lucide-react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { useNavigate } from 'react-router-dom'
import type { Course } from '@/types'
import { cupoEstado } from '@/lib/cupo'

interface Props {
  course: Course
  isWishlisted: boolean
  onToggleWishlist: () => void
  animDelay?: number
}

function fmtDate(d: string | null): string {
  if (!d) return '—'
  const [y, m, day] = d.split('-').map(Number)
  return format(new Date(y, m - 1, day), 'd MMM yyyy', { locale: es })
}

function calcDuracion(c: Course): { dias: number; noches: number } {
  if (!c.vivencial_fecha_salida || !c.vivencial_fecha_regreso) return { dias: 0, noches: 0 }
  const [y1, m1, d1] = c.vivencial_fecha_salida.split('-').map(Number)
  const [y2, m2, d2] = c.vivencial_fecha_regreso.split('-').map(Number)
  const dias = Math.round(
    (new Date(y2, m2 - 1, d2).getTime() - new Date(y1, m1 - 1, d1).getTime()) / 86400000
  ) + 1
  return { dias, noches: Math.max(0, dias - 1) }
}

function fmtARS(n: number | null | undefined): string {
  if (!n) return '—'
  return '$ ' + n.toLocaleString('es-AR') + ' ARS'
}

const cupoBarColor: Record<string, string> = {
  ok:   'var(--primary)',
  low:  'var(--urg)',
  full: 'rgba(239,68,68,.6)',
}

export default function VivencialCard({ course: c, isWishlisted, onToggleWishlist, animDelay = 0 }: Props) {
  const navigate = useNavigate()
  const { dias, noches } = calcDuracion(c)
  const disp  = c.vivencial_cupo_disponible ?? 0
  const max   = c.vivencial_cupo_maximo ?? 0
  const estado = cupoEstado(disp)
  const pct   = max > 0 ? Math.round((1 - disp / max) * 100) : 0
  const thumb = c.thumbnail_url ?? c.fotos?.[0] ?? ''

  return (
    <motion.article
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.42, ease: [0.23, 1, 0.32, 1], delay: animDelay / 1000 }}
      onClick={() => navigate(`/vivencial/${c.slug}`)}
      className="group cursor-pointer rounded-[18px] overflow-hidden"
      style={{
        background: 'var(--bg-2)',
        border: `1px solid ${estado.urgent ? 'rgba(239,107,53,.55)' : 'rgba(201,154,58,.3)'}`,
      }}
      whileHover={{ y: -5, boxShadow: '0 10px 36px rgba(0,0,0,.4), 0 0 0 1px rgba(201,154,58,.2)', borderColor: estado.urgent ? 'rgba(239,107,53,.85)' : 'rgba(201,154,58,.7)' }}
      whileTap={{ scale: 0.986 }}
    >
      {/* Thumbnail */}
      <div className="relative overflow-hidden" style={{ aspectRatio: '16/10', background: '#162F3E' }}>
        {thumb && (
          <img
            src={thumb}
            alt={c.titulo}
            loading="lazy"
            className="w-full h-full object-cover block transition-transform duration-[480ms] ease-[cubic-bezier(0.23,1,0.32,1)] group-hover:scale-[1.06]"
            onError={(e) => {
              ;(e.target as HTMLImageElement).src =
                'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=800&q=60'
            }}
          />
        )}
        {/* Gradient overlay */}
        <div
          className="absolute inset-0 z-[1] pointer-events-none"
          style={{ background: 'linear-gradient(to bottom, rgba(6,13,20,.04) 0%, rgba(6,13,20,.22) 40%, rgba(6,13,20,.88) 100%)' }}
        />

        {/* Badges — top left */}
        <div className="absolute top-[9px] left-[9px] z-[4] flex flex-wrap items-start gap-[5px]" style={{ right: 36 }}>
          <span
            className="relative overflow-hidden font-mono text-[9px] font-semibold tracking-[.08em] uppercase py-[3.5px] px-2 rounded-[4px] flex items-center gap-1 leading-[1.3]"
            style={{ background: 'var(--gold)', color: 'var(--bg)' }}
          >
            ✦ Vivencial
            <span className="badge-viv-sweep" />
          </span>
          {estado.urgent && disp > 0 && (
            <span
              className="font-mono text-[9px] font-semibold tracking-[.08em] uppercase py-[3.5px] px-2 rounded-[4px] leading-[1.3]"
              style={{ background: 'rgba(239,107,53,.88)', color: '#fff' }}
            >
              ⚡ {estado.label}
            </span>
          )}
          {disp === 0 && (
            <span
              className="font-mono text-[9px] font-semibold tracking-[.08em] uppercase py-[3.5px] px-2 rounded-[4px] leading-[1.3]"
              style={{ background: 'rgba(80,80,80,.85)', color: 'rgba(245,243,236,.5)' }}
            >
              Agotado
            </span>
          )}
        </div>

        {/* Wishlist — top right */}
        <motion.button
          className="absolute top-[9px] right-[9px] z-[10] w-[30px] h-[30px] rounded-full flex items-center justify-center"
          style={{ background: 'rgba(6,13,20,.65)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,.14)' }}
          onClick={(e) => { e.stopPropagation(); onToggleWishlist() }}
          whileTap={{ scale: 0.88 }}
          aria-label="Guardar en lista"
        >
          <Heart
            className="w-[13px] h-[13px]"
            fill={isWishlisted ? '#EF4444' : 'none'}
            stroke={isWishlisted ? '#EF4444' : 'currentColor'}
            strokeWidth={2}
          />
        </motion.button>

        {/* Destination overlay — bottom of thumb */}
        <div className="absolute bottom-[10px] left-[14px] right-[14px] z-[3]">
          <div
            className="font-display font-bold text-white leading-[1.2]"
            style={{ fontSize: '1.05rem', letterSpacing: '-.01em', textShadow: '0 1px 6px rgba(0,0,0,.5)' }}
          >
            {c.titulo}
          </div>
          {c.category && (
            <div
              className="font-mono uppercase mt-[2px]"
              style={{ fontSize: 9, color: 'rgba(201,211,214,.72)', letterSpacing: '.05em' }}
            >
              {c.category.nombre}
            </div>
          )}
        </div>
      </div>

      {/* Card body */}
      <div style={{ padding: '14px 16px 16px' }}>
        {/* Dates + price row */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex flex-col gap-[2px]">
            <div
              className="font-display font-bold"
              style={{ fontSize: '.97rem', letterSpacing: '-.01em', color: 'var(--text-1)' }}
            >
              {fmtDate(c.vivencial_fecha_salida)}
            </div>
            {dias > 0 && (
              <div
                className="font-mono uppercase"
                style={{ fontSize: 9, color: 'var(--text-3)', letterSpacing: '.06em', marginTop: 1 }}
              >
                {dias} días / {noches} noches
              </div>
            )}
          </div>
          {c.vivencial_precio_seña_ars && (
            <div className="text-right shrink-0">
              <div
                className="font-display font-bold"
                style={{ fontSize: '1.08rem', letterSpacing: '-.01em', color: 'var(--text-1)' }}
              >
                {fmtARS(c.vivencial_precio_seña_ars)}
              </div>
              <div
                className="font-mono"
                style={{ fontSize: 9, color: 'var(--text-3)', letterSpacing: '.04em', marginTop: 1 }}
              >
                Seña para reservar
              </div>
            </div>
          )}
        </div>

        {/* Cupo bar */}
        {max > 0 && (
          <div style={{ marginTop: 10 }}>
            <div
              style={{ height: 3, background: 'rgba(245,243,236,.1)', borderRadius: 2, overflow: 'hidden', marginBottom: 5 }}
            >
              <div
                style={{
                  height: '100%',
                  width: `${pct}%`,
                  borderRadius: 2,
                  background: cupoBarColor[estado.cls],
                  transition: 'width 800ms cubic-bezier(0.23,1,0.32,1)',
                }}
              />
            </div>
            <div
              className="flex items-center justify-between font-mono uppercase"
              style={{ fontSize: 9, letterSpacing: '.05em', color: estado.urgent ? '#EF6B35' : 'var(--text-3)' }}
            >
              <span>{estado.urgent && disp > 0 ? '⚠ ' : ''}{estado.label}</span>
              <span>{max} cupo total</span>
            </div>
          </div>
        )}

        {/* Ciudad de salida */}
        {c.vivencial_ciudad_salida && (
          <div
            className="flex items-center gap-[5px] font-mono"
            style={{ marginTop: 9, fontSize: '9.5px', color: 'var(--text-3)', letterSpacing: '.04em' }}
          >
            <MapPin className="w-[11px] h-[11px] shrink-0" />
            Sale desde {c.vivencial_ciudad_salida}
          </div>
        )}

        {/* CTA button */}
        <div style={{ marginTop: 13 }}>
          <motion.button
            className="w-full flex items-center justify-center gap-[6px] font-display font-bold rounded-[9px]"
            style={{ background: 'var(--neon)', color: '#0A1E29', fontSize: 13, padding: '10px 18px' }}
            onClick={(e) => { e.stopPropagation(); navigate(`/vivencial/${c.slug}`) }}
            whileTap={{ scale: 0.97 }}
            whileHover={{ boxShadow: '0 0 28px var(--neon-glow)' }}
          >
            Ver viaje
          </motion.button>
        </div>
      </div>
    </motion.article>
  )
}
