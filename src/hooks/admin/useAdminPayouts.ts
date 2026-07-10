import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase, supabaseWrite } from '@/lib/supabase'
import { COMPROBANTES_BUCKET } from '@/lib/storage'
import type { InstructorPayout } from '@/types'

const MAX_BYTES = 10 * 1024 * 1024
const ALLOWED_TYPES = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp']

export interface PayoutRow extends InstructorPayout {
  instructor?: { id: string; nombre: string; user_id: string | null } | null
}

async function fetchPayouts(): Promise<PayoutRow[]> {
  const { data, error } = await supabase
    .from('academy_instructor_payouts')
    .select('*, instructor:academy_instructors(id, nombre, user_id)')
    .order('periodo', { ascending: false })
  if (error) throw new Error(error.message)
  return (data ?? []) as unknown as PayoutRow[]
}

export function useAdminPayouts() {
  return useQuery({ queryKey: ['admin-payouts'], queryFn: fetchPayouts, staleTime: 1000 * 20 })
}

// Cierre manual del mes. La RPC valida internamente que quien llama sea admin y hace
// upsert sobre (instructor_id, periodo): llamarla dos veces recalcula, no duplica.
export function useCloseInstructorMonth() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ instructorId, periodo }: { instructorId: string; periodo: string }) => {
      const { error } = await supabaseWrite.rpc('academy_close_instructor_month', {
        p_instructor_id: instructorId,
        p_periodo: periodo,
      })
      if (error) throw new Error(error.message)
    },
    onSuccess: () => { void qc.invalidateQueries({ queryKey: ['admin-payouts'] }) },
  })
}

// Registra el pago. `pagado` lo pone el trigger al guardarse `comprobante_pago_url`,
// así que nunca se manda desde acá.
interface RegistrarPagoInput {
  payoutId: string
  instructorUserId: string | null
  instructorId: string
  periodo: string
  montoPagadoArs: number
  fechaPago: string
  file: File
}

export function useRegistrarPagoInstructor() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ payoutId, instructorUserId, instructorId, periodo, montoPagadoArs, fechaPago, file }: RegistrarPagoInput) => {
      if (file.size > MAX_BYTES) throw new Error('El archivo supera los 10MB')
      if (!ALLOWED_TYPES.includes(file.type)) throw new Error('Formato no permitido. Subí un PDF o una imagen.')

      // La policy de lectura del instructor exige que la carpeta sea su user_id. Si el
      // instructor no tiene cuenta vinculada, el archivo queda solo para el admin.
      const carpeta = instructorUserId ?? instructorId
      const ext = file.name.split('.').pop()?.toLowerCase() ?? 'pdf'

      // El admin tiene INSERT pero no UPDATE sobre el bucket, así que el path lleva
      // timestamp: un upsert sobre un path ya existente lo rechazaría la policy.
      const path = `instructor-pagos/${carpeta}/${periodo}-${Date.now()}.${ext}`

      const { error: upErr } = await supabase.storage
        .from(COMPROBANTES_BUCKET)
        .upload(path, file, { upsert: false, contentType: file.type })
      if (upErr) throw new Error(upErr.message)

      const { error } = await supabaseWrite
        .from('academy_instructor_payouts')
        .update({
          comprobante_pago_url: path,
          monto_pagado_ars: Math.round(montoPagadoArs),
          fecha_pago: fechaPago,
          updated_at: new Date().toISOString(),
        })
        .eq('id', payoutId)
      if (error) throw new Error(error.message)
    },
    onSuccess: () => { void qc.invalidateQueries({ queryKey: ['admin-payouts'] }) },
  })
}
