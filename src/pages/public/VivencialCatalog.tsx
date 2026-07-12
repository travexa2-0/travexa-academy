import { useState, useMemo, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, ChevronDown, Check } from 'lucide-react'
import Header from '@/components/layout/Header'
import VivencialCard from '@/components/courses/VivencialCard'
import VivencialValueBand from '@/components/vivencial/VivencialValueBand'
import SkeletonCard from '@/components/shared/SkeletonCard'
import { useCourses, useWishlist, useToggleWishlist } from '@/hooks/useCourses'
import { useAuth } from '@/contexts/AuthContext'

// ── Salida date formatting (filtro "Fecha de salida") ─────────────

const MONTHS_ES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
]

// ── FilterSelect (mismo patrón visual que el SortDropdown de /cursos) ──

function FilterSelect({
  value, options, onChange, minWidth = 170,
}: {
  value: string
  options: { value: string; label: string }[]
  onChange: (v: string) => void
  minWidth?: number
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const label = options.find(o => o.value === value)?.label ?? options[0]?.label ?? ''

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('click', handler)
    return () => document.removeEventListener('click', handler)
  }, [])

  return (
    <div ref={ref} className="relative shrink-0">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center justify-between gap-[7px] h-11 px-[13px] rounded-[10px] border font-medium transition-colors"
        style={{
          background:   'var(--card)',
          borderColor:  open ? 'var(--line-s)' : 'var(--line)',
          color:        'var(--text-2)',
          fontSize:     '12.5px',
          minWidth,
        }}
      >
        <span>{label}</span>
        <ChevronDown
          className="w-[14px] h-[14px] shrink-0 transition-transform duration-200"
          style={{ transform: open ? 'rotate(180deg)' : 'rotate(0deg)' }}
        />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: .97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: .97 }}
            transition={{ duration: 0.17, ease: [0.23, 1, 0.32, 1] }}
            className="absolute top-[calc(100%+5px)] left-0 right-0 z-50 rounded-xl border overflow-hidden max-h-[280px] overflow-y-auto"
            style={{ background: '#0C1E2C', borderColor: 'var(--line-s)', boxShadow: '0 16px 40px rgba(0,0,0,.5)' }}
          >
            {options.map(opt => (
              <button
                key={opt.value}
                onClick={() => { onChange(opt.value); setOpen(false) }}
                className="w-full flex items-center justify-between px-[14px] py-[10px] text-left transition-colors"
                style={{
                  fontSize:   '12.5px',
                  color:      value === opt.value ? 'var(--neon)' : 'var(--text-2)',
                  background: value === opt.value ? 'var(--neon-dim)' : 'transparent',
                }}
              >
                {opt.label}
                {value === opt.value && <Check className="w-[10px] h-[10px]" style={{ color: 'var(--neon)' }} />}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ── InfoModal (¿Qué es un vivencial?) ────────────────────────────

function InfoModal({ onClose }: { onClose: () => void }) {
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

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
        style={{ background: 'var(--bg-2)', borderColor: 'var(--line-s)', padding: '34px 30px 28px', boxShadow: '0 0 0 1px rgba(245,243,236,.04), 0 30px 70px rgba(0,0,0,.55), 0 0 90px rgba(0,229,200,.08)' }}
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
          ✦
        </div>
        <h3
          className="font-display font-bold mb-3"
          style={{ fontSize: '1.3rem', color: 'var(--text-1)', letterSpacing: '-.01em' }}
        >
          ¿Qué es un vivencial?
        </h3>
        <div style={{ fontSize: '.9rem', lineHeight: 1.7, color: 'var(--text-2)' }}>
          <p>Un vivencial es un viaje grupal pensado para asesores, no para turistas. Vas con Yesica o un instructor aliado, conocés el destino con mirada comercial y volvés con el argumento de venta, las fotos y los contactos que solo da haber estado ahí.</p>
          <p style={{ marginTop: 12 }}>Grupos chicos, workshops incluidos durante el viaje y certificado Travexa Academy al volver.</p>
        </div>
        <motion.button
          className="w-full font-display font-bold rounded-[10px] mt-5"
          style={{ background: 'var(--neon)', color: '#0A1E29', fontSize: '14.5px', padding: '12px 24px', minHeight: 48 }}
          onClick={onClose}
          whileTap={{ scale: 0.97 }}
        >
          Entendido
        </motion.button>
      </motion.div>
    </motion.div>
  )
}

// ── Main page ─────────────────────────────────────────────────────

export default function VivencialCatalog() {
  const { user } = useAuth()
  const { data: allCourses, isLoading } = useCourses()
  const { data: wishlist = [] } = useWishlist(user?.id)
  const toggleWishlist = useToggleWishlist(user?.id)

  const [activeRegion,   setActiveRegion]   = useState<string>('all')
  const [activeTraslado, setActiveTraslado] = useState<string>('all')
  const [activeDestino,  setActiveDestino]  = useState<string>('all')
  const [activeFecha,    setActiveFecha]    = useState<string>('all')
  const [showModal,    setShowModal]    = useState(false)

  const filtersRef = useRef<HTMLDivElement>(null)

  // All vivenciales
  const vivenciales = useMemo(
    () => (allCourses ?? []).filter(c => c.tipo === 'vivencial'),
    [allCourses]
  )

  // Dynamic region options from category slugs of vivenciales
  const regionOptions = useMemo(() => {
    const seen = new Set<string>()
    const opts: { slug: string; nombre: string }[] = []
    vivenciales.forEach(v => {
      if (v.category && !seen.has(v.category.slug)) {
        seen.add(v.category.slug)
        opts.push({ slug: v.category.slug, nombre: v.category.nombre })
      }
    })
    return opts
  }, [vivenciales])

  // Traslado options — solo los valores realmente presentes en los vivenciales
  // publicados (integridad de datos: si ninguno usa "Crucero", no aparece).
  const trasladoOptions = useMemo(() => {
    const order = ['Bus', 'Aéreo', 'Navegación', 'Crucero']
    const seen = new Set<string>()
    vivenciales.forEach(v => (v.vivencial_tipo_traslado ?? []).forEach(t => seen.add(t)))
    return order.filter(t => seen.has(t))
  }, [vivenciales])

  // Destino options — DISTINCT vivencial_pais de los vivenciales publicados.
  // Nunca hardcodeado: si no hay vivenciales con país, el array queda vacío y el
  // select no se renderiza (integridad de datos).
  const destinoOptions = useMemo(() => {
    const seen = new Set<string>()
    const opts: string[] = []
    vivenciales.forEach(v => {
      const pais = v.vivencial_pais?.trim()
      if (pais && !seen.has(pais)) {
        seen.add(pais)
        opts.push(pais)
      }
    })
    return opts.sort((a, b) => a.localeCompare(b, 'es'))
  }, [vivenciales])

  // Fecha de salida options — DISTINCT por mes/año de vivencial_fecha_salida,
  // orden cronológico, formateado legible ("Octubre 2026"). Value = 'YYYY-MM'.
  const fechaOptions = useMemo(() => {
    const seen = new Set<string>()
    const opts: { value: string; label: string }[] = []
    vivenciales.forEach(v => {
      const f = v.vivencial_fecha_salida
      if (!f) return
      const key = f.slice(0, 7) // YYYY-MM
      if (seen.has(key)) return
      seen.add(key)
      const [y, m] = key.split('-').map(Number)
      opts.push({ value: key, label: `${MONTHS_ES[m - 1]} ${y}` })
    })
    return opts.sort((a, b) => a.value.localeCompare(b.value))
  }, [vivenciales])

  // Filtered list — Región, Traslado, Destino y Fecha se combinan con AND.
  const filtered = useMemo(() => {
    let list = vivenciales
    if (activeRegion !== 'all')   list = list.filter(v => v.category?.slug === activeRegion)
    if (activeTraslado !== 'all') list = list.filter(v => (v.vivencial_tipo_traslado ?? []).includes(activeTraslado))
    if (activeDestino !== 'all')  list = list.filter(v => v.vivencial_pais?.trim() === activeDestino)
    if (activeFecha !== 'all')    list = list.filter(v => v.vivencial_fecha_salida?.slice(0, 7) === activeFecha)
    return list
  }, [vivenciales, activeRegion, activeTraslado, activeDestino, activeFecha])

  // Hero stats by year
  const statCounts = useMemo(() => {
    const counts: Record<string, number> = {}
    vivenciales.forEach(v => {
      if (v.vivencial_fecha_salida) {
        const y = v.vivencial_fecha_salida.slice(0, 4)
        counts[y] = (counts[y] ?? 0) + 1
      }
    })
    return counts
  }, [vivenciales])

  const scrollToFilters = useCallback(() => {
    const el = filtersRef.current
    if (!el) return
    const y = el.getBoundingClientRect().top + window.scrollY - 64
    window.scrollTo({ top: y, behavior: 'smooth' })
  }, [])

  return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh' }}>
      <Header />

      {/* ── HERO ─────────────────────────────────────────────── */}
      <section
        style={{
          position: 'relative',
          minHeight: 500,
          display: 'flex',
          alignItems: 'center',
          background: `
            radial-gradient(ellipse 1100px 620px at 22% 0%, rgba(0,229,200,.16), transparent 62%),
            radial-gradient(ellipse 700px 460px at 100% 10%, rgba(14,107,92,.22), transparent 58%),
            linear-gradient(180deg, #0D2A38 0%, var(--bg) 46%, #0D2230 100%)
          `,
          overflow: 'hidden',
          padding: '88px 0 48px',
        }}
      >
        {/* Dot grid */}
        <div
          aria-hidden
          style={{
            position: 'absolute', inset: 0, pointerEvents: 'none', opacity: .6,
            backgroundImage: 'linear-gradient(rgba(245,243,236,.06) 1px,transparent 1px),linear-gradient(90deg,rgba(245,243,236,.06) 1px,transparent 1px)',
            backgroundSize: '56px 56px',
            maskImage: 'radial-gradient(ellipse 1000px 560px at 18% 0%, black, transparent 72%)',
          }}
        />
        {/* Bottom fade */}
        <div aria-hidden style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 90, pointerEvents: 'none', background: 'linear-gradient(to bottom, transparent, #0D2230)' }} />

        <div className="w-full max-w-[1200px] mx-auto px-[22px]" style={{ position: 'relative', zIndex: 1 }}>
          {/* Eyebrow */}
          <motion.p
            className="font-mono uppercase flex items-center gap-2"
            style={{ fontSize: 10, letterSpacing: '.18em', color: 'var(--neon)', marginBottom: 20 }}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.23, 1, 0.32, 1], delay: 0.1 }}
          >
            <span
              className="eyebrow-dot"
              style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--neon)', boxShadow: '0 0 0 4px var(--neon-dim)', display: 'inline-block' }}
            />
            Travexa Academy · Experiencias vivenciales
          </motion.p>

          {/* Title */}
          <motion.h1
            className="font-display font-bold"
            style={{ fontSize: 'clamp(2rem,7vw,5rem)', lineHeight: 1.02, letterSpacing: '-.025em' }}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.23, 1, 0.32, 1], delay: 0.22 }}
          >
            <span style={{ color: 'var(--text-1)', display: 'block' }}>El turismo no solo se estudia.</span>
            <span style={{ color: 'var(--neon)', textShadow: '0 0 48px var(--neon-glow)', display: 'block' }}>Se vive.</span>
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            style={{ maxWidth: 600, marginTop: 22, fontSize: 'clamp(.95rem,1.8vw,1.1rem)', color: 'var(--text-3)', lineHeight: 1.7 }}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.23, 1, 0.32, 1], delay: 0.42 }}
          >
            No es un viaje de turista: conocés el destino, los hoteles y las actividades como los vas a vender después, y sumás talleres teórico-prácticos con expertos del rubro — role-play, simulaciones de venta y capacitación real, todo en el mismo viaje.
          </motion.p>

          {/* Actions */}
          <motion.div
            className="flex items-center gap-3 flex-wrap"
            style={{ marginTop: 32 }}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.23, 1, 0.32, 1], delay: 0.54 }}
          >
            <motion.button
              className="font-display font-bold rounded-[10px] inline-flex items-center justify-content-center"
              style={{ background: 'var(--neon)', color: '#0A1E29', fontSize: '14.5px', padding: '12px 24px', minHeight: 48 }}
              onClick={scrollToFilters}
              whileTap={{ scale: 0.97 }}
              whileHover={{ boxShadow: '0 0 24px var(--neon-glow), 0 4px 16px rgba(0,0,0,.25)' }}
            >
              Ver próximas salidas
            </motion.button>
            <motion.button
              className="font-display font-bold rounded-[10px] border inline-flex items-center"
              style={{ background: 'transparent', borderColor: 'var(--line-s)', color: 'var(--text-2)', fontSize: '14.5px', padding: '12px 24px', minHeight: 48 }}
              onClick={() => setShowModal(true)}
              whileTap={{ scale: 0.97 }}
            >
              ¿Qué es un vivencial?
            </motion.button>
          </motion.div>

          {/* Stats */}
          <motion.div
            className="flex items-center gap-6 flex-wrap"
            style={{ marginTop: 30 }}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.23, 1, 0.32, 1], delay: 0.66 }}
          >
            {['2026', '2027'].map((yr, i) => (
              <>
                {i > 0 && <div key={`sep-${yr}`} style={{ width: 1, height: 36, background: 'rgba(245,243,236,.11)' }} />}
                <div key={yr} className="flex flex-col gap-[2px]">
                  <span className="font-display font-bold" style={{ fontSize: '1.5rem', color: 'var(--text-1)' }}>
                    {isLoading ? '—' : (statCounts[yr] ?? 0)}
                  </span>
                  <span className="font-mono uppercase" style={{ fontSize: 9, letterSpacing: '.1em', color: 'var(--text-3)' }}>Destinos en {yr}</span>
                </div>
              </>
            ))}
            <div style={{ width: 1, height: 36, background: 'rgba(245,243,236,.11)' }} />
            <div className="flex flex-col gap-[2px]">
              <span className="font-display font-bold" style={{ fontSize: '1.5rem', color: 'var(--text-1)' }}>87</span>
              <span className="font-mono uppercase" style={{ fontSize: 9, letterSpacing: '.1em', color: 'var(--text-3)' }}>Asesores formados</span>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── OFERTA DE VALOR (4 tarjetas) ──────────────────────── */}
      <VivencialValueBand />

      {/* ── FILTERS ──────────────────────────────────────────── */}
      <div
        ref={filtersRef}
        style={{
          background: '#0D2230',
          padding: '18px 0 16px',
          position: 'sticky',
          top: 64,
          zIndex: 100,
          boxShadow: '0 1px 0 var(--line)',
        }}
      >
        <div className="w-full max-w-[1200px] mx-auto px-[22px]">
          {/* Row 1: Región */}
          {regionOptions.length > 0 && (
            <div className="flex items-center gap-[14px] mb-[10px]">
              <span className="font-display font-bold whitespace-nowrap shrink-0 min-w-[84px]" style={{ fontSize: '12.5px', color: 'var(--text-1)' }}>
                Región
              </span>
              <div className="flex items-center gap-[7px] overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
                {/* Todos */}
                <button
                  onClick={() => setActiveRegion('all')}
                  className="font-mono uppercase shrink-0 flex items-center"
                  style={{
                    fontSize: '9.5px', letterSpacing: '.07em', padding: '5px 12px', borderRadius: 99,
                    border: '1px solid',
                    minHeight: 32,
                    whiteSpace: 'nowrap',
                    fontWeight: 600,
                    background:   activeRegion === 'all' ? 'var(--text-1)' : 'transparent',
                    color:        activeRegion === 'all' ? 'var(--bg)'     : 'var(--text-3)',
                    borderColor:  activeRegion === 'all' ? 'var(--text-1)' : 'var(--line)',
                    transition:   'color 140ms ease, background 140ms ease, border-color 140ms ease',
                  }}
                >
                  Todos
                </button>
                {regionOptions.map(r => (
                  <button
                    key={r.slug}
                    onClick={() => setActiveRegion(r.slug)}
                    className="font-mono uppercase shrink-0 flex items-center"
                    style={{
                      fontSize: '9.5px', letterSpacing: '.07em', padding: '5px 12px', borderRadius: 99,
                      border: '1px solid',
                      minHeight: 32,
                      whiteSpace: 'nowrap',
                      fontWeight: activeRegion === r.slug ? 600 : 400,
                      background:  activeRegion === r.slug ? 'var(--neon-dim)' : 'transparent',
                      color:       activeRegion === r.slug ? 'var(--neon)'     : 'var(--text-3)',
                      borderColor: activeRegion === r.slug ? 'rgba(0,229,200,.35)' : 'var(--line)',
                      transition:  'color 140ms ease, background 140ms ease, border-color 140ms ease',
                    }}
                  >
                    {r.nombre}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Row 2: Tipo de traslado — solo si hay valores reales en la DB */}
          {trasladoOptions.length > 0 && (
            <div className="flex items-center gap-[14px]">
              <span className="font-display font-bold whitespace-nowrap shrink-0 min-w-[84px]" style={{ fontSize: '12.5px', color: 'var(--text-1)' }}>
                Traslado
              </span>
              <div className="flex items-center gap-[7px] overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
                {[{ value: 'all', label: 'Todos' }, ...trasladoOptions.map(t => ({ value: t, label: t }))].map(opt => {
                  const active = activeTraslado === opt.value
                  return (
                    <button
                      key={opt.value}
                      onClick={() => setActiveTraslado(opt.value)}
                      className="font-mono uppercase shrink-0 flex items-center"
                      style={{
                        fontSize: '9.5px', letterSpacing: '.07em', padding: '5px 12px', borderRadius: 99,
                        border: '1px solid',
                        minHeight: 32,
                        whiteSpace: 'nowrap',
                        fontWeight: active ? 600 : 400,
                        background:  active && opt.value === 'all' ? 'var(--text-1)' : active ? 'var(--neon-dim)' : 'transparent',
                        color:       active && opt.value === 'all' ? 'var(--bg)'     : active ? 'var(--neon)'     : 'var(--text-3)',
                        borderColor: active && opt.value === 'all' ? 'var(--text-1)' : active ? 'rgba(0,229,200,.35)' : 'var(--line)',
                        transition:  'color 140ms ease, background 140ms ease, border-color 140ms ease',
                      }}
                    >
                      {opt.label}
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {/* Row 3: Destino + Fecha de salida (selects, mismo patrón que /cursos).
              Cada select se muestra solo si hay valores reales en la DB; con la DB
              de vivenciales vacía no se renderiza ninguno. */}
          {(destinoOptions.length > 0 || fechaOptions.length > 0) && (
            <div className="flex items-center gap-[10px] mt-[12px] flex-wrap">
              {destinoOptions.length > 0 && (
                <FilterSelect
                  value={activeDestino}
                  onChange={setActiveDestino}
                  options={[
                    { value: 'all', label: 'Todos los destinos' },
                    ...destinoOptions.map(p => ({ value: p, label: p })),
                  ]}
                />
              )}
              {fechaOptions.length > 0 && (
                <FilterSelect
                  value={activeFecha}
                  onChange={setActiveFecha}
                  options={[
                    { value: 'all', label: 'Cualquier fecha' },
                    ...fechaOptions,
                  ]}
                />
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── GRID SECTION ─────────────────────────────────────── */}
      <main style={{ background: '#fff', position: 'relative', paddingBottom: 80 }}>
        {/* Navy → white gradient fade */}
        <div
          aria-hidden
          style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 54, background: 'linear-gradient(to bottom, #0D2230, #fff)', pointerEvents: 'none' }}
        />
        <div className="w-full max-w-[1200px] mx-auto px-[22px]" style={{ position: 'relative', paddingTop: 28 }}>
          {/* Count label */}
          <p
            className="font-mono uppercase"
            style={{ fontSize: '9.5px', letterSpacing: '.06em', color: '#6A8590', paddingBottom: 16 }}
          >
            {isLoading ? 'Cargando…' : `${filtered.length} experiencia${filtered.length !== 1 ? 's' : ''} disponible${filtered.length !== 1 ? 's' : ''}`}
          </p>

          {/* Grid */}
          <div
            className="grid gap-5"
            style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}
          >
            {isLoading ? (
              Array.from({ length: 3 }).map((_, i) => <SkeletonCard key={i} />)
            ) : filtered.length === 0 ? (
              <div
                className="flex flex-col items-center gap-[10px] text-center"
                style={{ gridColumn: '1/-1', padding: '64px 24px' }}
              >
                <svg className="w-7 h-7" style={{ color: '#A8B8BE' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                  <circle cx="12" cy="12" r="10" /><line x1="8" y1="12" x2="16" y2="12" />
                </svg>
                <h3 className="font-display font-bold" style={{ fontSize: '1rem', color: '#1A3040' }}>Sin resultados</h3>
                <p style={{ fontSize: '.84rem', color: '#6A8590' }}>Probá con otros filtros.</p>
              </div>
            ) : (
              filtered.map((v, i) => (
                <VivencialCard
                  key={v.id}
                  course={v}
                  isWishlisted={wishlist.includes(v.id)}
                  onToggleWishlist={() => {
                    if (!user) return
                    toggleWishlist.mutate({ courseId: v.id, isWishlisted: wishlist.includes(v.id) })
                  }}
                  animDelay={i * 70}
                />
              ))
            )}
          </div>
        </div>
      </main>

      {/* WhatsApp float */}
      <motion.a
        href="https://wa.me/5491112345678"
        target="_blank"
        rel="noopener noreferrer"
        aria-label="WhatsApp"
        className="fixed bottom-[22px] right-[22px] z-[500] w-[52px] h-[52px] rounded-full flex items-center justify-center group"
        style={{ background: '#25D366', boxShadow: '0 4px 18px rgba(37,211,102,.38)' }}
        initial={{ opacity: 0, scale: .6, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ delay: 1.5, duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
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

      {/* Info modal */}
      <AnimatePresence>
        {showModal && <InfoModal onClose={() => setShowModal(false)} />}
      </AnimatePresence>
    </div>
  )
}
