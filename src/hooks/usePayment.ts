import { useState } from 'react'
import { supabase } from '@/lib/supabase'

interface PaymentResult {
  init_point?: string
  error?: string
}

export function useCoursePayment() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const initiate = async (courseId: string): Promise<string | null> => {
    setLoading(true)
    setError(null)

    const { data, error: fnError } = await supabase.functions.invoke('create-course-payment', {
      body: { course_id: courseId },
    })

    setLoading(false)

    if (fnError || !data?.init_point) {
      const msg = (data as PaymentResult)?.error ?? fnError?.message ?? 'Error al iniciar el pago'
      setError(msg)
      return null
    }

    return (data as PaymentResult).init_point ?? null
  }

  return { initiate, loading, error }
}

export function useSubscriptionPayment() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const initiate = async (plan: 'mensual' | 'anual'): Promise<string | null> => {
    setLoading(true)
    setError(null)

    const { data, error: fnError } = await supabase.functions.invoke('create-subscription-academy', {
      body: { plan },
    })

    setLoading(false)

    if (fnError || !data?.init_point) {
      const msg = (data as PaymentResult)?.error ?? fnError?.message ?? 'Error al iniciar la suscripción'
      setError(msg)
      return null
    }

    return (data as PaymentResult).init_point ?? null
  }

  return { initiate, loading, error }
}

interface ConfirmResult {
  success: boolean
  status?: string
  error?: string
  already_confirmed?: boolean
}

export async function confirmCoursePayment(paymentId: string, externalReference?: string): Promise<ConfirmResult> {
  const { data, error } = await supabase.functions.invoke('confirm-course-payment', {
    body: { payment_id: paymentId, external_reference: externalReference },
  })
  if (error) return { success: false, error: error.message }
  return (data as ConfirmResult) ?? { success: false, error: 'Sin respuesta' }
}

export async function confirmSubscriptionPayment(preapprovalId: string): Promise<ConfirmResult> {
  const { data, error } = await supabase.functions.invoke('confirm-subscription-academy', {
    body: { preapproval_id: preapprovalId },
  })
  if (error) return { success: false, error: error.message }
  return (data as ConfirmResult) ?? { success: false, error: 'Sin respuesta' }
}
