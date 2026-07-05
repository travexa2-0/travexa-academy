import { useState, useEffect, useCallback, useMemo } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import {
  CheckCircle2, ChevronLeft, ChevronRight, Lock, Play, Plane,
  Radio, CalendarClock, Video, FileText, Map,
} from 'lucide-react'
import confetti from 'canvas-confetti'
import toast from 'react-hot-toast'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { liveLessonState } from '@/types'
import type { Course, Module, Lesson, LessonProgress, LessonRecurso } from '@/types'
import { EASE_OUT } from '@/lib/motion'
import { onLessonComplete } from '@/hooks/useGamification'
import { useMyReview } from '@/hooks/useCourses'
import LessonComments from '@/components/player/LessonComments'
import CourseCompleteModal from '@/components/player/CourseCompleteModal'
import EbookReader from '@/components/player/EbookReader'
import PdfCanvas from '@/components/player/PdfCanvas'

function getYouTubeId(url: string): string | null {
  const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|v\/))([^&?/]+)/)
  return match?.[1] ?? null
}

// PDFs adjuntos a la lección: se leen en canvas, nunca se descargan.
function getPdfResources(recursos: Lesson['recursos']): LessonRecurso[] {
  if (!Array.isArray(recursos)) return []
  return recursos
    .filter((r): r is LessonRecurso => !!r && typeof r === 'object' && typeof (r as LessonRecurso).url === 'string')
    .filter(r => r.tipo === 'pdf' || /\.pdf($|\?)/i.test(r.url))
}

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
  const { data } = await supabase
    .from('academy_lesson_progress')
    .select('*')
    .eq('user_id', userId)
    .eq('course_id', courseId)
  return (data ?? []) as LessonProgress[]
}

async function fetchEnrollmentActive(userId: string, courseId: string): Promise<boolean> {
  const { data } = await supabase
    .from('academy_enrollments')
    .select('id')
    .eq('user_id', userId)
    .eq('course_id', courseId)
    .eq('activo', true)
    .maybeSingle()
  return !!data
}

// Marca la lección y sincroniza el progreso del enrollment vía RPC segura
// (el UPDATE directo de academy_enrollments es admin-only por RLS). Devuelve
// si el curso quedó completo, para gatear el modal de cierre + reseña.
async function markLessonComplete(userId: string, lessonId: string, courseId: string): Promise<boolean> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any
  await db.from('academy_lesson_progress').upsert(
    { user_id: userId, lesson_id: lessonId, course_id: courseId, completada: true, segundos_vistos: 0 },
    { onConflict: 'user_id,lesson_id' },
  )
  const { data } = await db.rpc('academy_sync_course_progress', { p_course_id: courseId })
  return data === true
}

// ── Flight-path: ruta de vuelo horizontal con las lecciones como waypoints ──
function FlightPath({
  lessons, currentIdx, completedIds, slug,
}: { lessons: Lesson[]; currentIdx: number; completedIds: Set<string>; slug: string }) {
  return (
    <div
      className="hidden sm:flex items-center px-4 h-11 border-b overflow-x-auto scrollbar-none shrink-0"
      style={{ borderColor: 'var(--line)', background: 'var(--bg-2)' }}
      aria-label="Ruta del curso"
    >
      {lessons.map((l, i) => {
        const done = completedIds.has(l.id)
        const current = i === currentIdx
        return (
          <div key={l.id} className="flex items-center shrink-0">
            {i > 0 && (
              <span className="w-7 shrink-0" style={{ borderTop: '1.5px dashed var(--line-s)' }} />
            )}
            <Link
              to={`/cursos/${slug}/aprender/${l.id}`}
              title={`${i + 1}. ${l.titulo}`}
              className="relative flex items-center justify-center shrink-0"
              style={{ width: 22, height: 22 }}
            >
              {current ? (
                <Plane className="h-[15px] w-[15px]" style={{ color: 'var(--primary-l)', transform: 'rotate(45deg)' }} />
              ) : (
                <span
                  className="rounded-full"
                  style={{
                    width: done ? 9 : 7, height: done ? 9 : 7,
                    background: done ? 'var(--primary)' : 'transparent',
                    border: done ? 'none' : '1.5px solid var(--text-3)',
                  }}
                />
              )}
            </Link>
          </div>
        )
      })}
    </div>
  )
}

