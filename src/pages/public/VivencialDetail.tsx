import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import { useInView } from 'framer-motion'
import { ArrowLeft, Link2, Share2, Check, MapPin, ChevronDown, ExternalLink } from 'lucide-react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import NumberFlow from '@number-flow/react'
import Header from '@/components/layout/Header'
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
const CTA_FEATURES = [
  'Viajá, disfrutá y capacitate profesionalmente',
  'Instructores con más de 15 años de experiencia',
  'Convertite en profesional del destino y crecé con Travexa',
]

// Un ítem de "incluye" corto va como chip; los párrafos largos van como texto.
const CHIP_MAXLEN = 55

// ── Subcomponente: día del itinerario ─────────────────────────────

function DayItem({ dia, index, defaultOpen }: { dia: ItinerarioDia; index: number; defaultOpen: boolean }) {
  const [open, setOpen] = useState(defaultOpen)
  const tIn = useRef<ReturnType<typeof setTimeout>>()
  const tOut = useRef<ReturnType<typeof setTimeout>>()
  const canHover = useRef(false)

  useEffect(() => {
    canHover.current = window.matchMedia('(hover: hover) and (pointer: fine)').matches
    return () => { clearTimeout(tIn.current); clearTimeout(tOut.current) }
  }, [])

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
      className={`vv-day vv-reveal${open ? ' vv-open' : ''}`}
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
  ctaSlot: React.ReactNode
}

