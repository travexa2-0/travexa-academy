import { useEffect, useRef, useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import { ChevronLeft, ChevronRight, List, CheckCircle2, Check, X, BookOpen } from 'lucide-react'
import toast from 'react-hot-toast'
import PdfCanvas, { type PdfOutlineItem } from './PdfCanvas'
import { useEbookProgress, useUpdateEbookProgress } from '@/hooks/useEbook'
import { EASE_OUT } from '@/lib/motion'
import type { Course } from '@/types'

interface Props {
  course: Course
  userId: string | undefined
  canRead: boolean
}

export default function EbookReader({ course, userId, canRead }: Props) {
  const shouldReduce = useReducedMotion()
  const { data: progress } = useEbookProgress(userId, course.id)
  const { mutate: saveProgress } = useUpdateEbookProgress(userId)

  const [page, setPage] = useState(1)
  const [numPages, setNumPages] = useState(course.total_paginas ?? 0)
  const [outline, setOutline] = useState<PdfOutlineItem[]>([])
  const [menuOpen, setMenuOpen] = useState(false)
  const [completed, setCompleted] = useState(false)
  const initedRef = useRef(false)
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Retomar en la última página leída (una sola vez, cuando llega el progreso).
  useEffect(() => {
    if (initedRef.current || progress === undefined) return
    initedRef.current = true
    if (progress?.ultima_pagina && progress.ultima_pagina > 0) setPage(progress.ultima_pagina)
    if (progress?.completado) setCompleted(true)
  }, [progress])

  // Persistir la página con debounce. Marca completado al llegar a la última.
  const persist = useCallback(
    (p: number, done: boolean) => {
      if (!canRead || !userId) return
      if (saveTimer.current) clearTimeout(saveTimer.current)
      saveTimer.current = setTimeout(() => saveProgress({ courseId: course.id, ultimaPagina: p, completado: done || undefined }), 700)
    },
    [canRead, userId, course.id, saveProgress],
  )

  const goTo = useCallback(
    (p: number) => {
      const target = Math.max(1, Math.min(numPages || p, p))
      setPage(target)
      const reachedEnd = numPages > 0 && target >= numPages
      if (reachedEnd && !completed) setCompleted(true)
      persist(target, reachedEnd)
    },
    [numPages, completed, persist],
  )

  // Navegación por teclado.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') goTo(page + 1)
      else if (e.key === 'ArrowLeft') goTo(page - 1)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [page, goTo])

  const handleMarkRead = () => {
    setCompleted(true)
    if (canRead && userId) saveProgress({ courseId: course.id, ultimaPagina: page, completado: true })
    toast('Marcado como leído ✓', {
      style: { background: 'var(--bg-2)', color: 'var(--text-1)', border: '1px solid var(--gold)', borderRadius: '12px' },
    })
  }

  if (!course.pdf_url) {
    return (
      <div className="h-screen flex flex-col items-center justify-center gap-3" style={{ background: 'var(--bg)' }}>
        <BookOpen className="h-8 w-8" style={{ color: 'var(--text-3)' }} />
        <p className="text-sm" style={{ color: 'var(--text-3)' }}>Este ebook todavía no tiene contenido cargado.</p>
        <Link to={`/cursos/${course.slug}`} className="text-sm" style={{ color: 'var(--primary-l)' }}>Volver al detalle</Link>
      </div>
    )
  }

  const total = numPages || course.total_paginas || 0
  const pct = total > 0 ? Math.round((page / total) * 100) : 0

  return (
    <div className="h-screen flex flex-col overflow-hidden" style={{ background: 'var(--bg)' }}>
      {/* Header */}
      <header className="flex items-center gap-3 px-4 h-14 border-b shrink-0 z-20" style={{ background: 'rgba(6,13,20,.95)', borderColor: 'var(--line)', backdropFilter: 'blur(12px)' }}>
        <Link to={`/cursos/${course.slug}`} className="flex items-center gap-1.5 text-sm shrink-0" style={{ color: 'var(--text-3)' }}>
          <ChevronLeft className="h-4 w-4" />
          <span className="hidden sm:inline">Salir</span>
        </Link>
        <div className="flex-1 min-w-0">
          <p className="font-display font-semibold text-sm truncate" style={{ color: 'var(--text-1)' }}>{course.titulo}</p>
        </div>
        {outline.length > 0 && (
          <button
            onClick={() => setMenuOpen(v => !v)}
            className="flex items-center gap-1.5 text-xs font-mono px-3 py-1.5 rounded-lg border shrink-0"
            style={{ borderColor: 'var(--line)', color: 'var(--text-3)' }}
          >
            <List className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Secciones</span>
          </button>
        )}
        {completed ? (
          <span className="flex items-center gap-1.5 text-xs font-mono px-3 py-1.5 rounded-full shrink-0" style={{ background: 'var(--success-s)', color: 'var(--success)' }}>
            <CheckCircle2 className="h-3.5 w-3.5" /> Leído
          </span>
        ) : (
          <button
            onClick={handleMarkRead}
            className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg shrink-0"
            style={{ background: 'var(--primary)', color: 'var(--text-1)' }}
          >
            <Check className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Marcar leído</span>
          </button>
        )}
      </header>

      {/* Reader */}
      <div className="flex flex-1 overflow-hidden relative">
        {/* Section menu (outline) */}
        <AnimatePresence>
          {menuOpen && outline.length > 0 && (
            <>
              <motion.div
                className="absolute inset-0 z-20 md:hidden"
                style={{ background: 'rgba(6,13,20,.6)' }}
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                onClick={() => setMenuOpen(false)}
              />
              <motion.aside
                initial={{ x: -280 }} animate={{ x: 0 }} exit={{ x: -280 }}
                transition={{ duration: shouldReduce ? 0 : 0.24, ease: EASE_OUT }}
                className="absolute md:relative z-30 w-[260px] h-full border-r flex flex-col shrink-0"
                style={{ borderColor: 'var(--line)', background: 'var(--bg-2)' }}
              >
                <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: 'var(--line)' }}>
                  <span className="font-mono text-xs font-semibold" style={{ color: 'var(--text-3)' }}>SECCIONES</span>
                  <button onClick={() => setMenuOpen(false)} style={{ color: 'var(--text-3)' }}><X className="h-4 w-4" /></button>
                </div>
                <div className="flex-1 overflow-y-auto py-1">
                  {outline.map((it, i) => (
                    <button
                      key={`${it.title}-${i}`}
                      onClick={() => { goTo(it.pageNumber); setMenuOpen(false) }}
                      className="w-full text-left px-4 py-2 text-xs flex items-center justify-between gap-2"
                      style={{ color: page === it.pageNumber ? 'var(--primary-l)' : 'var(--text-2)' }}
                    >
                      <span className="line-clamp-2">{it.title}</span>
                      <span className="font-mono text-[10px] shrink-0" style={{ color: 'var(--text-3)' }}>{it.pageNumber}</span>
                    </button>
                  ))}
                </div>
              </motion.aside>
            </>
          )}
        </AnimatePresence>

        {/* Canvas */}
        <div className="flex-1 overflow-y-auto px-3 py-5 flex justify-center" style={{ background: 'var(--bg-deep)' }}>
          <PdfCanvas
            fileUrl={course.pdf_url}
            page={page}
            maxWidth={860}
            onLoad={({ numPages: n, outline: o }) => { setNumPages(n); setOutline(o) }}
          />
        </div>
      </div>

      {/* Bottom paginator */}
      <div className="border-t shrink-0 pb-safe" style={{ background: 'rgba(6,13,20,.95)', borderColor: 'var(--line)', backdropFilter: 'blur(12px)' }}>
        <div className="flex items-center justify-between gap-4 px-4 py-3">
          <button
            onClick={() => goTo(page - 1)}
            disabled={page <= 1}
            className="flex items-center gap-1.5 text-sm font-medium px-4 py-2 rounded-xl border disabled:opacity-40"
            style={{ borderColor: 'var(--line)', color: 'var(--text-2)' }}
          >
            <ChevronLeft className="h-4 w-4" /><span className="hidden sm:inline">Anterior</span>
          </button>

          <div className="flex flex-col items-center gap-1 flex-1 max-w-[240px]">
            <span className="font-mono text-xs" style={{ color: 'var(--text-3)' }}>
              Página {page}{total > 0 ? ` de ${total}` : ''}
            </span>
            {total > 0 && (
              <div className="w-full h-1 rounded-full overflow-hidden" style={{ background: 'var(--card)' }}>
                <div className="h-full rounded-full" style={{ background: 'var(--primary)', width: `${pct}%` }} />
              </div>
            )}
          </div>

          <button
            onClick={() => goTo(page + 1)}
            disabled={total > 0 && page >= total}
            className="flex items-center gap-1.5 text-sm font-medium px-4 py-2 rounded-xl border disabled:opacity-40"
            style={{ borderColor: 'var(--line)', color: 'var(--text-2)' }}
          >
            <span className="hidden sm:inline">Siguiente</span><ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
