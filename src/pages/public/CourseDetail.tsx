import { useParams, useNavigate, Link } from 'react-router-dom'
import { Play, Lock, CheckCircle2, Clock, Users, ChevronRight, ArrowLeft } from 'lucide-react'
import Header from '@/components/layout/Header'
import SkeletonCard from '@/components/shared/SkeletonCard'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { useCourseDetail } from '@/hooks/useCourses'
import { useAuth } from '@/contexts/AuthContext'
import type { Lesson } from '@/types'

function formatPrice(ars: number | null, tipo_acceso: string): string {
  if (tipo_acceso === 'free' || ars === null || ars === 0) return 'Gratis'
  return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(ars)
}

function formatSeconds(s: number | null): string {
  if (!s) return ''
  const m = Math.floor(s / 60)
  return `${m} min`
}

function LessonRow({ lesson }: { lesson: Lesson }) {
  return (
    <div className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-surface-card transition-colors">
      <div className="shrink-0">
        {lesson.es_preview
          ? <Play className="h-4 w-4 text-brand-gold" />
          : <Lock className="h-4 w-4 text-text-muted" />
        }
      </div>
      <span className="text-sm text-text-secondary flex-1 leading-snug">{lesson.titulo}</span>
      {lesson.duracion_segundos && (
        <span className="font-mono text-xs text-text-muted shrink-0">{formatSeconds(lesson.duracion_segundos)}</span>
      )}
      {lesson.es_preview && (
        <Badge className="font-mono text-[10px] bg-brand-gold/15 text-brand-gold border-brand-gold/30 shrink-0">
          Preview
        </Badge>
      )}
    </div>
  )
}

