import { useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  CheckCircle2, Copy, Check, CalendarDays, MapPin, Users, Plane,
  Building2, Landmark, Hash, ArrowRight, Info,
} from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import Header from '@/components/layout/Header'
import { useDatosTransferencia } from '@/hooks/useVivencialPago'
import { EASE_OUT, staggerContainer, staggerItem } from '@/lib/motion'
import type { Course, Enrollment } from '@/types'

function fmtARS(n: number | null | undefined): string {
  if (!n) return '—'
  return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(n)
}

function fmtDate(d: string | null): string {
  if (!d) return '—'
  const [y, m, day] = d.split('-').map(Number)
  return new Date(y, m - 1, day).toLocaleDateString('es-AR', { day: 'numeric', month: 'long', year: 'numeric' })
}

async function fetchReserva(userId: string, slug: string) {
  const { data: courseData } = await supabase
    .from('academy_courses')
    .select('*, instructor:academy_instructors(*)')
    .eq('slug', slug)
    .single()
  const course = courseData as Course | null
  if (!course) return { course: null, enrollment: null }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: enrollData } = await (supabase as any)
    .from('academy_enrollments')
    .select('*')
    .eq('user_id', userId)
    .eq('course_id', course.id)
    .maybeSingle()

  return { course, enrollment: (enrollData ?? null) as Enrollment | null }
}

