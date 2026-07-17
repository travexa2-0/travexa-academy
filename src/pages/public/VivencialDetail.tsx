import { useState, useEffect, useRef, useCallback, createElement } from 'react'
import type { CSSProperties, ReactNode, ElementType } from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import { Link2, Share2, Check, MapPin, ChevronDown, ExternalLink } from 'lucide-react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import NumberFlow from '@number-flow/react'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import { useCourseDetail } from '@/hooks/useCourses'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import VivencialPagoCTA from '@/components/vivencial/VivencialPagoCTA'
import { useWhatsappBusiness, cleanWhatsappNumber } from '@/hooks/useVivencialPago'
import { richTextLines, hasRichText, renderBold } from '@/lib/richText'
import { mesesHastaSalida, puntosSalida } from '@/lib/vivencial'
import { formatUsd } from '@/pages/admin/format'
import type { ItinerarioDia, Enrollment, VivencialHotel, VivencialTipoDestino } from '@/types'
import './vivencial-detail.css'

const EASE = 'cubic-bezier(.23,1,.32,1)'

// ── Helpers ───────────────────────────────────────────────────────

function fmtDate(d: string | null): string {
  if (!d) return '—'
  const [y, m, day] = d.split('-').map(Number)
  return format(new Date(y, m - 1, day), 'd MMM yyyy', { locale: es })
}

function fmtDateShort(d: string | null): string {
  if (!d) return '—'
  const [y, m, day] = d.split('-').map(Number)
  return format(new Date(y, m - 1, day), 'd MMM', { locale: es })
}

function fmtARS(n: number | null | undefined): string {
  if (!n) return '—'
  return '$ ' + n.toLocaleString('es-AR') + ' ARS'
}

function calcDuracion(salida: string | null, regreso: string | null): { dias: number; noches: number } {
  if (!salida || !regreso) return { dias: 0, noches: 0 }
  const [y1, m1, d1] = salida.split('-').map(Number)
  const [y2, m2, d2] = regreso.split('-').map(Number)
  const dias = Math.round(
    (new Date(y2, m2 - 1, d2).getTime() - new Date(y1, m1 - 1, d1).getTime()) / 86400000,
  ) + 1
  return { dias, noches: Math.max(0, dias - 1) }
}

const THEMES: readonly VivencialTipoDestino[] = ['playa', 'montana', 'desierto', 'selva', 'ciudad']

// Beneficios fijos de la card de reserva — iguales para todos los vivenciales.
// NO vienen de la base (hardcodeados a propósito, como en el mockup).
const CTA_FEATURES = [
  'Viajá, disfrutá y capacitate profesionalmente',
  'Instructores con más de 15 años de experiencia',
  'Convertite en profesional del destino y crecé con Travexa',
]

// Umbral para considerar una línea "bullet corto" (chip) vs prosa.
const CHIP_MAXLEN = 60

/**
 * `incluye` es texto libre: bullets cortos al inicio (una frase por línea) y,
 * opcionalmente, prosa larga después (manifiesto, Q&A). Regla genérica:
 * líneas cortas consecutivas desde el inicio — hasta la primera línea en
 * blanco o la primera línea larga — son chips; TODO lo que sigue es prosa
 * (párrafos separados por saltos dobles). Nada hardcodeado por vivencial.
 */
function parseIncluye(text: string | null | undefined): { chips: string[]; prosa: string[] } {
  if (!text) return { chips: [], prosa: [] }
  const lines = text.split(/\r?\n/)
  const chips: string[] = []
  let i = 0
  while (i < lines.length) {
    const l = lines[i].trim()
    if (!l || l.length > CHIP_MAXLEN) break
    chips.push(l)
    i++
  }
  const rest = lines.slice(i).join('\n').trim()
  const prosa = rest ? rest.split(/\n\s*\n+/).map(p => p.trim()).filter(Boolean) : []
  return { chips, prosa }
}

// Un párrafo de prosa es "subtítulo" si es una única línea corta terminada en
// "?" (ej: "¿A quién está dirigido?"). Genérico, no atado a estos textos.
function isProsaSub(para: string): boolean {
  const lines = para.split('\n').map(l => l.trim()).filter(Boolean)
  return lines.length === 1 && lines[0].length <= 60 && lines[0].endsWith('?')
}

// Agrupa la prosa en bloques: cada subtítulo abre un bloque nuevo; todo lo que
// sigue hasta el próximo subtítulo (o el final) es su contenido. La prosa
// inicial sin subtítulo (manifiesto) es el primer bloque. Sin subtítulos → un
// solo bloque. Cada bloque se renderiza en su propia card de vidrio.
function groupProsa(prosa: string[]): string[][] {
  const groups: string[][] = []
  let cur: string[] | null = null
  for (const para of prosa) {
    if (isProsaSub(para) || !cur) { cur = []; groups.push(cur) }
    cur.push(para)
  }
  return groups
}

