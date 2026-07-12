import { useState } from 'react'
import { FileDown, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { supabase } from '@/lib/supabase'
import { buildLiquidacionData, downloadLiquidacionPdf } from '@/lib/liquidacionPdf'
import type { Course, Enrollment, VivencialPayment } from '@/types'

interface Props {
  course: Course
  enrollment: Enrollment
  className?: string
  style?: React.CSSProperties
}

/**
 * Botón de descarga de la liquidación PDF para el viajero. Se autoabastece: trae
 * sus pagos y sus datos de contacto/nacimiento antes de generar el PDF client-side.
 */
export default function LiquidacionButton({ course, enrollment, className, style }: Props) {
  const [busy, setBusy] = useState(false)

  const descargar = async () => {
    if (busy) return
    setBusy(true)
    try {
      const [{ data: pays }, { data: prof }, { data: acad }] = await Promise.all([
        supabase.from('academy_vivencial_payments').select('*').eq('enrollment_id', enrollment.id),
        supabase.from('profiles').select('nombre, apellido, email, telefono').eq('id', enrollment.user_id).maybeSingle<{ nombre: string | null; apellido: string | null; email: string | null; telefono: string | null }>(),
        supabase.from('academy_profiles').select('fecha_nacimiento, dni').eq('user_id', enrollment.user_id).maybeSingle<{ fecha_nacimiento: string | null; dni: string | null }>(),
      ])
      const nombre = [prof?.nombre, prof?.apellido].filter(Boolean).join(' ') || (prof?.email ?? '—')
      const liq = buildLiquidacionData({
        course, enrollment, payments: (pays ?? []) as VivencialPayment[],
        cliente: { nombre, dni: acad?.dni ?? '', email: prof?.email ?? '', celular: prof?.telefono ?? '', fechaNac: acad?.fecha_nacimiento ?? '' },
      })
      await downloadLiquidacionPdf(liq)
    } catch (err) { toast.error((err as Error).message) }
    finally { setBusy(false) }
  }

  return (
    <button
      onClick={() => void descargar()}
      disabled={busy}
      className={className ?? 'flex items-center justify-center gap-2 py-3 px-5 rounded-xl text-sm font-medium border'}
      style={style ?? { borderColor: 'var(--line)', color: 'var(--text-2)' }}
    >
      {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileDown className="h-4 w-4" />}
      Descargar liquidación
    </button>
  )
}