function CopyRow({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = useState(false)
  if (!value) return null
  const copy = async () => {
    await navigator.clipboard.writeText(value).catch(() => {})
    setCopied(true)
    setTimeout(() => setCopied(false), 1600)
  }
  return (
    <div className="flex items-center justify-between gap-3 py-2.5 border-b" style={{ borderColor: 'var(--line)' }}>
      <div className="min-w-0">
        <p className="font-mono text-[10px] uppercase tracking-wide mb-0.5" style={{ color: 'var(--text-3)' }}>{label}</p>
        <p className="text-sm font-medium truncate" style={{ color: 'var(--text-1)' }}>{value}</p>
      </div>
      <button
        onClick={() => void copy()}
        className="shrink-0 flex items-center gap-1.5 text-xs font-medium rounded-lg border px-2.5 py-1.5"
        style={{ borderColor: 'var(--line)', color: copied ? 'var(--success)' : 'var(--text-2)' }}
      >
        {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
        {copied ? 'Copiado' : 'Copiar'}
      </button>
    </div>
  )
}

export default function ReservaConfirmada() {
  const { slug = '' } = useParams<{ slug: string }>()
  const { user } = useAuth()
  const navigate = useNavigate()
  const { data: cuentas = [] } = useDatosTransferencia()

  const { data, isLoading } = useQuery({
    queryKey: ['reserva-confirmada', user?.id, slug],
    queryFn: () => fetchReserva(user!.id, slug),
    enabled: !!user?.id && !!slug,
    staleTime: 1000 * 30,
  })

  const course = data?.course
  const enrollment = data?.enrollment

  if (isLoading) {
    return (
      <div className="min-h-screen" style={{ background: 'var(--bg)' }}>
        <Header />
        <div className="flex items-center justify-center py-40">
          <div className="w-8 h-8 border-2 rounded-full animate-spin" style={{ borderColor: 'var(--primary)', borderTopColor: 'transparent' }} />
        </div>
      </div>
    )
  }

  // Sin reserva (o link directo sin enrollment): mandamos al detalle del viaje.
  if (!course || !enrollment?.activo) {
    return (
      <div className="min-h-screen" style={{ background: 'var(--bg)' }}>
        <Header />
        <div className="flex flex-col items-center justify-center py-32 text-center px-4">
          <p className="mb-4" style={{ color: 'var(--text-3)' }}>No encontramos una reserva activa para este viaje.</p>
          <Link to="/vivencial" className="text-sm font-medium" style={{ color: 'var(--primary-l)' }}>Ver vivenciales</Link>
        </div>
      </div>
    )
  }

  const total = enrollment.monto_total_ars ?? course.precio_ars ?? 0

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg)' }}>
      <Header />

      <div className="max-w-2xl mx-auto px-4 py-10 space-y-6">
        {/* Celebración */}
        <motion.div
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, ease: EASE_OUT }}
          className="text-center"
        >
          <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: 'var(--success-s)' }}>
            <CheckCircle2 className="h-8 w-8" style={{ color: 'var(--success)' }} />
          </div>
          <p className="font-mono text-xs mb-1" style={{ color: 'var(--gold)' }}>✈ ¡RESERVA CONFIRMADA!</p>
          <h1 className="font-display font-bold text-2xl leading-tight" style={{ color: 'var(--text-1)' }}>
            Tu lugar en {course.titulo} está reservado
          </h1>
          {enrollment.numero_reserva && (
            <div className="inline-flex items-center gap-2 mt-4 rounded-xl border px-4 py-2" style={{ borderColor: 'rgba(201,154,58,.3)', background: 'var(--gold-soft)' }}>
              <Hash className="h-4 w-4" style={{ color: 'var(--gold)' }} />
              <span className="font-mono font-bold tracking-wide" style={{ color: 'var(--text-1)' }}>{enrollment.numero_reserva}</span>
            </div>
          )}
        </motion.div>

        {/* Resumen del viaje */}
        <motion.div variants={staggerContainer} initial="initial" animate="animate"
          className="rounded-2xl border p-5 space-y-4" style={{ background: 'var(--bg-2)', borderColor: 'var(--line)' }}>
          <h2 className="font-display font-bold" style={{ color: 'var(--text-1)' }}>Resumen del viaje</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              { icon: CalendarDays, label: 'Fechas', value: `${fmtDate(course.vivencial_fecha_salida)} — ${fmtDate(course.vivencial_fecha_regreso)}` },
              { icon: MapPin, label: 'Salís desde', value: enrollment.punto_salida_elegido ?? 'Por confirmar' },
              { icon: Plane, label: 'Destino', value: course.vivencial_pais ?? '—' },
              { icon: Users, label: 'Cupo', value: course.vivencial_cupo_maximo ? `${course.vivencial_cupo_maximo} asesores` : 'Grupo reducido' },
            ].map(item => (
              <motion.div key={item.label} variants={staggerItem} className="flex items-start gap-3 rounded-xl p-3" style={{ background: 'var(--card)' }}>
                <item.icon className="h-4 w-4 shrink-0 mt-0.5" style={{ color: 'var(--primary-l)' }} />
                <div className="min-w-0">
                  <p className="font-mono text-[10px] uppercase tracking-wide mb-0.5" style={{ color: 'var(--text-3)' }}>{item.label}</p>
                  <p className="text-sm font-medium" style={{ color: 'var(--text-1)' }}>{item.value}</p>
                </div>
              </motion.div>
            ))}
          </div>
          <div className="flex items-baseline justify-between pt-2 border-t" style={{ borderColor: 'var(--line)' }}>
            <span className="text-sm" style={{ color: 'var(--text-3)' }}>Monto total del viaje</span>
            <span className="font-display font-bold text-xl" style={{ color: 'var(--text-1)' }}>{fmtARS(total)}</span>
          </div>
        </motion.div>

        {/* Datos bancarios */}
        <div className="rounded-2xl border p-5 space-y-3" style={{ background: 'var(--bg-2)', borderColor: 'var(--line)' }}>
          <div className="flex items-center gap-2">
            <Landmark className="h-4 w-4" style={{ color: 'var(--gold)' }} />
            <h2 className="font-display font-bold" style={{ color: 'var(--text-1)' }}>Datos para transferir</h2>
          </div>
          {cuentas.length === 0 ? (
            <p className="text-sm" style={{ color: 'var(--text-3)' }}>
              Yesica te va a pasar los datos bancarios a la brevedad. También quedan disponibles en tu perfil.
            </p>
          ) : (
            cuentas.map((c, i) => (
              <div key={i} className="rounded-xl p-4" style={{ background: 'var(--card)' }}>
                {cuentas.length > 1 && (
                  <p className="flex items-center gap-1.5 font-mono text-[10px] uppercase mb-1.5" style={{ color: 'var(--text-3)' }}>
                    <Building2 className="h-3.5 w-3.5" /> Cuenta {i + 1}
                  </p>
                )}
                <CopyRow label="Titular" value={c.titular} />
                <CopyRow label="Banco" value={c.banco} />
                <CopyRow label="CBU/CVU" value={c.cbu} />
                <CopyRow label="Alias" value={c.alias} />
              </div>
            ))
          )}
          <div className="flex items-start gap-2 rounded-xl p-3" style={{ background: 'var(--pending-s)' }}>
            <Info className="h-4 w-4 shrink-0 mt-0.5" style={{ color: 'var(--pending)' }} />
            <p className="text-xs" style={{ color: 'var(--text-2)' }}>
              Cuando transfieras, subí el comprobante desde <strong>tu viaje</strong> con “Informar transferencia”.
              Yesica lo revisa y confirma tu pago. El monto se puede abonar en un pago o en partes, siempre antes de viajar.
            </p>
          </div>
        </div>

        {/* Acciones */}
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={() => navigate(`/viaje/${slug}`)}
            className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl font-semibold text-sm"
            style={{ background: 'var(--primary)', color: 'var(--text-1)' }}
          >
            Ir a mi viaje <ArrowRight className="h-4 w-4" />
          </button>
          <Link
            to="/perfil"
            className="flex items-center justify-center gap-2 py-3.5 px-5 rounded-xl text-sm font-medium border"
            style={{ borderColor: 'var(--line)', color: 'var(--text-2)' }}
          >
            Ver en mi perfil
          </Link>
        </div>
      </div>
    </div>
  )
}
