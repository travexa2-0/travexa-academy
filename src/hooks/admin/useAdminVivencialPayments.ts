import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase, supabaseWrite } from '@/lib/supabase'
import type { Payment, VivencialPayment, VivencialPaymentTipo } from '@/types'

const COMPROBANTES_BUCKET = 'academy-comprobantes'
const MAX_COMPROBANTE_BYTES = 10 * 1024 * 1024 // 10MB

// ── Historial de pagos de un enrollment (comprobantes + cuotas MP) ─────────

export interface PaymentHistory {
  comprobantes: VivencialPayment[]
  cuotas: Pick<Payment, 'id' | 'monto_ars' | 'estado' | 'mp_status' | 'created_at' | 'mp_payment_id'>[]
}

async function fetchHistory(enrollmentId: string): Promise<PaymentHistory> {
  const [comp, cuo] = await Promise.all([
    supabase
      .from('academy_vivencial_payments')
      .select('*')
      .eq('enrollment_id', enrollmentId)
      .order('created_at', { ascending: false }),
    supabase
      .from('academy_payments')
      .select('id, monto_ars, estado, mp_status, created_at, mp_payment_id')
      .eq('enrollment_id', enrollmentId)
      .eq('tipo', 'vivencial_cuotas')
      .order('created_at', { ascending: false }),
  ])
  if (comp.error) throw new Error(comp.error.message)
  if (cuo.error) throw new Error(cuo.error.message)
  return {
    comprobantes: (comp.data ?? []) as unknown as VivencialPayment[],
    cuotas: (cuo.data ?? []) as PaymentHistory['cuotas'],
  }
}

export function useEnrollmentPaymentHistory(enrollmentId: string | undefined, enabled: boolean) {
  return useQuery({
    queryKey: ['viv-payment-history', enrollmentId],
    queryFn: () => fetchHistory(enrollmentId!),
    enabled: !!enrollmentId && enabled,
    staleTime: 1000 * 15,
  })
}

// URL firmada para ver un comprobante privado.
export async function signedComprobanteUrl(path: string): Promise<string | null> {
  const { data, error } = await supabase.storage.from('academy-comprobantes').createSignedUrl(path, 120)
  if (error) return null
  return data.signedUrl
}

// ── Aprobar / rechazar comprobante ─────────────────────────────────────────

interface ReviewInput {
  paymentId: string
  courseId: string
  enrollmentId: string
  montoAprobadoArs?: number
  notas?: string
}

function useInvalidateReview() {
  const qc = useQueryClient()
  return (courseId: string, enrollmentId: string) => {
    void qc.invalidateQueries({ queryKey: ['admin-enrollments', courseId] })
    void qc.invalidateQueries({ queryKey: ['viv-payment-history', enrollmentId] })
    void qc.invalidateQueries({ queryKey: ['viv-pending-count'] })
    void qc.invalidateQueries({ queryKey: ['admin-course', courseId] })
  }
}

async function currentUserId(): Promise<string | null> {
  const { data } = await supabase.auth.getUser()
  return data.user?.id ?? null
}

export function useAprobarComprobante() {
  const invalidate = useInvalidateReview()
  return useMutation({
    mutationFn: async ({ paymentId, montoAprobadoArs, notas }: ReviewInput) => {
      const revisadoPor = await currentUserId()
      const { error } = await supabaseWrite
        .from('academy_vivencial_payments')
        .update({
          estado: 'aprobado',
          monto_aprobado_ars: montoAprobadoArs != null ? Math.round(montoAprobadoArs) : null,
          notas_admin: notas?.trim() || null,
          revisado_por: revisadoPor,
          revisado_at: new Date().toISOString(),
        })
        .eq('id', paymentId)
      if (error) throw new Error(error.message)
    },
    onSuccess: (_r, v) => invalidate(v.courseId, v.enrollmentId),
  })
}

export function useRechazarComprobante() {
  const invalidate = useInvalidateReview()
  return useMutation({
    mutationFn: async ({ paymentId, notas }: ReviewInput) => {
      const revisadoPor = await currentUserId()
      // No se borra: queda como historial con estado 'rechazado'.
      const { error } = await supabaseWrite
        .from('academy_vivencial_payments')
        .update({
          estado: 'rechazado',
          notas_admin: notas?.trim() || null,
          revisado_por: revisadoPor,
          revisado_at: new Date().toISOString(),
        })
        .eq('id', paymentId)
      if (error) throw new Error(error.message)
    },
    onSuccess: (_r, v) => invalidate(v.courseId, v.enrollmentId),
  })
}

// ── Admin carga un pago directo (ya aprobado) ──────────────────────────────
// Yesica cierra la venta por WhatsApp y sube el comprobante ella misma. El
// INSERT entra como 'aprobado' y el trigger recalcula el saldo del enrollment.

export interface CargarPagoInput {
  enrollmentId: string
  userId: string        // el viajero dueño del enrollment
  courseId: string
  tipo: VivencialPaymentTipo
  montoArs: number
  fecha: string         // yyyy-mm-dd
  file: File
}

export function useAdminCargarPago() {
  const invalidate = useInvalidateReview()
  return useMutation({
    mutationFn: async ({ enrollmentId, userId, tipo, montoArs, fecha, file }: CargarPagoInput) => {
      if (!/^(image\/|application\/pdf)/.test(file.type)) throw new Error('El comprobante debe ser una imagen o un PDF.')
      if (file.size > MAX_COMPROBANTE_BYTES) throw new Error('El archivo supera los 10MB.')
      if (!(montoArs > 0)) throw new Error('Ingresá un monto válido.')

      const monto = Math.round(montoArs)
      const revisadoPor = await currentUserId()

      const path = `${userId}/${enrollmentId}/${Date.now()}-${file.name}`
      const { error: uploadError } = await supabase.storage
        .from(COMPROBANTES_BUCKET)
        .upload(path, file, { upsert: false, contentType: file.type })
      if (uploadError) throw new Error(uploadError.message)

      const { error } = await supabaseWrite
        .from('academy_vivencial_payments')
        .insert({
          enrollment_id: enrollmentId,
          user_id: userId,
          tipo,
          monto_declarado_ars: monto,
          monto_aprobado_ars: monto,
          comprobante_url: path,
          fecha_declarada: fecha,
          estado: 'aprobado',
          revisado_por: revisadoPor,
          revisado_at: new Date().toISOString(),
        })
      if (error) throw new Error(error.message)
    },
    onSuccess: (_r, v) => invalidate(v.courseId, v.enrollmentId),
  })
}

// ── Liberar cupo (vencido) ─────────────────────────────────────────────────

export function useLiberarCupo() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ enrollmentId }: { enrollmentId: string; courseId: string }) => {
      const { error } = await supabaseWrite.rpc('academy_liberar_cupo_vivencial', { p_enrollment_id: enrollmentId })
      if (error) throw new Error(error.message)
    },
    onSuccess: (_r, v) => {
      void qc.invalidateQueries({ queryKey: ['admin-enrollments', v.courseId] })
      void qc.invalidateQueries({ queryKey: ['admin-course', v.courseId] })
      void qc.invalidateQueries({ queryKey: ['admin-courses'] })
    },
  })
}

// ── Badge del nav: comprobantes pendientes en todos los vivenciales ────────

export function useVivencialPendingCount() {
  return useQuery({
    queryKey: ['viv-pending-count'],
    queryFn: async (): Promise<number> => {
      const { count } = await supabase
        .from('academy_vivencial_payments')
        .select('id', { count: 'exact', head: true })
        .eq('estado', 'pendiente')
      return count ?? 0
    },
    staleTime: 1000 * 30,
  })
}
