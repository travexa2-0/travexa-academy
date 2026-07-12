import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Upload, FileText, Loader2, CheckCircle2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { useQueryClient } from '@tanstack/react-query'
import { EASE_OUT } from '@/lib/motion'
import {
  reserveVivencialSpot,
  submitTransfer,
  useDatosTransferencia,
  MAX_COMPROBANTE_BYTES,
} from '@/hooks/useVivencialPago'
import type { Course, MetodoTransferencia } from '@/types'

interface Props {
  open: boolean
  onClose: () => void
  course: Course
  userId: string
  /** Botón que abrió el modal: el host lo usa para calcular el monto sugerido. */
  mode?: 'sena' | 'saldo'
  montoSugerido: number
  /**
   * Enrollment activo del usuario. Si viene, se usa directo y NO se reserva cupo
   * (el enrollment ya existe). Solo se cae al RPC de reserva como fallback
   * defensivo cuando el usuario todavía no tiene enrollment.
   */
  enrollmentId?: string | null
  onDone?: () => void
}

function todayISO(): string {
  return new Date().toISOString().slice(0, 10)
}

const METODOS: { key: MetodoTransferencia; label: string }[] = [
  { key: 'transferencia', label: 'Transferencia' },
  { key: 'deposito', label: 'Depósito' },
]

const inputStyle = { background: 'var(--card)', borderColor: 'var(--line)', color: 'var(--text-1)' } as const

