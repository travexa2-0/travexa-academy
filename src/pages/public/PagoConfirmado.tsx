import { useEffect, useState } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { CheckCircle2, Loader2, AlertCircle, BookOpen } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { confirmCoursePayment, confirmSubscriptionPayment } from '@/hooks/usePayment'

type Stage = 'loading' | 'success' | 'pending' | 'error'

export default function PagoConfirmado() {
  const [params] = useSearchParams()
  const [stage, setStage] = useState<Stage>('loading')
  const [message, setMessage] = useState('')

  useEffect(() => {
    const run = async () => {
      const paymentId       = params.get('payment_id') ?? params.get('collection_id')
      const status          = params.get('status') ?? params.get('collection_status')
      const externalRef     = params.get('external_reference') ?? ''
      const preapprovalId   = params.get('preapproval_id')

      // ── Suscripción ──
      if (preapprovalId || externalRef.startsWith('ACAD-SUB-')) {
        const id = preapprovalId ?? externalRef
        const result = await confirmSubscriptionPayment(id)
        if (result.success && result.status === 'authorized') {
          setStage('success')
          setMessage('¡Tu suscripción está activa! Ya podés acceder a todos los cursos del plan.')
        } else if (result.status === 'pending' || status === 'pending') {
          setStage('pending')
          setMessage('Tu pago está siendo procesado. Recibirás acceso en breve.')
        } else {
          setStage('error')
          setMessage(result.error ?? 'No pudimos confirmar tu suscripción.')
        }
        return
      }

      // ── Pago de curso ──
      if (paymentId && status === 'approved') {
        const result = await confirmCoursePayment(paymentId, externalRef)
        if (result.success) {
          setStage('success')
          setMessage('¡Pago confirmado! Ya podés acceder al curso desde tu panel.')
        } else {
          setStage('error')
          setMessage(result.error ?? 'No pudimos confirmar tu pago.')
        }
        return
      }

      if (status === 'pending') {
        setStage('pending')
        setMessage('Tu pago está siendo procesado. Te avisaremos cuando esté confirmado.')
        return
      }

      setStage('error')
      setMessage('No encontramos los datos del pago. Si pagaste correctamente, revisá tu panel en unos minutos.')
    }

    void run()
  }, [params])

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md text-center">
        <Link to="/" className="inline-flex items-center gap-2 mb-10 justify-center">
          <BookOpen className="h-5 w-5 text-brand-gold" />
          <span className="font-display font-bold text-text-primary">
            Travexa <span className="text-brand-gold">Academy</span>
          </span>
        </Link>

        <div className="bg-brand-navy-2 rounded-2xl border border-surface p-10">
          {stage === 'loading' && (
            <>
              <Loader2 className="h-12 w-12 text-brand-gold animate-spin mx-auto mb-5" />
              <h1 className="font-display font-bold text-xl text-text-primary">Confirmando tu pago...</h1>
              <p className="text-text-muted text-sm mt-2">Un momento.</p>
            </>
          )}

          {stage === 'success' && (
            <>
              <CheckCircle2 className="h-14 w-14 text-brand-teal mx-auto mb-5" />
              <h1 className="font-display font-bold text-2xl text-text-primary mb-3">¡Todo listo!</h1>
              <p className="text-text-secondary text-sm leading-relaxed mb-8">{message}</p>
              <Link to="/dashboard">
                <Button className="w-full bg-brand-gold hover:bg-brand-gold-deep text-brand-navy font-semibold h-11">
                  Ir a mi panel
                </Button>
              </Link>
            </>
          )}

          {stage === 'pending' && (
            <>
              <Loader2 className="h-12 w-12 text-brand-gold animate-spin mx-auto mb-5" />
              <h1 className="font-display font-bold text-xl text-text-primary mb-3">Pago en proceso</h1>
              <p className="text-text-secondary text-sm leading-relaxed mb-8">{message}</p>
              <Link to="/dashboard">
                <Button variant="outline" className="w-full border-surface text-text-secondary hover:text-text-primary h-11">
                  Ver mi panel
                </Button>
              </Link>
            </>
          )}

          {stage === 'error' && (
            <>
              <AlertCircle className="h-12 w-12 text-red-400 mx-auto mb-5" />
              <h1 className="font-display font-bold text-xl text-text-primary mb-3">Algo salió mal</h1>
              <p className="text-text-secondary text-sm leading-relaxed mb-8">{message}</p>
              <div className="space-y-3">
                <Link to="/dashboard">
                  <Button className="w-full bg-brand-gold hover:bg-brand-gold-deep text-brand-navy font-semibold h-11">
                    Ir a mi panel
                  </Button>
                </Link>
                <Link to="/cursos">
                  <Button variant="ghost" className="w-full text-text-muted hover:text-text-primary">
                    Ver cursos
                  </Button>
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
