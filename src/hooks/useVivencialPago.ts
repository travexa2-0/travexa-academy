import { useQuery } from '@tanstack/react-query'
import { supabase, supabaseWrite } from '@/lib/supabase'
import { normalizeCuentas } from '@/lib/vivencial'
import type { CuentaTransferencia, MetodoTransferencia, VivencialPayment } from '@/types'

const COMPROBANTES_BUCKET = 'academy-comprobantes'
export const MAX_COMPROBANTE_BYTES = 10 * 1024 * 1024 // 10MB
const ACCEPTED_MIME = /^(image\/|application\/pdf)/

// ── WhatsApp Business (número global para "Quiero anotarme") ────────────────

async function fetchWhatsappBusiness(): Promise<string> {
  const { data, error } = await supabase
    .from('academy_settings')
    .select('value')
    .eq('key', 'travexa_whatsapp_business')
    .maybeSingle<{ value: unknown }>()
  if (error) throw new Error(error.message)
  return typeof data?.value === 'string' ? data.value : ''
}

export function useWhatsappBusiness() {
  return useQuery({
    queryKey: ['whatsapp-business'],
    queryFn: fetchWhatsappBusiness,
    staleTime: 1000 * 60 * 10,
  })
}

/** "+54 9 11 5697-4099" → "5491156974099" (solo dígitos con código de país). */
export function cleanWhatsappNumber(raw: string): string {
  return raw.replace(/\D/g, '')
}

/**
 * Arma el link de "Quiero anotarme". La forma de "interesado" depende del
 * género que cargó el usuario en el onboarding (Femenino / Masculino); para
 * cualquier otro valor, sin sesión o sin dato, usa el genérico "interesado/a".
 */
export function buildAnotarmeWaUrl(rawNumber: string, titulo: string, genero?: string | null): string {
  const digits = cleanWhatsappNumber(rawNumber)
  const interesado =
    genero === 'Femenino' ? 'interesada'
    : genero === 'Masculino' ? 'interesado'
    : 'interesado/a'
  const mensaje = `Hola! Estoy ${interesado} en ser parte del vivencial ${titulo}`
  return `https://wa.me/${digits}?text=${encodeURIComponent(mensaje)}`
}

// ── Datos bancarios de transferencia (setting travexa_datos_transferencia) ──
// Se muestran en la pantalla de confirmación y en el form de informar transferencia
// (antes Yesica los pasaba por chat). Soporta 1 cuenta (objeto) o varias (array).

async function fetchDatosTransferencia(): Promise<CuentaTransferencia[]> {
  const { data, error } = await supabase
    .from('academy_settings')
    .select('value')
    .eq('key', 'travexa_datos_transferencia')
    .maybeSingle<{ value: unknown }>()
  if (error) throw new Error(error.message)
  return normalizeCuentas(data?.value)
}

export function useDatosTransferencia() {
  return useQuery({
    queryKey: ['datos-transferencia'],
    queryFn: fetchDatosTransferencia,
    staleTime: 1000 * 60 * 10,
  })
}

// ── Reserva de cupo (idempotente vía RPC) ──────────────────────────────────

export async function reserveVivencialSpot(courseId: string): Promise<string> {
  const { data, error } = await supabaseWrite.rpc('academy_reserve_vivencial_spot', { p_course_id: courseId })
  if (error) throw new Error(error.message)
  return data as unknown as string
}

/**
 * Reserva self-service desde la plataforma: crea el enrollment (descuenta cupo),
 * persiste el punto de salida elegido y deja que el trigger asigne el numero_reserva.
 * Idempotente. Devuelve el enrollment_id. (Migración PROPUESTA 20260712010000: hasta
 * aplicarla, este RPC no existe y la reserva falla — esperado, mismo patrón que v2.)
 */
export async function reserveVivencialSelf(courseId: string, puntoSalida: string | null): Promise<string> {
  const { data, error } = await supabaseWrite.rpc('academy_reserve_vivencial_self', {
    p_course_id: courseId,
    p_punto_salida: puntoSalida,
  })
  if (error) throw new Error(error.message)
  return data as unknown as string
}

/**
 * Dispara el mail de "reserva confirmada" (edge function Resend, punto 4).
 * Fire-and-forget: nunca rompe el flujo de reserva — si no hay proveedor
 * configurado o falla el envío, se ignora (la reserva ya está hecha).
 */
