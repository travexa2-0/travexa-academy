import type { Course } from '@/types'
import { formatArs } from '../format'

interface Props { course: Course; onClick: () => void }

function statusBadge(c: Course) {
  if (c.archivado) return <span className="badge badge-archived">Archivado</span>
  if (c.publicado) return <span className="badge badge-published">Publicado</span>
  return <span className="badge badge-draft">Borrador</span>
}

export default function ContentCard({ course, onClick }: Props) {
  const isLive = course.tipo === 'en_vivo'
  const isViv = course.tipo === 'vivencial'
  const isFree = course.tipo_acceso === 'gratuito' || course.precio_ars === 0
  const tipoLabel = isViv ? 'Vivencial' : isLive ? '● En vivo' : 'Grabado'
  const cupo = course.vivencial_cupo_disponible

  return (
    <article className="item-card" onClick={onClick} style={course.archivado ? { opacity: 0.72 } : (!course.publicado ? { borderColor: 'var(--gold-soft)' } : undefined)}>
      <div className="item-thumb">
        {course.thumbnail_url
          ? <img src={course.thumbnail_url} alt="" style={course.archivado ? { filter: 'grayscale(0.5)' } : undefined} />
          : <div style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg,#0A1E29,#16323F)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg viewBox="0 0 24 24" width="30" height="30" fill="none" stroke="#8FA3AB" strokeWidth="1.5"><circle cx="12" cy="12" r="9" /><path d="M10 8l6 4-6 4V8z" fill="#8FA3AB" stroke="none" /></svg>
            </div>}
        <div className="item-thumb-badges">
          {course.destacado ? <span className="badge badge-featured">★ Destacado</span> : <span />}
          <span className="item-thumb-tag" style={isLive ? { background: 'rgba(177,80,46,0.85)' } : isViv ? { background: 'rgba(201,154,58,0.85)' } : undefined}>{tipoLabel}</span>
        </div>
        {!course.archivado && (
          <span className="item-thumb-price" style={isFree ? { background: 'rgba(14,107,92,0.85)' } : undefined}>
            {isFree ? 'Gratis' : formatArs(course.precio_ars)}
          </span>
        )}
      </div>
      <div className="item-body">
        <span className="item-cat">{course.category?.nombre ?? '—'}</span>
        <h4 className="item-title">{course.titulo}</h4>
        <div className="item-meta">
          {isViv
            ? <span>{typeof cupo === 'number' ? `${cupo} lugares libres` : 'Cupo sin definir'}</span>
            : <>
                <span><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 5.5C4 4.7 4.7 4 5.5 4H12v16H5.5A1.5 1.5 0 014 18.5v-13z" /><path d="M20 5.5c0-.8-.7-1.5-1.5-1.5H12v16h6.5a1.5 1.5 0 001.5-1.5v-13z" /></svg>{course.total_lecciones || 0} lecciones</span>
                {course.rating_avg > 0 && <span><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2l2.6 6.6L21 11l-6.4 2.4L12 20l-2.6-6.6L3 11l6.4-2.4z" /></svg>{course.rating_avg.toFixed(1)}</span>}
              </>}
        </div>
      </div>
      <div className="item-foot">
        {statusBadge(course)}
        <span style={{ fontSize: 11, color: course.publicado ? 'var(--ink-faint)' : 'var(--gold-deep)', fontWeight: course.publicado ? 400 : 600 }}>
          {course.publicado ? (course.instructor?.nombre ?? '') : 'Listo para preview →'}
        </span>
      </div>
    </article>
  )
}
