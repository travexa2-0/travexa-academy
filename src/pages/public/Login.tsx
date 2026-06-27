import { useState, type FormEvent } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { BookOpen, Eye, EyeOff, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuth } from '@/contexts/AuthContext'

export default function Login() {
  const { signIn } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const from = (location.state as { from?: string } | null)?.from ?? '/dashboard'

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const { error } = await signIn(email, password)

    if (error) {
      setError('Email o contraseña incorrectos.')
      setLoading(false)
      return
    }

    navigate(from, { replace: true })
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-6">
            <BookOpen className="h-6 w-6 text-brand-gold" />
            <span className="font-display font-bold text-xl text-text-primary">
              Travexa <span className="text-brand-gold">Academy</span>
            </span>
          </Link>
          <h1 className="font-display font-bold text-2xl text-text-primary">Ingresá a tu cuenta</h1>
          <p className="text-text-muted text-sm mt-1">Tu formación en turismo continúa acá.</p>
        </div>

        {/* Card */}
        <div className="bg-brand-navy-2 rounded-2xl border border-surface p-8">
          <form onSubmit={(e) => { void handleSubmit(e) }} className="space-y-5">
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-text-secondary text-sm">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="tu@email.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                className="bg-brand-navy border-surface text-text-primary placeholder:text-text-muted focus:border-brand-gold"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-text-secondary text-sm">Contraseña</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  className="bg-brand-navy border-surface text-text-primary placeholder:text-text-muted focus:border-brand-gold pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-secondary"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {error && (
              <p className="text-sm text-red-400 bg-red-400/10 border border-red-400/20 rounded-lg px-3 py-2">
                {error}
              </p>
            )}

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-brand-gold hover:bg-brand-gold-deep text-brand-navy font-semibold h-11"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Ingresar'}
            </Button>
          </form>
        </div>

        <p className="text-center text-text-muted text-sm mt-6">
          ¿No tenés cuenta?{' '}
          <Link to="/registro" className="text-brand-gold hover:text-brand-gold-soft font-medium">
            Registrate gratis
          </Link>
        </p>
      </div>
    </div>
  )
}
