import { Link } from 'react-router-dom'
import { Clock, Users } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import type { Course } from '@/types'

const NIVEL_LABEL: Record<string, string> = {
  principiante: 'Principiante',
  intermedio:   'Intermedio',
  avanzado:     'Avanzado',
}

function formatPrice(ars: number | null, tipo_acceso: string): string {
  if (tipo_acceso === 'free' || ars === null || ars === 0) return 'Gratis'
  return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(ars)
}

interface Props {
  course: Course
}

export default function CourseCard({ course }: Props) {
  return (
    <Link to={`/cursos/${course.slug}`} className="group block">
      <article className="rounded-xl overflow-hidden border border-surface bg-brand-navy-2 transition-all duration-300 hover:-translate-y-1 hover-gold-glow">
        {/* Thumbnail cinematic */}
        <div className="relative aspect-[16/9] overflow-hidden">
          {course.thumbnail_url ? (
            <img
              src={course.thumbnail_url}
              alt={course.titulo}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-brand-navy-2 to-brand-navy flex items-center justify-center">
              <span className="font-display text-4xl text-brand-gold/20 font-bold">TA</span>
            </div>
          )}
          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />

          {/* Nivel badge top-right */}
          <div className="absolute top-3 right-3">
            <Badge className="font-mono text-[10px] bg-black/60 text-text-secondary border-surface backdrop-blur-sm">
              {NIVEL_LABEL[course.nivel] ?? course.nivel}
            </Badge>
          </div>

          {/* Title overlay bottom */}
          <div className="absolute bottom-0 left-0 right-0 p-4">
            <h3 className="font-display font-bold text-text-primary text-base leading-snug line-clamp-2">
              {course.titulo}
            </h3>
            {course.instructor && (
              <p className="text-text-muted text-xs mt-1">{course.instructor.nombre}</p>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-4 py-3 flex items-center justify-between gap-2">
          <div className="flex items-center gap-3 text-text-muted">
            <span className="flex items-center gap-1 text-xs font-mono">
              <Users className="h-3 w-3" />
              {course.total_alumnos}
            </span>
            {course.category && (
              <span className="flex items-center gap-1 text-xs font-mono">
                <Clock className="h-3 w-3" />
                {course.category.nombre}
              </span>
            )}
          </div>
          <span className="font-mono font-semibold text-sm text-brand-gold shrink-0">
            {formatPrice(course.precio_ars, course.tipo_acceso)}
          </span>
        </div>
      </article>
    </Link>
  )
}
