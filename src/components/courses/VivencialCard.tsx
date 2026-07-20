import { motion } from 'framer-motion'
import { MapPin, Heart, CalendarDays, Wallet, Users, TrendingUp } from 'lucide-react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { Link } from 'react-router-dom'
import type { Course } from '@/types'
import { cupoEstado, cupoDisponibleDisplay } from '@/lib/cupo'
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

// Una celda de datos dentro del rectángulo flotante. Número grande arriba,
// label chico arriba y detalle auxiliar (sub) abajo — con buen contraste.
function DataCell({ icon, label, value, sub, accent, className = '' }: {
  icon: React.ReactNode
  label: string
  value: string
  sub?: string
  accent?: boolean
  className?: string
}) {
  return (
    <div className={`flex flex-col gap-[6px] px-[18px] py-[20px] min-w-0 ${className}`} style={{ background: 'var(--card-solid)' }}>
      <span className="flex items-center gap-[6px] font-mono uppercase" style={{ fontSize: 10, letterSpacing: '.09em', color: 'var(--text-2)' }}>
        <span style={{ color: accent ? 'var(--neon)' : 'var(--gold)' }}>{icon}</span>
        {label}
      </span>
      <span className="font-display font-bold truncate" style={{ fontSize: 'clamp(1.08rem, 1.5vw, 1.4rem)', letterSpacing: '-.01em', color: accent ? 'var(--neon)' : 'var(--text-1)' }}>
        {value}
      </span>
      {sub && <span className="font-mono truncate" style={{ fontSize: 11, color: 'var(--text-2)', letterSpacing: '.02em', opacity: .92 }}>{sub}</span>}
    </div>
  )
}

