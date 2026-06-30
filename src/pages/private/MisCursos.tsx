import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { BookOpen, CheckCircle2, Plane, Radio, Play, Share2, Award, CreditCard, MapPin } from 'lucide-react'
import Header from '@/components/layout/Header'
import SkeletonCard from '@/components/shared/SkeletonCard'
import { useAuth } from '@/contexts/AuthContext'
import { useMyEnrollments } from '@/hooks/useCourses'
import type { Enrollment } from '@/types'
import { staggerContainer, staggerItem, EASE_OUT } from '@/lib/motion'

type Tab = 'progreso' | 'completados' | 'vivenciales' | 'en_vivo'

const TABS: { value: Tab; label: string; icon: React.ReactNode }[] = [
  { value: 'progreso',    label: 'En progreso', icon: <Play className="h-3.5 w-3.5" /> },
  { value: 'completados', label: 'Completados', icon: <CheckCircle2 className="h-3.5 w-3.5" /> },
  { value: 'vivenciales', label: 'Vivenciales', icon: <Plane className="h-3.5 w-3.5" /> },
  { value: 'en_vivo',     label: 'En Vivo',     icon: <Radio className="h-3.5 w-3.5" /> },
]

function ProgressBar({ pct }: { pct: number }) {
  return (
    <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--card)' }}>
      <motion.div
        className="h-full rounded-full"
        style={{ background: 'var(--primary)' }}
        initial={{ width: 0 }}
        animate={{ width: `${pct}%` }}
        transition={{ duration: 0.6, ease: EASE_OUT, delay: 0.1 }}
      />
    </div>
  )
}

