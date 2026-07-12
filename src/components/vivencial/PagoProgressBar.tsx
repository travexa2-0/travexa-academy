import { motion } from 'framer-motion'
import { EASE_OUT } from '@/lib/motion'

interface Props {
  total: number
  pagado: number
  /** Compacto para tarjetas chicas (perfil). */
  compact?: boolean
}

function fmtARS(n: number): string {
  return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(n)
}

/**
 * Barra de progreso de pago de un vivencial: Total / Pagado / Saldo pendiente.
 * Mismo criterio visual que la vista de liquidación del backoffice.
 */
export default function PagoProgressBar({ total, pagado, compact }: Props) {
  const saldo = Math.max(0, total - pagado)
  const pct = total > 0 ? Math.min(100, Math.round((pagado / total) * 100)) : 0
  const full = pct >= 100

  return (
    <div className={compact ? 'space-y-1.5' : 'space-y-2'}>
      <div className="grid grid-cols-3 gap-2">
        <div>
          <p className="font-mono text-[9px] uppercase tracking-wide" style={{ color: 'var(--text-3)' }}>Total</p>
          <p className="font-display font-bold" style={{ fontSize: compact ? '.82rem' : '.95rem', color: 'var(--text-1)' }}>{fmtARS(total)}</p>
        </div>
        <div>
          <p className="font-mono text-[9px] uppercase tracking-wide" style={{ color: 'var(--text-3)' }}>Pagado</p>
          <p className="font-display font-bold" style={{ fontSize: compact ? '.82rem' : '.95rem', color: 'var(--success)' }}>{fmtARS(pagado)}</p>
        </div>
        <div className="text-right">
          <p className="font-mono text-[9px] uppercase tracking-wide" style={{ color: 'var(--text-3)' }}>Saldo</p>
          <p className="font-display font-bold" style={{ fontSize: compact ? '.82rem' : '.95rem', color: full ? 'var(--success)' : 'var(--pending)' }}>{fmtARS(saldo)}</p>
        </div>
      </div>
      <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--card)' }}>
        <motion.div
          className="h-full rounded-full"
          style={{ background: full ? 'var(--success)' : 'var(--pending)' }}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.7, ease: EASE_OUT }}
        />
      </div>
    </div>
  )
}