// Render de un párrafo de prosa: lista (varias líneas cortas), subtítulo
// (línea "?") o párrafo normal. Mantiene renderBold en los tres casos.
function renderProsaItem(para: string, key: string) {
  const lines = para.split('\n').map(l => l.trim()).filter(Boolean)
  if (lines.length > 1) {
    return (
      <ul className="vv-inc-list" key={key}>
        {lines.map((l, j) => <li key={j}>{renderBold(l, `${key}-${j}`)}</li>)}
      </ul>
    )
  }
  const line = lines[0] ?? ''
  if (line.length <= 60 && line.endsWith('?')) {
    return <h4 className="vv-inc-sub" key={key}>{renderBold(line, key)}</h4>
  }
  return <p key={key}>{renderBold(line, key)}</p>
}

const prefersReduced = () =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

/**
 * Registro global (nivel de módulo, FUERA de React) de los elementos que ya se
 * revelaron en esta sesión de pestaña. No lo resetea ningún remount de React —
 * sólo un refresh real de la página. Es el blindaje contra el parpadeo:
 * si algo desmonta y vuelve a montar una sección (refetch, StrictMode, un
 * cambio de key aguas arriba, lo que sea), la key ya está acá y el elemento
 * nace visible en vez de arrancar invisible y esperar de nuevo al observer.
 */
const revealedKeys = new Set<string>()

/**
 * Reveal-on-scroll a prueba de remounts. `key` es un id estable y único por
 * elemento. El estado inicial consulta el registro global: si esa key ya se
 * reveló alguna vez, el componente NACE en shown=true (sin parpadeo, sin
 * esperar al observer). La primera vez, el IntersectionObserver dispara una
 * sola vez (sólo en isIntersecting, sin rama que oculte), marca la key como
 * revelada para siempre y anima la entrada. El estilo es determinístico.
 */
function useReveal(key: string, delay = 0, opacityOnly = false) {
  const reduce = useRef(prefersReduced()).current
  const [shown, setShown] = useState(() => reduce || revealedKeys.has(key))
  const done = useRef(shown)
  const ioRef = useRef<IntersectionObserver | null>(null)

  const setRef = useCallback((el: HTMLElement | null) => {
    // React 18 llama al callback ref con null al desmontar (no soporta cleanup
    // como return): desconectamos ahí para no dejar observers colgados.
    if (el === null) { ioRef.current?.disconnect(); ioRef.current = null; return }
    if (done.current) return
    if (typeof IntersectionObserver === 'undefined') {
      done.current = true; revealedKeys.add(key); setShown(true); return
    }
    ioRef.current?.disconnect()
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {            // sólo al entrar; nunca se oculta
          done.current = true
          revealedKeys.add(key)            // revelado PARA SIEMPRE (esta sesión)
          setShown(true)
          io.disconnect()                  // una sola vez
        }
      })
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' })
    ioRef.current = io
    io.observe(el)
  }, [key])

  const style: CSSProperties = reduce
    ? {}
    : {
        opacity: shown ? 1 : 0,
        // opacityOnly: para ancestros de modales fixed (un transform crearía
        // un containing block que los rompe).
        transform: opacityOnly ? undefined : (shown ? 'none' : 'translateY(22px)'),
        transition: `opacity .6s ${EASE} ${delay}s, transform .6s ${EASE} ${delay}s`,
        willChange: shown ? undefined : 'opacity, transform',
      }
  return { setRef, style, shown }
}

// Elemento polimórfico que aparece al entrar en viewport (una sola vez).
// `revealKey` debe ser un id estable y único (ej: `${slug}:inc-chip-2`).
type RevealProps = {
  as?: ElementType
  revealKey: string
  className?: string
  style?: CSSProperties
  delay?: number
  children?: ReactNode
} & Record<string, unknown>

function Reveal({ as = 'div', revealKey, className, style, delay = 0, children, ...rest }: RevealProps) {
  const { setRef, style: rvStyle } = useReveal(revealKey, delay)
  return createElement(
    as,
    { ref: setRef, className, style: { ...rvStyle, ...style }, ...rest },
    children,
  )
}

// ── Subcomponente: día del itinerario ─────────────────────────────

