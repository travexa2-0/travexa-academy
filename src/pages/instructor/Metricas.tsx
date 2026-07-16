import { useMemo } from 'react'
import { useInstructorSelf } from '@/hooks/useInstructorSelf'
import { useOwnSales } from '@/hooks/instructor/useInstructorCourses'
import { useOwnPayouts } from '@/hooks/instructor/useInstructorPayouts'
import { formatArs } from '../admin/format'
import { periodKey, periodLabel } from './earnings'

interface MonthRow {
  key: string
  ventas: number
  alumnos: number
  ganancia: number
  cerrado: boolean
}

export default function InstructorMetricas() {
  const { instructor } = useInstructorSelf()
  const share = instructor?.revenue_share_pct ?? 0

  const { data: sales, isLoading } = useOwnSales(!!instructor?.id)
  const { data: payouts } = useOwnPayouts(instructor?.id)

  // Un mes es "cerrado" cuando existe su payout: ahí la ganancia deja de ser proyección
  // y pasa a ser el monto que liquidó Travexa. La proyección del mes en curso suma las
  // ganancias por venta (ya con el share aplicado) y redondea al final.
  const rows = useMemo<MonthRow[]>(() => {
    const porMes = new Map<string, { ventas: number; alumnos: Set<string>; ganancia: number }>()

    for (const s of sales ?? []) {
      const k = periodKey(s.created_at)
      const acc = porMes.get(k) ?? { ventas: 0, alumnos: new Set<string>(), ganancia: 0 }
      acc.ventas += 1
      acc.alumnos.add(s.user_id)
      acc.ganancia += s.ganancia_ars
      porMes.set(k, acc)
    }

    const payoutPorMes = new Map((payouts ?? []).map(p => [p.periodo.slice(0, 7), p]))

    return [...porMes.entries()]
      .sort((a, b) => (a[0] < b[0] ? 1 : -1))
      .map(([key, v]) => {
        const payout = payoutPorMes.get(key)
        return {
          key,
          ventas: v.ventas,
          alumnos: v.alumnos.size,
          ganancia: payout ? payout.monto_instructor_ars : Math.round(v.ganancia),
          cerrado: !!payout,
        }
      })
  }, [sales, payouts])

  const totalGanancia = rows.reduce((a, r) => a + r.ganancia, 0)
  const totalVentas = rows.reduce((a, r) => a + r.ventas, 0)

  if (isLoading) {
    return <div style={{ color: 'var(--ink-faint)', padding: '40px 0', textAlign: 'center' }}>Cargando…</div>
  }

  return (
    <>
      <div className="page-head">
        <div>
          <div className="page-eyebrow">Negocio</div>
          <h1 className="page-title">Métricas</h1>
          <p className="page-sub">
            Mes a mes. Los meses cerrados muestran la ganancia liquidada; el mes en curso,
            una proyección sobre las ventas aprobadas hasta hoy.
          </p>
        </div>
      </div>

      {rows.length === 0 ? (
        <div className="grid-empty">
          <div className="empty-state">
            <div className="empty-state-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M4 20V10M12 20V4M20 20v-7" /></svg>
            </div>
            <h4>Todavía no hay ventas</h4>
            <p>Cuando entre el primer pago aprobado de alguno de tus cursos, vas a ver el detalle acá.</p>
          </div>
        </div>
      ) : (
        <>
          <div className="card" style={{ marginBottom: 16 }}>
            <div style={{ overflowX: 'auto' }}>
              <table className="tbl">
                <thead>
                  <tr>
                    <th>Mes</th>
                    <th className="align-right">Cursos vendidos</th>
                    <th className="align-right">Alumnos</th>
                    <th className="align-right">Tu ganancia</th>
                    <th>Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map(r => (
                    <tr key={r.key}>
                      <td style={{ fontWeight: 600, color: 'var(--ink)', textTransform: 'capitalize' }}>{periodLabel(r.key)}</td>
                      <td className="num align-right">{r.ventas}</td>
                      <td className="num align-right">{r.alumnos}</td>
                      <td className="num align-right" style={{ fontWeight: 600 }}>{formatArs(r.ganancia)}</td>
                      <td>
                        {r.cerrado
                          ? <span className="badge badge-published">Cerrado</span>
                          : <span className="badge badge-draft">Proyectado</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="stat-mini-grid">
            <div className="stat-mini">
              <div className="v">{totalVentas}</div>
              <div className="l">Ventas totales</div>
            </div>
            <div className="stat-mini">
              <div className="v">{formatArs(totalGanancia)}</div>
              <div className="l">Ganancia acumulada</div>
            </div>
            <div className="stat-mini">
              <div className="v">{share}%</div>
              <div className="l">Tu revenue share</div>
            </div>
          </div>
        </>
      )}
    </>
  )
}
