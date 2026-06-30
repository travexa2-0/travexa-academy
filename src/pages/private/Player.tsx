import { useState, useEffect, useCallback } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import { CheckCircle2, ChevronLeft, ChevronRight, Lock, Play, X, Award } from 'lucide-react'
import confetti from 'canvas-confetti'
import toast from 'react-hot-toast'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import type { Course, Module, Lesson, LessonProgress } from '@/types'
import { EASE_OUT, scaleIn } from '@/lib/motion'
import { onLessonComplete } from '@/hooks/useGamification'

function getYouTubeId(url: string): string | null {
  const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|v\/))([^&?/]+)/)
  return match?.[1] ?? null
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

async function markLessonComplete(userId: string, lessonId: string, courseId: string) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (supabase as any).from('academy_lesson_progress').upsert(
    { user_id: userId, lesson_id: lessonId, course_id: courseId, completada: true, segundos_vistos: 0 },
    { onConflict: 'user_id,lesson_id' }
  )
}

function CelebrationModal({ onClose, courseTitle }: { onClose: () => void; courseTitle: string }) {
  useEffect(() => {
    confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 }, colors: ['#0E6B5C','#C99A3A','#4ECDB8','#F5F3EC'] })
  }, [])
  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(6,13,20,.85)', backdropFilter: 'blur(12px)' }}
      {...scaleIn}
    >
      <div className="rounded-2xl border p-8 max-w-sm w-full text-center space-y-5" style={{ background: 'var(--bg-2)', borderColor: 'var(--gold)', boxShadow: '0 0 40px rgba(201,154,58,.2)' }}>
        <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto" style={{ background: 'var(--gold-soft)' }}>
          <Award className="h-10 w-10" style={{ color: 'var(--gold)' }} />
        </div>
        <div>
          <h2 className="font-display font-bold text-2xl mb-2" style={{ color: 'var(--gold)' }}>¡Felicitaciones!</h2>
          <p className="text-sm" style={{ color: 'var(--text-2)' }}>
            Completaste <strong style={{ color: 'var(--text-1)' }}>{courseTitle}</strong>. ¡Sos increíble!
          </p>
        </div>
        <div className="flex flex-col gap-2">
          <button className="w-full py-3 rounded-xl font-semibold" style={{ background: 'var(--primary)', color: 'var(--text-1)' }}>
            Ver mi certificado
          </button>
          <button
            onClick={onClose}
            className="w-full py-2.5 rounded-xl text-sm border"
            style={{ borderColor: 'var(--line)', color: 'var(--text-2)' }}
          >
            Seguir explorando
          </button>
        </div>
        <button onClick={onClose} className="absolute top-4 right-4" style={{ color: 'var(--text-3)' }}>
          <X className="h-5 w-5" />
        </button>
      </div>
    </motion.div>
  )
}

