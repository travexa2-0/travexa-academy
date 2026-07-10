import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase, supabaseWrite } from '@/lib/supabase'
import { COMPROBANTES_BUCKET } from '@/lib/storage'
import type { InstructorPayout } from '@/types'

const MAX_FACTURA_BYTES = 10 * 1024 * 1024 // el bucket acepta hasta 10MB
const ALLOWED_TYPES = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp']

async function fetchOwnPayouts(instructorId: string): Promise<InstructorPayout[]> {
  const { data, error } = await supabase
    .from('academy_instructor_payouts')
    .select('*')
    .eq('instructor_id', instructorId)
    .order('periodo', { ascending: false })
  if (error) throw new Error(error.message)
  return (data ?? []) as unknown as InstructorPayout[]
}

export function useOwnPayouts(instructorId: string | undefined) {
  return useQuery({
    queryKey: ['instructor-payouts', instructorId],
    queryFn:  () => fetchOwnPayouts(instructorId!),
    enabled:  !!instructorId,
    staleTime: 1000 * 30,
  })
}

// El path debe empezar con `instructor-facturas/{auth.uid()}` — la policy de storage
// lo exige. `factura_url` guarda el path, no una URL: el bucket es privado.
interface UploadFacturaInput {
  payoutId: string
  instructorId: string
  userId: string
  periodo: string
  file: File
}

export function useUploadFactura() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ payoutId, userId, periodo, file }: UploadFacturaInput) => {
      if (file.size > MAX_FACTURA_BYTES) throw new Error('El archivo supera los 10MB')
      if (!ALLOWED_TYPES.includes(file.type)) throw new Error('Formato no permitido. Subí un PDF o una imagen.')

      const ext = file.name.split('.').pop()?.toLowerCase() ?? 'pdf'
      const path = `instructor-facturas/${userId}/${periodo}.${ext}`

      const { error: upErr } = await supabase.storage
        .from(COMPROBANTES_BUCKET)
        .upload(path, file, { upsert: true, contentType: file.type })
      if (upErr) throw new Error(upErr.message)

      // El trigger `protect_payout_admin_fields` revierte cualquier otro campo,
      // así que mandamos únicamente los dos que el instructor puede escribir.
      const { error } = await supabaseWrite
        .from('academy_instructor_payouts')
        .update({ factura_url: path, factura_subida_at: new Date().toISOString() })
        .eq('id', payoutId)
      if (error) throw new Error(error.message)
    },
    onSuccess: (_r, v) => {
      void qc.invalidateQueries({ queryKey: ['instructor-payouts', v.instructorId] })
    },
  })
}