export function sendReservaEmail(enrollmentId: string): void {
  void supabase.functions
    .invoke('send-reserva-email', { body: { enrollment_id: enrollmentId } })
    .catch(() => { /* no-op: el mail es una celebración, no bloquea la reserva */ })
}

// ── Declaración de transferencia (seña o saldo) ────────────────────────────

export interface SubmitTransferInput {
  enrollmentId: string
  userId: string
  montoArs: number
  fecha: string // yyyy-mm-dd
  file: File
  // Datos del formulario "Informar transferencia" (todos opcionales para no romper
  // llamadas viejas; columnas nullable en DB — migración PROPUESTA 20260712010000).
  metodo?: MetodoTransferencia
  depositanteNombre?: string
  depositanteDni?: string
  cuponNumero?: string
  cuentaDestino?: string
}

export async function submitTransfer(input: SubmitTransferInput): Promise<void> {
  const { enrollmentId, userId, montoArs, fecha, file, metodo, depositanteNombre, depositanteDni, cuponNumero, cuentaDestino } = input

  if (!ACCEPTED_MIME.test(file.type)) {
    throw new Error('El comprobante debe ser una imagen o un PDF.')
  }
  if (file.size > MAX_COMPROBANTE_BYTES) {
    throw new Error('El archivo supera los 10MB.')
  }
  if (!(montoArs > 0)) {
    throw new Error('Ingresá un monto válido.')
  }

  // Primer pago del enrollment = seña; los siguientes = transferencia de saldo.
  const { count, error: countError } = await supabase
    .from('academy_vivencial_payments')
    .select('id', { count: 'exact', head: true })
    .eq('enrollment_id', enrollmentId)
  if (countError) throw new Error(countError.message)
  const tipo = (count ?? 0) === 0 ? 'sena' : 'transferencia'

  const path = `${userId}/${enrollmentId}/${Date.now()}-${file.name}`
  const { error: uploadError } = await supabase.storage
    .from(COMPROBANTES_BUCKET)
    .upload(path, file, { upsert: false, contentType: file.type })
  if (uploadError) throw new Error(uploadError.message)

  const { error: insertError } = await supabaseWrite
    .from('academy_vivencial_payments')
    .insert({
      enrollment_id: enrollmentId,
      user_id: userId,
      tipo,
      monto_declarado_ars: Math.round(montoArs),
      comprobante_url: path,
      fecha_declarada: fecha,
      metodo: metodo ?? null,
      depositante_nombre: depositanteNombre?.trim() || null,
      depositante_dni: depositanteDni?.trim() || null,
      cupon_numero: cuponNumero?.trim() || null,
      cuenta_destino: cuentaDestino?.trim() || null,
    })
  if (insertError) throw new Error(insertError.message)
}

// ── Pagos de un enrollment (para el chip "en revisión") ────────────────────

async function fetchPaymentsFor(enrollmentId: string): Promise<VivencialPayment[]> {
  const { data, error } = await supabase
    .from('academy_vivencial_payments')
    .select('*')
    .eq('enrollment_id', enrollmentId)
    .order('created_at', { ascending: false })
  if (error) throw new Error(error.message)
  return (data ?? []) as unknown as VivencialPayment[]
}

export function useVivencialPaymentsFor(enrollmentId: string | undefined) {
  return useQuery({
    queryKey: ['vivencial-payments', enrollmentId],
    queryFn: () => fetchPaymentsFor(enrollmentId!),
    enabled: !!enrollmentId,
    staleTime: 1000 * 20,
  })
}

// ── Pago en cuotas vía MP (edge function) ──────────────────────────────────

interface CuotasResult {
  init_point?: string
  error?: string
}

export async function initCuotasPayment(courseId: string): Promise<string> {
  const { data, error } = await supabase.functions.invoke('create-vivencial-cuotas-payment', {
    body: { course_id: courseId },
  })
  if (error || !(data as CuotasResult)?.init_point) {
    throw new Error((data as CuotasResult)?.error ?? error?.message ?? 'No se pudo iniciar el pago en cuotas.')
  }
  return (data as CuotasResult).init_point as string
}
