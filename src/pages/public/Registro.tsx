import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { BookOpen, Eye, EyeOff, Loader2, Briefcase, User as UserIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuth } from '@/contexts/AuthContext'
import type { TipoCuenta } from '@/types'

const TIPO_OPCIONES: { value: TipoCuenta; label: string; desc: string; icon: typeof UserIcon }[] = [
  { value: 'asesor', label: 'Asesor de viajes', desc: 'Vendés y asesorás a pasajeros.', icon: UserIcon },
  { value: 'agencia', label: 'Agencia de viajes', desc: 'Representás o gestionás una agencia.', icon: Briefcase },
]

export default function Registro() {
  const { signUp } = useAuth()
  const navigate = useNavigate()

  const [nombre, setNombre] = useState('')
  const [apellido, setApellido] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [tipoCuenta, setTipoCuenta] = useState<TipoCuenta>('asesor')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres.')
      return
    }
    setLoading(true)
    setError(null)

    const { error } = await signUp({ email, password, nombre, apellido, tipo_cuenta: tipoCuenta })

    if (error) {
      setError(error.includes('already') || error.includes('registered')
        ? 'Ese email ya está registrado. ¿Querés ingresar?'
        : error
      )
      setLoading(false)
      return
    }

    navigate('/dashboard', { replace: true })
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-6">
            <BookOpen className="h-6 w-6 text-brand-gold" />
            <span className="font-display font-bold text-xl text-text-primary">
              Travexa <span className="text-brand-gold">Academy</span>
            </span>
          </Link>
          <h1 className="font-display font-bold text-2xl text-text-primary">Creá tu cuenta gratis</h1>
          <p className="text-text-muted text-sm mt-1">Empezá tu formación en turismo profesional.</p>
        </div>

        {/* Card */}
        <div className="bg-brand-navy-2 rounded-2xl border border-surface p-8">
          <form onSubmit={(e) => { void handleSubmit(e) }} className="space-y-5">
            {/* Tipo de cuenta */}
            <div className="space-y-2">
              <Label className="text-text-secondary text-sm">¿Cómo te describís?</Label>
              <div className="grid grid-cols-2 gap-3">
                {TIPO_OPCIONES.map(op => {
                  const Icon = op.icon
                  const active = tipoCuenta === op.value
                  return (
                    <button
                      key={op.value}
                      type="button"
                      onClick={() => setTipoCuenta(op.value)}
                      className={`rounded-xl border-2 p-4 text-left transition-all ${
                        active
                          ? 'border-brand-gold bg-brand-gold/10'
                          : 'border-surface bg-brand-navy hover:border-surface-border-strong'
                      }`}
                    >
                      <Icon className={`h-5 w-5 mb-2 ${active ? 'text-brand-gold' : 'text-text-muted'}`} />
                      <p className={`text-sm font-semibold ${active ? 'text-brand-gold' : 'text-text-secondary'}`}>
                        {op.label}
                      </p>
                      <p className="text-xs text-text-muted mt-0.5">{op.desc}</p>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Nombre + Apellido */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="nombre" className="text-text-secondary text-sm">Nombre</Label>
                <Input
                  id="nombre"
                  placeholder="Nombre"
                  value={nombre}
                  onChange={e => setNombre(e.target.value)}
                  required
                  className="bg-brand-navy border-surface text-text-primary placeholder:text-text-muted focus:border-brand-gold"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="apellido" className="text-text-secondary text-sm">Apellido</Label>
                <Input
                  id="apellido"
                  placeholder="Apellido"
                  value={apellido}
                  onChange={e => setApellido(e.target.value)}
                  required
                  className="bg-brand-navy border-surface text-text-primary placeholder:text-text-muted focus:border-brand-gold"
                />
              </div>
            </div>

            {/* Email */}
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

            {/* Password */}
            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-text-secondary text-sm">Contraseña</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Mínimo 6 caracteres"
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
                {error.includes('ingresar') && (
                  <Link to="/login" className="underline ml-1 font-medium">Ingresá acá.</Link>
                )}
              </p>
            )}

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-brand-gold hover:bg-brand-gold-deep text-brand-navy font-semibold h-11"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Crear cuenta gratis'}
            </Button>

            <p className="text-xs text-text-muted text-center leading-relaxed">
              Al registrarte aceptás nuestros términos de uso. Tu cuenta es gratuita y podés acceder a los cursos de preview sin costo.
            </p>
          </form>
        </div>

        <p className="text-center text-text-muted text-sm mt-6">
          ¿Ya tenés cuenta?{' '}
          <Link to="/login" className="text-brand-gold hover:text-brand-gold-soft font-medium">
            Ingresá
          </Link>
        </p>
      </div>
    </div>
  )
}
