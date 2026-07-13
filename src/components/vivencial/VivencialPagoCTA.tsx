import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { ArrowRightLeft, CheckCircle2, Clock, Plane, CreditCard } from 'lucide-react'
import { useVivencialPaymentsFor } from '@/hooks/useVivencialPago'
import { loginRedirect } from '@/lib/utils'
import TransferModal from './TransferModal'
import PuntoSalidaModal from './PuntoSalidaModal'
import type { Course, Enrollment } from '@/types'

type Variant = 'cta-card' | 'boarding' | 'perfil'

interface Props {
  course: Course
  enrollment: Enrollment | null
  userId?: string
  variant?: Variant
  /** Se dispara cuando cambia algo (envío de comprobante) para refrescar la página host. */
  onChanged?: () => void
}

function fmtARS(n: number): string {
  return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(n)
}

function fmtFechaLimite(d: string): string {
  const [y, m, day] = d.split('-').map(Number)
  return new Date(y, m - 1, day).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit' })
}

export default function VivencialPagoCTA({ course, enrollment, userId, variant = 'cta-card', onChanged }: Props) {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { data: payments } = useVivencialPaymentsFor(enrollment?.id)

  const [modalMode, setModalMode] = useState<'sena' | 'saldo' | null>(null)
  const [showPunto, setShowPunto] = useState(false)

  const total = enrollment?.monto_total_ars ?? course.precio_ars ?? 0
  const pagado = enrollment?.monto_señado_ars ?? 0
  const pendiente = enrollment?.monto_pendiente_ars ?? Math.max(0, total - pagado)
  const pagoCompletado = enrollment?.pago_completado ?? false
  const hasEnrollment = !!enrollment?.activo

  const hasPendingComprobante = (payments ?? []).some(p => p.estado === 'pendiente')
  const señaSugerida = course.vivencial_precio_seña_ars ?? 0

  const btnPrimary = { background: 'var(--primary)', color: 'var(--text-1)' } as const
  const showSaldoLine = variant !== 'boarding'

  const openComprobante = () => setModalMode(pagado > 0 ? 'saldo' : 'sena')

  // ── Estado: pago completado ─────────────────────────────────────
  if (hasEnrollment && pagoCompletado) {
    return (
      <div className="flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm" style={{ background: 'var(--success-s)', color: 'var(--success)' }}>
        <CheckCircle2 className="h-4 w-4" /> Viaje pagado
      </div>
    )
  }

  // ── Estado: inscripto (con o sin pagos) → informar transferencia ─
  if (hasEnrollment) {
    return (
      <div className="space-y-2.5">
        {showSaldoLine && (
          <div className="flex items-baseline justify-between">
            <span className="text-sm" style={{ color: 'var(--text-3)' }}>Saldo pendiente</span>
            <span className="font-display font-bold text-lg" style={{ color: 'var(--text-1)' }}>{fmtARS(pendiente)}</span>
          </div>
        )}

        {hasPendingComprobante ? (
          <div className="flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-medium" style={{ background: 'var(--pending-s)', color: 'var(--pending)' }}>
            <Clock className="h-4 w-4" /> Comprobante en revisión
          </div>
        ) : (
          <button onClick={openComprobante} className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm" style={btnPrimary}>
            <ArrowRightLeft className="h-4 w-4" /> Informar transferencia
          </button>
        )}

        {enrollment?.fecha_limite_pago && (
          <p className="text-xs text-center" style={{ color: 'var(--text-3)' }}>
            Tenés hasta el {fmtFechaLimite(enrollment.fecha_limite_pago)} para completar el pago, o se libera tu lugar.
          </p>
        )}

        {modalMode && userId && (
          <TransferModal
            open onClose={() => setModalMode(null)} course={course} userId={userId}
            mode={modalMode} montoSugerido={modalMode === 'saldo' ? pendiente : señaSugerida}
            enrollmentId={enrollment?.id ?? null}
            onDone={onChanged}
          />
        )}
      </div>
    )
  }

  // ── Estado: sin enrollment → informativo + "Reservar mi lugar" ───
  // Gate de login: sin sesión, va a /login?redirect=<url actual> y vuelve al mismo
  // vivencial. La reserva NO cobra: el pago es transferencia coordinada con Yesica.
  const reservar = () => {
    if (!userId) { navigate(loginRedirect()); return }
    setShowPunto(true)
  }

  const onReserved = () => {
    setShowPunto(false)
    void queryClient.invalidateQueries({ queryKey: ['vivencial-enrollment', userId, course.id] })
    void queryClient.invalidateQueries({ queryKey: ['vivencial-detalle', userId, course.slug] })
    navigate(`/reserva/${course.slug}`)
  }

  const tagStyle = { background: 'var(--card)', borderColor: 'var(--line)', color: 'var(--text-2)', borderWidth: 1 } as const

  return (
    <div className="space-y-3">
      <div className="space-y-2">
        <div className="flex items-center gap-2 py-2.5 px-3 rounded-xl text-sm" style={tagStyle}>
          <ArrowRightLeft className="h-4 w-4 shrink-0" style={{ color: 'var(--primary-l)' }} />
          <span>Transferencia en un pago</span>
        </div>
        <div className="flex items-center gap-2 py-2.5 px-3 rounded-xl text-sm" style={tagStyle}>
          <CreditCard className="h-4 w-4 shrink-0" style={{ color: 'var(--primary-l)' }} />
          <span>Pagás en partes cuando querés, siempre antes de viajar</span>
        </div>
      </div>

      <button
        onClick={reservar}
        className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm"
        style={btnPrimary}
      >
        <Plane className="h-4 w-4" /> Reservar mi lugar
      </button>

      {showPunto && (
        <PuntoSalidaModal open onClose={() => setShowPunto(false)} course={course} onReserved={onReserved} />
      )}
    </div>
  )
}