export default function CourseDetail() {
  const { slug } = useParams<{ slug: string }>()
  const { user } = useAuth()
  const navigate = useNavigate()
  const { data: course, isLoading, error } = useCourseDetail(slug ?? '')

  if (isLoading) {
    return (
      <div className="min-h-screen">
        <Header />
        <div className="max-w-5xl mx-auto px-4 py-10">
          <div className="grid md:grid-cols-3 gap-8">
            <div className="md:col-span-2 space-y-4">
              <SkeletonCard />
              <div className="space-y-2">
                {[1,2,3].map(i => <div key={i} className="h-4 bg-surface-card rounded animate-pulse" />)}
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error || !course) {
    return (
      <div className="min-h-screen">
        <Header />
        <div className="flex flex-col items-center justify-center py-32 text-center">
          <p className="text-text-muted text-lg mb-4">Curso no encontrado</p>
          <Link to="/cursos" className="text-brand-gold hover:underline text-sm">Ver todos los cursos</Link>
        </div>
      </div>
    )
  }

  const totalLessons = course.modules?.reduce((acc, m) => acc + (m.lessons?.length ?? 0), 0) ?? 0
  const isFree = course.tipo_acceso === 'free'

  const handleEnroll = () => {
    if (!user) {
      navigate('/registro', { state: { from: `/cursos/${slug}` } })
    } else {
      // Día 3: wired to payment flow
      navigate('/dashboard')
    }
  }

  return (
    <div className="min-h-screen">
      <Header />

      {/* Hero con thumbnail */}
      <div className="relative h-64 md:h-80 overflow-hidden">
        {course.thumbnail_url ? (
          <img src={course.thumbnail_url} alt={course.titulo} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-brand-navy-2 to-brand-navy" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-brand-navy via-brand-navy/60 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 max-w-5xl mx-auto px-4 pb-8">
          <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-text-muted text-sm mb-4 hover:text-text-secondary">
            <ArrowLeft className="h-4 w-4" /> Volver
          </button>
          {course.category && (
            <Badge className="font-mono text-xs bg-brand-gold/20 text-brand-gold border-brand-gold/30 mb-3">
              {course.category.nombre}
            </Badge>
          )}
          <h1 className="font-display font-bold text-2xl md:text-4xl text-text-primary leading-tight max-w-2xl">
            {course.titulo}
          </h1>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-5xl mx-auto px-4 py-10">
        <div className="grid md:grid-cols-3 gap-10">
          {/* Left: info + accordion */}
          <div className="md:col-span-2 space-y-8">
            {/* Meta */}
            <div className="flex flex-wrap gap-4 text-sm text-text-muted">
              {course.instructor && (
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-brand-teal" />
                  Instructor: <strong className="text-text-secondary">{course.instructor.nombre}</strong>
                </span>
              )}
              <span className="flex items-center gap-1.5">
                <Users className="h-4 w-4" />
                {course.total_alumnos} alumnos
              </span>
              <span className="flex items-center gap-1.5">
                <Clock className="h-4 w-4" />
                {totalLessons} lecciones
              </span>
            </div>

            {/* Descripción */}
            {course.descripcion && (
              <div>
                <h2 className="font-display font-bold text-lg text-text-primary mb-3">Sobre este curso</h2>
                <p className="text-text-secondary text-sm leading-relaxed">{course.descripcion}</p>
              </div>
            )}

            {/* Curriculum acordeón */}
            {course.modules && course.modules.length > 0 && (
              <div>
                <h2 className="font-display font-bold text-lg text-text-primary mb-4">Contenido del curso</h2>
                <Accordion multiple className="space-y-2">
                  {[...course.modules]
                    .sort((a, b) => a.orden - b.orden)
                    .map(mod => (
                      <AccordionItem
                        key={mod.id}
                        value={mod.id}
                        className="border border-surface rounded-xl overflow-hidden bg-brand-navy-2"
                      >
                        <AccordionTrigger className="px-4 py-4 hover:bg-surface-card [&>svg]:text-brand-gold">
                          <div className="flex items-center gap-3 text-left">
                            <span className="font-mono text-xs text-text-muted w-6 shrink-0">
                              {String(mod.orden).padStart(2, '0')}
                            </span>
                            <span className="font-display font-semibold text-text-primary text-sm">
                              {mod.titulo}
                            </span>
                            <span className="font-mono text-xs text-text-muted ml-auto mr-2 shrink-0">
                              {mod.lessons?.length ?? 0} lecciones
                            </span>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent className="pb-2 px-2">
                          {[...(mod.lessons ?? [])]
                            .sort((a, b) => a.orden - b.orden)
                            .map(lesson => <LessonRow key={lesson.id} lesson={lesson} />)
                          }
                        </AccordionContent>
                      </AccordionItem>
                    ))
                  }
                </Accordion>
              </div>
            )}
          </div>

          {/* Right: CTA card (sticky) */}
          <div className="md:col-span-1">
            <div className="sticky top-24 bg-brand-navy-2 rounded-2xl border border-surface p-6 space-y-5">
              <div>
                <p className="font-mono text-3xl font-bold text-brand-gold">
                  {formatPrice(course.precio_ars, course.tipo_acceso)}
                </p>
                {!isFree && course.precio_usd && (
                  <p className="font-mono text-xs text-text-muted mt-1">≈ USD {course.precio_usd}</p>
                )}
              </div>

              <Button
                onClick={handleEnroll}
                className="w-full bg-brand-gold hover:bg-brand-gold-deep text-brand-navy font-semibold h-11"
              >
                {isFree ? 'Acceder gratis' : 'Inscribirme'}
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>

              {!user && (
                <p className="text-xs text-text-muted text-center">
                  Necesitás una cuenta.{' '}
                  <Link to="/registro" className="text-brand-gold hover:underline">Registrate gratis.</Link>
                </p>
              )}

              {/* Features */}
              <ul className="space-y-2.5 pt-2 border-t border-surface">
                {[
                  'Acceso de por vida',
                  'Certificado al completar',
                  `${totalLessons} lecciones en video`,
                  'Acceso desde cualquier dispositivo',
                ].map(f => (
                  <li key={f} className="flex items-center gap-2 text-sm text-text-secondary">
                    <CheckCircle2 className="h-3.5 w-3.5 text-brand-teal shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
