import { Link, useSearchParams } from 'react-router-dom'
import { XCircle, BookOpen, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function PagoError() {
  const [params] = useSearchParams()
  const externalRef = params.get('external_reference') ?? ''
  const isCourse = externalRef.startsWith('ACAD-COURSE-')

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
          <XCircle className="h-14 w-14 text-red-400 mx-auto mb-5" />
          <h1 className="font-display font-bold text-2xl text-text-primary mb-3">
            El pago no se completó
          </h1>
          <p className="text-text-secondary text-sm leading-relaxed mb-8">
            Tu pago fue cancelado o rechazado. No se realizó ningún cobro.
            Si el problema persiste, contactanos.
          </p>

          <div className="space-y-3">
            {isCourse ? (
              <Link to="/cursos">
                <Button className="w-full bg-brand-gold hover:bg-brand-gold-deep text-brand-navy font-semibold h-11 gap-2">
                  <RefreshCw className="h-4 w-4" />
                  Volver a intentarlo
                </Button>
              </Link>
            ) : (
              <Link to="/mi-cuenta">
                <Button className="w-full bg-brand-gold hover:bg-brand-gold-deep text-brand-navy font-semibold h-11 gap-2">
                  <RefreshCw className="h-4 w-4" />
                  Volver a intentarlo
                </Button>
              </Link>
            )}
            <Link to="/dashboard">
              <Button variant="ghost" className="w-full text-text-muted hover:text-text-primary">
                Ir a mi panel
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
