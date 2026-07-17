import { useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, MapPin, Loader2, Plane } from 'lucide-react'
import toast from 'react-hot-toast'
import { EASE_OUT } from '@/lib/motion'
import { reserveVivencialSelf, sendReservaEmail } from '@/hooks/useVivencialPago'
import { onVivencialReservado } from '@/hooks/useGamification'
import { useAuth } from '@/contexts/AuthContext'
import { puntosSalida, puntoSalidaLabel } from '@/lib/vivencial'
import type { Course } from '@/types'

interface Props {
  open: boolean
  onClose: () => void
  course: Course
  /** Se llama con el enrollment_id ya reservado; el host navega a la confirmación. */
  onReserved: (enrollmentId: string) => void
}

/**
 * Paso previo a la reserva automática: el viajero elige el punto de salida/embarque
 * y confirma. Crea el enrollment vía RPC self-service (descuenta cupo, asigna
 * numero_reserva). NO cobra: el pago sigue siendo transferencia coordinada con Yesica.
 */
export default function PuntoSalidaModal({ open, onClose, course, onReserved }: Props) {
  const { user } = useAuth()
  const puntos = useMemo(() => puntosSalida(course), [course])
  const [selected, setSelected] = useState(0)
  const [reserving, setReserving] = useState(false)

  const confirm = async () => {
    if (reserving) return
    const punto = puntos[selected]
    const label = punto ? puntoSalidaLabel(punto) : null
    setReserving(true)
    try {
      const enrollmentId = await reserveVivencialSelf(course.id, label)
      sendReservaEmail(enrollmentId) // fire-and-forget
      if (user?.id) void onVivencialReservado(user.id, enrollmentId) // puntos (idempotente por enrollment)
      onReserved(enrollmentId)
    } catch (e) {
      const msg = (e as Error).message
      toast.error(/cupo/i.test(msg) ? 'Se agotó el cupo de este vivencial.' : msg)
      setReserving(false)
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[700] flex items-center justify-center p-4"
          style={{ background: 'rgba(12,20,32,.35)', backdropFilter: 'blur(10px) saturate(1.2)', WebkitBackdropFilter: 'blur(10px) saturate(1.2)' }}
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          onClick={(e) => { if (e.target === e.currentTarget && !reserving) onClose() }}
        >
          <motion.div
            className="relative w-full max-w-[460px] rounded-[26px] max-h-[92vh] overflow-y-auto"
            style={{
              background: 'rgba(20,33,61,.72)',
              backdropFilter: 'blur(30px) saturate(1.6)', WebkitBackdropFilter: 'blur(30px) saturate(1.6)',
              border: '1px solid rgba(255,255,255,.28)', color: '#fff',
              padding: '32px 28px 26px',
              boxShadow: '0 30px 90px rgba(6,12,24,.55), inset 0 1px 0 rgba(255,255,255,.4)',
            }}
            initial={{ opacity: 0, y: 24, scale: .96 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 8, scale: .97 }}
            transition={{ duration: 0.35, ease: EASE_OUT }}
          >
            <button onClick={onClose} disabled={reserving} className="absolute top-5 right-5 w-[38px] h-[38px] rounded-full flex items-center justify-center border" style={{ background: 'rgba(255,255,255,.1)', borderColor: 'rgba(255,255,255,.3)', color: '#fff' }} aria-label="Cerrar">
              <X className="w-[14px] h-[14px]" />
            </button>

            <p className="font-mono text-xs mb-1" style={{ color: 'var(--gold)' }}>✈ {course.titulo}</p>
            <h3 className="font-display font-bold text-xl mb-1" style={{ color: 'var(--text-1)' }}>Reservá tu lugar</h3>
            <p className="text-sm mb-5" style={{ color: 'var(--text-2)' }}>
              {puntos.length > 0
                ? 'Elegí desde dónde salís. Confirmamos tu lugar al instante y te pasamos los datos para transferir.'
                : 'Confirmamos tu lugar al instante y te pasamos los datos para transferir.'}
            </p>

            {puntos.length > 0 && (
              <div className="space-y-2 mb-5">
                {puntos.map((p, i) => {
                  const active = selected === i
                  return (
                    <button
                      key={i}
                      onClick={() => setSelected(i)}
                      className="w-full flex items-start gap-3 text-left rounded-xl border p-3 transition-colors"
                      style={{
                        background: active ? 'var(--primary-s)' : 'var(--card)',
                        borderColor: active ? 'var(--primary)' : 'var(--line)',
                      }}
                    >
                      <MapPin className="h-4 w-4 shrink-0 mt-0.5" style={{ color: active ? 'var(--primary-l)' : 'var(--text-3)' }} />
                      <div className="min-w-0">
                        <p className="font-semibold text-sm" style={{ color: 'var(--text-1)' }}>{p.ciudad}</p>
                        {p.detalle_encuentro && (
                          <p className="text-xs mt-0.5" style={{ color: 'var(--text-3)' }}>{p.detalle_encuentro}</p>
                        )}
                      </div>
                    </button>
                  )
                })}
              </div>
            )}

            <button
              onClick={() => void confirm()}
              disabled={reserving}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm"
              style={{ background: 'var(--primary)', color: 'var(--text-1)', opacity: reserving ? .7 : 1 }}
            >
              {reserving ? <><Loader2 className="h-4 w-4 animate-spin" /> Reservando…</> : <><Plane className="h-4 w-4" /> Confirmar reserva</>}
            </button>
            <p className="text-xs text-center mt-3" style={{ color: 'var(--text-3)' }}>
              La reserva no cobra nada ahora. El pago es por transferencia, coordinado con el equipo Travexa.
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
