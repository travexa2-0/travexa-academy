import { useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useInstructorSelf } from '@/hooks/useInstructorSelf'
import { useOwnCourses, useOwnLiveLessons } from '@/hooks/instructor/useInstructorCourses'

interface CalEvent {
  key: string
  titulo: string
  contexto: string
  fecha: Date
  tipo: 'curso' | 'clase'
}

const DIAS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']

// Índice de columna (0 = lunes) para una fecha dada.
function weekdayIndex(date: Date): number {
  return (date.getDay() + 6) % 7
}

export default function InstructorCalendario() {
  const { instructor } = useInstructorSelf()
  const { data: cursos } = useOwnCourses(instructor?.id)
  const courseIds = useMemo(() => cursos?.map(c => c.id), [cursos])
  const { data: lessons } = useOwnLiveLessons(courseIds)

  const [cursor, setCursor] = useState(() => {
    const now = new Date()
    return new Date(now.getFullYear(), now.getMonth(), 1)
  })

  const eventos = useMemo<CalEvent[]>(() => {
    const tituloDe = (courseId: string) => cursos?.find(c => c.id === courseId)?.titulo ?? 'Curso'

    const deCursos: CalEvent[] = (cursos ?? [])
      .filter(c => c.tipo === 'en_vivo' && c.live_date)
      .map(c => ({ key: `c-${c.id}`, titulo: c.titulo, contexto: 'Curso en vivo', fecha: new Date(c.live_date!), tipo: 'curso' }))

    const deClases: CalEvent[] = (lessons ?? [])
      .map(l => ({ key: `l-${l.id}`, titulo: l.titulo, contexto: tituloDe(l.course_id), fecha: new Date(l.fecha_vivo), tipo: 'clase' }))

    return [...deCursos, ...deClases]
  }, [cursos, lessons])

  const year = cursor.getFullYear()
  const month = cursor.getMonth()

  const delMes = eventos.filter(e => e.fecha.getFullYear() === year && e.fecha.getMonth() === month)

  const diasEnMes = new Date(year, month + 1, 0).getDate()
  const offset = weekdayIndex(new Date(year, month, 1))
  const celdas: (number | null)[] = [
    ...Array<null>(offset).fill(null),
    ...Array.from({ length: diasEnMes }, (_, i) => i + 1),
  ]

  const hoy = new Date()
  const esHoy = (d: number) => hoy.getFullYear() === year && hoy.getMonth() === month && hoy.getDate() === d

  const label = cursor.toLocaleDateString('es-AR', { month: 'long', year: 'numeric' })

  return (
    <>
      <div className="page-head">
        <div>
          <div className="page-eyebrow">Contenido</div>
          <h1 className="page-title">Calendario</h1>
          <p className="page-sub">Tus cursos en vivo y las clases en vivo dentro de tus cursos grabados.</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button className="btn btn-secondary btn-sm" onClick={() => setCursor(new Date(year, month - 1, 1))} aria-label="Mes anterior">
            <ChevronLeft />
          </button>
          <span style={{ minWidth: 150, textAlign: 'center', fontWeight: 600, color: 'var(--ink)', textTransform: 'capitalize' }}>{label}</span>
          <button className="btn btn-secondary btn-sm" onClick={() => setCursor(new Date(year, month + 1, 1))} aria-label="Mes siguiente">
            <ChevronRight />
          </button>
        </div>
      </div>

      <div className="card card-pad">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 6 }}>
          {DIAS.map(d => (
            <div key={d} className="mono" style={{ fontSize: 11, color: 'var(--ink-faint)', textAlign: 'center', paddingBottom: 6 }}>{d}</div>
          ))}

          {celdas.map((dia, i) => {
            if (dia === null) return <div key={`empty-${i}`} />
            const delDia = delMes.filter(e => e.fecha.getDate() === dia)
            return (
              <div
                key={dia}
                style={{
                  minHeight: 84,
                  borderRadius: 10,
                  border: `1px solid ${esHoy(dia) ? 'var(--teal)' : 'var(--line)'}`,
                  background: esHoy(dia) ? 'var(--teal-soft)' : 'transparent',
                  padding: 6,
                }}
              >
                <div className="mono" style={{ fontSize: 11, color: esHoy(dia) ? 'var(--teal-deep)' : 'var(--ink-faint)', fontWeight: esHoy(dia) ? 700 : 400 }}>
                  {dia}
                </div>
                {delDia.map(e => (
                  <div
                    key={e.key}
                    title={`${e.titulo} · ${e.contexto}`}
                    style={{
                      marginTop: 4, padding: '3px 5px', borderRadius: 6,
                      fontSize: 10.5, lineHeight: 1.3, fontWeight: 600,
                      background: e.tipo === 'curso' ? 'var(--gold-soft)' : 'var(--teal-soft)',
                      color: e.tipo === 'curso' ? 'var(--gold-deep)' : 'var(--teal-deep)',
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    }}
                  >
                    {e.titulo}
                  </div>
                ))}
              </div>
            )
          })}
        </div>
      </div>

      {delMes.length === 0 && (
        <div style={{ fontSize: 13, color: 'var(--ink-faint)', textAlign: 'center', marginTop: 16 }}>
          No tenés fechas agendadas en {label}.
        </div>
      )}
    </>
  )
}
