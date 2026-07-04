import { Link } from 'react-router-dom'
import type { Course } from '@/types'
import { Reveal } from './Reveal'

interface Props {
  vivencial: Course | null
  loading: boolean
}

function formatDateRange(salida: string | null, regreso: string | null): string {
  if (!salida) return ''
  const fmtDay = (d: string) => new Date(d).getUTCDate()
  const fmtFull = (d: string) =>
    new Date(d).toLocaleDateString('es-AR', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' })
      .replace('.', '').toUpperCase()
  if (regreso && new Date(regreso).getUTCMonth() === new Date(salida).getUTCMonth()) {
    return `${fmtDay(salida)}–${fmtFull(regreso)}`
  }
  return regreso ? `${fmtFull(salida)} – ${fmtFull(regreso)}` : fmtFull(salida)
}

// Headliner de vivencial. Trae el próximo vivencial publicado real; si no
// hay ninguno, muestra un estado vacío en vez del dato hardcodeado.
export default function VivencialHighlight({ vivencial, loading }: Props) {
  if (loading || !vivencial) {
    return (
      <section className="vivencial-hl">
        <div className="container">
          <Reveal>
            <div className="catalogo-empty" style={{ background: 'var(--content-white)' }}>
              <h4>{loading ? 'Buscando próximas salidas…' : 'Estamos armando el próximo vivencial'}</h4>
              <p>
                {loading
                  ? 'Un momento.'
                  : 'Los viajes educativos vuelven pronto. Registrate gratis para enterarte primero cuando abramos cupos.'}
              </p>
            </div>
          </Reveal>
        </div>
      </section>
    )
  }

  const photo = vivencial.fotos?.[0] ?? vivencial.thumbnail_url ?? undefined
  const cupoMax = vivencial.vivencial_cupo_maximo ?? 0
  const cupoDisp = vivencial.vivencial_cupo_disponible ?? 0
  const fillPct = cupoMax > 0 ? Math.max(0, Math.min(100, (cupoDisp / cupoMax) * 100)) : 0
  const dateRange = formatDateRange(vivencial.vivencial_fecha_salida, vivencial.vivencial_fecha_regreso)
  const ciudad = vivencial.vivencial_ciudad_salida

  return (
    <section className="vivencial-hl">
      <div className="container">
        <Reveal>
          <div className="vivencial-card">
            <div className="vivencial-text">
              <span className="vivencial-badge">✦ Vivencial</span>
              <h3>Conocé el destino <span>antes de venderlo.</span></h3>
              <p>
                Viajá con Yesica y otros asesores de toda Argentina. Volvé con fotos reales,
                contactos reales y un argumento de venta que ningún curso grabado te da.
              </p>
              <div className="vivencial-cta-row">
                <Link to="/vivencial" className="btn-lg">
                  Ver próximas salidas
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
                </Link>
              </div>
              <div className="vivencial-next">
                <div>
                  <div className="dest">{vivencial.titulo}</div>
                  {(dateRange || ciudad) && (
                    <div className="meta">
                      {dateRange}{dateRange && ciudad ? ' · ' : ''}{ciudad ? `SALE DESDE ${ciudad.toUpperCase()}` : ''}
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className="vivencial-photo" style={photo ? { backgroundImage: `url('${photo}')` } : undefined}>
              {cupoMax > 0 && (
                <div className="cupo-pill">
                  <div className="l">CUPO</div>
                  <div className="bar"><div className="bar-fill" style={{ width: `${fillPct}%` }} /></div>
                  <div className="n">{cupoDisp} de {cupoMax} disponibles</div>
                </div>
              )}
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  )
}
