import { motion } from 'framer-motion'
import { MapPin, Heart, CalendarDays, Wallet, Users, TrendingUp } from 'lucide-react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { Link } from 'react-router-dom'
import type { Course } from '@/types'
import { cupoEstado } from '@/lib/cupo'
import { cuotaEstimadaArs, mesesHastaSalida, puntosSalida } from '@/lib/vivencial'

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
  return '$ ' + n.toLocaleString('es-AR')
}

// Una celda de datos dentro del rectángulo flotante.
function DataCell({ icon, label, value, sub, accent, className = '' }: {
  icon: React.ReactNode
  label: string
  value: string
  sub?: string
  accent?: boolean
  className?: string
}) {
  return (
    <div className={`flex flex-col gap-[3px] px-[14px] py-[13px] min-w-0 ${className}`} style={{ background: 'var(--card-solid)' }}>
      <span className="flex items-center gap-[5px] font-mono uppercase" style={{ fontSize: 8.5, letterSpacing: '.08em', color: 'var(--text-3)' }}>
        <span style={{ color: accent ? 'var(--neon)' : 'var(--text-3)' }}>{icon}</span>
        {label}
      </span>
      <span className="font-display font-bold truncate" style={{ fontSize: '.95rem', letterSpacing: '-.01em', color: accent ? 'var(--neon)' : 'var(--text-1)' }}>
        {value}
      </span>
      {sub && <span className="font-mono truncate" style={{ fontSize: 8.5, color: 'var(--text-3)', letterSpacing: '.03em' }}>{sub}</span>}
    </div>
  )
}

