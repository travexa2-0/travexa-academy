interface Props {
  coursesCount: number
  vivencialCount: number
  freeCount: number
  instructorsCount: number
  loading: boolean
}

// Proof strip — SOLO números reales derivados de useCourses()/academy_courses.
// No hay fuente pública real para "asesores formados" (RLS bloquea el conteo
// de perfiles a anon) ni "rating promedio" (aún no hay reseñas), así que esas
// métricas inventadas del prototipo NO se muestran. Si no hay nada publicado
// todavía, la tira entera se oculta en vez de mostrar una fila de ceros.
export default function ProofStrip({ coursesCount, vivencialCount, freeCount, instructorsCount, loading }: Props) {
  if (loading) return null
  const hasContent = coursesCount > 0 || vivencialCount > 0
  if (!hasContent) return null

  const items: { num: number; label: string }[] = [
    { num: coursesCount, label: coursesCount === 1 ? 'CURSO DISPONIBLE' : 'CURSOS DISPONIBLES' },
    { num: freeCount, label: freeCount === 1 ? 'CURSO GRATIS' : 'CURSOS GRATIS' },
    { num: instructorsCount, label: instructorsCount === 1 ? 'INSTRUCTOR' : 'INSTRUCTORES' },
    { num: vivencialCount, label: vivencialCount === 1 ? 'VIVENCIAL ACTIVO' : 'VIVENCIALES ACTIVOS' },
  ]

  return (
    <section className="proof-strip">
      <div className="container">
        <div className="proof-grid">
          {items.map((it) => (
            <div className="proof-item" key={it.label}>
              <div className="proof-num">{it.num}</div>
              <div className="proof-label">{it.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
