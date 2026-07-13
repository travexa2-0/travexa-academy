import { useState, useEffect, useRef, useCallback, useLayoutEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, ChevronDown, Check, X, MapPin, CalendarDays, Clock, Users, Bus, Plane, Ship, Sailboat, Utensils, Hotel as HotelIcon, ExternalLink } from 'lucide-react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import Header from '@/components/layout/Header'
import { useCourseDetail, useReviews } from '@/hooks/useCourses'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import VivencialPagoCTA from '@/components/vivencial/VivencialPagoCTA'
import { useWhatsappBusiness, cleanWhatsappNumber } from '@/hooks/useVivencialPago'
import { cupoEstado } from '@/lib/cupo'
import { displayName } from '@/lib/utils'
import { richTextLines, hasRichText, renderBold } from '@/lib/richText'
import { mesesHastaSalida } from '@/lib/vivencial'
import { formatUsd } from '@/pages/admin/format'
import type { ItinerarioDia, Enrollment, VivencialPuntoSalida, VivencialHotel } from '@/types'

// Ícono por tipo de traslado.
const TRASLADO_ICON: Record<string, typeof Bus> = {
  'Bus': Bus, 'Aéreo': Plane, 'Navegación': Sailboat, 'Crucero': Ship,
}

// ── Helpers ───────────────────────────────────────────────────────

function fmtDate(d: string | null): string {
  if (!d) return '—'
  const [y, m, day] = d.split('-').map(Number)
  return format(new Date(y, m - 1, day), 'd MMM yyyy', { locale: es })
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
    (new Date(y2, m2 - 1, d2).getTime() - new Date(y1, m1 - 1, d1).getTime()) / 86400000
  ) + 1
  return { dias, noches: Math.max(0, dias - 1) }
}

// ── Tab config ────────────────────────────────────────────────────

const TABS = [
  { key: 'desc',     label: 'Descripción' },
  { key: 'itin',     label: 'Itinerario' },
  { key: 'inc',      label: 'Qué incluye' },
  { key: 'inst',     label: 'Instructor' },
  { key: 'revs',     label: 'Reseñas' },
] as const

type TabKey = typeof TABS[number]['key']

// Beneficios fijos de la card de reserva — iguales para todos los vivenciales.
// NO se leen de la DB (antes se derivaban de `incluye`, texto libre editable que
// mostraba datos de prueba). Hardcodeados a propósito.
const CTA_FEATURES = [
  'Viaja, disfruta y capacitate profesionalmente',
  'Instructores con más de 15 años de experiencia',
  'Convertite en profesional del destino y crecé con Travexa',
]

// ── FAQ data ──────────────────────────────────────────────────────

const FAQ_ITEMS = [
  { q: '¿Cómo reservo mi lugar?', a: 'Tocás "Reservar mi lugar", elegís desde dónde salís y confirmás. Tu lugar queda reservado al instante y te mostramos los datos bancarios para transferir.' },
  { q: '¿Qué pasa si se llena el cupo?', a: 'El cupo es limitado. Una vez agotado, quedás en lista de espera para la próxima salida del mismo destino.' },
  { q: '¿Puedo cancelar?', a: 'Sí, con reembolso del 100% de la seña si cancelás hasta 30 días antes de la salida. Consultá los términos completos.' },
  { q: '¿Está incluido el vuelo?', a: 'Depende del vivencial. Ver la sección "Qué incluye" para los detalles específicos de este viaje.' },
  { q: '¿Cómo se paga el viaje?', a: 'La reserva no cobra nada. Después transferís (en un pago o en partes, siempre antes de viajar) y subís el comprobante desde tu perfil. Yesica lo revisa y confirma tu pago.' },
]

// ── Subcomponents ─────────────────────────────────────────────────

function Toast({ msg, visible }: { msg: string; visible: boolean }) {
  return (
    <motion.div
      className="fixed bottom-7 left-1/2 z-[600] font-medium rounded-[10px] border px-4 py-[9px] text-[13px] whitespace-nowrap pointer-events-none"
      style={{ background: 'var(--bg-2)', borderColor: 'var(--line-s)', color: 'var(--text-1)', boxShadow: '0 8px 24px rgba(0,0,0,.4)' }}
      initial={{ opacity: 0, y: 16, x: '-50%' }}
      animate={{ opacity: visible ? 1 : 0, y: visible ? 0 : 16, x: '-50%' }}
      transition={{ duration: 0.17, ease: [0.23, 1, 0.32, 1] }}
    >
      {msg}
    </motion.div>
  )
}

type ModalType = 'info' | 'faq' | null