export default function VivencialCard({ course: c, isWishlisted, onToggleWishlist, animDelay = 0 }: Props) {
  const { dias, noches } = calcDuracion(c)
  const disp  = c.vivencial_cupo_disponible ?? 0
  const estado = cupoEstado(disp)
  const thumb = c.thumbnail_url ?? c.fotos?.[0] ?? ''
  // Cuota mensual estimada (informativa — los vivenciales no se cobran en la plataforma).
  const cuota = cuotaEstimadaArs(c)
  const meses = mesesHastaSalida(c.vivencial_fecha_salida)

  const puntos = puntosSalida(c)
  const salidaValue = puntos.length > 1
    ? `${puntos.length} puntos`
    : (puntos[0]?.ciudad ?? c.vivencial_ciudad_salida ?? '—')
  const salidaSub = puntos.length > 1 ? 'de salida' : undefined

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1], delay: animDelay / 1000 }}
    >
      <Link
        to={`/vivencial/${c.slug}`}
        aria-label={`Ver viaje: ${c.titulo}`}
        className="group block rounded-[22px] overflow-hidden transition-[transform,box-shadow,border-color] duration-300 ease-[cubic-bezier(0.23,1,0.32,1)] hover:-translate-y-[3px]"
        style={{
          background: 'var(--bg-2)',
          border: `1px solid ${estado.urgent ? 'rgba(239,107,53,.5)' : 'rgba(201,154,58,.3)'}`,
          boxShadow: '0 4px 20px rgba(0,0,0,.28)',
        }}
      >
        {/* ── Cover photo grande ── */}
        <div className="relative overflow-hidden" style={{ height: 'clamp(220px, 34vw, 360px)', background: '#162F3E' }}>
          {thumb && (
            <img
              src={thumb}
              alt={c.titulo}
              loading="lazy"
              className="w-full h-full object-cover block transition-transform duration-[520ms] ease-[cubic-bezier(0.23,1,0.32,1)] group-hover:scale-[1.05]"
              onError={(e) => {
                ;(e.target as HTMLImageElement).src =
                  'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=1200&q=60'
              }}
            />
          )}
          {/* Gradient overlay */}
          <div
            className="absolute inset-0 z-[1] pointer-events-none"
            style={{ background: 'linear-gradient(to bottom, rgba(6,13,20,.10) 0%, rgba(6,13,20,.10) 45%, rgba(6,13,20,.72) 100%)' }}
          />

          {/* Badges — top left */}
          <div className="absolute top-[12px] left-[12px] z-[4] flex flex-wrap items-start gap-[6px]" style={{ right: 52 }}>
            <span
              className="relative overflow-hidden font-mono text-[9.5px] font-semibold tracking-[.08em] uppercase py-1 px-[9px] rounded-[5px] flex items-center gap-1 leading-[1.3]"
              style={{ background: 'var(--gold)', color: 'var(--bg)' }}
            >
              ✦ Vivencial
              <span className="badge-viv-sweep" />
            </span>
            {estado.urgent && disp > 0 && (
              <span
                className="font-mono text-[9.5px] font-semibold tracking-[.08em] uppercase py-1 px-[9px] rounded-[5px] leading-[1.3]"
                style={{ background: 'rgba(239,107,53,.9)', color: '#fff' }}
              >
                ⚡ {estado.label}
              </span>
            )}
            {disp === 0 && (
              <span
                className="font-mono text-[9.5px] font-semibold tracking-[.08em] uppercase py-1 px-[9px] rounded-[5px] leading-[1.3]"
                style={{ background: 'rgba(80,80,80,.88)', color: 'rgba(245,243,236,.55)' }}
              >
                Agotado
              </span>
            )}
          </div>

          {/* Wishlist — top right */}
          <button
            type="button"
            className="absolute top-[12px] right-[12px] z-[10] w-[34px] h-[34px] rounded-full flex items-center justify-center transition-transform active:scale-90"
            style={{ background: 'rgba(6,13,20,.6)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,.14)' }}
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); onToggleWishlist() }}
            aria-label="Guardar en lista"
          >
            <Heart
              className="w-[15px] h-[15px]"
              fill={isWishlisted ? '#EF4444' : 'none'}
              stroke={isWishlisted ? '#EF4444' : 'currentColor'}
              strokeWidth={2}
            />
          </button>

        </div>

        {/* ── Rectángulo flotante de datos clave (se superpone a la foto) ── */}
        <div className="relative px-[18px] sm:px-[22px]">
          <div
            className="relative z-[6] grid grid-cols-2 sm:grid-cols-5 gap-px rounded-[16px] overflow-hidden"
            style={{
              marginTop: -40,
              background: 'var(--line)',
              border: '1px solid var(--line-s)',
              boxShadow: '0 16px 40px -12px rgba(0,0,0,.55)',
            }}
          >
            <DataCell icon={<CalendarDays className="w-[11px] h-[11px]" />} label="Salida" value={fmtDate(c.vivencial_fecha_salida)} sub={dias > 0 ? `${dias} días / ${noches} noches` : undefined} />
            <DataCell icon={<Wallet className="w-[11px] h-[11px]" />} label="Precio" value={fmtARS(c.precio_ars)} sub="total estimado" />
            {cuota != null ? (
              <DataCell icon={<TrendingUp className="w-[11px] h-[11px]" />} label="Cuotas est." value={`≈ ${meses}x`} sub={`${fmtARS(cuota)}/mes`} accent />
            ) : (
              <DataCell icon={<TrendingUp className="w-[11px] h-[11px]" />} label="Pago" value="Único" sub="valor informativo" />
            )}
            <DataCell icon={<Users className="w-[11px] h-[11px]" />} label="Lugares" value={disp > 0 ? `${disp}` : 'Agotado'} sub={disp > 0 ? 'disponibles' : undefined} accent={estado.urgent && disp > 0} />
            <DataCell icon={<MapPin className="w-[11px] h-[11px]" />} label="Sale desde" value={salidaValue} sub={salidaSub} className="col-span-2 sm:col-span-1" />
          </div>
        </div>

        {/* ── Título + descripción corta ── */}
        <div className="px-[20px] sm:px-[24px] pt-[18px] pb-[22px]">
          {c.category && (
            <div
              className="font-mono uppercase flex items-center gap-[5px] mb-[7px]"
              style={{ fontSize: 9.5, color: 'var(--text-3)', letterSpacing: '.08em' }}
            >
              <MapPin className="w-[11px] h-[11px]" style={{ color: 'var(--gold)' }} />
              {c.vivencial_pais ? `${c.category.nombre} · ${c.vivencial_pais}` : c.category.nombre}
            </div>
          )}
          <h3
            className="font-display font-bold"
            style={{ fontSize: 'clamp(1.25rem, 2.4vw, 1.6rem)', lineHeight: 1.12, letterSpacing: '-.02em', color: 'var(--text-1)' }}
          >
            {c.titulo}
          </h3>
          {c.descripcion && (
            <p
              className="mt-[9px]"
              style={{
                fontSize: '.92rem', lineHeight: 1.62, color: 'var(--text-3)',
                display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
              }}
            >
              {c.descripcion}
            </p>
          )}
          <span
            className="inline-flex items-center gap-[6px] font-mono uppercase mt-[14px] transition-colors"
            style={{ fontSize: 10, letterSpacing: '.09em', color: 'var(--neon)' }}
          >
            Ver viaje completo
            <span className="transition-transform duration-300 group-hover:translate-x-1">→</span>
          </span>
        </div>
      </Link>
    </motion.div>
  )
}
