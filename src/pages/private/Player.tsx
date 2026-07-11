import { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import { useParams, Link, useNavigate, useSearchParams } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import confetti from 'canvas-confetti'
import toast from 'react-hot-toast'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { liveLessonState } from '@/types'
import type { Course, Module, Lesson, LessonProgress, LessonRecurso } from '@/types'
import { onLessonComplete } from '@/hooks/useGamification'
import { confirmCoursePayment } from '@/hooks/usePayment'
import { useMyReview } from '@/hooks/useCourses'
import LessonComments from '@/components/player/LessonComments'
import CourseCompleteModal from '@/components/player/CourseCompleteModal'
import EbookReader from '@/components/player/EbookReader'
import PdfCanvas from '@/components/player/PdfCanvas'
import './player.css'

// ── Iconos inline (paths del proto) ──────────────────────────────
const S = { fill: 'none', stroke: 'currentColor', strokeWidth: 2 } as const
const IcoChevronL = () => <svg viewBox="0 0 24 24" {...S}><path d="M15 18l-6-6 6-6" /></svg>
const IcoChevronR = () => <svg viewBox="0 0 24 24" {...S}><path d="M9 6l6 6-6 6" /></svg>
const IcoChevronD = () => <svg viewBox="0 0 24 24" {...S}><path d="M6 9l6 6 6-6" /></svg>
const IcoMenu = () => <svg viewBox="0 0 24 24" {...S}><path d="M3 6h18M3 12h18M3 18h18" /></svg>
const IcoPlay = () => <svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z" /></svg>
const IcoLock = () => <svg viewBox="0 0 24 24" {...S}><rect x="5" y="11" width="14" height="9" rx="1.5" /><path d="M8 11V8a4 4 0 118 0v3" /></svg>
const IcoCheck = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4"><path d="M20 6L9 17l-5-5" /></svg>
const IcoPlane = () => <svg viewBox="0 0 24 24" fill="currentColor"><path d="M22 16v-2l-8.5-5V3.5c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5V9L2 14v2l8.5-2.5V19L8 20.5V22l4-1 4 1v-1.5L13.5 19v-5.5L22 16z" /></svg>
const IcoCircle = () => <svg viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="5" /></svg>
const IcoFile = () => <svg viewBox="0 0 24 24" {...S}><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" /><path d="M14 2v6h6" /></svg>
const IcoLink = () => <svg viewBox="0 0 24 24" {...S}><rect x="3" y="3" width="18" height="18" rx="2" /><path d="M3 9h18M9 21V9" /></svg>
const IcoArrowUpR = () => <svg viewBox="0 0 24 24" {...S}><path d="M7 17L17 7M7 7h10v10" /></svg>
const IcoArrowR = () => <svg viewBox="0 0 24 24" {...S}><path d="M5 12h14M13 6l6 6-6 6" /></svg>
const IcoVideo = () => <svg viewBox="0 0 24 24" {...S}><path d="M23 7l-7 5 7 5V7z" /><rect x="1" y="5" width="15" height="14" rx="2" /></svg>
const IcoCalendar = () => <svg viewBox="0 0 24 24" {...S}><rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" /></svg>

function getYouTubeId(url: string): string | null {
  const m = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|v\/|live\/))([^&?/]+)/)
  return m?.[1] ?? null
}

// Parámetros comunes del embed: nocookie, sin branding ni sugerencias al terminar.
function ytEmbedSrc(id: string, autoplay: boolean): string {
  const p = new URLSearchParams({ rel: '0', modestbranding: '1', playsinline: '1' })
  if (autoplay) p.set('autoplay', '1')
  return `https://www.youtube-nocookie.com/embed/${id}?${p.toString()}`
}

function asResources(recursos: Lesson['recursos']): LessonRecurso[] {
  if (!Array.isArray(recursos)) return []
  return recursos.filter((r): r is LessonRecurso => !!r && typeof r === 'object' && typeof (r as LessonRecurso).url === 'string')
}
function isPdfRes(r: LessonRecurso): boolean {
  return r.tipo === 'pdf' || /\.pdf($|\?)/i.test(r.url)
}