function DayItem({ dia, index, defaultOpen, revealKey }: { dia: ItinerarioDia; index: number; defaultOpen: boolean; revealKey: string }) {
  const [open, setOpen] = useState(defaultOpen)
  const { setRef, style } = useReveal(revealKey)
  const tIn = useRef<ReturnType<typeof setTimeout>>()
  const tOut = useRef<ReturnType<typeof setTimeout>>()
  const canHover = useRef(false)

  useEffect(() => {
    canHover.current = window.matchMedia('(hover: hover) and (pointer: fine)').matches
    return () => { clearTimeout(tIn.current); clearTimeout(tOut.current) }
  }, [])

  // Hover desktop: apertura lenta y cierre suave con delay 250ms. Colapsa vía
  // grid-template-rows, sin desmontar contenido.
  const onEnter = () => {
    if (!canHover.current) return
    clearTimeout(tOut.current)
    tIn.current = setTimeout(() => setOpen(true), 120)
  }
  const onLeave = () => {
    if (!canHover.current) return
    clearTimeout(tIn.current)
    tOut.current = setTimeout(() => setOpen(false), 250)
  }

  const num = String(index + 1).padStart(2, '0')
  const foto = dia.foto_url || null

  return (
    <div
      ref={setRef}
      className={`vv-day${open ? ' vv-open' : ''}`}
      style={style}
      onMouseEnter={onEnter}
      onMouseLeave={onLeave}
    >
      <div className="vv-day-dot">{num}</div>
      <div className="vv-day-card">
        <button className="vv-day-btn" aria-expanded={open} onClick={() => setOpen(o => !o)}>
          <span className="vv-l">
            {dia.dia && <span className="vv-dlabel">{dia.dia}</span>}
            {dia.titulo && <span className="vv-dtitle">{dia.titulo}</span>}
          </span>
          <span className="vv-chev">
            <ChevronDown className="w-[14px] h-[14px]" />
          </span>
        </button>
        <div className="vv-day-body"><div className="vv-day-body-in">
          <div className={`vv-day-content${foto ? '' : ' vv-nophoto'}`}>
            <p>{dia.descripcion}</p>
            {foto && (
              <div className="vv-ph">
                <img src={foto} alt={dia.titulo || dia.dia} loading="lazy" />
              </div>
            )}
          </div>
        </div></div>
      </div>
    </div>
  )
}

// ── Subcomponente: price card (contador + barra animados al entrar) ─

interface PriceCardProps {
  señaArs: number
  cuotaSaldoArs: number | null
  totalArs: number
  totalUsd: number | null
  disp: number
  max: number
  ctaPct: number
  noIncluye: string | null
  waUrl: string
  ctaSlot: ReactNode
  revealKey: string
}

