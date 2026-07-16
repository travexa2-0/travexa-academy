import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import NumberFlow from '@number-flow/react'
import { useInstructorSelf } from '@/hooks/useInstructorSelf'
import { useOwnCourses, useOwnSales, useOwnLiveLessons } from '@/hooks/instructor/useInstructorCourses'
import { useOwnPayouts } from '@/hooks/instructor/useInstructorPayouts'
import { formatArs } from '../admin/format'
import { currentPeriodKey, gananciaDe, periodKey, periodLabel } from './earnings'

interface UpcomingItem {
  key: string
  titulo: string
  contexto: string
  fecha: string
}

export default function InstructorResumen() {
  const navigate = useNavigate()
  const { instructor } = useInstructorSelf()
  const share = instructor?.revenue_share_pct ?? 0

  const { data: cursos, isLoading } = useOwnCourses(instructor?.id)
  const courseIds = useMemo(() => cursos?.map(c => c.id), [cursos])
  const { data: sales } = useOwnSales(!!instructor?.id)
  const { data: lessons } = useOwnLiveLessons(courseIds)
  const { data: payouts } = useOwnPayouts(instructor?.id)

  const mesActual = currentPeriodKey()
  const ventasMes = useMemo(() => (sales ?? []).filter(s => periodKey(s.created_at) === mesActual), [sales, mesActual])
  const gananciaMes = gananciaDe(ventasMes)

  // Próximas fechas: cursos en vivo + clases en vivo dentro de cursos grabados.
  const proximos = useMemo<UpcomingItem[]>(() => {
    const ahora = new Date()
    const tituloDe = (courseId: string) => cursos?.find(c => c.id === courseId)?.titulo ?? 'Curso'

    const deCursos: UpcomingItem[] = (cursos ?? [])
      .filter(c => c.tipo === 'en_vivo' && c.live_date && new Date(c.live_date) >= ahora)
      .map(c => ({ key: `c-${c.id}`, titulo: c.titulo, contexto: 'Curso en vivo', fecha: c.live_date! }))

    const deClases: UpcomingItem[] = (lessons ?? [])
      .filter(l => new Date(l.fecha_vivo) >= ahora)
      .map(l => ({ key: `l-${l.id}`, titulo: l.titulo, contexto: tituloDe(l.course_id), fecha: l.fecha_vivo }))

    return [...deCursos, ...deClases].sort((a, b) => (a.fecha < b.fecha ? -1 : 1)).slice(0, 5)
  }, [cursos, lessons])

  const ultimoPayout = (payouts ?? [])[0] ?? null

  if (isLoading) {
    return <div style={{ color: 'var(--ink-faint)', padding: '40px 0', textAlign: 'center' }}>Cargando…</div>
  }

  const sinCursos = (cursos ?? []).length === 0

  return (
    <>
      <div className="page-head">
        <div>
          <div className="page-eyebrow">Panel</div>
          <h1 className="page-title">Hola, {instructor?.nombre?.split(' ')[0] ?? 'instructor'} 👋</h1>
          <p className="page-sub">Así viene tu mes en Travexa Academy.</p>
        </div>
      </div>

      {sinCursos ? (
        <div className="card" style={{ textAlign: 'center', padding: '56px 24px' }}>
          <div style={{ fontSize: 40, marginBottom: 8 }}>🎓</div>
          <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 20, color: 'var(--ink)' }}>
            Todavía no tenés cursos asignados
          </h3>
          <p style={{ color: 'var(--ink-soft)', fontSize: 14, maxWidth: 440, margin: '8px auto 0' }}>
            Cuando el equipo de Travexa cargue un curso a tu nombre, acá vas a ver ventas,
            ganancia proyectada y tus próximas fechas.
          </p>
        </div>
      ) : (
        <>
          <div className="kpi-grid">
            <div className="kpi-card">
              <div className="kpi-top"><span className="kpi-label">Ventas del mes</span></div>
              <div className="kpi-value"><NumberFlow value={ventasMes.length} /></div>
              <div className="kpi-foot"><span className="kpi-period">{periodLabel(mesActual)}</span></div>
            </div>
            <div className="kpi-card">
              <div className="kpi-top"><span className="kpi-label">Tu ganancia proyectada</span></div>
              <div className="kpi-value"><NumberFlow value={gananciaMes} prefix="$" /><span className="unit">ARS</span></div>
              <div className="kpi-foot"><span className="kpi-period">{share}% · se cierra a fin de mes</span></div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1.7fr 1fr', gap: 16, marginTop: 4, alignItems: 'start' }}>
            <div className="card">
              <div className="card-head"><h3>Tus próximas fechas</h3></div>
              <div className="card-pad">
                {proximos.length === 0 ? (
                  <div style={{ fontSize: 13, color: 'var(--ink-faint)', padding: '8px 0' }}>
                    No tenés clases en vivo agendadas.
                  </div>
                ) : proximos.map(p => (
                  <div className="feed-item" key={p.key}>
                    <div className="feed-line"><span className="feed-dot" /></div>
                    <div>
                      <div className="feed-text">{p.titulo}</div>
                      <div className="feed-time">
                        {p.contexto} · {new Date(p.fecha).toLocaleDateString('es-AR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="card">
              <div className="card-head"><h3>Última liquidación</h3></div>
              <div className="card-pad" style={{ padding: '16px 20px 18px' }}>
                {!ultimoPayout ? (
                  <div style={{ fontSize: 13, color: 'var(--ink-faint)' }}>
                    Todavía no hay ningún mes cerrado. Cuando Travexa cierre tu primer período,
                    lo vas a ver acá.
                  </div>
                ) : (
                  <>
                    <div className="mono" style={{ fontSize: 11.5, color: 'var(--ink-faint)', textTransform: 'capitalize' }}>
                      {periodLabel(ultimoPayout.periodo.slice(0, 7))}
                    </div>
                    <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 24, color: 'var(--ink)', marginTop: 4 }}>
                      {formatArs(ultimoPayout.monto_instructor_ars)}
                    </div>
                    <div style={{ marginTop: 10 }}>
                      {ultimoPayout.pagado
                        ? <span className="badge badge-published">Pagado</span>
                        : <span className="badge badge-draft">Pendiente de pago</span>}
                    </div>
                    <button className="btn btn-secondary btn-sm" style={{ marginTop: 14 }} onClick={() => navigate('/instructor/pagos')}>
                      Ver mis pagos
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </>
  )
}