function fmtDuration(min: number): string {
  if (!min) return ''
  const h = Math.floor(min / 60)
  const m = min % 60
  return h > 0 ? (m > 0 ? `${h}h ${m}m` : `${h}h`) : `${m}m`
}
function fmtSecs(secs: number | null): string {
  if (!secs) return ''
  const m = Math.floor(secs / 60)
  const s = secs % 60
  return `${m}:${String(s).padStart(2, '0')}`
}

// ── Data ─────────────────────────────────────────────────────────
async function fetchCourseForPlayer(slug: string) {
  const { data, error } = await supabase
    .from('academy_courses')
    .select(`*, instructor:academy_instructors(*), modules:academy_modules(*, lessons:academy_lessons(*))`)
    .eq('slug', slug)
    .single()
  if (error) throw error
  const course = data as unknown as Course & { modules: Module[] }
  course.modules = [...(course.modules ?? [])].sort((a, b) => a.orden - b.orden).map(m => ({
    ...m, lessons: [...(m.lessons ?? [])].sort((a, b) => a.orden - b.orden),
  }))
  return course
}
async function fetchProgress(userId: string, courseId: string): Promise<LessonProgress[]> {
  const { data } = await supabase.from('academy_lesson_progress').select('*').eq('user_id', userId).eq('course_id', courseId)
  return (data ?? []) as LessonProgress[]
}
async function fetchEnrollmentActive(userId: string, courseId: string): Promise<boolean> {
  const { data } = await supabase.from('academy_enrollments').select('id').eq('user_id', userId).eq('course_id', courseId).eq('activo', true).maybeSingle()
  return !!data
}
async function markLessonComplete(lessonId: string, courseId: string, userId: string): Promise<boolean> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any
  await db.from('academy_lesson_progress').upsert(
    { user_id: userId, lesson_id: lessonId, course_id: courseId, completada: true, segundos_vistos: 0 },
    { onConflict: 'user_id,lesson_id' },
  )
  const { data } = await db.rpc('academy_sync_course_progress', { p_course_id: courseId })
  return data === true
}

interface FlatLesson extends Lesson {
  mi: number
  li: number
  moduleTitle: string
  moduleLessonCount: number
}