function PriceCard(p: PriceCardProps) {
  // opacityOnly: la card es ancestro de los modales fixed (TransferModal /
  // PuntoSalidaModal). El mismo `shown` dispara el contador y la barra.
  const { setRef, style, shown } = useReveal(p.revealKey, 0, true)
  const [noIncOpen, setNoIncOpen] = useState(false)

  const cuposLabel = p.max > 0
    ? (p.disp > 0 ? `Quedan ${p.disp} lugares de ${p.max}` : 'Sin lugares disponibles')
    : 'Cupos por confirmar'

  return (
    <div className="vv-price-card" ref={setRef} style={style}>
      {p.señaArs > 0 ? (
        <>
          <div className="vv-lbl">Seña para confirmar tu lugar</div>
          <div className="vv-big">
            <NumberFlow value={shown ? p.señaArs : 0} prefix="$ " locales="es-AR" format={{ maximumFractionDigits: 0 }} />
            <small>ARS</small>
          </div>
          {p.cuotaSaldoArs != null ? (
            <div className="vv-note">+ cuotas cómodas de <strong>{fmtARS(p.cuotaSaldoArs)}</strong></div>
          ) : (
            <div className="vv-note"><strong>Pago único</strong></div>
          )}
        </>
      ) : (
        <>
          <div className="vv-lbl">Reservá tu lugar</div>
          <div className="vv-big" style={{ fontSize: 'clamp(26px,3vw,34px)' }}>Consultanos<small>por el valor</small></div>
        </>
      )}

      {(p.totalArs > 0 || p.totalUsd) && (
        <div className="vv-price-rows">
          {p.totalArs > 0 && (
            <div className="vv-row"><span>Total del viaje</span><strong>{fmtARS(p.totalArs)}</strong></div>
          )}
          {p.totalUsd ? (
            <div className="vv-row"><span>O pagá en dólares</span><strong>{formatUsd(p.totalUsd)}</strong></div>
          ) : null}
        </div>
      )}

      {p.max > 0 && (
        <div className="vv-cupos">
          <div className="vv-cupos-bar">
            <div className="vv-cupos-fill" style={{ width: shown ? `${p.ctaPct}%` : 0 }} />
          </div>
          <p>● {cuposLabel}</p>
        </div>
      )}

      {p.ctaSlot}

      <a className="vv-btn vv-btn-ghost" href={p.waUrl} target="_blank" rel="noopener noreferrer">
        <svg viewBox="0 0 32 32" width="18" height="18" fill="currentColor" aria-hidden="true">
          <path d="M16 .5C7.4.5.5 7.4.5 16c0 2.8.7 5.5 2.1 7.9L.5 31.5l7.9-2.1c2.3 1.3 4.9 2 7.6 2 8.6 0 15.5-6.9 15.5-15.4S24.6.5 16 .5zm8.5 17.1c-.5-.2-2.8-1.4-3.2-1.5-.5-.2-.8-.2-1.1.2-.3.5-1.2 1.5-1.5 1.9-.3.3-.5.4-1 .1-.5-.2-2-.7-3.8-2.3-1.4-1.2-2.3-2.7-2.6-3.2-.3-.5 0-.7.2-.9.2-.2.5-.5.7-.7.2-.2.3-.5.5-.8.2-.3.1-.5 0-.7-.1-.2-1.1-2.7-1.5-3.7-.4-.9-.8-.8-1.1-.8-.3 0-.5 0-.8 0s-.8.1-1.2.5c-.4.5-1.5 1.5-1.5 3.8s1.6 4.5 1.8 4.8c.2.3 3.1 4.8 7.5 6.7 1.1.5 1.9.7 2.6.9 1.1.3 2.1.3 2.9.2.9-.1 2.8-1.1 3.2-2.2.4-1.1.4-2 .3-2.2-.1-.2-.4-.3-.9-.5z" />
        </svg>
        Consultá por WhatsApp
      </a>

      {hasRichText(p.noIncluye) && (
        <>
          <button className="vv-btn-noinc" aria-expanded={noIncOpen} onClick={() => setNoIncOpen(o => !o)}>
            Ver qué <strong>no</strong> incluye
            <ChevronDown className="w-[13px] h-[13px]" />
          </button>
          <div className={`vv-noinc${noIncOpen ? ' vv-open' : ''}`}><div className="vv-noinc-in">
            <ul>
              {richTextLines(p.noIncluye).map((item, i) => (
                <li key={i}>{renderBold(item, `ninc${i}`)}</li>
              ))}
            </ul>
          </div></div>
        </>
      )}
    </div>
  )
}

// ── Página principal ──────────────────────────────────────────────

