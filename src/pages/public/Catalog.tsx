import { useState, useMemo, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, ChevronDown, Check } from 'lucide-react'
import Header from '@/components/layout/Header'
import CourseCard from '@/components/courses/CourseCard'
import SkeletonCard from '@/components/shared/SkeletonCard'
import { useCourses, useCategories, useWishlist, useToggleWishlist } from '@/hooks/useCourses'
import { useAuth } from '@/contexts/AuthContext'
import type { Course, TipoCurso } from '@/types'

// ── Types ─────────────────────────────────────────────────────────

type TipoFilter = TipoCurso | 'all' | 'gratis'
type SortKey    = 'popular' | 'rating' | 'price-asc' | 'price-desc' | 'newest'

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
  { value: 'vivencial', label: '✈ Vivencial' },
  { value: 'gratis',    label: 'Gratis' },
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
                  color:      value === opt.value ? 'var(--primary-l)' : 'var(--text-2)',
                  background: value === opt.value ? 'var(--primary-s)' : 'transparent',
                }}
              >
                {opt.label}
                {value === opt.value && <Check className="w-[10px] h-[10px]" style={{ color: 'var(--primary-l)' }} />}
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
        color:       active ? 'var(--bg)' : liveStyle ? '#fff' : 'var(--text-3)',
        background:  active ? 'var(--text-1)' :
                     liveStyle ? '#EF4444' : 'transparent',
        borderColor: active ? 'var(--text-1)' :
                     liveStyle ? '#EF4444' : 'var(--line)',
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
        color:       active ? 'var(--primary-l)' : 'var(--text-3)',
        background:  active ? 'var(--primary-s)' : 'transparent',
        borderColor: active ? 'var(--primary)' : 'var(--line)',
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
  const [selectedCat, setSelectedCat]       = useState<string>('all')
  const [sort, setSort]                     = useState<SortKey>('popular')
  const [search, setSearch]                 = useState('')
  const [searchDisplay, setSearchDisplay]   = useState('')
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

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

  const filtered = useMemo(() => {
    let list = courses
    if (selectedTipo === 'grabado')   list = list.filter(c => c.tipo === 'grabado')
    else if (selectedTipo === 'en_vivo')   list = list.filter(c => c.tipo === 'en_vivo')
    else if (selectedTipo === 'vivencial') list = list.filter(c => c.tipo === 'vivencial')
    else if (selectedTipo === 'gratis')    list = list.filter(c => c.precio_ars === 0 || c.tipo_acceso === 'free')

    if (selectedCat !== 'all') list = list.filter(c => c.category?.nombre === selectedCat)

    if (search) {
      list = list.filter(c =>
        c.titulo.toLowerCase().includes(search) ||
        c.instructor?.nombre.toLowerCase().includes(search) ||
        c.category?.nombre.toLowerCase().includes(search)
      )
    }
    return sortCourses(list, sort)
  }, [courses, selectedTipo, selectedCat, search, sort])

  const liveCount      = courses.filter(c => c.tipo === 'en_vivo').length
  const vivencialCount = courses.filter(c => c.tipo === 'vivencial').length
  const totalCount     = courses.length

  const categoryNames = ['all', ...categories.map(c => c.nombre)]

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg)' }}>
      <Header />

      {/* ── White page header ── */}
      <section
        className="relative overflow-hidden"
        style={{ background: '#fff', padding: '42px 0 38px' }}
      >
        {/* Background photo */}
        <img
          className="absolute inset-0 w-full h-full object-cover pointer-events-none"
          style={{ objectPosition: 'center 35%', opacity: 0.09 }}
          src="https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=1400&q=70"
          alt=""
          aria-hidden
          onError={e => { (e.currentTarget as HTMLImageElement).style.visibility = 'hidden' }}
        />
        {/* Dot grid */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ backgroundImage: 'radial-gradient(circle,rgba(14,107,92,.08) 1px,transparent 1px)', backgroundSize: '26px 26px' }}
        />
        {/* Horizontal fade */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: 'linear-gradient(90deg,#fff 0%,transparent 18%,transparent 82%,#fff 100%)' }}
        />
        {/* Bottom fade */}
        <div
          className="absolute bottom-0 left-0 right-0 h-[38px] pointer-events-none"
          style={{ background: 'linear-gradient(to bottom,transparent,rgba(255,255,255,.75))' }}
        />

        {/* Content */}
        <div className="relative z-10 max-w-[1200px] mx-auto px-[22px]">
          <div className="flex items-center gap-[7px] mb-[9px]">
            <span className="eyebrow-dot w-[5px] h-[5px] rounded-full shrink-0" style={{ background: 'var(--primary)' }} />
            <span className="font-mono text-[10px] tracking-[.18em] uppercase" style={{ color: 'var(--primary)' }}>
              Trade turístico argentino
            </span>
          </div>
          <h1 className="font-display font-bold tracking-[-0.02em]" style={{ fontSize: 'clamp(1.75rem,4vw,2.7rem)', color: '#0A1E29' }}>
            Todos los cursos
          </h1>
          <p style={{ fontSize: '.92rem', color: '#4A6373', marginTop: '5px' }}>
            Formación práctica para asesores y agencias de viajes
          </p>
          <div className="flex items-center gap-4 mt-[14px] flex-wrap">
            {liveCount > 0 && (
              <div className="font-mono flex items-center gap-[6px] text-[9.5px] tracking-[.06em] uppercase" style={{ color: '#5C7A87' }}>
                <span className="live-stat-dot w-[7px] h-[7px] rounded-full shrink-0" style={{ background: '#EF4444', boxShadow: '0 0 0 3px rgba(239,68,68,.18)' }} />
                {liveCount} en vivo
              </div>
            )}
            {vivencialCount > 0 && (
              <div className="font-mono flex items-center gap-[6px] text-[9.5px] tracking-[.06em] uppercase" style={{ color: '#5C7A87' }}>
                <span className="w-[7px] h-[7px] rounded-full shrink-0" style={{ background: '#C99A3A' }} />
                {vivencialCount} vivenciales
              </div>
            )}
            {totalCount > 0 && (
              <div className="font-mono flex items-center gap-[6px] text-[9.5px] tracking-[.06em] uppercase" style={{ color: '#5C7A87' }}>
                <span className="w-[7px] h-[7px] rounded-full shrink-0" style={{ background: 'var(--primary)' }} />
                {totalCount} cursos en total
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Fade strip: white → navy */}
      <div
        style={{ height: '84px', background: 'linear-gradient(to bottom,#ffffff,#0A1E29)', marginTop: '-1px' }}
      />

      {/* ── Main content ── */}
      <main className="max-w-[1200px] mx-auto px-[22px]">

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

          {/* Row 2: Categoría */}
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
