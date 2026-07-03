import { useNavigate } from 'react-router-dom'
import NumberFlow from '@number-flow/react'
import { useAdminSummary, useRevenueSeries, useRecentActivity } from '@/hooks/admin/useAdminSummary'
import { useAdminCourses } from '@/hooks/admin/useAdminCourses'
import { formatArs, formatNum, daysBetween } from './format'
import type { Course } from '@/types'

function RevenueChart({ points }: { points: number[] }) {
  const max = Math.max(1, ...points)
  const w = 600, h = 170
  const stepX = points.length > 1 ? w / (points.length - 1) : w
  const coords = points.map((v, i) => [i * stepX, h - (v / max) * (h - 20) - 10] as const)
  const line = coords.map((c, i) => `${i === 0 ? 'M' : 'L'}${c[0].toFixed(0)},${c[1].toFixed(0)}`).join(' ')
  const area = `M0,${h} L${coords.map(c => `${c[0].toFixed(0)},${c[1].toFixed(0)}`).join(' L')} L${w},${h} Z`
  return (
    <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" style={{ width: '100%', height: 170, overflow: 'visible' }}>
      <defs>
        <linearGradient id="gradIngresos" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#4ECDB8" stopOpacity="0.25" />
          <stop offset="100%" stopColor="#4ECDB8" stopOpacity="0" />
        </linearGradient>
      </defs>
      <g stroke="#E4E5DF" strokeWidth="1">
        <line x1="0" y1="30" x2={w} y2="30" /><line x1="0" y1="80" x2={w} y2="80" /><line x1="0" y1="130" x2={w} y2="130" />
      </g>
      <path d={area} fill="url(#gradIngresos)" />
      <path d={line} fill="none" stroke="#0B6B57" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export default function Resumen() {
  const navigate = useNavigate()
  const { data: kpis } = useAdminSummary()
  const { data: series } = useRevenueSeries()
  const { data: activity } = useRecentActivity()
  const { data: cursos } = useAdminCourses(['grabado', 'en_vivo'])
  const { data: vivenciales } = useAdminCourses(['vivencial'])

  const totalContenido = (cursos?.length ?? 0) + (vivenciales?.length ?? 0)
  const loadingCounts = cursos === undefined || vivenciales === undefined

  // Empty state: no content loaded yet — the real state of the DB today.
  if (!loadingCounts && totalContenido === 0) {
    return (
      <>
        <div className="page-head">
          <div>
            <div className="page-eyebrow">Panel</div>
            <h1 className="page-title">Hola 👋</h1>
            <p className="page-sub">Todavía no cargaste contenido. Empezá por tu primer curso o vivencial y el panel va a cobrar vida.</p>
          </div>
        </div>
        <div className="card" style={{ textAlign: 'center', padding: '56px 24px', marginTop: 8 }}>
          <div style={{ fontSize: 40, marginBottom: 8 }}>🎓</div>
          <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 20, color: 'var(--ink)' }}>Todavía no cargaste tu primer curso</h3>
          <p style={{ color: 'var(--ink-soft)', fontSize: 14, maxWidth: 440, margin: '8px auto 22px' }}>
            Cuando publiques contenido, acá vas a ver ingresos, ventas, alumnos nuevos y alertas accionables — todo con datos reales.
          </p>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
            <button className="btn btn-secondary btn-sm" onClick={() => navigate('/admin/vivenciales?nuevo=1')}>Nuevo vivencial</button>
            <button className="btn btn-primary btn-sm" onClick={() => navigate('/admin/cursos?nuevo=1')}>Nuevo curso</button>
          </div>
        </div>
      </>
    )
  }

  // ── Alerts (real, derived from content) ──
  const all: Course[] = [...(cursos ?? []), ...(vivenciales ?? [])]
  const cupoBajo = (vivenciales ?? []).filter(v => v.publicado && !v.archivado && (v.vivencial_cupo_disponible ?? 0) > 0 && (v.vivencial_cupo_disponible ?? 0) <= 5)
  const borradoresViejos = all.filter(c => !c.publicado && !c.archivado && daysBetween(c.created_at) >= 5)
  const instructoresSinShare = all.filter(c => c.publicado && c.instructor && c.instructor.revenue_share_pct === 0 && c.instructor.nombre)
  const instructorNames = [...new Set(instructoresSinShare.map(c => c.instructor!.nombre))]
  const hasAlerts = cupoBajo.length > 0 || borradoresViejos.length > 0 || instructorNames.length > 0

  const proximoViv = (vivenciales ?? [])
    .filter(v => v.publicado && v.vivencial_fecha_salida && new Date(v.vivencial_fecha_salida) >= new Date())
    .sort((a, b) => (a.vivencial_fecha_salida! < b.vivencial_fecha_salida! ? -1 : 1))[0]

  const seriesPoints = (series ?? []).map(s => s.ars)
  const seriesTotal = seriesPoints.reduce((a, b) => a + b, 0)

  return (
    <>
      <div className="page-head">
        <div>
          <div className="page-eyebrow">Panel</div>
          <h1 className="page-title">Hola 👋</h1>
          <p className="page-sub">Así viene el mes. Acá vas a ver todo apenas empiecen a entrar las ventas.</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn btn-secondary btn-sm" onClick={() => navigate('/admin/vivenciales?nuevo=1')}>Nuevo vivencial</button>
          <button className="btn btn-primary btn-sm" onClick={() => navigate('/admin/cursos?nuevo=1')}>Nuevo curso</button>
        </div>
      </div>

      {/* KPI ROW */}
      <div className="kpi-grid">
        <div className="kpi-card">
          <div className="kpi-top"><span className="kpi-label">Ingresos del mes</span><div className="kpi-icon teal"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="6" width="20" height="13" rx="2" /><path d="M2 10h20M6 15h4" /></svg></div></div>
          <div className="kpi-value"><NumberFlow value={kpis?.ingresosMesArs ?? 0} prefix="$" /><span className="unit">ARS</span></div>
          <div className="kpi-foot"><span className="kpi-period">este mes</span></div>
        </div>
        <div className="kpi-card">
          <div className="kpi-top"><span className="kpi-label">Ventas</span><div className="kpi-icon teal"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="9" cy="20" r="1.4" /><circle cx="18" cy="20" r="1.4" /><path d="M2 3h2l2.4 12.4a2 2 0 002 1.6h8.6a2 2 0 002-1.6L21 7H6" /></svg></div></div>
          <div className="kpi-value"><NumberFlow value={kpis?.ventasMes ?? 0} /></div>
          <div className="kpi-foot"><span className="kpi-period">este mes</span></div>
        </div>
        <div className="kpi-card">
          <div className="kpi-top"><span className="kpi-label">Alumnos nuevos</span><div className="kpi-icon gold"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="9" cy="8" r="3.2" /><path d="M2 20c0-3.6 3-6 7-6s7 2.4 7 6" /><path d="M17 8.5a3 3 0 010 5.9M22 20c0-2.8-1.9-4.9-4.5-5.6" /></svg></div></div>
          <div className="kpi-value"><NumberFlow value={kpis?.alumnosNuevosMes ?? 0} /></div>
          <div className="kpi-foot"><span className="kpi-period">registrados este mes</span></div>
        </div>
        <div className="kpi-card">
          <div className="kpi-top"><span className="kpi-label">Cursos</span><div className="kpi-icon teal"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M4 5.5C4 4.7 4.7 4 5.5 4H12v16H5.5A1.5 1.5 0 014 18.5v-13z" /><path d="M20 5.5c0-.8-.7-1.5-1.5-1.5H12v16h6.5a1.5 1.5 0 001.5-1.5v-13z" /></svg></div></div>
          <div className="kpi-value"><NumberFlow value={kpis?.cursosPublicados ?? 0} /></div>
          <div className="kpi-foot"><span className="kpi-period">publicados · {formatNum(kpis?.cursosBorrador)} en borrador</span></div>
        </div>
        <div className="kpi-card">
          <div className="kpi-top"><span className="kpi-label">Vivenciales</span><div className="kpi-icon gold"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M3 11l18-7-7 18-2.5-7L3 11z" /></svg></div></div>
          <div className="kpi-value"><NumberFlow value={kpis?.vivencialesCupoAbierto ?? 0} /></div>
          <div className="kpi-foot"><span className="kpi-period">con cupo abierto ahora</span></div>
        </div>
      </div>

      {/* CHART + SIDE COLUMN */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.7fr 1fr', gap: 16, marginTop: 4, alignItems: 'start' }}>
        <div className="card">
          <div className="card-head">
            <div><h3>Ingresos — últimos 6 meses</h3><div className="sub">{seriesTotal > 0 ? `${formatArs(seriesTotal)} acumulados` : 'Sin ventas todavía'}</div></div>
          </div>
          <div className="card-pad" style={{ paddingTop: 18 }}>
            <RevenueChart points={seriesPoints.length ? seriesPoints : [0, 0, 0, 0, 0, 0]} />
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6, fontFamily: 'var(--font-mono)', fontSize: 10.5, color: 'var(--ink-faint)' }}>
              {(series ?? []).map((s, i) => <span key={i}>{s.label}</span>)}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="card">
            <div className="card-head"><h3>Necesita tu atención</h3></div>
            <div className="card-pad" style={{ padding: '8px 20px 14px' }}>
              {!hasAlerts && <div style={{ fontSize: 13, color: 'var(--ink-faint)', padding: '10px 0' }}>Todo en orden por ahora. 🎉</div>}
              {cupoBajo.map(v => (
                <div className="alert-item" key={v.id}>
                  <div className="alert-dot clay"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 9v4M12 17h.01M10.3 3.9L1.8 18a2 2 0 001.7 3h17a2 2 0 001.7-3L13.7 3.9a2 2 0 00-3.4 0z" /></svg></div>
                  <div className="alert-text">A <b>{v.titulo}</b> le quedan {v.vivencial_cupo_disponible} lugares libres<span className="sub">de {v.vivencial_cupo_maximo ?? '—'} totales</span></div>
                </div>
              ))}
              {borradoresViejos.length > 0 && (
                <div className="alert-item">
                  <div className="alert-dot gold"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 3" /></svg></div>
                  <div className="alert-text"><b>{borradoresViejos.length} {borradoresViejos.length === 1 ? 'contenido sigue' : 'contenidos siguen'}</b> en borrador hace más de 5 días<span className="sub">{borradoresViejos.slice(0, 3).map(c => c.titulo).join(' · ')}</span></div>
                </div>
              )}
              {instructorNames.map(nombre => (
                <div className="alert-item" key={nombre}>
                  <div className="alert-dot teal"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2l2.6 6.6L21 11l-6.4 2.4L12 20l-2.6-6.6L3 11l6.4-2.4z" /></svg></div>
                  <div className="alert-text"><b>{nombre}</b> no tiene revenue share cargado<span className="sub">Tiene cursos publicados a su nombre</span></div>
                </div>
              ))}
            </div>
          </div>

          {proximoViv && (
            <div className="card">
              <div className="card-head"><h3>Próximo vivencial</h3></div>
              <div className="card-pad" style={{ padding: '16px 18px 18px' }}>
                <div style={{ borderRadius: 12, overflow: 'hidden', border: '1px solid var(--line)' }}>
                  <div style={{ height: 74, background: proximoViv.thumbnail_url ? `#0A1E29 url('${proximoViv.thumbnail_url}') center/cover` : 'linear-gradient(135deg,#0A1E29,#0F2C3B)' }} />
                  <div style={{ padding: '11px 13px' }}>
                    <div style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 13 }}>{proximoViv.titulo}</div>
                    <div style={{ fontSize: 11.4, color: 'var(--ink-faint)', marginTop: 2 }}>Sale {new Date(proximoViv.vivencial_fecha_salida!).toLocaleDateString('es-AR', { day: 'numeric', month: 'short' })}</div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ACTIVITY */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.7fr 1fr', gap: 16, marginTop: 16 }}>
        <div className="card">
          <div className="card-head"><h3>Actividad reciente</h3></div>
          <div className="card-pad">
            {(activity ?? []).length === 0 && <div style={{ fontSize: 13, color: 'var(--ink-faint)', padding: '8px 0' }}>Cuando entren pagos e inscripciones, los vas a ver acá.</div>}
            {(activity ?? []).map(a => (
              <div className="feed-item" key={a.kind + a.id}>
                <div className="feed-line"><span className="feed-dot" style={a.kind === 'inscripcion' ? { background: 'var(--gold)' } : undefined} /></div>
                <div>
                  <div className="feed-text">{a.kind === 'pago' ? 'Pago recibido' : 'Nueva inscripción'}</div>
                  <div className="feed-time">{new Date(a.at).toLocaleDateString('es-AR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}{a.montoArs ? ` · ${formatArs(a.montoArs)}` : ''}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  )
}