function FloatingModal({ type, onClose }: { type: ModalType; onClose: () => void }) {
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  const [openFaq, setOpenFaq] = useState<number | null>(null)

  const isInfo = type === 'info'
  const title  = isInfo ? '¿Qué es un vivencial?' : 'Preguntas frecuentes'
  const icon   = isInfo ? '✦' : '?'

  return (
    <motion.div
      className="fixed inset-0 z-[700] flex items-center justify-center p-6"
      style={{ background: 'rgba(6,13,20,.6)', backdropFilter: 'blur(6px)' }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <motion.div
        className="relative w-full max-w-[420px] rounded-[20px] border"
        style={{
          background: 'var(--bg-2)',
          borderColor: 'var(--line-s)',
          padding: '34px 30px 28px',
          boxShadow: '0 0 0 1px rgba(245,243,236,.04), 0 30px 70px rgba(0,0,0,.55), 0 0 90px rgba(0,229,200,.08)',
        }}
        initial={{ opacity: 0, y: 18, scale: .96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 8, scale: .97 }}
        transition={{ duration: 0.32, ease: [0.23, 1, 0.32, 1] }}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-[30px] h-[30px] rounded-full flex items-center justify-center border"
          style={{ background: 'var(--card)', borderColor: 'var(--line)', color: 'var(--text-3)' }}
          aria-label="Cerrar"
        >
          <X className="w-[14px] h-[14px]" />
        </button>

        <div
          className="w-11 h-11 rounded-[12px] flex items-center justify-center text-[1.2rem] mb-[18px]"
          style={{ background: 'var(--neon-dim)', border: '1px solid rgba(0,229,200,.3)', color: 'var(--neon)' }}
        >
          {icon}
        </div>
        <h3 className="font-display font-bold mb-3" style={{ fontSize: '1.3rem', color: 'var(--text-1)', letterSpacing: '-.01em' }}>
          {title}
        </h3>

        {isInfo ? (
          <div style={{ fontSize: '.9rem', lineHeight: 1.7, color: 'var(--text-2)' }}>
            <p>Un vivencial es un viaje grupal pensado para asesores, no para turistas. Vas con Yesica o un instructor aliado, conocés el destino con mirada comercial y volvés con el argumento de venta, las fotos y los contactos que solo da haber estado ahí.</p>
            <p style={{ marginTop: 12 }}>Grupos chicos, workshops incluidos durante el viaje y certificado Travexa Academy al volver.</p>
          </div>
        ) : (
          <div style={{ fontSize: '.9rem', lineHeight: 1.7, color: 'var(--text-2)' }}>
            {FAQ_ITEMS.map((item, i) => (
              <div key={i} style={{ marginBottom: 12 }}>
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full text-left font-semibold"
                  style={{ color: 'var(--text-1)', marginBottom: 4 }}
                >
                  {item.q}
                </button>
                <AnimatePresence initial={false}>
                  {openFaq === i && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25, ease: [0.23, 1, 0.32, 1] }}
                      style={{ overflow: 'hidden' }}
                    >
                      <p style={{ color: 'var(--text-2)', paddingBottom: 4 }}>{item.a}</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        )}

        <motion.button
          className="w-full font-display font-bold rounded-[10px] mt-5"
          style={{ background: 'var(--neon)', color: '#0A1E29', fontSize: '14.5px', padding: '12px 24px', minHeight: 48 }}
          onClick={onClose}
          whileTap={{ scale: 0.97 }}
        >
          {isInfo ? 'Entendido' : 'Cerrar'}
        </motion.button>
      </motion.div>
    </motion.div>
  )
}

// ── Main page ─────────────────────────────────────────────────────

export default function VivencialDetail() {
  const { slug = '' } = useParams<{ slug: string }>()
  const navigate       = useNavigate()
  const { user }       = useAuth()

  const queryClient    = useQueryClient()
  const { data: whatsappBusiness } = useWhatsappBusiness()
  const { data: course, isLoading, isError } = useCourseDetail(slug)
  const { data: reviews = [] }               = useReviews(course?.id)

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

  const [activeTab,   setActiveTab]   = useState<TabKey>('desc')
  const [accOpen,     setAccOpen]     = useState<number>(0)
  const [modal,       setModal]       = useState<ModalType>(null)
  const [toastMsg,    setToastMsg]    = useState('')
  const [toastVisible, setToastVisible] = useState(false)
  const [indicator,   setIndicator]   = useState({ left: 0, width: 0 })

  const tabRefs    = useRef<(HTMLButtonElement | null)[]>([])
  const toastTimer = useRef<ReturnType<typeof setTimeout>>()

  // Redirect non-vivencial courses to their detail page
  useEffect(() => {
    if (course && course.tipo !== 'vivencial') {
      navigate(`/cursos/${course.slug}`, { replace: true })
    }
  }, [course, navigate])

  const showToast = useCallback((msg: string) => {
    setToastMsg(msg)
    setToastVisible(true)
    clearTimeout(toastTimer.current)
    toastTimer.current = setTimeout(() => setToastVisible(false), 2800)
  }, [])

  const updateIndicator = useCallback((tabKey: TabKey) => {
    const idx = TABS.findIndex(t => t.key === tabKey)
    const btn = tabRefs.current[idx]
    if (btn) setIndicator({ left: btn.offsetLeft, width: btn.offsetWidth })
  }, [])

  useLayoutEffect(() => {
    requestAnimationFrame(() => updateIndicator(activeTab))
  }, [activeTab, updateIndicator])

  if (isError) {
    return (
      <div style={{ background: 'var(--bg)', minHeight: '100vh' }}>
        <Header />
        <div className="flex flex-col items-center justify-center" style={{ paddingTop: 120 }}>
          <p style={{ color: 'var(--text-3)', fontSize: '.9rem' }}>No encontramos este vivencial.</p>
          <button onClick={() => navigate('/vivencial')} style={{ color: 'var(--neon)', marginTop: 12, fontSize: '.85rem' }}>
            ← Volver a vivenciales
          </button>
        </div>
      </div>
    )
  }

  if (isLoading || !course) {
    return (
      <div style={{ background: 'var(--bg)', minHeight: '100vh' }}>
        <Header />
        <div style={{ height: 480, background: '#162F3E', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(90deg, transparent, rgba(255,255,255,.05), transparent)', animation: 'sk-sweep 1.6s ease-in-out infinite' }} />
        </div>
      </div>
    )
  }

  const { dias, noches } = calcDuracion(course.vivencial_fecha_salida, course.vivencial_fecha_regreso)
  const disp    = course.vivencial_cupo_disponible ?? 0
  const max     = course.vivencial_cupo_maximo ?? 0
  const estado  = cupoEstado(disp)
  const ctaPct  = max > 0 ? Math.round((1 - disp / max) * 100) : 0
  const ctaBarColor = estado.cls === 'ok' ? 'var(--primary)' : estado.cls === 'low' ? 'var(--urg)' : '#EF4444'
  const thumb   = course.thumbnail_url ?? course.fotos?.[0] ?? ''
  // Consultas siempre al WhatsApp Business global (vivencial_whatsapp_url pasó a
  // ser el grupo del viaje, no un contacto de consultas).
  const waDigits = cleanWhatsappNumber(whatsappBusiness ?? '') || '5491112345678'
  const waUrl   = `https://wa.me/${waDigits}?text=${encodeURIComponent(`Hola! Quiero consultar por el vivencial ${course.titulo} (${fmtDate(course.vivencial_fecha_salida)}). ¿Me pasás más info?`)}`

  // Puntos de salida y hoteles múltiples, con fallback a las columnas legacy.
  const puntos: VivencialPuntoSalida[] = course.vivencial_puntos_salida?.length
    ? course.vivencial_puntos_salida
    : course.vivencial_ciudad_salida
      ? [{ ciudad: course.vivencial_ciudad_salida, detalle_encuentro: course.vivencial_punto_encuentro ?? '' }]
      : []
  const hoteles: VivencialHotel[] = course.vivencial_hoteles?.length
    ? course.vivencial_hoteles
    : course.vivencial_hotel
      ? [{ nombre: course.vivencial_hotel, noches, link: '', foto_url: null }]
      : []
  const salidaCiudades = puntos.map(p => p.ciudad).filter(Boolean)
  const salidaLabel = salidaCiudades.length ? salidaCiudades.join(' · ') : 'Por confirmar'
  const traslado = course.vivencial_tipo_traslado ?? []
  const regimen = course.vivencial_regimen_alimentos ?? []
  // Cuota mensual sobre el SALDO (total − seña), repartido en los meses que faltan
  // hasta la salida. Reusa mesesHastaSalida (misma lógica que la cuota del listado).
  // Si falta <1 mes o no hay saldo → sin cuota → "Pago único".
  const mesesCuota = mesesHastaSalida(course.vivencial_fecha_salida)
  const señaArs = course.vivencial_precio_seña_ars ?? 0
  const totalArs = course.precio_ars ?? 0
  const saldoArs = Math.max(0, totalArs - señaArs)
  const cuotaSaldoArs = mesesCuota >= 1 && saldoArs > 0 ? Math.round(saldoArs / mesesCuota) : null

  function handleCopyLink() {
    navigator.clipboard.writeText(window.location.href).catch(() => {})
    showToast('✓ Link copiado al portapapeles')
  }

  function handleShareWA() {
    const msg = `*Travexa Academy* — ${course!.titulo}\n\n${dias} días / ${noches} noches. Sale ${fmtDate(course!.vivencial_fecha_salida)} desde ${salidaCiudades.join(' · ') || 'Argentina'}.\nSeña: ${fmtARS(course!.vivencial_precio_seña_ars)}\n\n${window.location.href}`
    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank')
  }

  const avgRating = reviews.length > 0
    ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length
    : 0

  // ── Render ─────────────────────────────────────────────────────

  return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh' }}>
      <Header />

      {/* ── HERO ─────────────────────────────────────────────── */}
      <div style={{ position: 'relative', height: 480, overflow: 'hidden' }}>
        {thumb ? (
          <img src={thumb} alt={course.titulo} className="w-full h-full object-cover block" />
        ) : (
          <div style={{ width: '100%', height: '100%', background: '#162F3E' }} />
        )}
        {/* Gradient overlay */}
        <div
          style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(6,13,20,.15) 0%, rgba(6,13,20,.55) 50%, rgba(6,13,20,.97) 100%)' }}
        />

        {/* Hero content */}
        <div className="w-full max-w-[1200px] mx-auto px-[22px]" style={{ position: 'absolute', bottom: 30, left: 0, right: 0 }}>
          {/* Back */}
          <button
            onClick={() => navigate('/vivencial')}
            className="flex items-center gap-[6px] font-mono uppercase mb-[13px] transition-colors"
            style={{ fontSize: '9.5px', letterSpacing: '.06em', color: 'var(--text-3)' }}
          >
            <ArrowLeft className="w-[13px] h-[13px]" />
            Volver a vivenciales
          </button>

          {/* Vivencial badge */}
          <span
            className="relative overflow-hidden font-mono text-[9px] font-semibold tracking-[.08em] uppercase py-[3.5px] px-2 rounded-[4px] inline-flex items-center gap-1 mb-[10px]"
            style={{ background: 'var(--gold)', color: 'var(--bg)', lineHeight: 1.3 }}
          >
            ✦ Vivencial
            <span className="badge-viv-sweep" />
          </span>

          {/* Title */}
          <h1
            className="font-display font-bold"
            style={{ fontSize: 'clamp(1.6rem,4vw,2.8rem)', letterSpacing: '-.02em', lineHeight: 1.06, maxWidth: 720 }}
          >
            {course.titulo}
          </h1>

          {/* Country / category */}
          {course.category && (
            <div className="flex items-center gap-[7px] font-mono uppercase mt-[6px]" style={{ fontSize: 10, color: 'var(--neon)', letterSpacing: '.12em' }}>
              <span style={{ width: 16, height: 1, background: 'var(--neon)', display: 'inline-block' }} />
              {course.category.nombre}
            </div>
          )}

          {/* Meta */}
          <div className="flex items-center flex-wrap gap-4 mt-3">
            {course.vivencial_fecha_salida && (
              <span className="flex items-center gap-[5px] font-mono" style={{ fontSize: 10, color: 'var(--text-2)' }}>
                <CalendarDays className="w-3 h-3" style={{ color: 'var(--text-3)' }} />
                {fmtDate(course.vivencial_fecha_salida)} — {fmtDate(course.vivencial_fecha_regreso)}
              </span>
            )}
            {dias > 0 && (
              <span className="flex items-center gap-[5px] font-mono" style={{ fontSize: 10, color: 'var(--text-2)' }}>
                <Clock className="w-3 h-3" style={{ color: 'var(--text-3)' }} />
                {dias} días / {noches} noches
              </span>
            )}
            {max > 0 && (
              <span className="flex items-center gap-[5px] font-mono" style={{ fontSize: 10, color: 'var(--text-2)' }}>
                <Users className="w-3 h-3" style={{ color: 'var(--text-3)' }} />
                {disp === 0 ? 'Agotado' : `Quedan ${disp} lugares`}
              </span>
            )}
            {salidaCiudades.length > 0 && (
              <span className="flex items-center gap-[5px] font-mono" style={{ fontSize: 10, color: 'var(--text-2)' }}>
                <MapPin className="w-3 h-3" style={{ color: 'var(--text-3)' }} />
                Sale desde {salidaLabel}
              </span>
            )}
          </div>

          {/* Share buttons */}
          <div className="flex items-center gap-[7px] mt-[13px]">
            <button
              onClick={handleCopyLink}
              className="flex items-center gap-[5px] font-mono uppercase rounded-[6px] border transition-colors"
              style={{ fontSize: 9, letterSpacing: '.06em', color: 'var(--text-3)', padding: '5px 10px', borderColor: 'var(--line)', background: 'rgba(6,13,20,.5)', backdropFilter: 'blur(8px)' }}
            >
              <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
                <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
              </svg>
              Copiar link
            </button>
            <button
              onClick={handleShareWA}
              className="flex items-center gap-[5px] font-mono uppercase rounded-[6px] border transition-colors"
              style={{ fontSize: 9, letterSpacing: '.06em', color: 'var(--text-3)', padding: '5px 10px', borderColor: 'var(--line)', background: 'rgba(6,13,20,.5)', backdropFilter: 'blur(8px)' }}
            >
              <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
                <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/>
              </svg>
              Compartir
            </button>
          </div>
        </div>
      </div>

      {/* ── WHITE SECTION ─────────────────────────────────────── */}
      <div style={{ background: '#F2F5F4', paddingBottom: 0 }}>
        <div className="w-full max-w-[1200px] mx-auto px-[22px]">
          <div
            className="grid gap-11 items-start"
            style={{ gridTemplateColumns: '1fr 360px', paddingTop: 30, paddingBottom: 80 }}
          >
            {/* ── LEFT COLUMN ── */}
            <div style={{ background: '#fff', borderRadius: '16px 16px 0 0', padding: '30px 32px', minHeight: 480 }}>

              {/* ── DATOS CLAVE (bloque destacado) ── */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-[10px]" style={{ marginBottom: 18 }}>
                {[
                  { icon: CalendarDays, label: 'Fechas', value: `${fmtDate(course.vivencial_fecha_salida)} — ${fmtDate(course.vivencial_fecha_regreso)}` },
                  { icon: Clock, label: 'Duración', value: dias > 0 ? `${dias} días / ${noches} noches` : 'Por confirmar' },
                  { icon: Users, label: 'Cupos', value: max > 0 ? (disp === 0 ? 'Agotado' : `Quedan ${disp} de ${max}`) : 'Sin límite' },
                  { icon: MapPin, label: salidaCiudades.length > 1 ? 'Sale desde' : 'Salida', value: salidaLabel },
                ].map(item => (
                  <div key={item.label} style={{ background: 'rgba(14,107,92,.06)', border: '1px solid rgba(14,107,92,.12)', borderRadius: 12, padding: '14px 15px' }}>
                    <div className="flex items-center gap-[6px]" style={{ marginBottom: 8 }}>
                      <item.icon style={{ width: 15, height: 15, color: 'var(--primary)' }} />
                      <span className="font-mono uppercase" style={{ fontSize: 9, letterSpacing: '.1em', color: '#6A8590' }}>{item.label}</span>
                    </div>
                    <p className="font-display font-bold" style={{ fontSize: '.98rem', color: '#0A1E29', lineHeight: 1.25, letterSpacing: '-.01em' }}>{item.value}</p>
                  </div>
                ))}
              </div>

              {/* Traslado + régimen como tags visuales */}
              {(traslado.length > 0 || regimen.length > 0) && (
                <div className="flex flex-wrap items-center gap-[7px]" style={{ marginBottom: 22 }}>
                  {traslado.map(t => {
                    const Icon = TRASLADO_ICON[t] ?? Bus
                    return (
                      <span key={`t-${t}`} className="inline-flex items-center gap-[6px]" style={{ fontSize: '.78rem', fontWeight: 600, color: 'var(--primary)', background: 'rgba(14,107,92,.09)', border: '1px solid rgba(14,107,92,.18)', borderRadius: 8, padding: '6px 11px' }}>
                        <Icon style={{ width: 14, height: 14 }} /> {t}
                      </span>
                    )
                  })}
                  {regimen.map(r => (
                    <span key={`r-${r}`} className="inline-flex items-center gap-[6px]" style={{ fontSize: '.78rem', fontWeight: 600, color: '#8A6D1F', background: 'rgba(201,154,58,.12)', border: '1px solid rgba(201,154,58,.28)', borderRadius: 8, padding: '6px 11px' }}>
                      <Utensils style={{ width: 13, height: 13 }} /> {r}
                    </span>
                  ))}
                </div>
              )}

              {/* Tabs */}
              <div style={{ position: 'relative', borderBottom: '1px solid rgba(0,0,0,.1)', marginBottom: 24, overflowX: 'auto' }}>
                {/* Sliding indicator */}
                <div
                  style={{
                    position: 'absolute', bottom: -1,
                    left: indicator.left,
                    width: indicator.width,
                    height: 2,
                    background: 'var(--primary)',
                    borderRadius: 2,
                    transition: 'left 220ms cubic-bezier(0.23,1,0.32,1), width 220ms cubic-bezier(0.23,1,0.32,1)',
                    pointerEvents: 'none',
                  }}
                />
                {TABS.map((tab, i) => (
                  <button
                    key={tab.key}
                    ref={el => { tabRefs.current[i] = el }}
                    onClick={() => setActiveTab(tab.key)}
                    style={{
                      fontSize: 13,
                      fontWeight: 500,
                      color: activeTab === tab.key ? 'var(--primary)' : '#6A8590',
                      padding: '10px 17px',
                      border: 'none',
                      background: 'none',
                      cursor: 'pointer',
                      whiteSpace: 'nowrap',
                      minHeight: 44,
                      transition: 'color 140ms ease',
                    }}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Tab panels */}
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, y: 7 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.24, ease: [0.23, 1, 0.32, 1] }}
                >

                  {/* ── DESCRIPCIÓN ── */}
                  {activeTab === 'desc' && (
                    <div>
                      {course.descripcion && (
                        <p style={{ fontSize: '.93rem', lineHeight: 1.78, color: '#4A6070', marginBottom: 20 }}>
                          {course.descripcion}
                        </p>
                      )}
                      {/* Info grid */}
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                        {[
                          // nivel es null para vivenciales (es un campo de cursos): solo lo mostramos si existe.
                          ...(course.nivel ? [{ label: 'Nivel', value: course.nivel.charAt(0).toUpperCase() + course.nivel.slice(1) }] : []),
                          { label: 'Idioma',      value: 'Español' },
                          { label: 'Cupo máximo', value: max > 0 ? `${max} asesores` : 'Sin límite' },
                          { label: 'País',        value: course.vivencial_pais ?? 'Por confirmar' },
                          // Salida y alojamiento se muestran en sus secciones dedicadas (puntos de salida / hoteles) más abajo.
                        ].map(item => (
                          <div key={item.label} style={{ background: 'rgba(0,0,0,.03)', borderRadius: 10, padding: '14px 16px' }}>
                            <p className="font-mono uppercase" style={{ fontSize: 9, letterSpacing: '.1em', color: '#8FA3AB', marginBottom: 5 }}>{item.label}</p>
                            <p style={{ fontSize: '.88rem', fontWeight: 600, color: '#0A1E29' }}>{item.value}</p>
                          </div>
                        ))}
                      </div>

                      {/* Puntos de salida (ciudad + punto de embarque) */}
                      {puntos.length > 0 && (
                        <div style={{ marginTop: 22 }}>
                          <p className="font-display font-bold" style={{ fontSize: '.95rem', color: '#0A1E29', marginBottom: 12 }}>Puntos de salida</p>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                            {puntos.map((p, i) => (
                              <div key={i} className="flex items-start gap-[10px]" style={{ background: 'rgba(0,0,0,.03)', borderRadius: 10, padding: '12px 14px' }}>
                                <MapPin style={{ width: 15, height: 15, color: 'var(--primary)', marginTop: 2, flexShrink: 0 }} />
                                <div>
                                  <p style={{ fontSize: '.88rem', fontWeight: 600, color: '#0A1E29' }}>{p.ciudad}</p>
                                  {p.detalle_encuentro && <p style={{ fontSize: '.82rem', color: '#4A6070', lineHeight: 1.5, marginTop: 2 }}>{p.detalle_encuentro}</p>}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Hoteles */}
                      {hoteles.length > 0 && (
                        <div style={{ marginTop: 22 }}>
                          <p className="font-display font-bold" style={{ fontSize: '.95rem', color: '#0A1E29', marginBottom: 12 }}>Alojamiento</p>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {hoteles.map((h, i) => (
                              <div key={i} style={{ background: 'rgba(0,0,0,.03)', borderRadius: 12, overflow: 'hidden', border: '1px solid rgba(0,0,0,.06)' }}>
                                {h.foto_url && (
                                  <img src={h.foto_url} alt={h.nombre} style={{ width: '100%', height: 120, objectFit: 'cover', display: 'block' }} />
                                )}
                                <div style={{ padding: '12px 14px' }}>
                                  <div className="flex items-center gap-[7px]" style={{ marginBottom: h.noches ? 4 : 0 }}>
                                    <HotelIcon style={{ width: 14, height: 14, color: 'var(--primary)', flexShrink: 0 }} />
                                    <p style={{ fontSize: '.88rem', fontWeight: 600, color: '#0A1E29' }}>{h.nombre}</p>
                                  </div>
                                  {h.noches > 0 && (
                                    <p className="font-mono uppercase" style={{ fontSize: 9, letterSpacing: '.06em', color: '#8FA3AB' }}>{h.noches} noche{h.noches !== 1 ? 's' : ''}</p>
                                  )}
                                  {h.link && (
                                    <a href={h.link} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-[5px]" style={{ fontSize: '.8rem', color: 'var(--primary)', fontWeight: 600, marginTop: 6 }}>
                                      Ver hotel <ExternalLink style={{ width: 12, height: 12 }} />
                                    </a>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* ── ITINERARIO ── */}
                  {activeTab === 'itin' && (
                    <div>
                      {course.vivencial_itinerario.length === 0 ? (
                        <p style={{ fontSize: '.85rem', color: '#8FA3AB' }}>El itinerario detallado estará disponible próximamente.</p>
                      ) : (
                        course.vivencial_itinerario.map((dia: ItinerarioDia, i: number) => (
                          <div
                            key={i}
                            style={{
                              border: `1px solid ${accOpen === i ? 'rgba(0,0,0,.18)' : 'rgba(0,0,0,.1)'}`,
                              borderRadius: 11,
                              marginBottom: 7,
                              overflow: 'hidden',
                              transition: 'border-color 180ms ease',
                            }}
                          >
                            <button
                              onClick={() => setAccOpen(accOpen === i ? -1 : i)}
                              className="w-full flex items-center justify-between text-left"
                              style={{ padding: '14px 16px', background: 'rgba(0,0,0,.025)', minHeight: 48, transition: 'background 130ms ease' }}
                            >
                              <div className="flex items-center gap-3">
                                <span
                                  className="font-mono text-[9px] uppercase tracking-[.1em] rounded-[4px] whitespace-nowrap"
                                  style={{ color: 'var(--primary)', background: 'rgba(14,107,92,.1)', padding: '3px 7px' }}
                                >
                                  {dia.dia}
                                </span>
                                <span className="font-display font-semibold" style={{ fontSize: '.88rem', color: '#0A1E29' }}>
                                  {dia.titulo}
                                </span>
                              </div>
                              <ChevronDown
                                className="shrink-0"
                                style={{ width: 14, height: 14, color: '#6A8590', transform: accOpen === i ? 'rotate(180deg)' : 'none', transition: 'transform 220ms cubic-bezier(0.23,1,0.32,1)' }}
                              />
                            </button>
                            <AnimatePresence initial={false}>
                              {accOpen === i && (
                                <motion.div
                                  initial={{ height: 0 }}
                                  animate={{ height: 'auto' }}
                                  exit={{ height: 0 }}
                                  transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
                                  style={{ overflow: 'hidden' }}
                                >
                                  <div style={{ padding: '14px 16px 16px', fontSize: '.87rem', color: '#4A6070', lineHeight: 1.7 }}>
                                    {dia.descripcion}
                                  </div>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        ))
                      )}
                    </div>
                  )}

                  {/* ── QUÉ INCLUYE ── */}
                  {activeTab === 'inc' && (
                    <div>
                      {hasRichText(course.incluye) && (
                        <>
                          <p className="font-display font-bold" style={{ fontSize: '.95rem', color: '#0A1E29', marginBottom: 14 }}>Incluye</p>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px 24px', marginBottom: 22 }}>
                            {richTextLines(course.incluye).map((item, i) => (
                              <div key={i} className="flex items-start gap-2" style={{ fontSize: '.87rem', color: '#4A6070', lineHeight: 1.5 }}>
                                <Check className="shrink-0 mt-[1px]" style={{ width: 15, height: 15, color: 'var(--primary)' }} />
                                <span>{renderBold(item, `inc${i}`)}</span>
                              </div>
                            ))}
                          </div>
                        </>
                      )}
                      {hasRichText(course.no_incluye) && (
                        <>
                          <p className="font-display font-bold" style={{ fontSize: '.95rem', color: '#0A1E29', marginBottom: 14 }}>No incluye</p>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px 24px' }}>
                            {richTextLines(course.no_incluye).map((item, i) => (
                              <div key={i} className="flex items-start gap-2" style={{ fontSize: '.87rem', color: '#8FA3AB', lineHeight: 1.5 }}>
                                <X className="shrink-0 mt-[1px]" style={{ width: 15, height: 15, color: '#B0BEC5' }} />
                                <span>{renderBold(item, `ninc${i}`)}</span>
                              </div>
                            ))}
                          </div>
                        </>
                      )}
                      {!hasRichText(course.incluye) && !hasRichText(course.no_incluye) && (
                        <p style={{ fontSize: '.85rem', color: '#8FA3AB' }}>El detalle de qué incluye este vivencial estará disponible próximamente.</p>
                      )}
                    </div>
                  )}

                  {/* ── INSTRUCTOR ── */}
                  {activeTab === 'inst' && (
                    <div>
                      {course.instructor ? (
                        <>
                          <div className="flex items-start gap-[18px] mb-[22px]">
                            {course.instructor.avatar_url ? (
                              <img
                                src={course.instructor.avatar_url}
                                alt={course.instructor.nombre}
                                className="w-16 h-16 rounded-full object-cover shrink-0"
                              />
                            ) : (
                              <div
                                className="w-16 h-16 rounded-full flex items-center justify-center font-display font-bold shrink-0"
                                style={{ background: 'linear-gradient(135deg, var(--primary), var(--neon))', fontSize: '1.3rem', color: '#0A1E29' }}
                              >
                                {course.instructor.nombre.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                              </div>
                            )}
                            <div>
                              <p className="font-display font-bold" style={{ fontSize: '1.05rem', color: '#0A1E29' }}>{course.instructor.nombre}</p>
                              <p style={{ fontSize: '.85rem', color: 'var(--primary)', fontWeight: 600, marginTop: 2 }}>Instructor · Travexa Academy</p>
                            </div>
                          </div>
                          {course.instructor.bio && (
                            <p style={{ fontSize: '.9rem', lineHeight: 1.75, color: '#4A6070' }}>{course.instructor.bio}</p>
                          )}
                        </>
                      ) : (
                        <p style={{ fontSize: '.85rem', color: '#8FA3AB' }}>Información del instructor próximamente.</p>
                      )}
                    </div>
                  )}

                  {/* ── RESEÑAS ── */}
                  {activeTab === 'revs' && (
                    <div>
                      {reviews.length > 0 ? (
                        <>
                          {/* Summary */}
                          <div className="flex items-center gap-[14px] pb-5 mb-[22px]" style={{ borderBottom: '1px solid rgba(0,0,0,.08)' }}>
                            <span className="font-display font-bold" style={{ fontSize: '2.2rem', color: '#0A1E29' }}>
                              {avgRating.toFixed(1)}
                            </span>
                            <div>
                              <div style={{ color: 'var(--gold)', fontSize: '1rem', letterSpacing: 1 }}>
                                {'★'.repeat(Math.round(avgRating))}{'☆'.repeat(5 - Math.round(avgRating))}
                              </div>
                              <p className="font-mono uppercase" style={{ fontSize: '9.5px', color: '#8FA3AB', letterSpacing: '.06em', marginTop: 3 }}>
                                {reviews.length} reseña{reviews.length !== 1 ? 's' : ''} de este vivencial
                              </p>
                            </div>
                          </div>
                          {/* List */}
                          {reviews.map(r => {
                            const nombre = displayName(r.profile)
                            const initials = nombre.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()
                            return (
                              <div key={r.id} style={{ background: 'rgba(0,0,0,.025)', border: '1px solid rgba(0,0,0,.08)', borderRadius: 11, padding: 16, marginBottom: 9 }}>
                                <div className="flex items-center gap-[9px] mb-[9px]">
                                  <div
                                    className="w-8 h-8 rounded-full flex items-center justify-center font-display font-bold shrink-0"
                                    style={{ fontSize: 11, color: '#fff', background: 'var(--primary)' }}
                                  >
                                    {initials}
                                  </div>
                                  <div>
                                    <p style={{ fontWeight: 600, fontSize: '.84rem', color: '#0A1E29' }}>{nombre}</p>
                                    <p style={{ color: 'var(--gold)', fontSize: 11, letterSpacing: 1 }}>
                                      {'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}
                                    </p>
                                  </div>
                                </div>
                                {r.comentario && (
                                  <p style={{ fontSize: '.84rem', color: '#4A6070', lineHeight: 1.65 }}>{r.comentario}</p>
                                )}
                              </div>
                            )
                          })}
                        </>
                      ) : (
                        <p style={{ fontSize: '.85rem', color: '#8FA3AB' }}>
                          Todavía no hay reseñas de este vivencial. Vas a ser de los primeros en viajar.
                        </p>
                      )}
                      <p style={{ fontSize: '.78rem', color: '#8FA3AB', marginTop: 8 }}>
                        Solo pueden reseñar asesores que hicieron este viaje específico.
                      </p>
                    </div>
                  )}

                </motion.div>
              </AnimatePresence>
            </div>

            {/* ── RIGHT COLUMN — CTA STICKY ── */}
            <div className="hidden md:block" style={{ position: 'sticky', top: 'calc(64px + 14px)' }}>
              <div
                className="rounded-[18px] border"
                style={{
                  background: 'var(--bg-2)',
                  borderColor: 'var(--line-s)',
                  padding: 30,
                  boxShadow: '0 0 0 1px rgba(245,243,236,.05), 0 4px 16px rgba(0,0,0,.32), 0 20px 56px rgba(0,0,0,.5), 0 0 72px rgba(0,229,200,.05)',
                }}
              >
                {/* Badge */}
                <div
                  className="inline-flex items-center gap-[5px] rounded-[5px] font-mono uppercase mb-[14px]"
                  style={{ background: 'var(--neon-dim)', border: '1px solid rgba(0,229,200,.3)', padding: '4px 9px', fontSize: '9.5px', letterSpacing: '.06em', color: 'var(--neon)' }}
                >
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--neon)', display: 'inline-block' }} />
                  Reserva tu lugar
                </div>

                {/* Price — la SEÑA es la cifra más grande y prominente de la card */}
                {course.vivencial_precio_seña_ars && (
                  <>
                    <div className="font-display font-bold" style={{ fontSize: '2.4rem', lineHeight: 1.04, letterSpacing: '-.02em', color: 'var(--text-1)' }}>
                      {fmtARS(course.vivencial_precio_seña_ars)}
                    </div>
                    <div style={{ fontSize: '.84rem', color: 'var(--text-2)', marginTop: 6, marginBottom: 12, lineHeight: 1.5 }}>
                      Seña para confirmar tu lugar
                      {cuotaSaldoArs != null ? (
                        <> + cuotas cómodas de: <strong style={{ color: 'var(--text-1)' }}>{fmtARS(cuotaSaldoArs)}</strong></>
                      ) : (
                        <> · <strong style={{ color: 'var(--text-1)' }}>Pago único</strong></>
                      )}
                    </div>
                  </>
                )}
                {course.precio_ars ? (
                  <div style={{ fontSize: '.82rem', color: 'var(--text-3)', marginBottom: course.precio_usd ? 4 : 14 }}>
                    Total del viaje: <strong style={{ color: 'var(--text-2)' }}>{fmtARS(course.precio_ars)}</strong>
                  </div>
                ) : null}
                {course.precio_usd ? (
                  <div style={{ fontSize: '.82rem', color: 'var(--text-3)', marginBottom: 14 }}>
                    O pagá en dólares: <strong style={{ color: 'var(--text-2)' }}>{formatUsd(course.precio_usd)}</strong>
                  </div>
                ) : null}

                {/* Separator */}
                <div style={{ height: 1, background: 'var(--line)', margin: '14px 0' }} />

                {/* Cupo bar */}
                {max > 0 && (
                  <div style={{ marginBottom: 14 }}>
                    <div style={{ height: 4, background: 'rgba(245,243,236,.1)', borderRadius: 2, overflow: 'hidden', marginBottom: 6 }}>
                      <div style={{ height: '100%', width: `${ctaPct}%`, borderRadius: 2, background: ctaBarColor, transition: 'width 1s cubic-bezier(0.23,1,0.32,1)' }} />
                    </div>
                    <div className="font-mono uppercase" style={{ fontSize: '9.5px', letterSpacing: '.05em', color: estado.urgent ? '#EF6B35' : 'var(--neon)' }}>
                      {estado.urgent ? '⚠ ' : ''}{estado.label} de {max}
                    </div>
                  </div>
                )}

                {/* State-driven CTA (seña / transferir saldo / cuotas / pagado) */}
                {disp === 0 && !enrollment ? (
                  <div className="w-full text-center font-display font-bold rounded-[10px] mb-2" style={{ background: 'var(--card)', color: 'var(--text-3)', fontSize: '14.5px', padding: '12px 24px' }}>
                    Agotado
                  </div>
                ) : (
                  <div className="mb-2">
                    <VivencialPagoCTA course={course} enrollment={enrollment} userId={user?.id} variant="cta-card" onChanged={refreshEnrollment} />
                  </div>
                )}

                {/* Separator */}
                <div style={{ height: 1, background: 'var(--line)', margin: '14px 0' }} />

                {/* Feature list — 3 items fijos, iguales para todos los vivenciales */}
                {CTA_FEATURES.map((f, i) => (
                  <div key={i} className="flex items-start gap-2 mb-2.5" style={{ fontSize: '.82rem', color: 'var(--text-2)', lineHeight: 1.4 }}>
                    <Check className="shrink-0 mt-[2px]" style={{ width: 15, height: 15, color: 'var(--neon)' }} />
                    <span>{f}</span>
                  </div>
                ))}

                {/* FAQ button */}
                <button
                  onClick={() => setModal('faq')}
                  className="w-full border rounded-[8px] font-medium mt-3"
                  style={{ borderColor: 'var(--line-s)', color: 'var(--text-2)', background: 'transparent', fontSize: 13, padding: '8px 16px', minHeight: 38 }}
                >
                  Preguntas frecuentes
                </button>

                {/* WhatsApp */}
                <a
                  href={waUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 w-full rounded-[10px] border mt-[10px]"
                  style={{ padding: 12, borderColor: 'rgba(37,211,102,.35)', background: 'rgba(37,211,102,.08)', fontSize: 13, fontWeight: 600, color: '#25D366' }}
                >
                  <svg viewBox="0 0 32 32" className="w-4 h-4" xmlns="http://www.w3.org/2000/svg" fill="#25D366">
                    <path d="M16 .5C7.4.5.5 7.4.5 16c0 2.8.7 5.5 2.1 7.9L.5 31.5l7.9-2.1c2.3 1.3 4.9 2 7.6 2 8.6 0 15.5-6.9 15.5-15.4S24.6.5 16 .5zm0 28c-2.5 0-4.9-.7-7-2l-.5-.3-5.1 1.3 1.4-4.9-.3-.5C3.2 20.8 2.5 18.5 2.5 16 2.5 8.6 8.6 2.5 16 2.5S29.5 8.6 29.5 16 23.4 28.5 16 28.5zm8.5-10.9c-.5-.2-2.8-1.4-3.2-1.5-.5-.2-.8-.2-1.1.2-.3.5-1.2 1.5-1.5 1.9-.3.3-.5.4-1 .1-.5-.2-2-.7-3.8-2.3-1.4-1.2-2.3-2.7-2.6-3.2-.3-.5 0-.7.2-.9.2-.2.5-.5.7-.7.2-.2.3-.5.5-.8.2-.3.1-.5 0-.7-.1-.2-1.1-2.7-1.5-3.7-.4-.9-.8-.8-1.1-.8-.3 0-.5 0-.8 0s-.8.1-1.2.5C8.5 10.4 7.5 11.5 7.5 13.8s1.6 4.7 1.8 5c.2.3 3.1 4.8 7.5 6.7 1.1.5 1.9.7 2.6.9 1.1.3 2.1.3 2.9.2.9-.1 2.8-1.1 3.2-2.2.4-1.1.4-2 .3-2.2-.1-.2-.4-.3-.9-.5z"/>
                  </svg>
                  Consultá por WhatsApp
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── MOBILE CTA BAR ── */}
      <div
        className="fixed bottom-0 left-0 right-0 z-[200] flex items-center justify-between gap-3 border-t md:hidden"
        style={{
          background: 'rgba(9,18,26,.95)',
          backdropFilter: 'blur(24px)',
          borderColor: 'var(--line-s)',
          padding: '11px 18px',
          paddingBottom: 'max(11px, env(safe-area-inset-bottom, 0px))',
        }}
      >
        <div className="flex flex-col gap-[1px] shrink-0">
          <span className="font-display font-bold" style={{ fontSize: '1.1rem', color: 'var(--text-1)' }}>
            {fmtARS(course.vivencial_precio_seña_ars)}
          </span>
          <span className="font-mono uppercase" style={{ fontSize: '8.5px', color: 'var(--text-3)', letterSpacing: '.06em' }}>
            {disp === 0 ? 'agotado' : `seña · quedan ${disp} lugares`}
          </span>
        </div>
        <div className="flex-1 min-w-0">
          {disp === 0 && !enrollment ? (
            <div className="text-center font-display font-bold rounded-[8px]" style={{ background: 'var(--card)', color: 'var(--text-3)', fontSize: 13, padding: '8px 16px' }}>Agotado</div>
          ) : (
            <VivencialPagoCTA course={course} enrollment={enrollment} userId={user?.id} variant="cta-card" onChanged={refreshEnrollment} />
          )}
        </div>
      </div>

      {/* WhatsApp float */}
      <motion.a
        href={`https://wa.me/${waDigits}`}
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

      {/* Modal */}
      <AnimatePresence>
        {modal && <FloatingModal type={modal} onClose={() => setModal(null)} />}
      </AnimatePresence>

      {/* Toast */}
      <Toast msg={toastMsg} visible={toastVisible} />
    </div>
  )
}