export default function Player() {
  const { slug, lessonId } = useParams<{ slug: string; lessonId?: string }>()
  const { user } = useAuth()
  const navigate = useNavigate()
  const qc = useQueryClient()
  const [searchParams, setSearchParams] = useSearchParams()
  const paymentConfirmRan = useRef(false)

  const [collapsed, setCollapsed] = useState(false)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [foldKey, setFoldKey] = useState(0)
  const [playing, setPlaying] = useState(false)
  const [framePdf, setFramePdf] = useState<string | null>(null)
  const [pdfPage, setPdfPage] = useState(1)
  const [pdfNum, setPdfNum] = useState(0)
  const [openModules, setOpenModules] = useState<Set<string>>(new Set())
  const [showCompletion, setShowCompletion] = useState(false)

  const { data: course, isLoading } = useQuery({
    queryKey: ['player-course', slug],
    queryFn: () => fetchCourseForPlayer(slug!),
    enabled: !!slug,
  })
  const { data: progress = [] } = useQuery({
    queryKey: ['progress', user?.id, course?.id],
    queryFn: () => fetchProgress(user!.id, course!.id),
    enabled: !!user?.id && !!course?.id,
  })
  const { data: enrolled = false } = useQuery({
    queryKey: ['enrollment-active', user?.id, course?.id],
    queryFn: () => fetchEnrollmentActive(user!.id, course!.id),
    enabled: !!user?.id && !!course?.id,
  })
  const { data: myReview } = useMyReview(user?.id, course?.id)

  // Vuelta desde Mercado Pago: confirmar el pago del curso y destrabar el acceso sin recargar.
  useEffect(() => {
    if (paymentConfirmRan.current) return
    const payment = searchParams.get('payment')
    const paymentId = searchParams.get('payment_id') ?? searchParams.get('collection_id')
    const status = searchParams.get('status') ?? searchParams.get('collection_status')
    const externalRef = searchParams.get('external_reference') ?? ''
    const isSuccess = payment === 'success' || status === 'approved'
    if (!isSuccess || !paymentId) return
    paymentConfirmRan.current = true

    void (async () => {
      const result = await confirmCoursePayment(paymentId, externalRef)
      if (result.success) {
        // Prefijo parcial: invalida el enrollment de cualquier curso sin depender de course.id (aún puede estar cargando).
        await qc.invalidateQueries({ queryKey: ['enrollment-active'] })
        void qc.invalidateQueries({ queryKey: ['enrollments', user?.id] })
        toast('¡Listo! Ya tenés acceso a este curso', {
          icon: '✅',
          style: { background: 'var(--bg-2)', color: 'var(--text-1)', border: '1px solid var(--primary)', borderRadius: '12px' },
          duration: 3500,
        })
      }
      // Limpiar los params (replace, sin entrada de historial) para que un refresh no reintente.
      setSearchParams(prev => {
        const next = new URLSearchParams(prev)
        for (const k of ['payment', 'payment_id', 'collection_id', 'status', 'collection_status', 'external_reference', 'preference_id', 'payment_type', 'merchant_order_id', 'site_id', 'processing_mode', 'merchant_account_id']) next.delete(k)
        return next
      }, { replace: true })
    })()
  }, [searchParams, setSearchParams, qc, user?.id])

  const completedIds = useMemo(() => new Set(progress.filter(p => p.completada).map(p => p.lesson_id)), [progress])
  const isEbook = course?.tipo === 'ebook'

  const lessons: FlatLesson[] = useMemo(() => {
    const out: FlatLesson[] = []
    course?.modules?.forEach((m, mi) => {
      (m.lessons ?? []).forEach((l, li) => out.push({ ...l, mi, li, moduleTitle: m.titulo, moduleLessonCount: (m.lessons ?? []).length }))
    })
    return out
  }, [course])
  const TOTAL = lessons.length

  // Frontera = primera lección no completada.
  const frontier = useMemo(() => {
    const idx = lessons.findIndex(l => !completedIds.has(l.id))
    return idx === -1 ? TOTAL : idx
  }, [lessons, completedIds, TOTAL])

  const viewingIndex = useMemo(() => {
    if (lessonId) {
      const i = lessons.findIndex(l => l.id === lessonId)
      if (i !== -1) return i
    }
    return Math.min(frontier, Math.max(0, TOTAL - 1))
  }, [lessonId, lessons, frontier, TOTAL])

  const current = lessons[viewingIndex]

  const isFrontier = (i: number) => i === frontier
  const isAccessible = useCallback((i: number) => i <= frontier || completedIds.has(lessons[i]?.id) || !!lessons[i]?.es_preview, [frontier, completedIds, lessons])

  const completedCount = completedIds.size
  const pct = TOTAL > 0 ? Math.round((completedCount / TOTAL) * 100) : 0
  const totalMin = course?.duracion_total_minutos || Math.round(lessons.reduce((a, l) => a + (l.duracion_segundos ?? 0), 0) / 60)

  // Aterrizaje en la frontera si no hay lessonId (cursos con lecciones).
  useEffect(() => {
    if (!isEbook && !lessonId && lessons.length > 0) {
      const target = lessons[Math.min(frontier, TOTAL - 1)]
      navigate(`/cursos/${slug}/aprender/${target.id}`, { replace: true })
    }
  }, [isEbook, lessonId, lessons, frontier, TOTAL, slug, navigate])

  // Reset de media al cambiar de lección.
  const pdfResources = useMemo(() => asResources(current?.recursos ?? null).filter(isPdfRes), [current])
  const allResources = useMemo(() => asResources(current?.recursos ?? null), [current])
  const primaryPdf = current && !current.video_url && pdfResources[0] ? pdfResources[0].url : null

  useEffect(() => {
    setPlaying(false)
    setFramePdf(primaryPdf)
    setPdfPage(1)
    setPdfNum(0)
  }, [viewingIndex, primaryPdf])

  // Abrir el módulo de la lección actual en el sidebar.
  useEffect(() => {
    const modId = course?.modules?.[current?.mi ?? -1]?.id
    if (modId) setOpenModules(prev => new Set(prev).add(modId))
  }, [course, current])

  const triggerFold = () => setFoldKey(k => k + 1)
  const toggleCollapsed = () => { setCollapsed(c => !c); triggerFold() }

  const goToLesson = useCallback((i: number) => {
    if (!lessons[i]) return
    setDrawerOpen(false)
    navigate(`/cursos/${slug}/aprender/${lessons[i].id}`)
  }, [lessons, slug, navigate])

  const { mutate: markComplete, isPending: marking } = useMutation({
    mutationFn: () => markLessonComplete(lessons[frontier]!.id, course!.id, user!.id),
    onSuccess: (courseComplete) => {
      void qc.invalidateQueries({ queryKey: ['progress', user?.id, course?.id] })
      void qc.invalidateQueries({ queryKey: ['enrollments', user?.id] })
      const newCompleted = completedCount + 1
      if (user?.id && course) {
        onLessonComplete(user.id, lessons[frontier]!.id, course.id, course.titulo, TOTAL, newCompleted)
          .then(({ puntosGanados, badgeGanado }) => {
            if (puntosGanados > 0) toast(`+${puntosGanados} pts 🪙`, { icon: '🎯', style: { background: 'var(--bg-2)', color: 'var(--gold)', border: '1px solid var(--gold)', borderRadius: '12px' }, duration: 2500 })
            if (badgeGanado) toast(`🏆 Badge: ${badgeGanado}`, { style: { background: 'var(--bg-2)', color: 'var(--text-1)', border: '1px solid var(--gold)', borderRadius: '12px' }, duration: 4000 })
            void qc.invalidateQueries({ queryKey: ['academy-profile', user?.id] })
            void qc.invalidateQueries({ queryKey: ['notifications', user?.id] })
          }).catch(() => { /* no crítico */ })
      }
      if (courseComplete) {
        setShowCompletion(true)
      } else {
        confetti({ particleCount: 60, spread: 60, origin: { y: 0.8 }, scalar: 0.8, colors: ['#0E6B5C', '#4ECDB8', '#C99A3A'] })
        const nextFrontier = frontier + 1
        if (lessons[nextFrontier]) navigate(`/cursos/${slug}/aprender/${lessons[nextFrontier].id}`)
      }
    },
  })

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg)' }}>
        <div className="w-8 h-8 border-2 rounded-full animate-spin" style={{ borderColor: 'var(--primary)', borderTopColor: 'transparent' }} />
      </div>
    )
  }
  if (!course) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg)' }}>
        <div className="text-center">
          <p className="mb-4" style={{ color: 'var(--text-3)' }}>Curso no encontrado</p>
          <Link to="/mis-cursos" className="text-sm" style={{ color: 'var(--primary-l)' }}>Volver a mis cursos</Link>
        </div>
      </div>
    )
  }

  // Ebook → lector dedicado (fuera del layout del player de curso).
  if (isEbook) {
    return (
      <>
        <EbookReader course={course} userId={user?.id} canRead={enrolled} />
        <style>{`@media print { body { display: none !important; } }`}</style>
      </>
    )
  }

  const accessible = current ? isAccessible(viewingIndex) : false
  const state = current ? liveLessonState(current) : 'sin_video'
  const isLiveNow = state === 'en_vivo'
  // La lección en vivo usa live_url; la grabada usa video_url (YouTube deja el vivo en la misma URL al terminar).
  const effectiveVideoUrl = current?.video_url ?? current?.live_url ?? null
  const youtubeId = effectiveVideoUrl ? getYouTubeId(effectiveVideoUrl) : null
  // Portada de la lección con fallback al thumbnail del curso.
  const lessonPoster = current?.thumbnail_url ?? course.thumbnail_url ?? null
  // Chat embed nativo de YouTube (solo mientras está en vivo).
  const liveChatSrc = youtubeId ? `https://www.youtube.com/live_chat?v=${youtubeId}&embed_domain=${window.location.hostname}` : null
  const doneCurrent = current ? completedIds.has(current.id) : false
  const canComment = enrolled || !!current?.es_preview

  const prev = viewingIndex > 0 ? lessons[viewingIndex - 1] : null
  const next = viewingIndex < TOTAL - 1 ? lessons[viewingIndex + 1] : null
  const atEnd = viewingIndex === TOTAL - 1

  const watermark = (
    <div className="watermark" aria-hidden>
      {user?.email ? Array.from({ length: 24 }).map((_, i) => <span key={i}>{user.email}</span>) : null}
    </div>
  )

  // ── Media del content-frame ──
  let media: React.ReactNode
  if (!accessible) {
    media = (
      <div className="lock-overlay">
        <div className="lock-icon"><IcoLock /></div>
        <h4>Todavía no llegaste a esta escala</h4>
        <p>Completá las lecciones anteriores para desbloquear el video o el PDF.</p>
        <button onClick={() => goToLesson(frontier)}>Ir a la lección pendiente <IcoArrowR /></button>
      </div>
    )
  } else if (framePdf) {
    media = (
      <div className="pdf-shell">
        <div className="pdf-toolbar">
          <div className="doc-name"><IcoFile /><span>{current?.titulo}</span></div>
          <div className="pages">
            <button onClick={() => setPdfPage(p => Math.max(1, p - 1))} disabled={pdfPage <= 1} aria-label="Anterior"><IcoChevronL /></button>
            <span>Página {pdfPage}{pdfNum ? ` de ${pdfNum}` : ''}</span>
            <button onClick={() => setPdfPage(p => (pdfNum ? Math.min(pdfNum, p + 1) : p + 1))} disabled={!!pdfNum && pdfPage >= pdfNum} aria-label="Siguiente"><IcoChevronR /></button>
          </div>
        </div>
        <div className="pdf-scroll">
          <PdfCanvas fileUrl={framePdf} page={pdfPage} maxWidth={420} onLoad={({ numPages }) => setPdfNum(numPages)} />
        </div>
      </div>
    )
  } else if (state === 'grabada' && youtubeId) {
    media = playing ? (
      <iframe
        src={ytEmbedSrc(youtubeId, true)}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen title={current?.titulo}
      />
    ) : (
      <>
        {lessonPoster && <div className="lesson-poster" style={{ backgroundImage: `url('${lessonPoster}')` }} />}
        <div className="duration-chip">00:00 / {fmtSecs(current?.duracion_segundos ?? null) || '—'}</div>
        <div className="progress-mini"><i style={{ width: doneCurrent ? '100%' : '0%' }} /></div>
        <button className="play-btn" aria-label="Reproducir" onClick={() => setPlaying(true)} onContextMenu={e => e.preventDefault()}><IcoPlay /></button>
      </>
    )
  } else if (state === 'en_vivo' && youtubeId) {
    // Vivo al aire: se reproduce embebido dentro de Academy, nunca redirige a YouTube.
    media = (
      <>
        <div className="badge-live"><span className="dot" />EN VIVO AHORA</div>
        <iframe
          src={ytEmbedSrc(youtubeId, true)}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen title={current?.titulo}
        />
      </>
    )
  } else if (state === 'programada') {
    const fecha = new Date(current!.fecha_vivo!)
    media = (
      <>
        {lessonPoster && <div className="lesson-poster" style={{ backgroundImage: `url('${lessonPoster}')` }} />}
        <div className="badge-live"><span className="dot" />EN VIVO · {fecha.toLocaleDateString('es-AR', { day: 'numeric', month: 'short' })}</div>
        <div className="frame-state">
          <div className="fs-ic"><IcoCalendar /></div>
          <h4>{fecha.toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' })}</h4>
          <p>{fecha.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })} h · El vivo se reproduce acá mismo. La grabación queda disponible después.</p>
        </div>
      </>
    )
  } else if (state === 'grabacion_pendiente') {
    media = (
      <div className="frame-state">
        <div className="fs-ic"><IcoCalendar /></div>
        <h4>La grabación se sube pronto</h4>
        <p>La clase ya se dio en vivo. Estamos preparando la grabación.</p>
      </div>
    )
  } else {
    media = (
      <div className="frame-state">
        <div className="fs-ic"><IcoVideo /></div>
        <h4>Contenido no disponible</h4>
        <p>Esta lección todavía no tiene video ni material cargado.</p>
      </div>
    )
  }

  return (
    <div className={`player-root${collapsed ? ' is-collapsed' : ''}`}>
      {/* Header */}
      <header className="player-header">
        <Link to="/mis-cursos" className="back-btn"><IcoChevronL /> Mis cursos</Link>
        <div className="header-divider" />
        <div className="header-course">
          <span className="k">Curso</span>
          <span className="v">{course.titulo}</span>
        </div>
        <div className="route-progress">
          <span className="route-progress-loc">{current ? `Módulo ${current.mi + 1} · Lección ${current.li + 1} de ${current.moduleLessonCount}` : '—'}</span>
          <div className="route-progress-track">
            <div className="route-progress-fill" style={{ width: `${pct}%` }} />
            <div className="route-progress-plane" style={{ left: `${pct}%` }}><IcoPlane /></div>
          </div>
          <span className="route-progress-pct">{pct}%</span>
        </div>
        <button className="sidebar-toggle-mobile" aria-label="Abrir ruta del curso" onClick={() => setDrawerOpen(true)}><IcoMenu /></button>
      </header>

      <div className={`mobile-drawer-backdrop${drawerOpen ? ' is-open' : ''}`} onClick={() => setDrawerOpen(false)} />

      <div className="shell">
        <div className="main-col">
          <div className="player-wrap">
            <div className={`live-stage${isLiveNow && accessible && liveChatSrc ? ' is-live' : ''}`}>
              <div className={`content-frame${!accessible ? ' is-locked' : ''}`}>
                {watermark}
                {media}
              </div>
              {isLiveNow && accessible && liveChatSrc && (
                <aside className="yt-chat">
                  <div className="yt-chat-head">Chat en vivo</div>
                  <iframe src={liveChatSrc} title="Chat en vivo de YouTube" />
                </aside>
              )}
            </div>
          </div>

          <div className="lesson-meta">
            <div className="lesson-eyebrow">
              <span>Módulo {(current?.mi ?? 0) + 1} · {current?.moduleTitle}</span>
              <span className="sep">/</span>
              <span>Lección {(current?.li ?? 0) + 1} de {current?.moduleLessonCount}</span>
            </div>
            <h1 className="lesson-title">{current?.titulo}</h1>
            {/* descripcion opcional de la leccion */}
            {(current as unknown as { descripcion?: string })?.descripcion && (
              <p className="lesson-desc">{(current as unknown as { descripcion?: string }).descripcion}</p>
            )}

            <div className="lesson-actions">
              {doneCurrent ? (
                <button className="btn-complete is-done"><IcoCheck /> Completada</button>
              ) : isFrontier(viewingIndex) ? (
                <button className="btn-complete" disabled={marking} onClick={() => markComplete()}>
                  <IcoCheck /> {marking ? 'Guardando…' : 'Marcar como completada'}
                </button>
              ) : (
                <button className="btn-complete" disabled><IcoLock /> Completá las anteriores</button>
              )}
              <span className="autosave-note">Tu avance se guarda solo, podés cortar y volver cuando quieras</span>
            </div>
          </div>

          {/* Recursos */}
          <div className="lesson-section-label">Recursos de esta lección</div>
          {allResources.length > 0 ? (
            <div className="resources">
              {allResources.map((r, i) => {
                const pdf = isPdfRes(r)
                return pdf ? (
                  <button key={i} className="resource-row" onClick={() => { setFramePdf(r.url); setPdfPage(1); window.scrollTo({ top: 0, behavior: 'smooth' }) }}>
                    <div className="resource-icon"><IcoFile /></div>
                    <div>
                      <div className="resource-name">{r.titulo || 'Documento'}</div>
                      <div className="resource-type">{r.tipo || 'PDF'}</div>
                    </div>
                    <span className="resource-action">Ver <IcoArrowUpR /></span>
                  </button>
                ) : (
                  <a key={i} className="resource-row" href={r.url} target="_blank" rel="noopener noreferrer">
                    <div className="resource-icon"><IcoLink /></div>
                    <div>
                      <div className="resource-name">{r.titulo || 'Enlace'}</div>
                      <div className="resource-type">{r.tipo || 'Enlace externo'}</div>
                    </div>
                    <span className="resource-action">Abrir <IcoArrowUpR /></span>
                  </a>
                )
              })}
            </div>
          ) : (
            <div className="no-resources">Esta lección no tiene recursos adicionales</div>
          )}

          {/* Preguntas de la clase — mientras está en vivo, el chat de YouTube las reemplaza arriba. */}
          {current && !isLiveNow && (
            <>
              <div className="lesson-section-label">Preguntas de esta clase</div>
              <div className="lesson-comments">
                <LessonComments lessonId={current.id} courseId={course.id} userId={user?.id} canComment={canComment} />
              </div>
            </>
          )}
        </div>

        {/* Sidebar — ruta del curso */}
        <aside className={`route-sidebar${drawerOpen ? ' is-open-mobile' : ''}`}>
          <button className="sidebar-tab" aria-label="Plegar o desplegar la ruta del curso" onClick={toggleCollapsed}>
            <span style={{ display: 'flex', transform: collapsed ? 'rotate(180deg)' : 'none', transition: 'transform .48s var(--pl-ease)' }}><IcoChevronL /></span>
          </button>
          {foldKey > 0 && <div key={foldKey} className="fold-sweep is-active" />}

          {/* Rail compacto (colapsado) */}
          <div className="route-rail">
            <div className="rail-pct">{pct}%</div>
            {course.modules?.map((m, mi) => {
              const st = moduleStatus(mi, lessons, frontier, completedIds)
              return (
                <div key={m.id} style={{ display: 'contents' }}>
                  {mi > 0 && <div className="rail-connector" />}
                  <button className={`rail-node is-${st}`} title={m.titulo} onClick={() => { setCollapsed(false); triggerFold() }}>
                    {st === 'done' ? <IcoCheck /> : st === 'current' ? <IcoPlane /> : <IcoCircle />}
                  </button>
                </div>
              )
            })}
          </div>

          {/* Ruta completa */}
          <div className="route-sidebar-full">
            <div className="route-sidebar-head">
              <span className="eyebrow">Ruta del curso</span>
              <h2>{course.titulo}</h2>
              <div className="course-stats">
                <div className="stat"><b>{completedCount}/{TOTAL}</b><span>LECCIONES</span></div>
                <div className="stat"><b>{pct}%</b><span>COMPLETADO</span></div>
                {totalMin > 0 && <div className="stat"><b>{fmtDuration(totalMin)}</b><span>DURACIÓN</span></div>}
              </div>
            </div>
            <div className="route-track">
              {course.modules?.map((m, mi) => {
                const idxs = lessons.map((_, i) => i).filter(i => lessons[i].mi === mi)
                const doneN = idxs.filter(i => completedIds.has(lessons[i].id)).length
                const st = moduleStatus(mi, lessons, frontier, completedIds)
                const open = openModules.has(m.id)
                return (
                  <div key={m.id} className={`module-block is-${st}${open ? ' is-open' : ''}`}>
                    <div className="module-node">{st === 'done' ? <IcoCheck /> : st === 'current' ? <IcoPlane /> : <IcoLock />}</div>
                    <div className="module-head" onClick={() => setOpenModules(prev => { const n = new Set(prev); if (n.has(m.id)) n.delete(m.id); else n.add(m.id); return n })}>
                      <div><div className="title">{m.titulo}</div></div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span className="frac">{doneN}/{idxs.length}</span>
                        <span className="chev"><IcoChevronD /></span>
                      </div>
                    </div>
                    <div className="lesson-list">
                      {idxs.map(i => {
                        const l = lessons[i]
                        const done = completedIds.has(l.id)
                        const fr = isFrontier(i)
                        const acc = isAccessible(i)
                        const st2 = liveLessonState(l)
                        return (
                          <button
                            key={l.id}
                            className={`lesson-row${done ? ' is-done' : ''}${fr ? ' is-frontier' : ''}${!acc ? ' is-locked' : ''}${l.es_preview ? ' is-preview' : ''}${i === viewingIndex ? ' is-viewing' : ''}`}
                            onClick={() => goToLesson(i)}
                          >
                            <div className="lesson-status">{done ? <IcoCheck /> : fr ? <IcoPlane /> : acc ? <IcoCircle /> : <IcoLock />}</div>
                            <div className="lname">{l.titulo}</div>
                            <div className="lesson-meta-row">
                              {st2 === 'en_vivo' && <span className="tag-pill live">En vivo ahora</span>}
                              {st2 === 'programada' && <span className="tag-pill upcoming">Próximo</span>}
                              {l.es_preview && <span className="tag-pill preview">Preview</span>}
                              {!l.video_url && asResources(l.recursos).some(isPdfRes) && <span className="tag-pill pdf">PDF</span>}
                              <span className="lesson-dur">{st2 === 'programada' && l.fecha_vivo ? new Date(l.fecha_vivo).toLocaleDateString('es-AR', { day: 'numeric', month: 'short' }) : fmtSecs(l.duracion_segundos)}</span>
                            </div>
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </aside>
      </div>

      {/* Bottom nav */}
      <div className="bottom-bar">
        <button className={`nav-btn${!prev ? ' is-disabled' : ''}`} onClick={() => prev && goToLesson(viewingIndex - 1)}>
          <IcoChevronL /><span className="lbl">{prev?.titulo}</span>
        </button>
        <div className="nav-center">
          <span className="k">LECCIÓN {viewingIndex + 1} DE {TOTAL}</span>
          <div className="dots">
            {lessons.map((l, i) => <i key={l.id} className={completedIds.has(l.id) ? 'done' : i === frontier ? 'current' : ''} />)}
          </div>
        </div>
        {isFrontier(viewingIndex) ? (
          <button className="nav-btn" disabled={marking} onClick={() => markComplete()}>
            <span className="lbl">{atEnd ? 'Finalizar curso' : 'Marcar y continuar'}</span><IcoChevronR />
          </button>
        ) : (
          <button className={`nav-btn${!next ? ' is-disabled' : ''}`} onClick={() => next && goToLesson(viewingIndex + 1)}>
            <span className="lbl">{next?.titulo}</span><IcoChevronR />
          </button>
        )}
      </div>

      <AnimatePresence>
        {showCompletion && (
          <CourseCompleteModal
            courseId={course.id}
            courseTitle={course.titulo}
            userId={user?.id}
            alreadyReviewed={!!myReview}
            onClose={() => setShowCompletion(false)}
          />
        )}
      </AnimatePresence>

      <style>{`@media print { body { display: none !important; } }`}</style>
    </div>
  )
}

// Estado de un módulo para el sidebar / rail.
function moduleStatus(mi: number, lessons: FlatLesson[], frontier: number, completedIds: Set<string>): 'done' | 'current' | 'locked' {
  const idxs = lessons.map((_, i) => i).filter(i => lessons[i].mi === mi)
  if (idxs.every(i => completedIds.has(lessons[i].id))) return 'done'
  if (idxs.includes(frontier)) return 'current'
  if (idxs.every(i => i > frontier)) return 'locked'
  return 'current'
}