// ── Sidebar "ruta del curso" con boarding-pass tab + fold-sweep ──
function CourseSidebar({
  open, onToggle, modules, currentLessonId, completedIds, slug, shouldReduce,
}: {
  open: boolean; onToggle: () => void; modules: Module[]
  currentLessonId: string | undefined; completedIds: Set<string>; slug: string; shouldReduce: boolean | null
}) {
  return (
    <>
      {/* Boarding-pass tab — visible cuando el panel está plegado */}
      <AnimatePresence>
        {!open && (
          <motion.button
            key="tab"
            onClick={onToggle}
            initial={{ opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 12 }}
            transition={{ duration: shouldReduce ? 0 : 0.2, ease: EASE_OUT }}
            className="hidden md:flex fixed right-0 top-1/2 -translate-y-1/2 z-30 flex-col items-center gap-2 py-4 px-1.5"
            style={{
              background: 'var(--bg-2)', border: '1px solid var(--line)', borderRight: 'none',
              borderRadius: '10px 0 0 10px', color: 'var(--primary-l)',
              boxShadow: '-4px 0 18px rgba(0,0,0,.28)',
            }}
            aria-label="Abrir ruta del curso"
          >
            <Map className="h-4 w-4" />
            <span className="font-mono text-[10px] tracking-[.18em] uppercase" style={{ writingMode: 'vertical-rl', color: 'var(--text-3)' }}>
              Ruta del curso
            </span>
          </motion.button>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {open && (
          <>
            {/* Backdrop en mobile */}
            <motion.div
              className="fixed inset-0 z-30 md:hidden"
              style={{ background: 'rgba(6,13,20,.6)' }}
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={onToggle}
            />
            <motion.aside
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 300, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: shouldReduce ? 0 : 0.3, ease: EASE_OUT }}
              className="fixed md:relative right-0 top-0 bottom-0 z-40 md:z-auto flex flex-col border-l shrink-0 overflow-hidden"
              style={{ borderColor: 'var(--line)', background: 'var(--bg-2)' }}
            >
              {/* Sheen de pliegue tipo mapa (una sola pasada; respeta reduced-motion vía CSS) */}
              {!shouldReduce && <span className="academy-fold-sheen" aria-hidden />}

              <div className="flex items-center justify-between px-4 py-3 border-b shrink-0" style={{ borderColor: 'var(--line)' }}>
                <div className="flex items-center gap-2">
                  <Map className="h-3.5 w-3.5" style={{ color: 'var(--primary-l)' }} />
                  <p className="font-mono text-xs font-semibold tracking-[.12em]" style={{ color: 'var(--text-3)' }}>RUTA DEL CURSO</p>
                </div>
                <button onClick={onToggle} aria-label="Plegar ruta" style={{ color: 'var(--text-3)' }}>
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto" style={{ width: 300 }}>
                {modules.map(mod => (
                  <div key={mod.id} className="border-b" style={{ borderColor: 'var(--line)' }}>
                    <p className="px-4 py-3 text-xs font-semibold" style={{ color: 'var(--text-3)' }}>
                      {String(mod.orden + 1).padStart(2, '0')} · {mod.titulo}
                    </p>
                    {mod.lessons?.map(lesson => {
                      const done = completedIds.has(lesson.id)
                      const active = lesson.id === currentLessonId
                      const state = liveLessonState(lesson)
                      return (
                        <Link
                          key={lesson.id}
                          to={`/cursos/${slug}/aprender/${lesson.id}`}
                          className="flex items-center gap-2.5 px-4 py-2.5 text-xs relative"
                          style={{
                            background: active ? 'var(--primary-s)' : 'transparent',
                            color: active ? 'var(--primary-l)' : done ? 'var(--text-3)' : 'var(--text-2)',
                          }}
                        >
                          {active && <span className="absolute left-0 top-0 bottom-0 w-0.5 rounded-r" style={{ background: 'var(--primary)' }} />}
                          {done
                            ? <CheckCircle2 className="h-3.5 w-3.5 shrink-0" style={{ color: 'var(--primary)' }} />
                            : state === 'programada'
                              ? <CalendarClock className="h-3.5 w-3.5 shrink-0" style={{ color: 'var(--live)' }} />
                              : active
                                ? <Play className="h-3.5 w-3.5 shrink-0" style={{ color: 'var(--primary-l)' }} />
                                : <Lock className="h-3.5 w-3.5 shrink-0 opacity-40" />}
                          <span className="line-clamp-2 leading-snug flex-1">{lesson.titulo}</span>
                          {state === 'programada' && (
                            <span className="font-mono text-[8px] tracking-[.06em] uppercase px-1 py-0.5 rounded shrink-0" style={{ background: 'rgba(239,68,68,.14)', color: 'var(--live)' }}>Vivo</span>
                          )}
                        </Link>
                      )
                    })}
                  </div>
                ))}
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  )
}

// ── Panel de video / estado de clase en vivo ──
function LessonMedia({ lesson }: { lesson: Lesson | undefined }) {
  if (!lesson) return null
  const state = liveLessonState(lesson)
  const youtubeId = lesson.video_url ? getYouTubeId(lesson.video_url) : null

  if (state === 'grabada' && youtubeId) {
    return (
      <div className="aspect-video w-full max-h-[calc(100vh-16rem)]" onContextMenu={e => e.preventDefault()}>
        <iframe
          src={`https://www.youtube-nocookie.com/embed/${youtubeId}?rel=0&modestbranding=1`}
          className="w-full h-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          title={lesson.titulo}
        />
      </div>
    )
  }

  if (state === 'programada') {
    const fecha = new Date(lesson.fecha_vivo!)
    return (
      <div className="aspect-video w-full flex flex-col items-center justify-center gap-3 text-center px-6" style={{ background: 'var(--bg-2)' }}>
        <span className="flex items-center gap-2 font-mono text-[11px] tracking-[.14em] uppercase px-3 py-1 rounded-full live-pulse" style={{ background: 'rgba(239,68,68,.14)', color: 'var(--live)' }}>
          <Radio className="h-3.5 w-3.5" /> En vivo
        </span>
        <p className="font-display font-bold text-lg" style={{ color: 'var(--text-1)' }}>
          {fecha.toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' })}
        </p>
        <p className="font-mono text-sm" style={{ color: 'var(--text-3)' }}>
          {fecha.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })} h
        </p>
        {lesson.live_url && (
          <a
            href={lesson.live_url} target="_blank" rel="noopener noreferrer"
            className="mt-1 inline-flex items-center gap-2 text-sm font-semibold px-4 py-2 rounded-xl"
            style={{ background: 'var(--primary)', color: 'var(--text-1)' }}
          >
            <Video className="h-4 w-4" /> Ir a la sala en vivo
          </a>
        )}
      </div>
    )
  }

  if (state === 'grabacion_pendiente') {
    return (
      <div className="aspect-video w-full flex flex-col items-center justify-center gap-2 text-center px-6" style={{ background: 'var(--bg-2)' }}>
        <CalendarClock className="h-8 w-8" style={{ color: 'var(--text-3)' }} />
        <p className="font-display font-semibold" style={{ color: 'var(--text-1)' }}>La grabación se sube pronto</p>
        <p className="text-sm" style={{ color: 'var(--text-3)' }}>La clase ya se dio en vivo. Estamos preparando la grabación.</p>
      </div>
    )
  }

  return (
    <div className="aspect-video w-full flex items-center justify-center" style={{ background: 'var(--bg-2)' }}>
      <p className="text-sm" style={{ color: 'var(--text-3)' }}>Video no disponible</p>
    </div>
  )
}

export default function Player() {
  const { slug, lessonId } = useParams<{ slug: string; lessonId?: string }>()
  const { user } = useAuth()
  const navigate = useNavigate()
  const qc = useQueryClient()
  const shouldReduce = useReducedMotion()
  const [sidebarOpen, setSidebarOpen] = useState(true)
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

  const completedIds = useMemo(
    () => new Set(progress.filter(p => p.completada).map(p => p.lesson_id)),
    [progress],
  )
  const allLessons: Lesson[] = useMemo(
    () => course?.modules?.flatMap(m => m.lessons ?? []) ?? [],
    [course],
  )
  const isEbook = course?.tipo === 'ebook'

  const currentLesson = lessonId ? allLessons.find(l => l.id === lessonId) : allLessons[0]
  const currentIdx = currentLesson ? allLessons.indexOf(currentLesson) : 0
  const prevLesson = currentIdx > 0 ? allLessons[currentIdx - 1] : null
  const nextLesson = currentIdx < allLessons.length - 1 ? allLessons[currentIdx + 1] : null

  // Aterrizar en la primera lección si no hay lessonId (solo cursos con lecciones).
  useEffect(() => {
    if (!isEbook && !lessonId && allLessons.length > 0) {
      navigate(`/cursos/${slug}/aprender/${allLessons[0].id}`, { replace: true })
    }
  }, [slug, lessonId, allLessons, navigate, isEbook])

  const { mutate: markComplete, isPending: marking } = useMutation({
    mutationFn: () => markLessonComplete(user!.id, currentLesson!.id, course!.id),
    onSuccess: (isCourseComplete) => {
      void qc.invalidateQueries({ queryKey: ['progress', user?.id, course?.id] })
      void qc.invalidateQueries({ queryKey: ['enrollments', user?.id] })
      const newCompleted = completedIds.size + 1

      if (user?.id && course) {
        onLessonComplete(user.id, currentLesson!.id, course.id, course.titulo, allLessons.length, newCompleted)
          .then(({ puntosGanados, badgeGanado }) => {
            if (puntosGanados > 0) {
              toast(`+${puntosGanados} pts 🪙`, {
                icon: '🎯',
                style: { background: 'var(--bg-2)', color: 'var(--gold)', border: '1px solid var(--gold)', borderRadius: '12px' },
                duration: 2500,
              })
            }
            if (badgeGanado) {
              toast(`🏆 Badge desbloqueado: ${badgeGanado}`, {
                style: { background: 'var(--bg-2)', color: 'var(--text-1)', border: '1px solid var(--gold)', borderRadius: '12px' },
                duration: 4000,
              })
            }
            void qc.invalidateQueries({ queryKey: ['academy-profile', user?.id] })
            void qc.invalidateQueries({ queryKey: ['notifications', user?.id] })
          }).catch(() => { /* gamif no crítico */ })
      }

      if (isCourseComplete) {
        setShowCompletion(true)
      } else if (!shouldReduce) {
        confetti({ particleCount: 60, spread: 60, origin: { y: 0.8 }, scalar: 0.8, colors: ['#0E6B5C', '#4ECDB8', '#C99A3A'] })
      }
    },
  })

  const isCompleted = currentLesson ? completedIds.has(currentLesson.id) : false
  const canInteract = enrolled || !!currentLesson?.es_preview

  const handleMark = useCallback(() => {
    if (isCompleted || marking || !currentLesson || !user) return
    markComplete()
  }, [isCompleted, marking, currentLesson, user, markComplete])

  const totalCompleted = completedIds.size
  const totalLessons = allLessons.length
  const progressPct = totalLessons > 0 ? Math.round((totalCompleted / totalLessons) * 100) : 0

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

  // Ebooks: lector de PDF a pantalla completa (mismo visor canvas).
  if (isEbook) {
    return (
      <>
        {user?.email && (
          <div className="fixed inset-0 pointer-events-none z-10 flex items-center justify-center select-none" style={{ transform: 'rotate(-30deg)', opacity: 0.06, fontSize: 14, color: 'var(--text-1)', fontFamily: 'var(--font-mono)' }}>
            {user.email}
          </div>
        )}
        <EbookReader course={course} userId={user?.id} canRead={enrolled} />
        <style>{`@media print { body { display: none !important; } }`}</style>
      </>
    )
  }

  const pdfResources = getPdfResources(currentLesson?.recursos ?? null)

  return (
    <>
      {/* Watermark */}
      {user?.email && (
        <div className="fixed inset-0 pointer-events-none z-10 flex items-center justify-center select-none" style={{ transform: 'rotate(-30deg)', opacity: 0.06, fontSize: 14, color: 'var(--text-1)', fontFamily: 'var(--font-mono)' }}>
          {user.email}
        </div>
      )}

      <div className="h-screen flex flex-col overflow-hidden" style={{ background: 'var(--bg)' }}>
        {/* Top bar */}
        <header className="flex items-center gap-4 px-4 h-14 border-b shrink-0 z-20" style={{ background: 'rgba(6,13,20,.95)', borderColor: 'var(--line)', backdropFilter: 'blur(12px)' }}>
          <Link to={`/cursos/${slug}`} className="flex items-center gap-1.5 text-sm shrink-0" style={{ color: 'var(--text-3)' }}>
            <ChevronLeft className="h-4 w-4" />
            <span className="hidden sm:inline">Volver al curso</span>
          </Link>
          <div className="flex-1 min-w-0">
            <p className="font-display font-semibold text-sm truncate" style={{ color: 'var(--text-1)' }}>{course.titulo}</p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <div className="hidden sm:flex items-center gap-2">
              <div className="w-28 h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--card)' }}>
                <div className="h-full rounded-full" style={{ background: 'var(--primary)', width: `${progressPct}%` }} />
              </div>
              <span className="font-mono text-xs" style={{ color: 'var(--text-3)' }}>{progressPct}%</span>
            </div>
            <button
              onClick={() => setSidebarOpen(v => !v)}
              className="flex items-center gap-1.5 text-xs font-mono px-3 py-1.5 rounded-lg border"
              style={{ borderColor: 'var(--line)', color: 'var(--text-3)' }}
            >
              <Map className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Ruta</span>
            </button>
          </div>
        </header>

        {/* Flight path */}
        <FlightPath lessons={allLessons} currentIdx={currentIdx} completedIds={completedIds} slug={slug!} />

        {/* Main */}
        <div className="flex flex-1 overflow-hidden">
          <div className="flex-1 flex flex-col overflow-y-auto pb-24">
            {/* Media */}
            <div className="w-full" style={{ background: '#000' }}>
              <LessonMedia lesson={currentLesson} />
            </div>

            {/* Lesson body */}
            <div className="px-6 py-5 w-full max-w-3xl mx-auto space-y-5">
              <div>
                <p className="font-mono text-xs mb-2" style={{ color: 'var(--text-3)' }}>
                  Lección {currentIdx + 1} de {totalLessons}
                </p>
                <h1 className="font-display font-bold text-xl" style={{ color: 'var(--text-1)' }}>{currentLesson?.titulo}</h1>
              </div>

              {/* Recursos PDF en canvas */}
              {pdfResources.map((res, i) => (
                <div key={i} className="rounded-2xl border overflow-hidden" style={{ borderColor: 'var(--line)', background: 'var(--bg-2)' }}>
                  <div className="flex items-center gap-2 px-4 py-3 border-b" style={{ borderColor: 'var(--line)' }}>
                    <FileText className="h-4 w-4" style={{ color: 'var(--primary-l)' }} />
                    <span className="font-display font-semibold text-sm" style={{ color: 'var(--text-1)' }}>
                      {res.titulo || `Material de la clase ${pdfResources.length > 1 ? i + 1 : ''}`.trim()}
                    </span>
                  </div>
                  <div className="px-3 py-4" style={{ background: 'var(--bg-deep)' }}>
                    <PdfResource url={res.url} />
                  </div>
                </div>
              ))}

              {/* Comentarios / preguntas */}
              {currentLesson && (
                <LessonComments
                  lessonId={currentLesson.id}
                  courseId={course.id}
                  userId={user?.id}
                  canComment={canInteract}
                />
              )}
            </div>
          </div>

          {/* Sidebar */}
          <CourseSidebar
            open={sidebarOpen}
            onToggle={() => setSidebarOpen(v => !v)}
            modules={course.modules ?? []}
            currentLessonId={currentLesson?.id}
            completedIds={completedIds}
            slug={slug!}
            shouldReduce={shouldReduce}
          />
        </div>

        {/* Bottom bar */}
        <div className="fixed bottom-0 left-0 right-0 z-20 border-t pb-safe" style={{ background: 'rgba(6,13,20,.95)', backdropFilter: 'blur(20px)', borderColor: 'var(--line)' }}>
          <div className="flex items-center justify-between gap-4 px-4 py-3">
            {prevLesson ? (
              <Link to={`/cursos/${slug}/aprender/${prevLesson.id}`} className="flex items-center gap-1.5 text-sm font-medium px-4 py-2 rounded-xl border" style={{ borderColor: 'var(--line)', color: 'var(--text-2)' }}>
                <ChevronLeft className="h-4 w-4" /><span className="hidden sm:inline">Anterior</span>
              </Link>
            ) : <div />}

            <p className="text-xs font-mono text-center truncate max-w-[180px] sm:max-w-sm" style={{ color: 'var(--text-3)' }}>
              {currentLesson?.titulo}
            </p>

            <div className="flex items-center gap-2">
              {!isCompleted && (
                <motion.button
                  whileTap={{ scale: 0.96 }}
                  onClick={handleMark}
                  disabled={marking}
                  className="flex items-center gap-1.5 text-sm font-semibold px-4 py-2 rounded-xl"
                  style={{ background: 'var(--primary)', color: 'var(--text-1)' }}
                >
                  <CheckCircle2 className="h-4 w-4" />
                  <span className="hidden sm:inline">{marking ? 'Guardando...' : 'Marcar completa'}</span>
                </motion.button>
              )}
              {nextLesson ? (
                <Link to={`/cursos/${slug}/aprender/${nextLesson.id}`} className="flex items-center gap-1.5 text-sm font-medium px-4 py-2 rounded-xl border" style={{ borderColor: isCompleted ? 'var(--primary)' : 'var(--line)', color: isCompleted ? 'var(--primary-l)' : 'var(--text-2)' }}>
                  <span className="hidden sm:inline">Siguiente</span><ChevronRight className="h-4 w-4" />
                </Link>
              ) : isCompleted && (
                <span className="text-xs font-mono px-3 py-1 rounded-full" style={{ background: 'var(--success-s)', color: 'var(--success)' }}>
                  ¡Curso completado!
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Completion + reseña obligatoria */}
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
      </div>

      <style>{`@media print { body { display: none !important; } }`}</style>
    </>
  )
}

// Recurso PDF individual con paginado local.
function PdfResource({ url }: { url: string }) {
  const [page, setPage] = useState(1)
  const [numPages, setNumPages] = useState(0)
  return (
    <div className="space-y-3">
      <PdfCanvas fileUrl={url} page={page} maxWidth={720} onLoad={({ numPages: n }) => setNumPages(n)} />
      {numPages > 1 && (
        <div className="flex items-center justify-center gap-4">
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1} className="p-1.5 rounded-lg border disabled:opacity-40" style={{ borderColor: 'var(--line)', color: 'var(--text-2)' }}>
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="font-mono text-xs" style={{ color: 'var(--text-3)' }}>{page} / {numPages}</span>
          <button onClick={() => setPage(p => Math.min(numPages, p + 1))} disabled={page >= numPages} className="p-1.5 rounded-lg border disabled:opacity-40" style={{ borderColor: 'var(--line)', color: 'var(--text-2)' }}>
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  )
}
