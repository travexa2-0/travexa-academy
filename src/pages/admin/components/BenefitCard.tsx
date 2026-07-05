import type { Benefit } from '@/types'
import { benefitTypeMeta, benefitValueLabel } from './benefitMeta'
import { formatDate } from '../format'

interface Props { benefit: Benefit; onClick: () => void }

function statusBadge(b: Benefit) {
  if (b.archivado) return <span className="badge badge-archived">Archivado</span>
  if (b.publicado) return <span className="badge badge-published">Publicado</span>
  return <span className="badge badge-draft">Borrador</span>
}

export default function BenefitCard({ benefit, onClick }: Props) {
  const meta = benefitTypeMeta(benefit.tipo)
  const valueLabel = benefitValueLabel(benefit.tipo, benefit.descuento_valor)
  const cupoLabel = benefit.cupo_maximo != null ? `${benefit.cupo_usado}/${benefit.cupo_maximo}` : `${benefit.cupo_usado} · sin límite`
  const vence = benefit.fecha_vencimiento ? `Vence ${formatDate(benefit.fecha_vencimiento)}` : 'Sin vencimiento'

  return (
    <article className="item-card" onClick={onClick} style={benefit.archivado ? { opacity: 0.72 } : (!benefit.publicado ? { borderColor: 'var(--gold-soft)' } : undefined)}>
      <div className="item-thumb">
        {benefit.imagen_url
          ? <img src={benefit.imagen_url} alt="" style={benefit.archivado ? { filter: 'grayscale(0.5)' } : undefined} />
          : <div style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg,#0A1E29,#16323F)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#8FA3AB', fontSize: 30 }}>
              {meta.icon}
            </div>}
        <div className="item-thumb-badges">
          {valueLabel ? <span className="badge badge-featured">{valueLabel}</span> : <span />}
          <span className="item-thumb-tag" style={{ background: meta.deep, color: '#fff', display: 'inline-flex', alignItems: 'center', gap: 5 }}>
            <span style={{ display: 'inline-flex', fontSize: 12 }}>{meta.icon}</span>{meta.label}
          </span>
        </div>
        {!benefit.archivado && (
          <span className="item-thumb-price">{benefit.costo_creditos > 0 ? `${benefit.costo_creditos} 🪙` : 'Gratis'}</span>
        )}
      </div>
      <div className="item-body">
        <span className="item-cat" style={{ color: meta.deep }}>{meta.label}</span>
        <h4 className="item-title">{benefit.titulo}</h4>
        <div className="item-meta">
          <span><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" /><circle cx="9" cy="7" r="3" /></svg>{cupoLabel}</span>
          <span><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" /></svg>{vence}</span>
        </div>
      </div>
      <div className="item-foot">
        {statusBadge(benefit)}
        <span style={{ fontSize: 11, color: benefit.publicado ? 'var(--ink-faint)' : 'var(--gold-deep)', fontWeight: benefit.publicado ? 400 : 600 }}>
          {benefit.publicado ? (benefit.course?.titulo ?? '') : 'Listo para preview →'}
        </span>
      </div>
    </article>
  )
}