export default function Player() {
  const { slug, lessonId } = useParams<{ slug: string; lessonId?: string }>()
  const { user } = useAuth()
  const navigate = useNavigate()
  const qc = useQueryClient()
  const shouldReduce = useReducedMotion()
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [showCelebration, setShowCelebration] = useState(false)

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

  const completedIds = new Set(progress.filter(p => p.completada).map(p => p.lesson_id))

  // Flat list of all lessons
  const allLessons: Lesson[] = course?.modules?.flatMap(m => m.lessons ?? []) ?? []

  // Current lesson
  const currentLesson = lessonId
    ? allLessons.find(l => l.id === lessonId)
    : allLessons[0]

  const currentIdx = currentLesson ? allLessons.indexOf(currentLesson) : 0
  const prevLesson = currentIdx > 0 ? allLessons[currentIdx - 1] : null
  const nextLesson = currentIdx < allLessons.length - 1 ? allLessons[currentIdx + 1] : null

  // Navigate to first lesson if no lessonId
  useEffect(() => {
    if (!lessonId && allLessons.length > 0) {
      navigate(`/cursos/${slug}/aprender/${allLessons[0].id}`, { replace: true })
    }
  }, [slug, lessonId, allLessons, navigate])

  const { mutate: markComplete, isPending: marking } = useMutation({
    mutationFn: () => markLessonComplete(user!.id, currentLesson!.id, course!.id),
    onSuccess: async () => {
      void qc.invalidateQueries({ queryKey: ['progress', user?.id, course?.id] })
      const newCompleted = completedIds.size + 1
      const isCourseComplete = newCompleted >= allLessons.length

      // Gamificación asíncrona (no bloquea UI)
      if (user?.id && course) {
        onLessonComplete(
          user.id,
          currentLesson!.id,
          course.id,
          course.titulo,
          allLessons.length,
          newCompleted,
        ).then(({ puntosGanados, badgeGanado }) => {
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
          // Refrescar perfil y notificaciones
          void qc.invalidateQueries({ queryKey: ['academy-profile', user?.id] })
          void qc.invalidateQueries({ queryKey: ['notifications', user?.id] })
        }).catch(() => { /* gamif no crítico */ })
      }

      if (isCourseComplete) {
        setShowCelebration(true)
      } else if (!shouldReduce) {
        confetti({ particleCount: 60, spread: 60, origin: { y: 0.8 }, scalar: 0.8, colors: ['#0E6B5C','#4ECDB8','#C99A3A'] })
      }
    },
  })

  const isCompleted = currentLesson ? completedIds.has(currentLesson.id) : false

  const handleMark = useCallback(() => {
    if (isCompleted || marking || !currentLesson || !user) return
    markComplete()
  }, [isCompleted, marking, currentLesson, user, markComplete])

  const youtubeId = currentLesson?.video_url ? getYouTubeId(currentLesson.video_url) : null
  const totalCompleted = completedIds.size
  const totalLessons   = allLessons.length
  const progressPct    = totalLessons > 0 ? Math.round((totalCompleted / totalLessons) * 100) : 0

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

  return (
    <>
      {/* Watermark */}
      {user?.email && (
        <div
          className="fixed inset-0 pointer-events-none z-10 flex items-center justify-center select-none"
          style={{ transform: 'rotate(-30deg)', opacity: 0.06, fontSize: 14, color: 'var(--text-1)', fontFamily: 'var(--font-mono)' }}
        >
          {user.email}
        </div>
      )}

      <div className="h-screen flex flex-col overflow-hidden" style={{ background: 'var(--bg)' }}>
        {/* Top bar */}
        <header className="flex items-center gap-4 px-4 h-14 border-b shrink-0 z-20" style={{ background: 'rgba(6,13,20,.95)', borderColor: 'var(--line)', backdropFilter: 'blur(12px)' }}>
          <Link to={`/cursos/${slug}`} className="flex items-center gap-1.5 text-sm" style={{ color: 'var(--text-3)' }}>
            <ChevronLeft className="h-4 w-4" />
            <span className="hidden sm:inline">Volver al curso</span>
          </Link>
          <div className="flex-1 min-w-0">
            <p className="font-display font-semibold text-sm truncate" style={{ color: 'var(--text-1)' }}>{course.titulo}</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2">
              <div className="w-28 h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--card)' }}>
                <div className="h-full rounded-full" style={{ background: 'var(--primary)', width: `${progressPct}%` }} />
              </div>
              <span className="font-mono text-xs" style={{ color: 'var(--text-3)' }}>{progressPct}%</span>
            </div>
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="text-xs font-mono px-3 py-1 rounded-lg border"
              style={{ borderColor: 'var(--line)', color: 'var(--text-3)' }}
            >
              {sidebarOpen ? 'Ocultar' : 'Temario'}
            </button>
          </div>
        </header>

        {/* Main */}
        <div className="flex flex-1 overflow-hidden">
          {/* Video + content */}
          <div className="flex-1 flex flex-col overflow-y-auto">
            {/* Video */}
            <div className="w-full" style={{ background: '#000' }}>
              {youtubeId ? (
                <div
                  className="aspect-video w-full max-h-[calc(100vh-14rem)]"
                  onContextMenu={e => e.preventDefault()}
                >
                  <iframe
                    src={`https://www.youtube-nocookie.com/embed/${youtubeId}?rel=0&modestbranding=1`}
                    className="w-full h-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    title={currentLesson?.titulo}
                  />
                </div>
              ) : (
                <div className="aspect-video w-full flex items-center justify-center" style={{ background: 'var(--bg-2)' }}>
                  <p className="text-sm" style={{ color: 'var(--text-3)' }}>Video no disponible</p>
                </div>
              )}
            </div>

            {/* Lesson info */}
            <div className="px-6 py-5 max-w-3xl">
              <p className="font-mono text-xs mb-2" style={{ color: 'var(--text-3)' }}>
                Lección {currentIdx + 1} de {totalLessons}
              </p>
              <h1 className="font-display font-bold text-xl mb-4" style={{ color: 'var(--text-1)' }}>
                {currentLesson?.titulo}
              </h1>
            </div>
          </div>

          {/* Sidebar curriculum */}
          <AnimatePresence>
            {sidebarOpen && (
              <motion.aside
                initial={{ width: 0, opacity: 0 }}
                animate={{ width: 280, opacity: 1 }}
                exit={{ width: 0, opacity: 0 }}
                transition={{ duration: 0.22, ease: EASE_OUT }}
                className="hidden md:flex flex-col border-l shrink-0 overflow-hidden"
                style={{ borderColor: 'var(--line)', background: 'var(--bg-2)' }}
              >
                <div className="p-4 border-b" style={{ borderColor: 'var(--line)' }}>
                  <p className="font-mono text-xs font-semibold" style={{ color: 'var(--text-3)' }}>TEMARIO</p>
                </div>
                <div className="flex-1 overflow-y-auto">
                  {course.modules?.map(mod => (
                    <div key={mod.id} className="border-b" style={{ borderColor: 'var(--line)' }}>
                      <p className="px-4 py-3 text-xs font-semibold" style={{ color: 'var(--text-3)' }}>
                        {String(mod.orden).padStart(2,'0')} · {mod.titulo}
                      </p>
                      {mod.lessons?.map(lesson => {
                        const done   = completedIds.has(lesson.id)
                        const active = lesson.id === currentLesson?.id
                        return (
                          <motion.div key={lesson.id} layoutId={`sidebar-${lesson.id}`}>
                            <Link
                              to={`/cursos/${slug}/aprender/${lesson.id}`}
                              className="flex items-center gap-2.5 px-4 py-2.5 text-xs transition-colors relative"
                              style={{
                                background: active ? 'var(--primary-s)' : 'transparent',
                                color:      active ? 'var(--primary-l)' : done ? 'var(--text-3)' : 'var(--text-2)',
                              }}
                            >
                              {active && (
                                <motion.div
                                  layoutId="sidebar-indicator"
                                  className="absolute left-0 top-0 bottom-0 w-0.5 rounded-r"
                                  style={{ background: 'var(--primary)' }}
                                />
                              )}
                              {done
                                ? <CheckCircle2 className="h-3.5 w-3.5 shrink-0" style={{ color: 'var(--primary)' }} />
                                : active
                                  ? <Play className="h-3.5 w-3.5 shrink-0" style={{ color: 'var(--primary-l)' }} />
                                  : <Lock className="h-3.5 w-3.5 shrink-0 opacity-40" />
                              }
                              <span className="line-clamp-2 leading-snug">{lesson.titulo}</span>
                            </Link>
                          </motion.div>
                        )
                      })}
                    </div>
                  ))}
                </div>
              </motion.aside>
            )}
          </AnimatePresence>
        </div>

        {/* Bottom bar — FIXED */}
        <div
          className="fixed bottom-0 left-0 right-0 z-20 border-t pb-safe"
          style={{ background: 'rgba(6,13,20,.95)', backdropFilter: 'blur(20px)', borderColor: 'var(--line)' }}
        >
          <div className="flex items-center justify-between gap-4 px-4 py-3">
            {/* Anterior */}
            {prevLesson ? (
              <Link
                to={`/cursos/${slug}/aprender/${prevLesson.id}`}
                className="flex items-center gap-1.5 text-sm font-medium px-4 py-2 rounded-xl border"
                style={{ borderColor: 'var(--line)', color: 'var(--text-2)' }}
              >
                <ChevronLeft className="h-4 w-4" />
                <span className="hidden sm:inline">Anterior</span>
              </Link>
            ) : <div />}

            {/* Lección actual */}
            <p className="text-xs font-mono text-center truncate max-w-[180px] sm:max-w-sm" style={{ color: 'var(--text-3)' }}>
              {currentLesson?.titulo}
            </p>

            {/* Completar / Siguiente */}
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
                <Link
                  to={`/cursos/${slug}/aprender/${nextLesson.id}`}
                  className="flex items-center gap-1.5 text-sm font-medium px-4 py-2 rounded-xl border"
                  style={{ borderColor: isCompleted ? 'var(--primary)' : 'var(--line)', color: isCompleted ? 'var(--primary-l)' : 'var(--text-2)' }}
                >
                  <span className="hidden sm:inline">Siguiente</span>
                  <ChevronRight className="h-4 w-4" />
                </Link>
              ) : isCompleted && (
                <span className="text-xs font-mono px-3 py-1 rounded-full" style={{ background: 'var(--success-s)', color: 'var(--success)' }}>
                  ¡Curso completado!
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Celebration modal */}
        <AnimatePresence>
          {showCelebration && (
            <CelebrationModal
              onClose={() => setShowCelebration(false)}
              courseTitle={course.titulo}
            />
          )}
        </AnimatePresence>
      </div>

      {/* Print protection */}
      <style>{`@media print { body { display: none !important; } }`}</style>
    </>
  )
}
