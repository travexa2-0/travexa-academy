import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { BookOpen, ChevronRight, Sparkles, Flame, Plane, Radio, Trophy, Star } from 'lucide-react'
import NumberFlow from '@number-flow/react'
import Header from '@/components/layout/Header'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/contexts/AuthContext'
import { useCourses, useMyEnrollments } from '@/hooks/useCourses'
import CourseCard from '@/components/courses/CourseCard'
import SkeletonCard from '@/components/shared/SkeletonCard'
import { staggerContainer, staggerItem, EASE_OUT } from '@/lib/motion'
import { nivelFromPuntos } from '@/types'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { AcademyProfile } from '@/types'

function useAcademyProfile(userId: string | undefined) {
  return useQuery({
    queryKey: ['academy-profile', userId],
    queryFn: async () => {
      const { data } = await supabase
        .from('academy_profiles')
        .select('*')
        .eq('user_id', userId as string)
        .single()
      return data as AcademyProfile | null
    },
    enabled: !!userId,
    staleTime: 1000 * 60 * 2,
  })
}

function greeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Buenos días'
  if (h < 19) return 'Buenas tardes'
  return 'Buenas noches'
}

function StatCard({ icon, value, label, color }: { icon: React.ReactNode; value: number | string; label: string; color: string }) {
  return (
    <motion.div
      variants={staggerItem}
      className="rounded-2xl border p-4 flex items-start gap-3"
      style={{ background: 'var(--bg-2)', borderColor: 'var(--line)' }}
    >
      <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: `${color}1a`, color }}>
        {icon}
      </div>
      <div>
        <p className="font-display font-bold text-2xl leading-none" style={{ color: 'var(--text-1)' }}>
          {typeof value === 'number' ? <NumberFlow value={value} /> : value}
        </p>
        <p className="text-xs mt-1" style={{ color: 'var(--text-3)' }}>{label}</p>
      </div>
    </motion.div>
  )
}