export default function VivencialCard({ course: c, isWishlisted, onToggleWishlist, animDelay = 0 }: Props) {
  const { dias, noches } = calcDuracion(c)
  // HARDCODE TEMPORAL: cupos de display, pedido de Nico (sesión jul-2026). El listado
  // muestra el mismo "disponible" ficticio que el detalle (cupo_maximo real − anotados
  // hardcodeados; ver src/lib/cupo.ts). Es sólo visual — la reserva se gatea en el
  // detalle con el cupo real de la DB.
  const disp  = cupoDisponibleDisplay(c.slug, c.vivencial_cupo_maximo ?? 0)
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
        className="group block rounded-[26px] overflow-hidden transition-[transform,box-shadow,border-color] duration-300 ease-[cubic-bezier(0.23,1,0.32,1)] hover:-translate-y-[4px]"
        style={{
          background: 'var(--bg-2)',
          border: `1px solid ${estado.urgent ? 'rgba(239,107,53,.5)' : 'rgba(201,154,58,.3)'}`,
          boxShadow: '0 6px 28px rgba(0,0,0,.32)',
        }}
      >
        {/* ── Cover photo grande — título + subtítulo superpuestos arriba ── */}
        <div className="relative overflow-hidden" style={{ height: 'clamp(300px, 40vw, 480px)', background: '#162F3E' }}>
          {thumb && (
            <img
              src={thumb}
              alt={c.titulo}
              loading="lazy"
              className="w-full h-full object-cover block transition-transform duration-[560ms] ease-[cubic-bezier(0.23,1,0.32,1)] group-hover:scale-[1.04]"
              onError={(e) => {
                ;(e.target as HTMLImageElement).src =
                  'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=1400&q=60'
              }}
            />
          )}
          {/* Gradient overlay — oscuro arriba (para el título) y abajo (para el rectángulo) */}
          <div
            className="absolute inset-0 z-[1] pointer-events-none"
            style={{ background: 'linear-gradient(to bottom, rgba(6,13,20,.74) 0%, rgba(6,13,20,.30) 30%, rgba(6,13,20,.10) 52%, rgba(6,13,20,.52) 100%)' }}
          />

          {/* Wishlist — top right */}
          <button
            type="button"
            className="absolute top-[16px] right-[16px] z-[10] w-[40px] h-[40px] rounded-full flex items-center justify-center transition-transform active:scale-90"
            style={{ background: 'rgba(6,13,20,.55)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,.16)' }}
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); onToggleWishlist() }}
            aria-label="Guardar en lista"
          >
            <Heart
              className="w-[17px] h-[17px]"
              fill={isWishlisted ? '#EF4444' : 'none'}
              stroke={isWishlisted ? '#EF4444' : '#fff'}
              strokeWidth={2}
            />
          </button>

          {/* Bloque superpuesto arriba a la izquierda: badges + título + subtítulo */}
          <div className="absolute top-[22px] left-[24px] z-[4]" style={{ right: 80 }}>
            <div className="flex flex-wrap items-center gap-[7px] mb-[14px]">
              <span
                className="relative overflow-hidden font-mono text-[10px] font-semibold tracking-[.08em] uppercase py-[5px] px-[11px] rounded-[6px] flex items-center gap-1 leading-[1.3]"
                style={{ background: 'var(--gold)', color: 'var(--bg)' }}
              >
                ✦ Vivencial
                <span className="badge-viv-sweep" />
              </span>
              {estado.urgent && disp > 0 && (
                <span
                  className="font-mono text-[10px] font-semibold tracking-[.08em] uppercase py-[5px] px-[11px] rounded-[6px] leading-[1.3]"
                  style={{ background: 'rgba(239,107,53,.92)', color: '#fff' }}
                >
                  ⚡ {estado.label}
                </span>
              )}
              {disp === 0 && (
                <span
                  className="font-mono text-[10px] font-semibold tracking-[.08em] uppercase py-[5px] px-[11px] rounded-[6px] leading-[1.3]"
                  style={{ background: 'rgba(80,80,80,.9)', color: 'rgba(245,243,236,.6)' }}
                >
                  Agotado
                </span>
              )}
            </div>

            <h3
              className="font-display font-bold text-white"
              style={{ fontSize: 'clamp(1.7rem, 3.6vw, 2.9rem)', lineHeight: 1.06, letterSpacing: '-.025em', textShadow: '0 2px 18px rgba(0,0,0,.5)' }}
            >
              {c.titulo}
            </h3>
            {c.category && (
              <div
                className="flex items-center gap-[6px] mt-[10px] font-mono uppercase"
                style={{ fontSize: 'clamp(.72rem, 1.1vw, .86rem)', letterSpacing: '.08em', color: 'rgba(245,243,236,.86)', textShadow: '0 1px 10px rgba(0,0,0,.5)' }}
              >
                <MapPin className="w-[14px] h-[14px]" style={{ color: 'var(--gold)' }} />
                {c.vivencial_pais ? `${c.category.nombre} · ${c.vivencial_pais}` : c.category.nombre}
              </div>
            )}
          </div>
        </div>

        {/* ── Rectángulo flotante de datos clave (se superpone a la foto) ── */}
        <div className="relative px-[20px] sm:px-[26px] pb-[26px]">
          <div
            className="relative z-[6] grid grid-cols-2 sm:grid-cols-5 gap-px rounded-[20px] overflow-hidden"
            style={{
              marginTop: -56,
              background: 'var(--line)',
              border: '1px solid var(--line-s)',
              boxShadow: '0 22px 50px -14px rgba(0,0,0,.62)',
            }}
          >
            <DataCell icon={<CalendarDays className="w-[13px] h-[13px]" />} label="Salida" value={fmtDate(c.vivencial_fecha_salida)} sub={dias > 0 ? `${dias} días / ${noches} noches` : undefined} />
            <DataCell icon={<Wallet className="w-[13px] h-[13px]" />} label="Precio" value={fmtARS(c.precio_ars)} sub="total estimado" />
            {cuota != null ? (
              <DataCell icon={<TrendingUp className="w-[13px] h-[13px]" />} label="Cuotas est." value={`${fmtARS(cuota)}/mes`} sub={`≈ ${meses} cuotas`} accent />
            ) : (
              <DataCell icon={<TrendingUp className="w-[13px] h-[13px]" />} label="Pago" value="Único" sub="valor informativo" />
            )}
            <DataCell icon={<Users className="w-[13px] h-[13px]" />} label="Lugares" value={disp > 0 ? `${disp}` : 'Agotado'} sub={disp > 0 ? 'disponibles' : undefined} accent={estado.urgent && disp > 0} />
            <DataCell icon={<MapPin className="w-[13px] h-[13px]" />} label="Sale desde" value={salidaValue} sub={salidaSub} className="col-span-2 sm:col-span-1" />
          </div>
        </div>
      </Link>
    </motion.div>
  )
}
