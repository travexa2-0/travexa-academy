import { useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  ArrowLeft, MapPin, Hotel, CalendarDays, Users,
  MessageCircle, ExternalLink, CheckCircle2, Circle, Plane,
  Clock, Copy, Check,
} from 'lucide-react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import Header from '@/components/layout/Header'
import VivencialPagoCTA from '@/components/vivencial/VivencialPagoCTA'
import type { Course, Enrollment } from '@/types'
import { richTextLines, hasRichText, renderBold } from '@/lib/richText'
import { staggerContainer, staggerItem, EASE_OUT } from '@/lib/motion'

// ── Checklist persistido en localStorage ─────────────────────────

const DOCS_DEFAULT = [
  { id: 'pasaporte',   label: 'Pasaporte o DNI vigente' },
  { id: 'seguro',      label: 'Seguro de viaje contratado' },
  { id: 'vacunas',     label: 'Vacunas al día (si aplica)' },
  { id: 'dinero',      label: 'Dinero en efectivo (moneda local)' },
  { id: 'datos',       label: 'Datos internacionales en el celular' },
  { id: 'ropa',        label: 'Ropa adecuada para el clima' },
  { id: 'medicamentos',label: 'Medicamentos personales' },
  { id: 'contactos',   label: 'Contactos de emergencia compartidos' },
]

function useChecklist(courseId: string) {
  const key = `checklist_vivencial_${courseId}`

  const [checked, setChecked] = useState<Record<string, boolean>>(() => {
    try { return JSON.parse(localStorage.getItem(key) ?? '{}') as Record<string, boolean> }
    catch { return {} }
  })

  const toggle = (id: string) => {
    const next = { ...checked, [id]: !checked[id] }
    setChecked(next)
    localStorage.setItem(key, JSON.stringify(next))
  }

  const total = DOCS_DEFAULT.length
  const done  = DOCS_DEFAULT.filter(d => checked[d.id]).length

  return { checked, toggle, total, done }
}

// ── Fetch ─────────────────────────────────────────────────────────

async function fetchVivencialData(userId: string, slug: string) {
  const { data: courseData } = await supabase
    .from('academy_courses')
    .select('*, instructor:academy_instructors(*), modules:academy_modules(*, lessons:academy_lessons(*))')
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

  return {
    course,
    enrollment: (enrollData ?? null) as Enrollment | null,
  }
}

// ── Boarding pass header ──────────────────────────────────────────

