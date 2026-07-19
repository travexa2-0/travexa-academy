import { useAdminMetrics, useBenefitsMetrics } from '@/hooks/admin/useAdminMetrics'
import { useAdminSettings } from '@/hooks/admin/useAdminSettings'
import { useRevenueSeries } from '@/hooks/admin/useAdminSummary'
import { useAdminUI } from './adminContext'
import { formatArs, formatNum } from './format'

function BarChart({ points, labels }: { points: number[]; labels: string[] }) {
  const max = Math.max(1, ...points)
  const w = 640, h = 200, base = 170
  const slot = w / points.length
  return (
    <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" style={{ width: '100%', height: 200, overflow: 'visible' }}>
      <g stroke="#E4E5DF" strokeWidth="1"><line x1="0" y1="40" x2={w} y2="40" /><line x1="0" y1="95" x2={w} y2="95" /><line x1="0" y1="150" x2={w} y2="150" /></g>
      <line x1="0" y1={base} x2={w} y2={base} stroke="#D2D5CB" strokeWidth="1.5" />
      {points.map((v, i) => {
        const height = (v / max) * (base - 20)
        return <rect key={i} x={i * slot + slot / 2 - 12} y={base - height} width={24} height={Math.max(0, height)} rx={3} fill="#4ECDB8" />
      })}
      {labels.map((l, i) => <text key={i} x={i * slot + slot / 2} y={h - 2} textAnchor="middle" fontSize="10.5" fill="#93A6AC" fontFamily="var(--font-mono)">{l}</text>)}
    </svg>
  )
}

