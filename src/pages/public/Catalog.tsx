import { useState, useMemo, useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, ChevronDown, Check } from 'lucide-react'
import Header from '@/components/layout/Header'
import CourseCard from '@/components/courses/CourseCard'
import FormacionValueSection from '@/components/courses/FormacionValueSection'
import FormacionStatsRow from '@/components/courses/FormacionStatsRow'
import SkeletonCard from '@/components/shared/SkeletonCard'
import { useCourses, useCategories, useWishlist, useToggleWishlist } from '@/hooks/useCourses'
import { useAuth } from '@/contexts/AuthContext'
import type { Course, TipoCurso, NivelCurso } from '@/types'

// ── Types ─────────────────────────────────────────────────────────

type TipoFilter  = TipoCurso | 'all' | 'gratis'
type NivelFilter = NivelCurso | 'all'
type SortKey     = 'popular' | 'rating' | 'price-asc' | 'price-desc' | 'newest'

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: 'popular',    label: 'Más vendidos' },
  { value: 'rating',     label: 'Mejor valorados' },
  { value: 'price-asc',  label: 'Precio: menor a mayor' },
  { value: 'price-desc', label: 'Precio: mayor a menor' },
  { value: 'newest',     label: 'Más nuevos' },
]

const TIPO_OPTIONS: { value: TipoFilter; label: string; icon?: string }[] = [
  { value: 'all',       label: 'Todos' },
  { value: 'grabado',   label: 'A tu ritmo' },
  { value: 'en_vivo',   label: 'En Vivo' },
  { value: 'ebook',     label: 'Ebook / PDF' },
  { value: 'gratis',    label: 'Gratis' },
]

const NIVEL_OPTIONS: { value: NivelFilter; label: string }[] = [
  { value: 'all',           label: 'Todos' },
  { value: 'principiante',  label: 'Principiante' },
  { value: 'intermedio',    label: 'Intermedio' },
  { value: 'avanzado',      label: 'Avanzado' },
]

// ── Sort ──────────────────────────────────────────────────────────

function sortCourses(courses: Course[], sort: SortKey): Course[] {
  return [...courses].sort((a, b) => {
    switch (sort) {
      case 'popular':    return (b.total_alumnos ?? 0) - (a.total_alumnos ?? 0)
      case 'rating':     return (b.rating_avg ?? 0) - (a.rating_avg ?? 0)
      case 'price-asc':  return (a.precio_ars ?? 0) - (b.precio_ars ?? 0)
      case 'price-desc': return (b.precio_ars ?? 0) - (a.precio_ars ?? 0)
      case 'newest':     return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    }
  })
}

// ── Sort Dropdown ─────────────────────────────────────────────────