function BoardingPass({ course, enrollment, userId, onChanged }: { course: Course; enrollment: Enrollment | null; userId?: string; onChanged?: () => void }) {
  const totalPago  = enrollment?.monto_total_ars ?? course.precio_ars ?? 0
  const señado     = enrollment?.monto_señado_ars ?? 0
  const pendiente  = enrollment?.monto_pendiente_ars ?? (totalPago - señado)
  const pct        = totalPago > 0 ? Math.round((señado / totalPago) * 100) : 0

  return (
    <div
      className="rounded-3xl border overflow-hidden relative"
      style={{ background: 'linear-gradient(135deg, var(--bg-2) 0%, var(--card-solid) 100%)', borderColor: 'rgba(201,154,58,.3)' }}
    >
      {/* Gold accent line */}
      <div className="absolute top-0 left-0 right-0 h-1" style={{ background: 'linear-gradient(90deg, var(--gold-deep), var(--gold), var(--primary-l))' }} />

      <div className="p-6 space-y-5">
        {/* Top row */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="font-mono text-xs mb-1" style={{ color: 'var(--gold)' }}>✈ VIAJE VIVENCIAL</p>
            <h2 className="font-display font-bold text-xl leading-snug" style={{ color: 'var(--text-1)' }}>
              {course.titulo}
            </h2>
            {course.instructor && (
              <p className="text-sm mt-0.5" style={{ color: 'var(--text-3)' }}>{course.instructor.nombre}</p>
            )}
          </div>
          {course.thumbnail_url && (
            <div className="w-20 h-20 rounded-2xl overflow-hidden shrink-0">
              <img src={course.thumbnail_url} alt="" className="w-full h-full object-cover" />
            </div>
          )}
        </div>

        {/* Fechas estilo boarding pass */}
        <div className="grid grid-cols-3 gap-3 py-4 border-t border-b border-dashed" style={{ borderColor: 'var(--line)' }}>
          <div className="text-center">
            <p className="font-mono text-[10px] mb-1" style={{ color: 'var(--text-3)' }}>SALIDA</p>
            {course.vivencial_fecha_salida ? (
              <>
                <p className="font-display font-bold text-lg leading-none" style={{ color: 'var(--text-1)' }}>
                  {new Date(course.vivencial_fecha_salida).toLocaleDateString('es-AR', { day: 'numeric', month: 'short' }).toUpperCase()}
                </p>
                <p className="font-mono text-xs mt-0.5" style={{ color: 'var(--text-3)' }}>
                  {new Date(course.vivencial_fecha_salida).getFullYear()}
                </p>
              </>
            ) : <p className="font-mono text-sm" style={{ color: 'var(--text-3)' }}>—</p>}
          </div>
          <div className="flex flex-col items-center justify-center">
            <Plane className="h-5 w-5" style={{ color: 'var(--gold)' }} />
            {course.vivencial_fecha_salida && course.vivencial_fecha_regreso && (
              <p className="font-mono text-[9px] mt-1" style={{ color: 'var(--text-3)' }}>
                {Math.ceil((new Date(course.vivencial_fecha_regreso).getTime() - new Date(course.vivencial_fecha_salida).getTime()) / 86400000)} noches
              </p>
            )}
          </div>
          <div className="text-center">
            <p className="font-mono text-[10px] mb-1" style={{ color: 'var(--text-3)' }}>REGRESO</p>
            {course.vivencial_fecha_regreso ? (
              <>
                <p className="font-display font-bold text-lg leading-none" style={{ color: 'var(--text-1)' }}>
                  {new Date(course.vivencial_fecha_regreso).toLocaleDateString('es-AR', { day: 'numeric', month: 'short' }).toUpperCase()}
                </p>
                <p className="font-mono text-xs mt-0.5" style={{ color: 'var(--text-3)' }}>
                  {new Date(course.vivencial_fecha_regreso).getFullYear()}
                </p>
              </>
            ) : <p className="font-mono text-sm" style={{ color: 'var(--text-3)' }}>—</p>}
          </div>
        </div>

        {/* Estado de pago */}
        {totalPago > 0 && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span style={{ color: 'var(--text-3)' }}>Pago</span>
              <span className="font-mono font-bold" style={{ color: pct === 100 ? 'var(--success)' : 'var(--pending)' }}>
                {pct}% abonado
              </span>
            </div>
            <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--card)' }}>
              <motion.div
                className="h-full rounded-full"
                style={{ background: pct === 100 ? 'var(--success)' : 'var(--pending)' }}
                initial={{ width: 0 }}
                animate={{ width: `${pct}%` }}
                transition={{ duration: 0.8, ease: EASE_OUT }}
              />
            </div>
            <div className="flex justify-between text-xs font-mono">
              <span style={{ color: 'var(--success)' }}>
                {new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(señado)} señado
              </span>
              {pendiente > 0 && (
                <span style={{ color: 'var(--pending)' }}>
                  {new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(pendiente)} pendiente
                </span>
              )}
            </div>
          </div>
        )}

        {/* CTA pago con estados (seña / transferir saldo / cuotas / pagado) */}
        <VivencialPagoCTA course={course} enrollment={enrollment} userId={userId} variant="boarding" onChanged={onChanged} />
      </div>
    </div>
  )
}

// ── Main ──────────────────────────────────────────────────────────

