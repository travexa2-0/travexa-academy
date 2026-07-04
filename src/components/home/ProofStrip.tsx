interface Props {
  coursesCount: number
  vivencialCount: number
  loading: boolean
}

// Proof strip. `cursos disponibles` y `vivencial activo` salen de la DB
// real (academy_courses). `asesores formados` y `rating promedio` son de
// muestra: no hay fuente pública real todavía (RLS bloquea el conteo de
// perfiles a anon, y aún no existen reseñas). Ver SAMPLE en ProofStrip.
const SAMPLE_ASESORES = '867'
const SAMPLE_RATING = '4.7'

export default function ProofStrip({ coursesCount, vivencialCount, loading }: Props) {
  const dash = loading ? '—' : null
  return (
    <section className="proof-strip">
      <div className="container">
        <div className="proof-grid">
          <div className="proof-item">
            <div className="proof-num">{SAMPLE_ASESORES}</div>
            <div className="proof-label">ASESORES FORMADOS</div>
          </div>
          <div className="proof-item">
            <div className="proof-num"><span className="gold">{SAMPLE_RATING}</span> / 5</div>
            <div className="proof-label">RATING PROMEDIO</div>
          </div>
          <div className="proof-item">
            <div className="proof-num">{dash ?? coursesCount}</div>
            <div className="proof-label">{coursesCount === 1 ? 'CURSO DISPONIBLE' : 'CURSOS DISPONIBLES'}</div>
          </div>
          <div className="proof-item">
            <div className="proof-num">{dash ?? vivencialCount}</div>
            <div className="proof-label">{vivencialCount === 1 ? 'VIVENCIAL ACTIVO' : 'VIVENCIALES ACTIVOS'}</div>
          </div>
        </div>
      </div>
    </section>
  )
}