function PriceCard(p: PriceCardProps) {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, amount: 0.3 })
  const [noIncOpen, setNoIncOpen] = useState(false)

  const cuposLabel = p.max > 0
    ? (p.disp > 0 ? `Quedan ${p.disp} lugares de ${p.max}` : 'Sin lugares disponibles')
    : 'Cupos por confirmar'

  return (
    <div className="vv-price-card vv-reveal" ref={ref}>
      {p.señaArs > 0 ? (
        <>
          <div className="vv-lbl">Seña para confirmar tu lugar</div>
          <div className="vv-big">
            <NumberFlow value={inView ? p.señaArs : 0} prefix="$ " locales="es-AR" format={{ maximumFractionDigits: 0 }} />
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
            <div className="vv-cupos-fill" style={{ width: inView ? `${p.ctaPct}%` : 0 }} />
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

  const rootRef = useRef<HTMLDivElement>(null)
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

  // Reveal on scroll — observa los .vv-reveal una vez montado el contenido.
  useEffect(() => {
    if (!course) return
    const root = rootRef.current
    if (!root) return
    const els = Array.from(root.querySelectorAll<HTMLElement>('.vv-reveal:not(.vv-in)'))
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e, i) => {
        if (e.isIntersecting) {
          const el = e.target as HTMLElement
          el.style.transitionDelay = `${(i % 4) * 60}ms`
          el.classList.add('vv-in')
          io.unobserve(el)
        }
      })
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' })
    els.forEach(el => io.observe(el))
    return () => io.disconnect()
  }, [course])

  // Parallax hero + glassbar (aparece pasado el hero, se oculta sobre la reserva).
  useEffect(() => {
    if (!course) return
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
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

  // Itinerario: sólo días con contenido real (título o descripción).
  const itinerario = (course.vivencial_itinerario ?? []).filter(d => (d.titulo?.trim() || d.descripcion?.trim()))

  // Incluye: ítems cortos → chips; párrafos largos → texto bajo la grilla.
  const incLines = richTextLines(course.incluye)
  const incChips = incLines.filter(l => l.length <= CHIP_MAXLEN)
  const incParas = incLines.filter(l => l.length > CHIP_MAXLEN)
  const showExperience = incChips.length > 0 || incParas.length > 0 || hoteles.length > 0

  // Precios (misma lógica que la página vieja: precio_ars/usd ya son el total final).
  const mesesCuota = mesesHastaSalida(course.vivencial_fecha_salida)
  const señaArs = course.vivencial_precio_seña_ars ?? 0
  const totalArs = course.precio_ars ?? 0
  const totalUsd = course.precio_usd ?? null
  const saldoArs = Math.max(0, totalArs - señaArs)
  const cuotaSaldoArs = mesesCuota >= 1 && saldoArs > 0 ? Math.round(saldoArs / mesesCuota) : null

  const idiomaLabel = !course.idioma || course.idioma.toLowerCase() === 'es' ? 'español' : course.idioma

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
    const msg = `*Travexa Academy* — ${course!.titulo}\n\n${dias} días / ${noches} noches. Sale ${fmtDate(course!.vivencial_fecha_salida)} desde ${salidaCiudades.join(' · ') || 'Argentina'}.\nSeña: ${fmtARS(course!.vivencial_precio_seña_ars)}\n\n${window.location.href}`
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

      <div ref={rootRef} className="vvx" data-theme={tema} style={{ marginTop: -56 }}>

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
            <div className="vv-hero-top" data-enter="1">
              <button className="vv-hero-back" onClick={() => navigate('/vivencial')}>
                <ArrowLeft className="w-[15px] h-[15px]" /> Volver a vivenciales
              </button>
              <div className="vv-hero-actions">
                <button className="vv-hero-icon" onClick={handleCopyLink} aria-label="Copiar link" title="Copiar link">
                  <Link2 className="w-[16px] h-[16px]" />
                </button>
                <button className="vv-hero-icon" onClick={handleShareWA} aria-label="Compartir" title="Compartir">
                  <Share2 className="w-[16px] h-[16px]" />
                </button>
              </div>
            </div>

            <span className="vv-tag" data-enter="2">✦ Capacitación vivencial</span>
            <h1 data-enter="3">{course.titulo}</h1>
            {course.descripcion && <p className="vv-sub" data-enter="3">{course.descripcion}</p>}

            <div className="vv-hero-cards" data-enter="4">
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
                <span className="vv-eyebrow vv-reveal">Itinerario</span>
                <h2 className="vv-reveal">Un día a la vez,<br />del embarque al regreso.</h2>
              </div>
              <div className="vv-timeline">
                {itinerario.map((dia, i) => (
                  <DayItem key={i} dia={dia} index={i} defaultOpen={i === 0} />
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
              {(incChips.length > 0 || incParas.length > 0) && (
                <>
                  <div className="vv-exp-head">
                    <span className="vv-eyebrow vv-reveal" style={{ color: '#E8C685' }}>Qué incluye</span>
                    <h2 className="vv-reveal">Todo resuelto,<br />de punta a punta.</h2>
                    <p className="vv-reveal">Vos ocupate de aprender el destino. De la logística nos encargamos nosotros.</p>
                  </div>
                  {incChips.length > 0 && (
                    <div className="vv-inc-grid">
                      {incChips.map((item, i) => (
                        <div className="vv-inc vv-reveal" key={i}>
                          <div className="vv-inc-ico"><Check className="w-[21px] h-[21px]" /></div>
                          <div><h4>{renderBold(item, `inc${i}`)}</h4></div>
                        </div>
                      ))}
                    </div>
                  )}
                  {incParas.length > 0 && (
                    <div className="vv-inc-extra vv-reveal">
                      {incParas.map((para, i) => (
                        <p key={i}>{renderBold(para, `incp${i}`)}</p>
                      ))}
                    </div>
                  )}
                </>
              )}

              {hoteles.length > 0 && (
                <>
                  <div className="vv-exp-hotels-head">
                    <span className="vv-eyebrow vv-reveal" style={{ color: '#E8C685' }}>Alojamiento</span>
                    <h3 className="vv-reveal">Dormís donde después vas a vender.</h3>
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
                        <a className="vv-hotel vv-reveal" key={i} href={h.link} target="_blank" rel="noopener noreferrer">{inner}</a>
                      ) : (
                        <div className="vv-hotel vv-reveal" key={i}>{inner}</div>
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
              <span className="vv-eyebrow vv-reveal">Puntos de salida</span>
              <h2 className="vv-reveal">Subís cerca de tu casa.</h2>
            </div>
            <div className="vv-dep-grid">
              {puntos.map((p, i) => (
                <div className="vv-dep vv-reveal" key={i}>
                  <div className="vv-pin"><MapPin className="w-[20px] h-[20px]" /></div>
                  <h4>{p.ciudad}</h4>
                  {p.detalle_encuentro && <p>{p.detalle_encuentro}</p>}
                </div>
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
              <span className="vv-eyebrow vv-reveal" style={{ color: '#E8C685' }}>Reservá tu lugar</span>
              <h2 className="vv-reveal">Confirmá con la seña y pagá en cuotas.</h2>
              <p className="vv-lead vv-reveal">
                El idioma del vivencial es {idiomaLabel}{max > 0 ? ` y el cupo máximo es de ${max} asesores` : ''}. Los lugares se confirman por orden de seña.
              </p>
              <ul className="vv-benefits">
                {CTA_FEATURES.map((f, i) => (
                  <li className="vv-reveal" key={i}>
                    <Check className="w-[18px] h-[18px]" strokeWidth={2.4} />{f}
                  </li>
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

      {/* Toast (copiar link) */}
      {toast && (
        <div style={{ position: 'fixed', bottom: 92, left: '50%', transform: 'translateX(-50%)', zIndex: 600, background: '#14213D', color: '#fff', borderRadius: 12, padding: '10px 18px', fontSize: 13, fontWeight: 600, boxShadow: '0 12px 40px rgba(6,12,24,.4)', pointerEvents: 'none' }}>
          {toast}
        </div>
      )}
    </>
  )
}