export default function VivencialDetail() {
  const { slug = '' } = useParams<{ slug: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [searchParams] = useSearchParams()
  const preview = searchParams.get('preview') === '1'

  const queryClient = useQueryClient()
  const { data: whatsappBusiness } = useWhatsappBusiness()
  const { data: course, isLoading, isError } = useCourseDetail(slug, preview)

  const enrollmentKey = ['vivencial-enrollment', user?.id, course?.id] as const
  const { data: enrollment = null } = useQuery({
    queryKey: enrollmentKey,
    queryFn: async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data } = await (supabase as any)
        .from('academy_enrollments')
        .select('*')
        .eq('user_id', user!.id)
        .eq('course_id', course!.id)
        .maybeSingle()
      return (data ?? null) as Enrollment | null
    },
    enabled: !!user?.id && !!course?.id,
    staleTime: 1000 * 30,
  })
  const refreshEnrollment = () => void queryClient.invalidateQueries({ queryKey: enrollmentKey })

  const heroRef = useRef<HTMLElement>(null)
  const heroImgRef = useRef<HTMLImageElement>(null)
  const bookingRef = useRef<HTMLElement>(null)
  const glassbarRef = useRef<HTMLDivElement>(null)

  const [toast, setToast] = useState<string | null>(null)
  const toastTimer = useRef<ReturnType<typeof setTimeout>>()
  const showToast = useCallback((msg: string) => {
    setToast(msg)
    clearTimeout(toastTimer.current)
    toastTimer.current = setTimeout(() => setToast(null), 2600)
  }, [])

  // Redirect non-vivencial courses to their detail page
  useEffect(() => {
    if (course && course.tipo !== 'vivencial') {
      navigate(`/cursos/${course.slug}`, { replace: true })
    }
  }, [course, navigate])

  // Parallax hero + glassbar (aparece pasado el hero, se oculta sobre la reserva).
  useEffect(() => {
    if (!course) return
    const reduce = prefersReduced()
    let bookingVisible = false
    let pastHero = false
    let ticking = false

    const updateBar = () => {
      glassbarRef.current?.classList.toggle('vv-show', pastHero && !bookingVisible)
    }
    const onScroll = () => {
      if (ticking) return
      ticking = true
      requestAnimationFrame(() => {
        const y = window.scrollY
        const heroH = heroRef.current?.offsetHeight ?? window.innerHeight
        pastHero = y > heroH * 0.55
        updateBar()
        if (!reduce && heroImgRef.current && y < heroH) {
          heroImgRef.current.style.transform = `translateY(${y * 0.18}px)`
        }
        ticking = false
      })
    }
    window.addEventListener('scroll', onScroll, { passive: true })

    let io: IntersectionObserver | null = null
    if (bookingRef.current) {
      io = new IntersectionObserver((entries) => {
        entries.forEach(e => { bookingVisible = e.isIntersecting; updateBar() })
      }, { threshold: 0.25 })
      io.observe(bookingRef.current)
    }
    return () => {
      window.removeEventListener('scroll', onScroll)
      io?.disconnect()
    }
  }, [course])

  if (isError) {
    return (
      <>
        <Header />
        <div className="flex flex-col items-center justify-center" style={{ minHeight: '60vh' }}>
          <p style={{ color: 'var(--text-3)', fontSize: '.9rem' }}>No encontramos este vivencial.</p>
          <button onClick={() => navigate('/vivencial')} style={{ color: 'var(--neon)', marginTop: 12, fontSize: '.85rem' }}>
            ← Volver a vivenciales
          </button>
        </div>
      </>
    )
  }

  if (isLoading || !course) {
    return (
      <>
        <Header />
        <div style={{ height: '80vh', background: '#14213D', position: 'relative', overflow: 'hidden', marginTop: -56 }}>
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(90deg, transparent, rgba(255,255,255,.05), transparent)', animation: 'sk-sweep 1.6s ease-in-out infinite' }} />
        </div>
      </>
    )
  }

  // ── Derivaciones de datos ──────────────────────────────────────
  const tema: VivencialTipoDestino = THEMES.includes(course.vivencial_tipo_destino as VivencialTipoDestino)
    ? (course.vivencial_tipo_destino as VivencialTipoDestino)
    : 'playa'

  const fotos = course.fotos ?? []
  const heroFoto = fotos[0] ?? ''
  const expFoto = fotos[1] ?? fotos[0] ?? ''
  const bookingFoto = fotos[2] ?? fotos[1] ?? fotos[0] ?? ''

  const { dias, noches } = calcDuracion(course.vivencial_fecha_salida, course.vivencial_fecha_regreso)
  const disp = course.vivencial_cupo_disponible ?? 0
  const max = course.vivencial_cupo_maximo ?? 0
  const ctaPct = max > 0 ? Math.max(0, Math.round((1 - disp / max) * 100)) : 0

  const pais = (course.vivencial_pais ?? '').trim()
  const heroWord = pais.toUpperCase()

  const puntos = puntosSalida(course)
  const salidaCiudades = puntos.map(p => p.ciudad).filter(Boolean)
  const salidaLabel = salidaCiudades.length ? salidaCiudades.join(' · ') : 'Por confirmar'

  const hoteles: VivencialHotel[] = course.vivencial_hoteles?.length
    ? course.vivencial_hoteles
    : course.vivencial_hotel
      ? [{ nombre: course.vivencial_hotel, noches, link: '', foto_url: null }]
      : []

  // Itinerario: chequeo defensivo de forma (claves dia/titulo/descripcion) y
  // sólo días con contenido real — un elemento malformado no rompe la lista.
  const itinerario = (course.vivencial_itinerario ?? []).filter(
    (d): d is ItinerarioDia =>
      !!d && typeof d === 'object' &&
      Boolean((d.titulo ?? '').trim() || (d.descripcion ?? '').trim()),
  )

  // Incluye: bullets iniciales → chips; el resto (manifiesto/Q&A) → prosa.
  const { chips: incChips, prosa: incProsa } = parseIncluye(course.incluye)
  const hasIncluye = incChips.length > 0 || incProsa.length > 0
  const showExperience = hasIncluye || hoteles.length > 0

  // Precios (misma lógica que la página vieja: precio_ars/usd ya son el total final).
  const mesesCuota = mesesHastaSalida(course.vivencial_fecha_salida)
  const señaArs = course.vivencial_precio_seña_ars ?? 0
  const totalArs = course.precio_ars ?? 0
  const totalUsd = course.precio_usd ?? null
  const saldoArs = Math.max(0, totalArs - señaArs)
  const cuotaSaldoArs = mesesCuota >= 1 && saldoArs > 0 ? Math.round(saldoArs / mesesCuota) : null

  const idiomaLabel = !course.idioma || course.idioma.toLowerCase() === 'es' ? 'español' : course.idioma

  // Key estable por elemento para el registro de revelados. Incluye el slug para
  // que cada vivencial anime fresco, pero sea idéntica entre renders/remounts.
  const rk = (s: string) => `${slug}:${s}`

  // WhatsApp: siempre al Business global de consultas.
  const waDigits = cleanWhatsappNumber(whatsappBusiness ?? '') || '5491112345678'
  const waUrl = `https://wa.me/${waDigits}?text=${encodeURIComponent(`Hola! Quiero consultar por el vivencial ${course.titulo} (${fmtDate(course.vivencial_fecha_salida)}). ¿Me pasás más info?`)}`

  const heroCards = [
    { k: 'Fechas', v: course.vivencial_fecha_salida && course.vivencial_fecha_regreso ? `${fmtDateShort(course.vivencial_fecha_salida)} — ${fmtDateShort(course.vivencial_fecha_regreso)}` : 'Por confirmar' },
    { k: 'Duración', v: dias > 0 ? `${dias} días · ${noches} noches` : 'Por confirmar' },
    { k: 'Cupos', v: max > 0 ? (disp > 0 ? `Quedan ${disp} de ${max}` : 'Agotado') : 'Sin límite' },
    { k: 'Sale desde', v: salidaLabel },
  ]

  function handleCopyLink() {
    navigator.clipboard.writeText(window.location.href).catch(() => {})
    showToast('✓ Link copiado al portapapeles')
  }
  function handleShareWA() {
    const url = window.location.href
    const text = `${course!.titulo} — Travexa Academy`
    // Compartir nativo si el dispositivo lo soporta; si no, cae a WhatsApp.
    if (navigator.share) {
      navigator.share({ title: text, url }).catch(() => {})
      return
    }
    const msg = `*Travexa Academy* — ${course!.titulo}\n\n${dias} días / ${noches} noches. Sale ${fmtDate(course!.vivencial_fecha_salida)} desde ${salidaCiudades.join(' · ') || 'Argentina'}.\nSeña: ${fmtARS(course!.vivencial_precio_seña_ars)}\n\n${url}`
    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank')
  }

  const scrollToReserva = () => bookingRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })

  // CTA state-driven (login gate / reservar / informar transferencia / saldo / pagado).
  const agotado = disp === 0 && !enrollment
  const ctaSlot = agotado ? (
    <div className="flex items-center justify-center" style={{ padding: '16px 24px', borderRadius: 15, fontWeight: 700, fontSize: 15, background: 'rgba(255,255,255,.12)', color: 'rgba(255,255,255,.7)', border: '1px solid rgba(255,255,255,.25)' }}>
      Agotado
    </div>
  ) : (
    <VivencialPagoCTA course={course} enrollment={enrollment} userId={user?.id} variant="booking" onChanged={refreshEnrollment} />
  )

  // ── Render ─────────────────────────────────────────────────────
  return (
    <>
      <Header />

      <div className="vvx" data-theme={tema} style={{ marginTop: -56 }}>

        {preview && (
          <div style={{ position: 'sticky', top: 0, zIndex: 70, background: '#C99A3A', color: '#0A1E29', textAlign: 'center', padding: '8px 16px', fontSize: 13, fontWeight: 600 }}>
            Modo preview — así se va a ver el vivencial publicado. {!course.publicado && 'Todavía está en borrador.'}
          </div>
        )}

        {/* ── HERO ── */}
        <header className="vv-hero" ref={heroRef}>
          <div className="vv-hero-media">
            {heroFoto && <img ref={heroImgRef} id="vvHeroImg" src={heroFoto} alt={course.titulo} />}
          </div>
          {heroWord && <div className="vv-hero-word" aria-hidden="true">{heroWord}</div>}

          <div className="vv-hero-inner vv-container">
            {/* La vuelta a vivenciales vive en el header de navegación real (Vivencial),
                no se duplica en el hero. */}
            <span className="vv-tag" data-enter="1">✦ Capacitación vivencial</span>
            <h1 data-enter="1">{course.titulo}</h1>
            {course.descripcion && <p className="vv-sub" data-enter="2">{course.descripcion}</p>}

            {/* Copiar link / compartir — debajo del título, junto a las mini-cards. */}
            <div className="vv-hero-share" data-enter="2">
              <button className="vv-hero-icon" onClick={handleCopyLink} aria-label="Copiar link" title="Copiar link">
                <Link2 className="w-[19px] h-[19px]" />
              </button>
              <button className="vv-hero-icon" onClick={handleShareWA} aria-label="Compartir" title="Compartir">
                <Share2 className="w-[19px] h-[19px]" />
              </button>
            </div>

            <div className="vv-hero-cards" data-enter="3">
              {heroCards.map(c => (
                <div className="vv-hero-card" key={c.k}>
                  <div className="vv-k">{c.k}</div>
                  <div className="vv-v">{c.v}</div>
                </div>
              ))}
            </div>
          </div>
        </header>

        {/* ── ITINERARIO ── */}
        {itinerario.length > 0 && (
          <section className="vv-itinerary">
            <div className="vv-container">
              <div className="vv-itinerary-head">
                <Reveal as="span" className="vv-eyebrow" revealKey={rk('itin-eyebrow')}>Itinerario</Reveal>
                <Reveal as="h2" delay={0.06} revealKey={rk('itin-title')}>Un día a la vez,<br />del embarque al regreso.</Reveal>
              </div>
              <div className="vv-timeline">
                {itinerario.map((dia, i) => (
                  <DayItem key={i} dia={dia} index={i} defaultOpen={i === 0} revealKey={rk(`itin-day-${i}`)} />
                ))}
              </div>
            </div>
          </section>
        )}

        {/* ── EXPERIENCIA (Qué incluye + Alojamiento) ── */}
        {showExperience && (
          <section className="vv-experience">
            <div className="vv-exp-bg">
              {expFoto && <img src={expFoto} alt="" loading="lazy" />}
            </div>
            <div className="vv-inner vv-container">
              {hasIncluye && (
                <>
                  <div className="vv-exp-head">
                    <Reveal as="span" className="vv-eyebrow" style={{ color: '#E8C685' }} revealKey={rk('inc-eyebrow')}>Qué incluye</Reveal>
                    <Reveal as="h2" delay={0.06} revealKey={rk('inc-title')}>Todo resuelto,<br />de punta a punta.</Reveal>
                    <Reveal as="p" delay={0.12} revealKey={rk('inc-sub')}>Vos ocupate de aprender el destino. De la logística nos encargamos nosotros.</Reveal>
                  </div>
                  {incChips.length > 0 && (
                    <div className="vv-inc-grid">
                      {incChips.map((item, i) => (
                        <Reveal className="vv-inc" key={i} delay={(i % 3) * 0.06} revealKey={rk(`inc-chip-${i}`)}>
                          <div className="vv-inc-ico"><Check className="w-[21px] h-[21px]" /></div>
                          <div><h4>{renderBold(item, `inc${i}`)}</h4></div>
                        </Reveal>
                      ))}
                    </div>
                  )}
                  {incProsa.length > 0 && (
                    <Reveal className="vv-inc-extra" revealKey={rk('inc-prosa')}>
                      {/* Cada bloque (cortado por subtítulo) en su propia card de
                          vidrio, para que el texto tenga contraste consistente
                          sin importar qué parte de la foto quede detrás. */}
                      {groupProsa(incProsa).map((group, gi) => (
                        <div className="vv-inc-card" key={gi}>
                          {group.map((para, i) => renderProsaItem(para, `incp${gi}-${i}`))}
                        </div>
                      ))}
                    </Reveal>
                  )}
                </>
              )}

              {hoteles.length > 0 && (
                <>
                  {/* Título fijo (no viene de la base). Si no hay bloque de
                      incluye arriba, colapsa el margen superior. */}
                  <div className="vv-exp-hotels-head" style={hasIncluye ? undefined : { marginTop: 0 }}>
                    <Reveal as="span" className="vv-eyebrow" style={{ color: '#E8C685' }} revealKey={rk('hotel-eyebrow')}>Alojamiento</Reveal>
                    <Reveal as="h3" delay={0.06} revealKey={rk('hotel-title')}>Dormís donde después vas a vender.</Reveal>
                  </div>
                  <div className="vv-hotel-grid">
                    {hoteles.map((h, i) => {
                      const foto = h.foto_url || expFoto || ''
                      const inner = (
                        <>
                          {foto
                            ? <img src={foto} alt={h.nombre} loading="lazy" />
                            : <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg,#1C2B4A,#0F1B33)' }} />}
                          <div className="vv-hz">
                            <div>
                              <h4>{h.nombre}</h4>
                              {h.noches > 0 && <div className="vv-nights">{h.noches} noche{h.noches !== 1 ? 's' : ''}</div>}
                            </div>
                            {h.link && (
                              <span className="vv-go">
                                <ExternalLink className="w-[16px] h-[16px]" />
                              </span>
                            )}
                          </div>
                        </>
                      )
                      return h.link ? (
                        <Reveal as="a" className="vv-hotel" key={i} href={h.link} target="_blank" rel="noopener noreferrer" delay={(i % 2) * 0.08} revealKey={rk(`hotel-${i}`)}>{inner}</Reveal>
                      ) : (
                        <Reveal className="vv-hotel" key={i} delay={(i % 2) * 0.08} revealKey={rk(`hotel-${i}`)}>{inner}</Reveal>
                      )
                    })}
                  </div>
                </>
              )}
            </div>
          </section>
        )}

        {/* ── PUNTOS DE SALIDA ── */}
        {puntos.length > 0 && (
          <section className="vv-departures vv-container">
            <div className="vv-departures-head">
              <Reveal as="span" className="vv-eyebrow" revealKey={rk('dep-eyebrow')}>Puntos de salida</Reveal>
              <Reveal as="h2" delay={0.06} revealKey={rk('dep-title')}>Subís cerca de tu casa.</Reveal>
            </div>
            <div className="vv-dep-grid">
              {puntos.map((p, i) => (
                <Reveal className="vv-dep" key={i} delay={(i % 4) * 0.06} revealKey={rk(`dep-${i}`)}>
                  <div className="vv-pin"><MapPin className="w-[20px] h-[20px]" /></div>
                  <h4>{p.ciudad}</h4>
                  {p.detalle_encuentro && <p>{p.detalle_encuentro}</p>}
                </Reveal>
              ))}
            </div>
          </section>
        )}

        {/* ── RESERVA ── */}
        <section className="vv-booking" id="reserva" ref={bookingRef}>
          <div className="vv-booking-bg">
            {bookingFoto && <img src={bookingFoto} alt="" loading="lazy" />}
          </div>
          <div className="vv-booking-in">
            <div>
              {/* Copy fijo del mockup — no viene de la base. */}
              <Reveal as="span" className="vv-eyebrow" style={{ color: '#E8C685' }} revealKey={rk('booking-eyebrow')}>Reservá tu lugar</Reveal>
              <Reveal as="h2" delay={0.06} revealKey={rk('booking-title')}>Confirmá con la seña y pagá en cuotas.</Reveal>
              <Reveal as="p" className="vv-lead" delay={0.12} revealKey={rk('booking-lead')}>
                El idioma del vivencial es {idiomaLabel}{max > 0 ? ` y el cupo máximo es de ${max} asesores` : ''}. Los lugares se confirman por orden de seña.
              </Reveal>
              <ul className="vv-benefits">
                {CTA_FEATURES.map((f, i) => (
                  <Reveal as="li" key={i} delay={0.15 + i * 0.06} revealKey={rk(`booking-benefit-${i}`)}>
                    <Check className="w-[18px] h-[18px]" strokeWidth={2.4} />{f}
                  </Reveal>
                ))}
              </ul>
            </div>

            <PriceCard
              señaArs={señaArs}
              cuotaSaldoArs={cuotaSaldoArs}
              totalArs={totalArs}
              totalUsd={totalUsd}
              disp={disp}
              max={max}
              ctaPct={ctaPct}
              noIncluye={course.no_incluye}
              waUrl={waUrl}
              ctaSlot={ctaSlot}
              revealKey={rk('booking-pricecard')}
            />
          </div>
        </section>

        {/* ── GLASS BAR flotante ── */}
        <div className="vv-glassbar" ref={glassbarRef} role="region" aria-label="Reserva rápida">
          <div className="vv-glassbar-in">
            <div className="vv-gp">
              <div className="vv-k">Seña desde</div>
              <div className="vv-v">
                {fmtARS(señaArs)}{totalUsd ? <small> · o {formatUsd(totalUsd)} total</small> : null}
              </div>
            </div>
            {max > 0 && (
              <div className="vv-gc"><span className="vv-dot" />Quedan {disp} de {max} lugares</div>
            )}
            <button className="vv-bar-btn" onClick={scrollToReserva}>Ver detalle</button>
          </div>
        </div>
      </div>

      {/* Footer estándar del sitio: la reserva es el último bloque del
          vivencial y de ahí se pasa directo al pie, sin franjas vacías. */}
      <Footer />

      {/* Toast (copiar link) */}
      {toast && (
        <div style={{ position: 'fixed', bottom: 92, left: '50%', transform: 'translateX(-50%)', zIndex: 600, background: '#14213D', color: '#fff', borderRadius: 12, padding: '10px 18px', fontSize: 13, fontWeight: 600, boxShadow: '0 12px 40px rgba(6,12,24,.4)', pointerEvents: 'none' }}>
          {toast}
        </div>
      )}
    </>
  )
}