export default function TransferModal({ open, onClose, course, userId, montoSugerido, enrollmentId: existingEnrollmentId, onDone }: Props) {
  const qc = useQueryClient()
  const fileRef = useRef<HTMLInputElement>(null)
  const { data: cuentas = [] } = useDatosTransferencia()

  const [enrollmentId, setEnrollmentId] = useState<string | null>(null)
  const [reserving, setReserving] = useState(false)
  const [metodo, setMetodo] = useState<MetodoTransferencia>('transferencia')
  const [depositante, setDepositante] = useState('')
  const [dni, setDni] = useState('')
  const [cupon, setCupon] = useState('')
  const [cuentaIdx, setCuentaIdx] = useState(0)
  const [monto, setMonto] = useState('')
  const [fecha, setFecha] = useState(todayISO())
  const [file, setFile] = useState<File | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)

  const title = 'Informar transferencia'

  // Al abrir: usar el enrollment existente si lo hay; si no, reservar cupo como
  // fallback (idempotente). Si no hay cupo, avisar y cerrar.
  useEffect(() => {
    if (!open) return
    let cancelled = false
    setDone(false)
    setFile(null)
    setFecha(todayISO())
    setMonto(montoSugerido > 0 ? String(Math.round(montoSugerido)) : '')

    if (existingEnrollmentId) {
      setReserving(false)
      setEnrollmentId(existingEnrollmentId)
      return () => { cancelled = true }
    }

    setReserving(true)
    setEnrollmentId(null)
    reserveVivencialSpot(course.id)
      .then(id => { if (!cancelled) setEnrollmentId(id) })
      .catch((e: Error) => {
        if (cancelled) return
        toast.error(e.message.includes('cupo') ? 'Se agotó el cupo de este vivencial.' : e.message)
        onClose()
      })
      .finally(() => { if (!cancelled) setReserving(false) })
    return () => { cancelled = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, course.id, existingEnrollmentId])

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  const pickFile = (f: File | undefined) => {
    if (!f) return
    if (f.size > MAX_COMPROBANTE_BYTES) { toast.error('El archivo supera los 10MB.'); return }
    if (!/^(image\/|application\/pdf)/.test(f.type)) { toast.error('Subí una imagen o un PDF.'); return }
    setFile(f)
  }

  const submit = async () => {
    if (!enrollmentId) return
    if (!file) { toast.error('Adjuntá el comprobante.'); return }
    const montoNum = Number(monto)
    if (!(montoNum > 0)) { toast.error('Ingresá un monto válido.'); return }
    const cuenta = cuentas[cuentaIdx]
    const cuentaDestino = cuenta ? (cuenta.alias || cuenta.banco || cuenta.cbu) : undefined
    setSubmitting(true)
    try {
      await submitTransfer({
        enrollmentId, userId, montoArs: montoNum, fecha, file,
        metodo,
        depositanteNombre: depositante,
        depositanteDni: dni,
        cuponNumero: cupon,
        cuentaDestino,
      })
      setDone(true)
      void qc.invalidateQueries({ queryKey: ['vivencial-payments', enrollmentId] })
      onDone?.()
    } catch (e) {
      toast.error((e as Error).message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[700] flex items-center justify-center p-4"
          style={{ background: 'rgba(6,13,20,.6)', backdropFilter: 'blur(6px)' }}
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          onClick={(e) => { if (e.target === e.currentTarget && !submitting) onClose() }}
        >
          <motion.div
            className="relative w-full max-w-[460px] rounded-[20px] border max-h-[92vh] overflow-y-auto"
            style={{ background: 'var(--bg-2)', borderColor: 'var(--line-s)', padding: '30px 26px 24px', boxShadow: '0 30px 70px rgba(0,0,0,.55)' }}
            initial={{ opacity: 0, y: 18, scale: .96 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 8, scale: .97 }}
            transition={{ duration: 0.3, ease: EASE_OUT }}
          >
            <button onClick={onClose} disabled={submitting} className="absolute top-4 right-4 w-[30px] h-[30px] rounded-full flex items-center justify-center border" style={{ background: 'var(--card)', borderColor: 'var(--line)', color: 'var(--text-3)' }} aria-label="Cerrar">
              <X className="w-[14px] h-[14px]" />
            </button>

            {done ? (
              <div className="text-center py-6">
                <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: 'var(--success-s)' }}>
                  <CheckCircle2 className="h-7 w-7" style={{ color: 'var(--success)' }} />
                </div>
                <h3 className="font-display font-bold text-lg mb-2" style={{ color: 'var(--text-1)' }}>Recibimos tu comprobante</h3>
                <p className="text-sm mb-6" style={{ color: 'var(--text-2)' }}>Yesica lo va a revisar y te vamos a avisar cuando quede confirmado. No hace falta que lo subas de nuevo.</p>
                <button onClick={onClose} className="w-full py-3 rounded-xl font-semibold text-sm" style={{ background: 'var(--primary)', color: 'var(--text-1)' }}>Listo</button>
              </div>
            ) : (
              <>
                <p className="font-mono text-xs mb-1" style={{ color: 'var(--gold)' }}>✈ {course.titulo}</p>
                <h3 className="font-display font-bold text-xl mb-1" style={{ color: 'var(--text-1)' }}>{title}</h3>
                <p className="text-sm mb-5" style={{ color: 'var(--text-2)' }}>Contanos los datos del pago y subí el comprobante. Yesica lo revisa a mano.</p>

                {reserving ? (
                  <div className="flex items-center justify-center py-10">
                    <Loader2 className="h-6 w-6 animate-spin" style={{ color: 'var(--primary-l)' }} />
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Método */}
                    <div>
                      <label className="block text-sm mb-1.5" style={{ color: 'var(--text-2)' }}>Método</label>
                      <div className="grid grid-cols-2 gap-2">
                        {METODOS.map(m => {
                          const active = metodo === m.key
                          return (
                            <button
                              key={m.key}
                              type="button"
                              onClick={() => setMetodo(m.key)}
                              className="py-2.5 rounded-xl border text-sm font-medium transition-colors"
                              style={{
                                background: active ? 'var(--primary-s)' : 'var(--card)',
                                borderColor: active ? 'var(--primary)' : 'var(--line)',
                                color: active ? 'var(--text-1)' : 'var(--text-2)',
                              }}
                            >
                              {m.label}
                            </button>
                          )
                        })}
                      </div>
                    </div>

                    {/* Depositante + DNI */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm mb-1.5" style={{ color: 'var(--text-2)' }}>Nombre y apellido del depositante</label>
                        <input type="text" value={depositante} onChange={e => setDepositante(e.target.value)} placeholder="Como figura en el banco" className="w-full py-2.5 px-3 rounded-xl border text-sm" style={inputStyle} />
                      </div>
                      <div>
                        <label className="block text-sm mb-1.5" style={{ color: 'var(--text-2)' }}>DNI</label>
                        <input type="text" inputMode="numeric" value={dni} onChange={e => setDni(e.target.value)} className="w-full py-2.5 px-3 rounded-xl border text-sm" style={inputStyle} />
                      </div>
                    </div>

                    {/* Cuenta destino (si hay más de una cargada) */}
                    {cuentas.length > 1 && (
                      <div>
                        <label className="block text-sm mb-1.5" style={{ color: 'var(--text-2)' }}>Cuenta destino</label>
                        <select value={cuentaIdx} onChange={e => setCuentaIdx(Number(e.target.value))} className="w-full py-2.5 px-3 rounded-xl border text-sm" style={inputStyle}>
                          {cuentas.map((c, i) => (
                            <option key={i} value={i}>{c.alias || c.banco || c.cbu || `Cuenta ${i + 1}`}</option>
                          ))}
                        </select>
                      </div>
                    )}

                    {/* Importe + Fecha */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm mb-1.5" style={{ color: 'var(--text-2)' }}>Importe (ARS)</label>
                        <input type="number" value={monto} onChange={e => setMonto(e.target.value)} className="w-full py-2.5 px-3 rounded-xl border text-sm" style={inputStyle} />
                      </div>
                      <div>
                        <label className="block text-sm mb-1.5" style={{ color: 'var(--text-2)' }}>Fecha del pago</label>
                        <input type="date" value={fecha} max={todayISO()} onChange={e => setFecha(e.target.value)} className="w-full py-2.5 px-3 rounded-xl border text-sm" style={inputStyle} />
                      </div>
                    </div>

                    {/* N° cupón / comprobante */}
                    <div>
                      <label className="block text-sm mb-1.5" style={{ color: 'var(--text-2)' }}>N° de cupón / comprobante <span style={{ color: 'var(--text-3)' }}>(opcional)</span></label>
                      <input type="text" value={cupon} onChange={e => setCupon(e.target.value)} className="w-full py-2.5 px-3 rounded-xl border text-sm" style={inputStyle} />
                    </div>

                    {/* Archivo del comprobante */}
                    <div>
                      <label className="block text-sm mb-1.5" style={{ color: 'var(--text-2)' }}>Comprobante (imagen o PDF, máx 10MB)</label>
                      <input ref={fileRef} type="file" accept="image/*,application/pdf" hidden onChange={e => pickFile(e.target.files?.[0])} />
                      <button type="button" onClick={() => fileRef.current?.click()} className="w-full flex items-center gap-2 py-3 px-3 rounded-xl border border-dashed text-sm" style={{ borderColor: 'var(--line)', color: file ? 'var(--text-1)' : 'var(--text-3)' }}>
                        {file ? <FileText className="h-4 w-4 shrink-0" style={{ color: 'var(--primary-l)' }} /> : <Upload className="h-4 w-4 shrink-0" />}
                        <span className="truncate">{file ? file.name : 'Subir comprobante'}</span>
                      </button>
                    </div>

                    <button
                      onClick={() => void submit()}
                      disabled={submitting || !enrollmentId}
                      className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm"
                      style={{ background: 'var(--primary)', color: 'var(--text-1)', opacity: submitting ? .7 : 1 }}
                    >
                      {submitting ? <><Loader2 className="h-4 w-4 animate-spin" /> Enviando…</> : 'Enviar comprobante'}
                    </button>
                    <p className="text-xs text-center" style={{ color: 'var(--text-3)' }}>
                      Ingresa como pendiente hasta que Yesica lo apruebe.
                    </p>
                  </div>
                )}
              </>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