export default function Dashboard() {
  const { user } = useAuth()
  const { data: academyProfile } = useAcademyProfile(user?.id)
  const { data: featured = [], isLoading: loadingFeatured } = useCourses()
  const { data: enrollments = [], isLoading: loadingEnrollments } = useMyEnrollments(user?.id)

  const nombre  = (user?.user_metadata as { nombre?: string } | undefined)?.nombre ?? 'Viajero'
  const puntos  = academyProfile?.puntos ?? 0
  const streak  = academyProfile?.streak_actual ?? 0
  const nivel   = nivelFromPuntos(puntos)

  const inProgress = enrollments.filter(e => !e.completado && e.activo !== false)
  const upcoming   = enrollments.filter(e => e.course?.tipo === 'en_vivo' || e.course?.tipo === 'vivencial')

  return (
    <div className="min-h-screen">
      <Header />

      {/* Hero — saludo contextual */}
      <section className="border-b px-4 py-10" style={{ background: 'linear-gradient(160deg, var(--bg-2) 0%, var(--bg) 100%)', borderColor: 'var(--line)' }}>
        <div className="max-w-7xl mx-auto">
          <p className="font-mono text-xs tracking-widest uppercase mb-2" style={{ color: 'var(--primary-l)' }}>
            {greeting()}
          </p>
          <h1 className="font-display font-bold text-2xl md:text-3xl mb-1" style={{ color: 'var(--text-1)' }}>
            {greeting()}, {nombre} {streak > 1 ? '🔥' : '👋'}
          </h1>
          <p className="text-sm mb-6" style={{ color: 'var(--text-3)' }}>
            Tu formación en turismo profesional continúa acá.
          </p>

          {/* Nivel badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-mono font-semibold" style={{ background: 'var(--gold-soft)', color: 'var(--gold)' }}>
            <Star className="h-3.5 w-3.5" />
            {nivel}
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 py-8 space-y-12">

        {/* Stats */}
        {academyProfile && (
          <section>
            <motion.div
              variants={staggerContainer}
              initial="initial"
              animate="animate"
              className="grid grid-cols-2 sm:grid-cols-4 gap-4"
            >
              <StatCard
                icon={<Trophy className="h-5 w-5" />}
                value={puntos}
                label="Puntos totales"
                color="var(--gold)"
              />
              <StatCard
                icon={<Flame className="h-5 w-5" />}
                value={streak}
                label={streak === 1 ? 'día seguido' : 'días seguidos'}
                color="var(--pending)"
              />
              <StatCard
                icon={<BookOpen className="h-5 w-5" />}
                value={academyProfile.total_cursos_completados}
                label="Cursos completados"
                color="var(--primary)"
              />
              <StatCard
                icon={<Plane className="h-5 w-5" />}
                value={academyProfile.total_vivenciales}
                label="Viajes realizados"
                color="var(--primary-l)"
              />
            </motion.div>
          </section>
        )}

        {/* Continuar aprendiendo */}
        <section>
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-display font-bold text-xl" style={{ color: 'var(--text-1)' }}>
              Continuar aprendiendo
            </h2>
            <Link to="/mis-cursos" className="flex items-center gap-1 text-sm font-medium" style={{ color: 'var(--gold)' }}>
              Ver todos <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          {loadingEnrollments ? (
            <div className="space-y-3">
              {[1,2].map(i => <SkeletonCard key={i} />)}
            </div>
          ) : inProgress.length === 0 ? (
            <div className="rounded-2xl border p-10 text-center" style={{ borderColor: 'var(--line)', background: 'var(--bg-2)' }}>
              <BookOpen className="h-10 w-10 mx-auto mb-3" style={{ color: 'var(--text-3)' }} />
              <h3 className="font-display font-semibold mb-1" style={{ color: 'var(--text-2)' }}>Todavía no empezaste ningún curso</h3>
              <p className="text-sm mb-5" style={{ color: 'var(--text-3)' }}>Explorá el catálogo y empezá a aprender hoy.</p>
              <Link to="/cursos">
                <Button style={{ background: 'var(--primary)', color: 'var(--text-1)' }} className="font-semibold">
                  Explorar cursos
                </Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {inProgress.slice(0, 3).map(e => {
                const course = e.course
                if (!course) return null
                return (
                  <motion.div
                    key={e.id}
                    initial={false}
                    whileHover={{ x: 4 }}
                    transition={{ duration: 0.15 }}
                  >
                    <Link to={`/cursos/${course.slug}/aprender`} className="flex gap-4 p-4 rounded-2xl border transition-all" style={{ background: 'var(--bg-2)', borderColor: 'var(--line)' }}>
                      <div className="w-20 h-14 rounded-xl overflow-hidden shrink-0">
                        {course.thumbnail_url
                          ? <img src={course.thumbnail_url} alt={course.titulo} className="w-full h-full object-cover" />
                          : <div className="w-full h-full" style={{ background: 'var(--card-solid)' }} />
                        }
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm leading-snug line-clamp-1 mb-1" style={{ color: 'var(--text-1)' }}>{course.titulo}</p>
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--card)' }}>
                            <motion.div
                              className="h-full rounded-full"
                              style={{ background: 'var(--primary)', width: `${e.progreso_pct}%` }}
                              initial={{ width: 0 }}
                              animate={{ width: `${e.progreso_pct}%` }}
                              transition={{ duration: 0.6, ease: EASE_OUT }}
                            />
                          </div>
                          <span className="text-xs font-mono shrink-0" style={{ color: 'var(--text-3)' }}>{e.progreso_pct}%</span>
                        </div>
                      </div>
                      <ChevronRight className="h-4 w-4 shrink-0 self-center" style={{ color: 'var(--text-3)' }} />
                    </Link>
                  </motion.div>
                )
              })}
            </div>
          )}
        </section>

        {/* Próximos eventos */}
        {upcoming.length > 0 && (
          <section>
            <h2 className="font-display font-bold text-xl mb-5" style={{ color: 'var(--text-1)' }}>Próximos eventos</h2>
            <div className="flex gap-4 overflow-x-auto pb-2">
              {upcoming.map(e => {
                const c = e.course
                if (!c) return null
                const isLive      = c.tipo === 'en_vivo'
                const isVivencial = c.tipo === 'vivencial'
                return (
                  <Link key={e.id} to={`/cursos/${c.slug}`} className="shrink-0 w-56">
                    <div
                      className="rounded-2xl border overflow-hidden h-full"
                      style={{
                        borderColor: isLive ? 'rgba(239,68,68,.4)' : 'rgba(201,154,58,.3)',
                        background: 'var(--bg-2)',
                      }}
                    >
                      <div className="relative h-28">
                        {c.thumbnail_url
                          ? <img src={c.thumbnail_url} alt={c.titulo} className="w-full h-full object-cover" />
                          : <div className="w-full h-full" style={{ background: 'var(--card-solid)' }} />
                        }
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                        <div className="absolute top-2 left-2">
                          {isLive
                            ? <span className="flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded-full text-white" style={{ background: 'rgba(239,68,68,.9)' }}>
                                <Radio className="h-2.5 w-2.5 live-pulse" /> EN VIVO
                              </span>
                            : <span className="text-[10px] font-mono px-2 py-0.5 rounded-full" style={{ background: 'var(--gold)', color: 'var(--bg-deep)' }}>
                                ✈ Vivencial
                              </span>
                          }
                        </div>
                      </div>
                      <div className="p-3">
                        <p className="font-semibold text-xs leading-snug line-clamp-2" style={{ color: 'var(--text-1)' }}>{c.titulo}</p>
                        {isVivencial && c.vivencial_fecha_salida && (
                          <p className="font-mono text-[10px] mt-1" style={{ color: 'var(--gold)' }}>
                            {new Date(c.vivencial_fecha_salida).toLocaleDateString('es-AR', { month: 'short', day: 'numeric' })}
                          </p>
                        )}
                        {isLive && c.live_date && (
                          <p className="font-mono text-[10px] mt-1" style={{ color: '#ef4444' }}>
                            {new Date(c.live_date).toLocaleDateString('es-AR', { weekday: 'short', month: 'short', day: 'numeric' })}
                          </p>
                        )}
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>
          </section>
        )}

        {/* Cursos destacados */}
        <section>
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4" style={{ color: 'var(--gold)' }} />
              <h2 className="font-display font-bold text-xl" style={{ color: 'var(--text-1)' }}>Cursos destacados</h2>
            </div>
            <Link to="/cursos" className="flex items-center gap-1 text-sm font-medium" style={{ color: 'var(--gold)' }}>
              Ver catálogo <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          {loadingFeatured ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {[1,2,3].map(i => <SkeletonCard key={i} />)}
            </div>
          ) : (
            <motion.div
              variants={staggerContainer}
              initial="initial"
              animate="animate"
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5"
            >
              {featured.filter(c => c.destacado).slice(0, 3).map(c => (
                <motion.div key={c.id} variants={staggerItem}>
                  <CourseCard course={c} />
                </motion.div>
              ))}
            </motion.div>
          )}
        </section>
      </div>
    </div>
  )
}