function SortDropdown({ value, onChange }: { value: SortKey; onChange: (s: SortKey) => void }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const label = SORT_OPTIONS.find(o => o.value === value)?.label ?? 'Ordenar'

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
        className="flex items-center justify-between gap-[7px] h-11 px-[13px] rounded-[10px] border font-medium transition-colors min-w-[160px]"
        style={{
          background:   'var(--card)',
          borderColor:  open ? 'var(--line-s)' : 'var(--line)',
          color:        'var(--text-2)',
          fontSize:     '12.5px',
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
            className="absolute top-[calc(100%+5px)] left-0 right-0 z-50 rounded-xl border overflow-hidden"
            style={{ background: '#0C1E2C', borderColor: 'var(--line-s)', boxShadow: '0 16px 40px rgba(0,0,0,.5)' }}
          >
            {SORT_OPTIONS.map(opt => (
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

// ── Filter Pill ───────────────────────────────────────────────────

function FilterPill({
  label, active, onClick, liveStyle = false
}: { label: string; active: boolean; onClick: () => void; liveStyle?: boolean }) {
  return (
    <motion.button
      whileTap={{ scale: 0.96 }}
      onClick={onClick}
      className="flex items-center gap-[5px] font-mono tracking-[.07em] uppercase rounded-full border whitespace-nowrap min-h-8 px-3 transition-all"
      style={{
        fontSize:    '9.5px',
        color:       active ? 'var(--neon)'     : liveStyle ? '#fff' : 'var(--text-3)',
        background:  active ? 'var(--neon-dim)' : liveStyle ? '#EF4444' : 'transparent',
        borderColor: active ? 'rgba(0,229,200,.35)' : liveStyle ? '#EF4444' : 'var(--line)',
        fontWeight:  active ? 600 : 400,
      }}
    >
      {liveStyle && <span className="live-stat-dot w-[5px] h-[5px] rounded-full shrink-0 bg-white" />}
      {label}
    </motion.button>
  )
}

function CategoryPill({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <motion.button
      whileTap={{ scale: 0.96 }}
      onClick={onClick}
      className="flex items-center font-mono tracking-[.07em] uppercase rounded-full border whitespace-nowrap min-h-8 px-3 transition-all"
      style={{
        fontSize:    '9.5px',
        color:       active ? 'var(--neon)'     : 'var(--text-3)',
        background:  active ? 'var(--neon-dim)' : 'transparent',
        borderColor: active ? 'rgba(0,229,200,.35)' : 'var(--line)',
      }}
    >
      {label}
    </motion.button>
  )
}

// ── Empty state ───────────────────────────────────────────────────

function EmptyState() {
  return (
    <div className="col-span-full flex flex-col items-center justify-center py-16 gap-[10px] text-center">
      <Search className="w-7 h-7 mb-1" style={{ color: 'var(--text-3)' }} />
      <h3 className="font-display font-bold" style={{ fontSize: '1rem', color: 'var(--text-2)' }}>Sin resultados</h3>
      <p style={{ fontSize: '.84rem', color: 'var(--text-3)' }}>Probá otro término o quitá los filtros</p>
    </div>
  )
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
  )
}

// ── Catalog ───────────────────────────────────────────────────────

export default function Catalog() {
  const { user } = useAuth()
  const [selectedTipo, setSelectedTipo]     = useState<TipoFilter>('all')
  const [selectedNivel, setSelectedNivel]   = useState<NivelFilter>('all')
  const [selectedCat, setSelectedCat]       = useState<string>('all')
  const [sort, setSort]                     = useState<SortKey>('popular')
  const [search, setSearch]                 = useState('')
  const [searchDisplay, setSearchDisplay]   = useState('')
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const resultsRef = useRef<HTMLElement>(null)

  const scrollToResults = useCallback(() => {
    const el = resultsRef.current
    if (!el) return
    window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 70, behavior: 'smooth' })
  }, [])

  const { data: courses = [], isLoading } = useCourses()
  const { data: categories = [] }         = useCategories()
  const { data: wishlist = [] }           = useWishlist(user?.id)
  const { mutate: toggleWishlist }        = useToggleWishlist(user?.id)

  const handleSearch = (v: string) => {
    setSearchDisplay(v)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => setSearch(v.toLowerCase().trim()), 260)
  }

  const handleWishlist = (courseId: string) => {
    if (!user) return
    toggleWishlist({ courseId, isWishlisted: wishlist.includes(courseId) })
  }

  // Los vivenciales tienen su propio catálogo en /vivencial — acá no se muestran.
  const catalogCourses = useMemo(() => courses.filter(c => c.tipo !== 'vivencial'), [courses])

  const filtered = useMemo(() => {
    let list = catalogCourses
    if (selectedTipo === 'grabado')      list = list.filter(c => c.tipo === 'grabado')
    else if (selectedTipo === 'en_vivo') list = list.filter(c => c.tipo === 'en_vivo')
    else if (selectedTipo === 'ebook')   list = list.filter(c => c.tipo === 'ebook')
    else if (selectedTipo === 'gratis')  list = list.filter(c => c.precio_ars === 0 || c.tipo_acceso === 'gratuito')

    if (selectedNivel !== 'all') list = list.filter(c => c.nivel === selectedNivel)
    if (selectedCat !== 'all')   list = list.filter(c => c.category?.nombre === selectedCat)

    if (search) {
      list = list.filter(c =>
        c.titulo.toLowerCase().includes(search) ||
        c.instructor?.nombre.toLowerCase().includes(search) ||
        c.category?.nombre.toLowerCase().includes(search)
      )
    }
    return sortCourses(list, sort)
  }, [catalogCourses, selectedTipo, selectedNivel, selectedCat, search, sort])

  const categoryNames = ['all', ...categories.map(c => c.nombre)]

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg)' }}>
      <Header />

      {/* ── HERO (estilo Vivencial: dark + grid + dos columnas) ── */}
      <section
        style={{
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          background: `
            radial-gradient(ellipse 1100px 620px at 22% 0%, rgba(0,229,200,.16), transparent 62%),
            radial-gradient(ellipse 700px 460px at 100% 10%, rgba(14,107,92,.22), transparent 58%),
            linear-gradient(180deg, #0D2A38 0%, var(--bg) 46%, #0D2230 100%)
          `,
          overflow: 'hidden',
          padding: '96px 0 52px',
        }}
      >
        {/* Grid pattern */}
        <div
          aria-hidden
          style={{
            position: 'absolute', inset: 0, pointerEvents: 'none', opacity: .6,
            backgroundImage: 'linear-gradient(rgba(245,243,236,.06) 1px,transparent 1px),linear-gradient(90deg,rgba(245,243,236,.06) 1px,transparent 1px)',
            backgroundSize: '56px 56px',
            maskImage: 'radial-gradient(ellipse 1000px 560px at 18% 0%, black, transparent 72%)',
          }}
        />
        {/* Bottom fade to page bg */}
        <div aria-hidden style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 90, pointerEvents: 'none', background: 'linear-gradient(to bottom, transparent, var(--bg))' }} />

        <div
          className="w-full max-w-[1200px] mx-auto px-[22px] grid gap-10 items-center lg:grid-cols-[minmax(0,1fr)_480px] xl:grid-cols-[minmax(0,1fr)_600px]"
          style={{ position: 'relative', zIndex: 1 }}
        >
          {/* left column */}
          <div style={{ maxWidth: 640 }}>
            <motion.p
              className="font-mono uppercase flex items-center gap-2"
              style={{ fontSize: 10, letterSpacing: '.18em', color: 'var(--neon)', marginBottom: 18 }}
              initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: [0.23, 1, 0.32, 1], delay: 0.1 }}
            >
              <span className="eyebrow-dot" style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--neon)', boxShadow: '0 0 0 4px var(--neon-dim)', display: 'inline-block' }} />
              Travexa Academy · Formación
            </motion.p>

            <motion.h1
              className="font-display font-bold"
              style={{ fontSize: 'clamp(2.4rem,6vw,4.4rem)', lineHeight: 1.03, letterSpacing: '-.025em' }}
              initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, ease: [0.23, 1, 0.32, 1], delay: 0.22 }}
            >
              <span style={{ color: 'var(--text-1)', display: 'block' }}>Formación práctica que se</span>
              <span style={{ color: 'var(--neon)', textShadow: '0 0 48px var(--neon-glow)', display: 'block' }}>traduce en más ventas.</span>
            </motion.h1>

            <motion.p
              style={{ maxWidth: 540, marginTop: 22, fontSize: 'clamp(.95rem,1.8vw,1.1rem)', color: 'var(--text-3)', lineHeight: 1.7 }}
              initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, ease: [0.23, 1, 0.32, 1], delay: 0.42 }}
            >
              Nada de teoría de manual. Cada curso está armado con casos reales del mercado argentino, pensado para que vendas más — no para juntar diplomas.
            </motion.p>

            <motion.div
              className="flex items-center gap-3 flex-wrap"
              style={{ marginTop: 32 }}
              initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, ease: [0.23, 1, 0.32, 1], delay: 0.54 }}
            >
              <motion.button
                className="font-display font-bold rounded-[10px] inline-flex items-center justify-center"
                style={{ background: 'var(--neon)', color: '#0A1E29', fontSize: '14.5px', padding: '12px 24px', minHeight: 48 }}
                onClick={scrollToResults}
                whileTap={{ scale: 0.97 }}
                whileHover={{ boxShadow: '0 0 24px var(--neon-glow), 0 4px 16px rgba(0,0,0,.25)' }}
              >
                Ver cursos
              </motion.button>
              <motion.button
                className="font-display font-bold rounded-[10px] border inline-flex items-center"
                style={{ background: 'transparent', borderColor: 'var(--line-s)', color: 'var(--text-2)', fontSize: '14.5px', padding: '12px 24px', minHeight: 48 }}
                onClick={() => { setSelectedTipo('gratis'); scrollToResults() }}
                whileTap={{ scale: 0.97 }}
              >
                Cursos gratis
              </motion.button>
            </motion.div>

          </div>

          {/* right column — imagen flotante */}
          <motion.div
            className="hidden lg:flex items-center justify-center"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.9, ease: [0.23, 1, 0.32, 1], delay: 0.4 }}
          >
            <div style={{ position: 'relative', width: '100%' }}>
              <div aria-hidden style={{ position: 'absolute', inset: '-16%', background: 'radial-gradient(ellipse at center, rgba(0,229,200,.20), transparent 70%)', filter: 'blur(40px)', pointerEvents: 'none' }} />
              <div
                style={{ position: 'relative', width: '100%', borderRadius: 24, overflow: 'hidden', border: '1px solid var(--line-s)', boxShadow: '0 48px 96px -28px rgba(0,0,0,.7), 0 0 72px rgba(0,229,200,.12)' }}
              >
                <img
                  src="/hero-formacion.png"
                  alt="Asesora de viajes trabajando frente a una ventana con un avión despegando"
                  style={{ width: '100%', display: 'block', aspectRatio: '4/5', objectFit: 'cover' }}
                  loading="eager"
                />
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── Fila de métricas destacadas (debajo del hero, full width) ── */}
      <FormacionStatsRow />

      {/* ── Oferta de valor de Formación ── */}
      <FormacionValueSection />

      {/* ── Main content ── */}
      <main ref={resultsRef} className="max-w-[1200px] mx-auto px-[22px]">

        {/* Controls: search + sort */}
        <div
          className="flex items-center gap-[10px] py-4 flex-wrap"
          style={{ borderBottom: '1px solid var(--line)' }}
        >
          {/* Search */}
          <div
            className="flex items-center gap-[9px] flex-1 min-w-[180px] max-w-[380px] h-11 px-[14px] rounded-[10px] border transition-colors"
            style={{ background: 'var(--card)', borderColor: 'var(--line)' }}
          >
            <Search className="w-[15px] h-[15px] shrink-0" style={{ color: 'var(--text-3)' }} />
            <input
              type="text"
              placeholder="Buscar cursos o instructores..."
              value={searchDisplay}
              onChange={e => handleSearch(e.target.value)}
              autoComplete="off"
              className="flex-1 bg-transparent border-none outline-none text-[13px]"
              style={{ color: 'var(--text-1)' }}
            />
          </div>

          {/* Sort */}
          <SortDropdown value={sort} onChange={setSort} />
        </div>

        {/* Filters: 2 rows */}
        <div className="py-[14px]" style={{ borderBottom: '1px solid var(--line)' }}>
          {/* Row 1: Modalidad */}
          <div className="flex items-center gap-[14px] mb-[10px]">
            <span className="font-display text-[13px] font-bold shrink-0 min-w-[90px]" style={{ color: 'var(--text-1)' }}>
              Modalidad
            </span>
            <div className="flex items-center gap-[7px] overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
              {TIPO_OPTIONS.map(opt => (
                <FilterPill
                  key={opt.value}
                  label={opt.label}
                  active={selectedTipo === opt.value}
                  liveStyle={opt.value === 'en_vivo' && selectedTipo !== opt.value}
                  onClick={() => setSelectedTipo(opt.value)}
                />
              ))}
            </div>
          </div>

          {/* Row 2: Nivel */}
          <div className="flex items-center gap-[14px] mb-[10px]">
            <span className="font-display text-[13px] font-bold shrink-0 min-w-[90px]" style={{ color: 'var(--text-1)' }}>
              Nivel
            </span>
            <div className="flex items-center gap-[7px] overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
              {NIVEL_OPTIONS.map(opt => (
                <FilterPill
                  key={opt.value}
                  label={opt.label}
                  active={selectedNivel === opt.value}
                  onClick={() => setSelectedNivel(opt.value)}
                />
              ))}
            </div>
          </div>

          {/* Row 3: Categoría */}
          <div className="flex items-center gap-[14px]">
            <span className="font-display text-[13px] font-bold shrink-0 min-w-[90px]" style={{ color: 'var(--text-1)' }}>
              Categoría
            </span>
            <div className="flex items-center gap-[7px] overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
              {categoryNames.map(cat => (
                <CategoryPill
                  key={cat}
                  label={cat === 'all' ? 'Todas' : cat}
                  active={selectedCat === cat}
                  onClick={() => setSelectedCat(cat)}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Result count */}
        <p
          className="font-mono tracking-[.06em] uppercase py-[9px]"
          style={{ fontSize: '9.5px', color: 'var(--text-3)' }}
        >
          {filtered.length === 1 ? '1 curso' : `${filtered.length} cursos`}
        </p>

        {/* Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-[18px] pb-20">
            {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-[18px] pb-20">
            <EmptyState />
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-[18px] pb-20">
            {filtered.map((course, i) => (
              <CourseCard
                key={course.id}
                course={course}
                wishlisted={wishlist.includes(course.id)}
                onWishlistToggle={handleWishlist}
                animDelay={i * 0.058}
              />
            ))}
          </div>
        )}
      </main>

      <WhatsAppFloat />
    </div>
  )
}