export default function Metricas() {
  const { openSettings } = useAdminUI()
  const { data: settings } = useAdminSettings()
  const { data: metrics } = useAdminMetrics(settings?.comision_mp_pct ?? 5.5)
  const { data: series } = useRevenueSeries()
  const { data: ben } = useBenefitsMetrics()

  const totalVentas = (metrics?.buyers ?? []).reduce((n, b) => n + b.compras, 0)
  const ticket = totalVentas > 0 ? (metrics?.ingresoBrutoArs ?? 0) / totalVentas : 0
  const inversion = settings?.inversion_marketing_mensual_ars ?? 0
  const roi = inversion > 0 ? (metrics?.netoArs ?? 0) / inversion : null
  const completion = metrics && metrics.leccionesTotales > 0 ? Math.round((metrics.leccionesCompletadas / metrics.leccionesTotales) * 100) : 0
  const funnel = metrics?.funnel

  return (
    <>
      <div className="page-head">
        <div>
          <div className="page-eyebrow">Negocio · Academy</div>
          <h1 className="page-title">Métricas</h1>
          <p className="page-sub">Plata, gente y uso real de la plataforma. No solo qué se vendió más — qué deja más.</p>
        </div>
      </div>

      <div className="kpi-grid" style={{ gridTemplateColumns: 'repeat(4,1fr)' }}>
        <div className="kpi-card accent-teal">
          <div className="kpi-top"><span className="kpi-label">Ingresos totales</span><div className="kpi-icon teal"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="6" width="20" height="13" rx="2" /><path d="M2 10h20M6 15h4" /></svg></div></div>
          <div className="kpi-value">{formatArs(metrics?.ingresoBrutoArs)}<span className="unit">ARS</span></div>
          <div className="kpi-foot"><span className="kpi-period">pagos aprobados</span></div>
        </div>
        <div className="kpi-card accent-teal">
          <div className="kpi-top"><span className="kpi-label">Ingreso neto real</span><div className="kpi-icon teal"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 12a8 8 0 11-8-8" /><path d="M20 4L12 12" /></svg></div></div>
          <div className="kpi-value">{formatArs(metrics?.netoArs)}<span className="unit">ARS</span></div>
          <div className="kpi-foot"><span className="kpi-period">después de rev. share + comisión MP</span></div>
        </div>
        <div className="kpi-card">
          <div className="kpi-top"><span className="kpi-label">Ticket promedio</span><div className="kpi-icon gold"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="9" cy="20" r="1.4" /><circle cx="18" cy="20" r="1.4" /><path d="M2 3h2l2.4 12.4a2 2 0 002 1.6h8.6a2 2 0 002-1.6L21 7H6" /></svg></div></div>
          <div className="kpi-value">{formatArs(ticket)}<span className="unit">ARS</span></div>
          <div className="kpi-foot"><span className="kpi-period">{formatNum(totalVentas)} transacciones</span></div>
        </div>
        <div className="kpi-card accent-gold">
          <div className="kpi-top"><span className="kpi-label">ROI marketing</span><div className="kpi-icon gold"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2l2.6 6.6L21 11l-6.4 2.4L12 20l-2.6-6.6L3 11l6.4-2.4z" /></svg></div></div>
          <div className="kpi-value">{roi != null ? `${roi.toFixed(1)}x` : '—'}</div>
          <div className="kpi-foot"><span className="kpi-period">{formatArs(inversion)} invertidos — <a href="#" onClick={e => { e.preventDefault(); openSettings() }} style={{ color: 'var(--teal-deep)', fontWeight: 600 }}>{inversion > 0 ? 'editar' : 'cargar'}</a></span></div>
        </div>
      </div>

      <div className="card" style={{ marginTop: 4 }}>
        <div className="card-head"><div><h3>Ingresos por mes</h3><div className="sub">Últimos 6 meses (pagos aprobados)</div></div></div>
        <div className="card-pad" style={{ paddingTop: 20 }}>
          <BarChart points={(series ?? []).map(s => s.ars)} labels={(series ?? []).map(s => s.label)} />
        </div>
      </div>

      <div className="card" style={{ marginTop: 16 }}>
        <div className="card-head"><div><h3>Rentabilidad por instructor</h3><div className="sub">Bruto menos revenue share; la comisión MP se descuenta del neto global</div></div></div>
        <div style={{ overflowX: 'auto' }}>
          <table className="tbl">
            <thead><tr><th>Instructor</th><th>Ventas</th><th>Bruto</th><th>Rev. share</th><th>Neto instructor</th></tr></thead>
            <tbody>
              {(metrics?.instructors ?? []).length === 0
                ? <tr><td colSpan={5} style={{ color: 'var(--ink-faint)', padding: 16 }}>Sin ventas con instructor asignado todavía.</td></tr>
                : (metrics?.instructors ?? []).map(r => (
                    <tr key={r.instructorId}>
                      <td><b>{r.nombre}</b></td>
                      <td className="num">{r.ventas}</td>
                      <td className="num">{formatArs(r.brutoArs)}</td>
                      <td className="num" style={{ color: r.shareArs > 0 ? 'var(--clay-deep)' : 'var(--ink-faint)' }}>{r.shareArs > 0 ? `−${formatArs(r.shareArs)}` : '$0'} ({r.revenueSharePct}%)</td>
                      <td className="num"><b>{formatArs(r.brutoArs - r.shareArs)}</b></td>
                    </tr>
                  ))}
            </tbody>
          </table>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 16, marginTop: 16, alignItems: 'start' }}>
        <div className="card">
          <div className="card-head"><div><h3>Mejores compradores</h3><div className="sub">Por gasto total</div></div></div>
          <table className="tbl">
            <thead><tr><th>Cliente</th><th>Compras</th><th>Gastado</th></tr></thead>
            <tbody>
              {(metrics?.buyers ?? []).length === 0
                ? <tr><td colSpan={3} style={{ color: 'var(--ink-faint)', padding: 16 }}>Todavía no hay compras.</td></tr>
                : (metrics?.buyers ?? []).map(b => (
                    <tr key={b.userId}>
                      <td><div className="row-flex"><div className="tbl-avatar">{b.nombre.slice(0, 2).toUpperCase()}</div><b>{b.nombre}</b></div></td>
                      <td className="num">{b.compras}</td>
                      <td className="num"><b>{formatArs(b.totalArs)}</b></td>
                    </tr>
                  ))}
            </tbody>
          </table>
        </div>

        <div className="card">
          <div className="card-head"><h3>Uso de la plataforma</h3></div>
          <div className="card-pad">
            {funnel && funnel.registrados > 0 ? (
              <>
                <FunnelBar label="Registrados" value={funnel.registrados} total={funnel.registrados} />
                <FunnelBar label="Completaron datos de asesor" value={funnel.conPerfil} total={funnel.registrados} />
                <FunnelBar label="Onboarding completo" value={funnel.completos} total={funnel.registrados} />
              </>
            ) : <div style={{ fontSize: 13, color: 'var(--ink-faint)', marginBottom: 14 }}>Sin registros todavía.</div>}
            <div className="stat-mini-grid" style={{ gridTemplateColumns: '1fr 1fr', marginBottom: 0 }}>
              <div className="stat-mini"><div className="v">{completion}%</div><div className="l">Lecciones completadas</div></div>
              <div className="stat-mini"><div className="v">{metrics?.enrollmentsCompletados ?? 0}/{metrics?.enrollmentsTotales ?? 0}</div><div className="l">Cursos completados</div></div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Beneficios / Créditos ── */}
      <div className="card" style={{ marginTop: 18 }}>
        <div className="card-head"><div><h3>Beneficios</h3><div className="sub">Tienda de canjes por créditos</div></div></div>
        <div className="card-pad">
          <div className="stat-mini-grid" style={{ gridTemplateColumns: 'repeat(4,1fr)' }}>
            <div className="stat-mini"><div className="v">{formatNum(ben?.creditos_circulacion ?? 0)} 🪙</div><div className="l">Créditos en circulación</div></div>
            <div className="stat-mini"><div className="v">{formatNum(ben?.creditos_canjeados ?? 0)} 🪙</div><div className="l">Créditos canjeados</div></div>
            <div className="stat-mini"><div className="v">{formatNum(ben?.creditos_vencidos ?? 0)} 🪙</div><div className="l">Créditos vencidos</div></div>
            <div className="stat-mini"><div className="v">{formatNum(ben?.canjes_totales ?? 0)}</div><div className="l">Canjes totales</div></div>
          </div>
          <div className="grid-2" style={{ marginTop: 16 }}>
            <div>
              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink-soft)', marginBottom: 8 }}>Canjes por tipo</div>
              {(ben?.canjes_por_tipo ?? []).length === 0
                ? <div style={{ fontSize: 12.5, color: 'var(--ink-faint)' }}>Sin canjes todavía.</div>
                : (ben?.canjes_por_tipo ?? []).map(t => (
                    <div key={t.tipo} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5, padding: '5px 0', borderBottom: '1px solid var(--line)' }}>
                      <span>{TIPO_LABELS[t.tipo] ?? t.tipo}</span><b className="mono">{formatNum(t.count)}</b>
                    </div>
                  ))}
            </div>
            <div>
              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink-soft)', marginBottom: 8 }}>Top 5 beneficios</div>
              {(ben?.top_beneficios ?? []).length === 0
                ? <div style={{ fontSize: 12.5, color: 'var(--ink-faint)' }}>Sin canjes todavía.</div>
                : (ben?.top_beneficios ?? []).map((t, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', gap: 10, fontSize: 12.5, padding: '5px 0', borderBottom: '1px solid var(--line)' }}>
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.titulo}</span><b className="mono">{formatNum(t.count)}</b>
                    </div>
                  ))}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

const TIPO_LABELS: Record<string, string> = {
  curso_gratis: 'Cursos gratis',
  descuento_pct: 'Descuentos %',
  descuento_fijo: 'Descuentos fijos',
  sorteo_vivencial: 'Sorteos',
  otro: 'Otros',
}

function FunnelBar({ label, value, total }: { label: string; value: number; total: number }) {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0
  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 6 }}><span>{label}</span><b className="mono">{pct}%</b></div>
      <div className="cupo-bar-track"><div className={`cupo-bar-fill${pct < 75 ? ' low' : ''}`} style={{ width: `${pct}%` }} /></div>
    </div>
  )
}