export default function VivencialDetalle() {
  const { slug } = useParams<{ slug: string }>()
  const { user } = useAuth()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [copiedLink, setCopiedLink] = useState(false)

  const { data, isLoading } = useQuery({
    queryKey: ['vivencial-detalle', user?.id, slug],
    queryFn:  () => fetchVivencialData(user!.id, slug!),
    enabled:  !!user?.id && !!slug,
    staleTime: 1000 * 60 * 2,
  })

  const course     = data?.course
  const enrollment = data?.enrollment
  const { checked, toggle, total, done } = useChecklist(course?.id ?? '')

  const shareUrl = `${window.location.origin}/cursos/${slug}`
  const copyLink = async () => {
    await navigator.clipboard.writeText(shareUrl)
    setCopiedLink(true)
    setTimeout(() => setCopiedLink(false), 2000)
  }

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

  if (!course) {
    return (
      <div className="min-h-screen" style={{ background: 'var(--bg)' }}>
        <Header />
        <div className="flex flex-col items-center justify-center py-32 text-center">
          <p className="mb-4" style={{ color: 'var(--text-3)' }}>Viaje no encontrado</p>
          <Link to="/mis-cursos" className="text-sm font-medium" style={{ color: 'var(--primary-l)' }}>Volver a mis cursos</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg)' }}>
      <Header />

      {/* Back */}
      <div className="max-w-4xl mx-auto px-4 pt-6">
        <button onClick={() => navigate('/mis-cursos')} className="flex items-center gap-1.5 text-sm mb-6" style={{ color: 'var(--text-3)' }}>
          <ArrowLeft className="h-4 w-4" /> Mis cursos
        </button>
      </div>

      <div className="max-w-4xl mx-auto px-4 pb-16 space-y-8">
        {/* Boarding pass */}
        <BoardingPass
          course={course}
          enrollment={enrollment ?? null}
          userId={user?.id}
          onChanged={() => void queryClient.invalidateQueries({ queryKey: ['vivencial-detalle', user?.id, slug] })}
        />

        {/* Grid info cards */}
        <motion.div variants={staggerContainer} initial="initial" animate="animate" className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {course.vivencial_ciudad_salida && (
            <motion.div variants={staggerItem} className="rounded-2xl border p-4 flex items-start gap-3" style={{ background: 'var(--bg-2)', borderColor: 'var(--line)' }}>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'var(--primary-s)' }}>
                <Plane className="h-5 w-5" style={{ color: 'var(--primary-l)' }} />
              </div>
              <div>
                <p className="font-mono text-xs mb-0.5" style={{ color: 'var(--text-3)' }}>Ciudad de salida</p>
                <p className="font-semibold" style={{ color: 'var(--text-1)' }}>{course.vivencial_ciudad_salida}</p>
              </div>
            </motion.div>
          )}

          {course.vivencial_hotel && (
            <motion.div variants={staggerItem} className="rounded-2xl border p-4 flex items-start gap-3" style={{ background: 'var(--bg-2)', borderColor: 'var(--line)' }}>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'var(--gold-soft)' }}>
                <Hotel className="h-5 w-5" style={{ color: 'var(--gold)' }} />
              </div>
              <div>
                <p className="font-mono text-xs mb-0.5" style={{ color: 'var(--text-3)' }}>Alojamiento</p>
                <p className="font-semibold" style={{ color: 'var(--text-1)' }}>{course.vivencial_hotel}</p>
              </div>
            </motion.div>
          )}

          {course.vivencial_cupo_maximo && (
            <motion.div variants={staggerItem} className="rounded-2xl border p-4 flex items-start gap-3" style={{ background: 'var(--bg-2)', borderColor: 'var(--line)' }}>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'var(--card)' }}>
                <Users className="h-5 w-5" style={{ color: 'var(--text-2)' }} />
              </div>
              <div>
                <p className="font-mono text-xs mb-0.5" style={{ color: 'var(--text-3)' }}>Participantes</p>
                <p className="font-semibold" style={{ color: 'var(--text-1)' }}>
                  {(course.vivencial_cupo_maximo - (course.vivencial_cupo_disponible ?? 0))} confirmados de {course.vivencial_cupo_maximo}
                </p>
              </div>
            </motion.div>
          )}

          {course.vivencial_fecha_salida && (
            <motion.div variants={staggerItem} className="rounded-2xl border p-4 flex items-start gap-3" style={{ background: 'var(--bg-2)', borderColor: 'var(--line)' }}>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'var(--pending-s)' }}>
                <Clock className="h-5 w-5" style={{ color: 'var(--pending)' }} />
              </div>
              <div>
                <p className="font-mono text-xs mb-0.5" style={{ color: 'var(--text-3)' }}>Faltan</p>
                <p className="font-semibold" style={{ color: 'var(--text-1)' }}>
                  {Math.max(0, Math.ceil((new Date(course.vivencial_fecha_salida).getTime() - Date.now()) / 86400000))} días
                </p>
              </div>
            </motion.div>
          )}
        </motion.div>

        {/* Punto de encuentro */}
        {course.vivencial_punto_encuentro && (
          <div className="rounded-2xl border p-5 space-y-3" style={{ background: 'var(--bg-2)', borderColor: 'var(--line)' }}>
            <h3 className="font-display font-bold" style={{ color: 'var(--text-1)' }}>
              <MapPin className="h-4 w-4 inline mr-2" style={{ color: 'var(--gold)' }} />
              Punto de encuentro
            </h3>
            <p className="text-sm" style={{ color: 'var(--text-2)' }}>{course.vivencial_punto_encuentro}</p>
            <a
              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(course.vivencial_punto_encuentro)}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 text-sm font-medium"
              style={{ color: 'var(--primary-l)' }}
            >
              <ExternalLink className="h-3.5 w-3.5" />
              Ver en Google Maps
            </a>
          </div>
        )}

        {/* Itinerario */}
        {course.vivencial_itinerario?.length > 0 && (
          <div>
            <h3 className="font-display font-bold text-xl mb-4" style={{ color: 'var(--text-1)' }}>
              <CalendarDays className="h-5 w-5 inline mr-2" style={{ color: 'var(--primary-l)' }} />
              Itinerario completo
            </h3>
            <div className="space-y-4 relative">
              {/* Vertical timeline line */}
              <div className="absolute left-5 top-5 bottom-5 w-px" style={{ background: 'var(--line)' }} />

              {course.vivencial_itinerario.map((dia, i) => (
                <motion.div
                  key={dia.dia}
                  className="flex gap-4 relative"
                  initial={{ opacity: 0, x: -16 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05, duration: 0.25, ease: EASE_OUT }}
                  viewport={{ once: true, margin: '-40px' }}
                >
                  {/* Day dot */}
                  <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 z-10 font-mono text-xs font-bold" style={{ background: 'var(--gold)', color: 'var(--bg-deep)' }}>
                    {dia.dia}
                  </div>
                  <div className="flex-1 pb-4">
                    <p className="font-display font-bold mb-1" style={{ color: 'var(--text-1)' }}>{dia.titulo}</p>
                    <p className="text-sm leading-relaxed" style={{ color: 'var(--text-2)' }}>{dia.descripcion}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* Incluye / No incluye */}
        {(hasRichText(course.incluye) || hasRichText(course.no_incluye)) && (
          <div className="grid sm:grid-cols-2 gap-5">
            {hasRichText(course.incluye) && (
              <div className="rounded-2xl border p-5" style={{ background: 'var(--bg-2)', borderColor: 'var(--line)' }}>
                <h4 className="font-display font-bold mb-3" style={{ color: 'var(--text-1)' }}>✅ Incluye</h4>
                <ul className="space-y-2">
                  {richTextLines(course.incluye).map((item, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm" style={{ color: 'var(--text-2)' }}>
                      <CheckCircle2 className="h-3.5 w-3.5 shrink-0 mt-0.5" style={{ color: 'var(--success)' }} />
                      <span>{renderBold(item, `inc${i}`)}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {hasRichText(course.no_incluye) && (
              <div className="rounded-2xl border p-5" style={{ background: 'var(--bg-2)', borderColor: 'var(--line)' }}>
                <h4 className="font-display font-bold mb-3" style={{ color: 'var(--text-1)' }}>❌ No incluye</h4>
                <ul className="space-y-2">
                  {richTextLines(course.no_incluye).map((item, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm" style={{ color: 'var(--text-2)' }}>
                      <div className="w-3.5 h-3.5 shrink-0 mt-0.5 rounded-full border flex items-center justify-center" style={{ borderColor: '#ef4444' }}>
                        <div className="w-1.5 h-0.5 rounded" style={{ background: '#ef4444' }} />
                      </div>
                      <span>{renderBold(item, `ninc${i}`)}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Checklist de documentos */}
        <div className="rounded-2xl border p-5 space-y-4" style={{ background: 'var(--bg-2)', borderColor: 'var(--line)' }}>
          <div className="flex items-center justify-between">
            <h3 className="font-display font-bold" style={{ color: 'var(--text-1)' }}>
              📋 Checklist pre-viaje
            </h3>
            <span className="font-mono text-sm" style={{ color: done === total ? 'var(--success)' : 'var(--text-3)' }}>
              {done}/{total}
            </span>
          </div>

          {/* Progress */}
          <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--card)' }}>
            <motion.div
              className="h-full rounded-full"
              style={{ background: done === total ? 'var(--success)' : 'var(--primary)' }}
              animate={{ width: `${(done / total) * 100}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>

          <ul className="space-y-2">
            {DOCS_DEFAULT.map(doc => (
              <motion.li
                key={doc.id}
                whileTap={{ scale: 0.98 }}
                onClick={() => toggle(doc.id)}
                className="flex items-center gap-3 py-2.5 px-3 rounded-xl cursor-pointer transition-colors"
                style={{ background: checked[doc.id] ? 'var(--success-s)' : 'transparent' }}
              >
                {checked[doc.id]
                  ? <CheckCircle2 className="h-4 w-4 shrink-0" style={{ color: 'var(--success)' }} />
                  : <Circle className="h-4 w-4 shrink-0" style={{ color: 'var(--text-3)' }} />
                }
                <span className="text-sm" style={{ color: checked[doc.id] ? 'var(--text-2)' : 'var(--text-2)', textDecoration: checked[doc.id] ? 'line-through' : 'none' }}>
                  {doc.label}
                </span>
              </motion.li>
            ))}
          </ul>

          {done === total && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-3 rounded-xl font-semibold text-sm"
              style={{ background: 'var(--success-s)', color: 'var(--success)' }}
            >
              🎉 ¡Todo listo para el viaje!
            </motion.div>
          )}
        </div>

        {/* WhatsApp + Compartir */}
        <div className="flex flex-col sm:flex-row gap-3">
          {course.vivencial_whatsapp_url && (
            <a
              href={course.vivencial_whatsapp_url}
              target="_blank"
              rel="noreferrer"
              className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl font-semibold text-sm border"
              style={{ borderColor: 'rgba(37,211,102,.3)', background: 'rgba(37,211,102,.08)', color: '#25D366' }}
            >
              <MessageCircle className="h-4 w-4" />
              Grupo de WhatsApp del viaje
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          )}
          <button
            onClick={() => void copyLink()}
            className="flex items-center justify-center gap-2 py-3.5 px-5 rounded-xl text-sm font-medium border"
            style={{ borderColor: 'var(--line)', color: 'var(--text-2)' }}
          >
            {copiedLink ? <><Check className="h-4 w-4" /> Copiado</> : <><Copy className="h-4 w-4" /> Compartir viaje</>}
          </button>
        </div>

        {/* Volver */}
        <div className="pt-4">
          <Link to="/mis-cursos" className="flex items-center gap-1.5 text-sm" style={{ color: 'var(--text-3)' }}>
            <ArrowLeft className="h-4 w-4" /> Volver a mis cursos
          </Link>
        </div>
      </div>
    </div>
  )
}