function CourseProgressCard({ enrollment }: { enrollment: Enrollment }) {
  const course = enrollment.course
  if (!course) return null

  return (
    <motion.div variants={staggerItem}>
      <Link to={`/cursos/${course.slug}/aprender`} className="group block">
        <div
          className="flex gap-4 p-4 rounded-2xl border transition-all"
          style={{ background: 'var(--bg-2)', borderColor: 'var(--line)' }}
        >
          {/* Thumbnail */}
          <div className="w-24 h-16 rounded-xl overflow-hidden shrink-0">
            {course.thumbnail_url ? (
              <img src={course.thumbnail_url} alt={course.titulo} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
            ) : (
              <div className="w-full h-full flex items-center justify-center" style={{ background: 'var(--card-solid)' }}>
                <BookOpen className="h-5 w-5" style={{ color: 'var(--primary-l)' }} />
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <h3 className="font-display font-semibold text-sm leading-snug line-clamp-1 mb-1" style={{ color: 'var(--text-1)' }}>
              {course.titulo}
            </h3>
            <p className="text-xs mb-3" style={{ color: 'var(--text-3)' }}>
              {course.instructor?.nombre}
            </p>
            <div className="flex items-center gap-3">
              <ProgressBar pct={enrollment.progreso_pct} />
              <span className="text-xs font-mono shrink-0" style={{ color: 'var(--text-3)' }}>
                {enrollment.progreso_pct}%
              </span>
            </div>
          </div>

          <div className="flex flex-col items-end justify-between shrink-0">
            <span
              className="text-xs font-mono px-2 py-0.5 rounded-full"
              style={{ background: 'var(--primary-s)', color: 'var(--primary-l)' }}
            >
              Continuar →
            </span>
          </div>
        </div>
      </Link>
    </motion.div>
  )
}

function CompletedCard({ enrollment }: { enrollment: Enrollment }) {
  const course = enrollment.course
  if (!course) return null

  return (
    <motion.div variants={staggerItem}>
      <div
        className="flex gap-4 p-4 rounded-2xl border"
        style={{ background: 'var(--bg-2)', borderColor: 'var(--line)' }}
      >
        <div className="w-24 h-16 rounded-xl overflow-hidden shrink-0">
          {course.thumbnail_url ? (
            <img src={course.thumbnail_url} alt={course.titulo} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center" style={{ background: 'var(--success-s)' }}>
              <CheckCircle2 className="h-6 w-6" style={{ color: 'var(--success)' }} />
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <CheckCircle2 className="h-3.5 w-3.5 shrink-0" style={{ color: 'var(--success)' }} />
            <h3 className="font-display font-semibold text-sm leading-snug line-clamp-1" style={{ color: 'var(--text-1)' }}>
              {course.titulo}
            </h3>
          </div>
          {enrollment.fecha_completado && (
            <p className="text-xs mb-3" style={{ color: 'var(--text-3)' }}>
              Completado el {new Date(enrollment.fecha_completado).toLocaleDateString('es-AR')}
            </p>
          )}
          <div className="flex items-center gap-2">
            <button
              className="flex items-center gap-1.5 text-xs font-medium px-3 py-1 rounded-lg"
              style={{ background: 'var(--gold-soft)', color: 'var(--gold)' }}
            >
              <Award className="h-3 w-3" />
              Ver certificado
            </button>
            <button
              className="flex items-center gap-1.5 text-xs font-medium px-3 py-1 rounded-lg"
              style={{ background: 'var(--card)', color: 'var(--text-3)' }}
            >
              <Share2 className="h-3 w-3" />
              Compartir
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

function VivencialCard({ enrollment }: { enrollment: Enrollment }) {
  const course = enrollment.course
  if (!course) return null

  const totalPago  = enrollment.monto_total_ars ?? course.precio_ars ?? 0
  const señado     = enrollment.monto_señado_ars ?? 0
  const pendiente  = enrollment.monto_pendiente_ars ?? (totalPago - señado)
  const pct        = totalPago > 0 ? Math.round((señado / totalPago) * 100) : 0

  return (
    <motion.div variants={staggerItem}>
      <div
        className="rounded-2xl border overflow-hidden"
        style={{ borderColor: 'rgba(201,154,58,.3)', background: 'var(--bg-2)' }}
      >
        {/* Header photo */}
        <div className="relative h-32">
          {course.thumbnail_url ? (
            <img src={course.thumbnail_url} alt={course.titulo} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #0d1a00, #1a3d0a)' }}>
              <Plane className="h-10 w-10 opacity-30" style={{ color: 'var(--gold)' }} />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
          <div className="absolute bottom-3 left-4 right-4">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full" style={{ background: 'var(--gold)', color: 'var(--bg-deep)' }}>
                ✈ Vivencial
              </span>
            </div>
            <h3 className="font-display font-bold text-sm" style={{ color: 'var(--text-1)' }}>{course.titulo}</h3>
          </div>
        </div>

        {/* Info */}
        <div className="p-4 space-y-3">
          {/* Fechas */}
          {course.vivencial_fecha_salida && (
            <div className="flex items-center gap-2 text-xs" style={{ color: 'var(--text-2)' }}>
              <MapPin className="h-3.5 w-3.5 shrink-0" style={{ color: 'var(--gold)' }} />
              Salida: {new Date(course.vivencial_fecha_salida).toLocaleDateString('es-AR', { weekday: 'short', day: 'numeric', month: 'long' })}
              {course.vivencial_ciudad_salida && ` · ${course.vivencial_ciudad_salida}`}
            </div>
          )}

          {/* Payment breakdown */}
          <div className="rounded-xl p-3 space-y-2" style={{ background: 'var(--card)' }}>
            <div className="flex justify-between text-xs">
              <span style={{ color: 'var(--text-3)' }}>Total</span>
              <span className="font-mono" style={{ color: 'var(--text-2)' }}>
                {new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(totalPago)}
              </span>
            </div>
            <div className="flex justify-between text-xs">
              <span style={{ color: 'var(--success)' }}>Señado ✓</span>
              <span className="font-mono" style={{ color: 'var(--success)' }}>
                {new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(señado)}
              </span>
            </div>
            {pendiente > 0 && (
              <div className="flex justify-between text-xs">
                <span style={{ color: 'var(--pending)' }}>Pendiente</span>
                <span className="font-mono font-semibold" style={{ color: 'var(--pending)' }}>
                  {new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(pendiente)}
                </span>
              </div>
            )}
            <ProgressBar pct={pct} />
          </div>

          {/* CTA */}
          {pendiente > 0 && (
            <button
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold"
              style={{ background: 'var(--primary)', color: 'var(--text-1)' }}
            >
              <CreditCard className="h-4 w-4" />
              Completar pago
            </button>
          )}

          <Link
            to={`/viaje/${course.slug}`}
            className="block w-full text-center py-2 rounded-xl text-sm font-medium border transition-colors"
            style={{ borderColor: 'var(--line)', color: 'var(--text-2)' }}
          >
            Ver detalles del viaje →
          </Link>
        </div>
      </div>
    </motion.div>
  )
}

function EmptyState({ tab }: { tab: Tab }) {
  const msgs: Record<Tab, { icon: React.ReactNode; title: string; desc: string }> = {
    progreso:    { icon: <BookOpen className="h-10 w-10" />, title: 'No hay cursos en progreso', desc: 'Explorá el catálogo y empezá a aprender.' },
    completados: { icon: <CheckCircle2 className="h-10 w-10" />, title: 'Todavía no completaste ningún curso', desc: 'Seguí aprendiendo, ¡ya estás cerca!' },
    vivenciales: { icon: <Plane className="h-10 w-10" />, title: 'No estás inscripto en ningún viaje', desc: 'Descubrí nuestros fam trips exclusivos.' },
    en_vivo:     { icon: <Radio className="h-10 w-10" />, title: 'No tenés lives agendados', desc: 'Mirá los próximos cursos en vivo.' },
  }
  const m = msgs[tab]

  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="mb-4" style={{ color: 'var(--text-3)' }}>{m.icon}</div>
      <h3 className="font-display font-semibold text-lg mb-1" style={{ color: 'var(--text-2)' }}>{m.title}</h3>
      <p className="text-sm mb-6" style={{ color: 'var(--text-3)' }}>{m.desc}</p>
      <Link
        to="/cursos"
        className="text-sm font-medium px-4 py-2 rounded-xl"
        style={{ background: 'var(--primary)', color: 'var(--text-1)' }}
      >
        Ver catálogo
      </Link>
    </div>
  )
}

export default function MisCursos() {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState<Tab>('progreso')
  const { data: enrollments = [], isLoading } = useMyEnrollments(user?.id)

  const inProgreso   = enrollments.filter(e => !e.completado && e.course?.tipo === 'grabado')
  const completados  = enrollments.filter(e => e.completado)
  const vivenciales  = enrollments.filter(e => e.course?.tipo === 'vivencial')
  const enVivo       = enrollments.filter(e => e.course?.tipo === 'en_vivo')

  const counts: Record<Tab, number> = {
    progreso:    inProgreso.length,
    completados: completados.length,
    vivenciales: vivenciales.length,
    en_vivo:     enVivo.length,
  }

  const currentList: Record<Tab, Enrollment[]> = {
    progreso:    inProgreso,
    completados: completados,
    vivenciales: vivenciales,
    en_vivo:     enVivo,
  }

  return (
    <div className="min-h-screen">
      <Header />

      {/* Page header */}
      <section className="border-b px-4 py-10" style={{ background: 'linear-gradient(to bottom, var(--bg-2), var(--bg))', borderColor: 'var(--line)' }}>
        <div className="max-w-4xl mx-auto">
          <p className="font-mono text-xs tracking-widest uppercase mb-2" style={{ color: 'var(--primary-l)' }}>Mi aprendizaje</p>
          <h1 className="font-display font-bold text-3xl" style={{ color: 'var(--text-1)' }}>Mis cursos</h1>
        </div>
      </section>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Tabs */}
        <div className="flex gap-1 p-1 rounded-xl mb-8" style={{ background: 'var(--bg-2)' }}>
          {TABS.map(tab => {
            const active = activeTab === tab.value
            const count  = counts[tab.value]
            return (
              <button
                key={tab.value}
                onClick={() => setActiveTab(tab.value)}
                className="relative flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-medium transition-all"
                style={{
                  background: active ? 'var(--bg)' : 'transparent',
                  color:      active ? 'var(--text-1)' : 'var(--text-3)',
                  boxShadow:  active ? '0 1px 3px rgba(0,0,0,.3)' : 'none',
                }}
              >
                {tab.icon}
                <span className="hidden sm:inline">{tab.label}</span>
                {count > 0 && (
                  <span
                    className="font-mono text-[10px] px-1.5 py-0.5 rounded-full"
                    style={{ background: active ? 'var(--primary-s)' : 'var(--card)', color: active ? 'var(--primary-l)' : 'var(--text-3)' }}
                  >
                    {count}
                  </span>
                )}
              </button>
            )
          })}
        </div>

        {/* Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
          >
            {isLoading ? (
              <div className="space-y-4">
                {[1,2,3].map(i => <SkeletonCard key={i} />)}
              </div>
            ) : currentList[activeTab].length === 0 ? (
              <EmptyState tab={activeTab} />
            ) : (
              <motion.div
                variants={staggerContainer}
                initial="initial"
                animate="animate"
                className={activeTab === 'vivenciales' ? 'grid grid-cols-1 sm:grid-cols-2 gap-5' : 'space-y-4'}
              >
                {activeTab === 'progreso' && currentList.progreso.map(e => <CourseProgressCard key={e.id} enrollment={e} />)}
                {activeTab === 'completados' && currentList.completados.map(e => <CompletedCard key={e.id} enrollment={e} />)}
                {activeTab === 'vivenciales' && currentList.vivenciales.map(e => <VivencialCard key={e.id} enrollment={e} />)}
                {activeTab === 'en_vivo' && currentList.en_vivo.map(e => <CourseProgressCard key={e.id} enrollment={e} />)}
              </motion.div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  )
}
