import { Link } from 'react-router-dom'
import { useLayoutEffect, useRef, useState } from 'react'
import type { Course } from '@/types'
import { Reveal } from './Reveal'

// ── helpers (mismos criterios que CourseCard) ──
function formatARS(n: number | null): string {
  if (n === null || n === undefined) return ''
  return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(n)
}
function formatPrice(ars: number | null, tipoAcceso: string): string {
  if (tipoAcceso === 'gratuito' || ars === null || ars === 0) return 'Gratis'
  return formatARS(ars)
}
function formatDuration(min: number): string {
  if (!min) return ''
  if (min < 60) return `${min}min`
  const h = Math.floor(min / 60)
  const m = min % 60
  return m > 0 ? `${h}h ${m}min` : `${h}h`
}
const NIVEL_LABEL: Record<string, string> = {
  principiante: 'Principiante',
  intermedio: 'Intermedio',
  avanzado: 'Avanzado',
}

const HeartIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8z" /></svg>
)

function CourseCardMini({ course }: { course: Course }) {
  const isFree = course.tipo_acceso === 'gratuito' || course.precio_ars === 0
  const isLive = course.tipo === 'en_vivo'
  const rating = course.rating_avg || course.rating_promedio || 0
  const duration = formatDuration(course.duracion_total_minutos || course.duracion_minutos)
  const thumb = course.thumbnail_url ?? undefined

  return (
    <Link className="course-card" to={`/cursos/${course.slug}`}>
      <div className="course-thumb" style={thumb ? { backgroundImage: `url('${thumb}')` } : undefined}>
        <div className="course-badges">
          <span className={`badge-pill${isLive ? ' live' : ''}`}>{isLive ? 'En vivo' : 'A tu ritmo'}</span>
        </div>
        <span className="heart-btn" aria-hidden="true"><HeartIcon /></span>
        {course.descripcion && (
          <div className="course-hover-info"><p>{course.descripcion}</p></div>
        )}
      </div>
      <div className="course-body">
        <h4>{course.titulo}</h4>
        <p className="course-instructor">{course.instructor?.nombre ?? 'Travexa Academy'}</p>
        <div className="course-meta">
          {rating > 0 && <><span className="star">★</span> {rating.toFixed(1)} <span className="dot">·</span> </>}
          {duration && <>{duration} <span className="dot">·</span> </>}
          {course.total_alumnos} alumnos
        </div>
        <div className="course-foot">
          <span className={`course-price${isFree ? ' free' : ''}`}>{formatPrice(course.precio_ars, course.tipo_acceso)}</span>
          <span className="chip-level">{NIVEL_LABEL[course.nivel] ?? course.nivel}</span>
        </div>
      </div>
    </Link>
  )
}

interface Props {
  courses: Course[]
  loading: boolean
}

export default function FeaturedCoursesMarquee({ courses, loading }: Props) {
  const hasCourses = courses.length > 0

  // El marquee solo debe animarse cuando UN set de cards es más ancho que el
  // contenedor visible; si no, las cards quedaban pegadas a la izquierda y el
  // loop de -50% saltaba sobre una distancia mínima (se veía "trabado en la 1ª
  // tarjeta"). Cuando el catálogo entra entero, se centra estático (sin loop).
  const maskRef  = useRef<HTMLDivElement>(null)
  const trackRef = useRef<HTMLDivElement>(null)
  const [scroll, setScroll] = useState(false)

  useLayoutEffect(() => {
    if (!hasCourses) return
    const measure = () => {
      const mask = maskRef.current
      const track = trackRef.current
      if (!mask || !track) return
      // Los dos sets son idénticos: si ya está en modo scroll, un set = mitad.
      const oneSet = scroll ? track.scrollWidth / 2 : track.scrollWidth
      setScroll(oneSet > mask.clientWidth + 4)
    }
    measure()
    window.addEventListener('resize', measure)
    return () => window.removeEventListener('resize', measure)
  }, [hasCourses, courses.length, scroll])

  // En modo scroll se duplica el set para el loop continuo (translateX -50%).
  const rendered = scroll ? [...courses, ...courses] : courses

  return (
    <section className="catalogo">
      <div className="container">
        <Reveal>
          <div className="section-head-row">
            <div>
              <div className="section-label on-light">Formación</div>
              <h2 className="section-title on-light">Los cursos más elegidos</h2>
              <p className="section-sub on-light">Pasá el mouse sobre un curso para ver de qué se trata.</p>
            </div>
            <Link to="/cursos" className="link-arrow">
              Ver todos los cursos
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
            </Link>
          </div>
        </Reveal>
      </div>

      {hasCourses ? (
        <div className="marquee-mask" ref={maskRef}>
          <div className={`course-track ${scroll ? 'is-scroll' : 'is-centered'}`} ref={trackRef}>
            {rendered.map((c, i) => <CourseCardMini key={`${c.id}-${i}`} course={c} />)}
          </div>
        </div>
      ) : (
        <div className="container">
          <div className="catalogo-empty">
            <h4>{loading ? 'Cargando cursos…' : 'Los primeros cursos están en camino'}</h4>
            <p>
              {loading
                ? 'Un momento, estamos trayendo el catálogo.'
                : 'Estamos preparando la primera tanda de cursos. Registrate gratis y te avisamos apenas estén disponibles.'}
            </p>
          </div>
        </div>
      )}
    </section>
  )
}
