import { useState, type FormEvent, useEffect } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import { Eye, EyeOff, Loader2, Briefcase, User as UserIcon, GraduationCap, CheckCircle2, BookOpen, Plane } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuth } from '@/contexts/AuthContext'
import type { TipoCuenta } from '@/types'
import { EASE_OUT, shakeX } from '@/lib/motion'

const TIPO_OPCIONES: { value: TipoCuenta; label: string; desc: string; icon: typeof UserIcon }[] = [
  { value: 'asesor',   label: 'Asesor freelance', desc: 'Vendés y asesorás en forma independiente.', icon: UserIcon },
  { value: 'agencia',  label: 'Agencia',           desc: 'Representás o gestionás una agencia.',     icon: Briefcase },
  { value: 'externo',  label: 'Estudiante',         desc: 'Estoy aprendiendo el mundo del turismo.',  icon: GraduationCap },
]

export default function Registro() {
  const { signUp, signInWithGoogle } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const shouldReduce = useReducedMotion()

  const [nombre, setNombre]             = useState('')
  const [apellido, setApellido]         = useState('')
  const [email, setEmail]               = useState('')
  const [password, setPassword]         = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [tipoCuenta, setTipoCuenta]     = useState<TipoCuenta>('asesor')
  const [referralCode, setReferralCode] = useState('')
  const [loading, setLoading]           = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [status, setStatus]             = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [error, setError]               = useState<string | null>(null)
  const [shake, setShake]               = useState(false)

  useEffect(() => {
    const ref = searchParams.get('ref')
    if (ref) setReferralCode(ref)
  }, [searchParams])

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres.')
      setShake(true)
      setTimeout(() => setShake(false), 500)
      return
    }
    setLoading(true)
    setStatus('loading')
    setError(null)

    const { error } = await signUp({
      email, password, nombre, apellido,
      tipo_cuenta: tipoCuenta,
      referral_code: referralCode || undefined,
    })

    if (error) {
      setError(
        error.includes('already') || error.includes('registered')
          ? 'Ese email ya está registrado. ¿Querés ingresar?'
          : error
      )
      setStatus('error')
      setLoading(false)
      setShake(true)
      setTimeout(() => setShake(false), 500)
      return
    }

    setStatus('success')
    setTimeout(() => navigate('/onboarding', { replace: true }), 700)
  }

  const handleGoogle = async () => {
    setGoogleLoading(true)
    const { error } = await signInWithGoogle()
    if (error) {
      setError('No se pudo conectar con Google.')
      setGoogleLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* Left — imagen cinemática */}
      <div className="hidden lg:flex lg:w-[44%] relative overflow-hidden" style={{ background: 'var(--bg-deep)' }}>
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: 'url(https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=1200&q=80)' }}
        />
        <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, rgba(6,13,20,.7) 0%, rgba(14,107,92,.3) 50%, rgba(6,13,20,.85) 100%)' }} />

        <div className="relative z-10 flex flex-col justify-between p-12 w-full">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'var(--primary)' }}>
              <BookOpen className="h-5 w-5 text-white" />
            </div>
            <span className="font-display font-bold text-lg" style={{ color: 'var(--text-1)' }}>
              Travexa <span style={{ color: 'var(--gold)' }}>Academy</span>
            </span>
          </Link>

          <div className="space-y-5">
            {[
              { icon: <Plane className="h-5 w-5" />, title: 'Viajes vivenciales', desc: 'Fam trips exclusivos para asesores.' },
              { icon: <GraduationCap className="h-5 w-5" />, title: 'Cursos prácticos', desc: 'Contenido del trade real, sin relleno.' },
              { icon: <CheckCircle2 className="h-5 w-5" />, title: 'Certificados', desc: 'Respaldados por Travexa, el software del sector.' },
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={shouldReduce ? false : { opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 * i + 0.3, duration: 0.3, ease: EASE_OUT }}
                className="flex items-start gap-3"
              >
                <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ background: 'var(--primary-s)', color: 'var(--primary-l)' }}>
                  {item.icon}
                </div>
                <div>
                  <p className="font-semibold text-sm" style={{ color: 'var(--text-1)' }}>{item.title}</p>
                  <p className="text-xs" style={{ color: 'var(--text-3)' }}>{item.desc}</p>
                </div>
              </motion.div>
            ))}
            <div className="pt-2 pl-1 font-mono text-xs" style={{ color: 'var(--primary-l)' }}>
              🎁 Sumás Créditos de bienvenida si te registrás con el código de otro asesor
            </div>
          </div>
        </div>
      </div>

      {/* Right — form */}
      <div className="flex-1 flex items-center justify-center px-6 py-12 overflow-y-auto" style={{ background: 'var(--bg)' }}>
        <motion.div
          className="w-full max-w-md"
          initial={shouldReduce ? false : { opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: EASE_OUT }}
        >
          {/* Mobile logo */}
          <div className="lg:hidden text-center mb-8">
            <Link to="/" className="inline-flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'var(--primary)' }}>
                <BookOpen className="h-4 w-4 text-white" />
              </div>
              <span className="font-display font-bold text-lg" style={{ color: 'var(--text-1)' }}>
                Travexa <span style={{ color: 'var(--gold)' }}>Academy</span>
              </span>
            </Link>
          </div>

          <h1 className="font-display font-bold text-2xl mb-1" style={{ color: 'var(--text-1)' }}>
            Creá tu cuenta gratis
          </h1>
          <p className="text-sm mb-8" style={{ color: 'var(--text-3)' }}>
            Empezá tu formación en turismo profesional hoy.
          </p>

          {/* Google Button */}
          <motion.button
            onClick={() => { void handleGoogle() }}
            disabled={googleLoading || loading}
            whileTap={{ scale: 0.97 }}
            className="w-full flex items-center justify-center gap-3 h-11 rounded-xl border transition-all duration-200 font-medium text-sm mb-4 disabled:opacity-60"
            style={{ borderColor: 'var(--line)', background: 'var(--card)', color: 'var(--text-1)' }}
          >
            {googleLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
            )}
            Registrarme con Google
          </motion.button>

          <div className="flex items-center gap-3 mb-5">
            <div className="flex-1 h-px" style={{ background: 'var(--line)' }} />
            <span className="text-xs font-mono" style={{ color: 'var(--text-3)' }}>o con email</span>
            <div className="flex-1 h-px" style={{ background: 'var(--line)' }} />
          </div>

          <motion.form
            onSubmit={(e) => { void handleSubmit(e) }}
            animate={shake && !shouldReduce ? shakeX : {}}
            className="space-y-4"
          >
            {/* Tipo de cuenta */}
            <div className="space-y-2">
              <Label className="text-sm" style={{ color: 'var(--text-2)' }}>¿Cómo te describís?</Label>
              <div className="grid grid-cols-3 gap-2">
                {TIPO_OPCIONES.map(op => {
                  const Icon = op.icon
                  const active = tipoCuenta === op.value
                  return (
                    <motion.button
                      key={op.value}
                      type="button"
                      whileTap={{ scale: 0.97 }}
                      onClick={() => setTipoCuenta(op.value)}
                      className="rounded-xl border-2 p-3 text-left transition-all"
                      style={{
                        borderColor: active ? 'var(--primary)' : 'var(--line)',
                        background: active ? 'var(--primary-s)' : 'var(--bg)',
                      }}
                    >
                      <Icon className="h-4 w-4 mb-1.5" style={{ color: active ? 'var(--primary-l)' : 'var(--text-3)' }} />
                      <p className="text-xs font-semibold" style={{ color: active ? 'var(--text-1)' : 'var(--text-2)' }}>
                        {op.label}
                      </p>
                    </motion.button>
                  )
                })}
              </div>
            </div>

            {/* Nombre + Apellido */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="nombre" className="text-sm" style={{ color: 'var(--text-2)' }}>Nombre</Label>
                <Input
                  id="nombre"
                  placeholder="Nombre"
                  value={nombre}
                  onChange={e => setNombre(e.target.value)}
                  required
                  className="h-10"
                  style={{ background: 'var(--bg-2)', borderColor: 'var(--line)', color: 'var(--text-1)' }}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="apellido" className="text-sm" style={{ color: 'var(--text-2)' }}>Apellido</Label>
                <Input
                  id="apellido"
                  placeholder="Apellido"
                  value={apellido}
                  onChange={e => setApellido(e.target.value)}
                  required
                  className="h-10"
                  style={{ background: 'var(--bg-2)', borderColor: 'var(--line)', color: 'var(--text-1)' }}
                />
              </div>
            </div>

            {/* Email */}
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-sm" style={{ color: 'var(--text-2)' }}>Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="tu@email.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                className="h-10"
                style={{ background: 'var(--bg-2)', borderColor: 'var(--line)', color: 'var(--text-1)' }}
              />
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-sm" style={{ color: 'var(--text-2)' }}>Contraseña</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Mínimo 6 caracteres"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  className="h-10 pr-10"
                  style={{ background: 'var(--bg-2)', borderColor: 'var(--line)', color: 'var(--text-1)' }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                  style={{ color: 'var(--text-3)' }}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Código de referido — solo si no viene pre-llenado de URL */}
            {!searchParams.get('ref') && (
              <div className="space-y-1.5">
                <Label htmlFor="ref" className="text-xs" style={{ color: 'var(--text-3)' }}>
                  Código de referido (opcional)
                </Label>
                <Input
                  id="ref"
                  placeholder="XXXXXXXX"
                  value={referralCode}
                  onChange={e => setReferralCode(e.target.value.toUpperCase())}
                  maxLength={8}
                  className="h-9 font-mono text-sm"
                  style={{ background: 'var(--bg-2)', borderColor: 'var(--line)', color: 'var(--text-1)' }}
                />
              </div>
            )}
            {searchParams.get('ref') && (
              <div className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-mono" style={{ background: 'var(--primary-s)', color: 'var(--primary-l)' }}>
                <CheckCircle2 className="h-3.5 w-3.5" />
                Código de referido aplicado: {referralCode}
              </div>
            )}

            <AnimatePresence>
              {error && (
                <motion.p
                  key="error"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="text-sm rounded-lg px-3 py-2"
                  style={{ color: 'rgb(248 113 113)', background: 'rgba(248,113,113,.1)', border: '1px solid rgba(248,113,113,.2)' }}
                >
                  {error}
                  {error.includes('ingresar') && (
                    <Link to="/login" className="underline ml-1 font-medium">Ingresá acá.</Link>
                  )}
                </motion.p>
              )}
            </AnimatePresence>

            <motion.div whileTap={{ scale: 0.97 }}>
              <Button
                type="submit"
                disabled={loading || googleLoading}
                className="w-full h-11 font-semibold disabled:opacity-60"
                style={{ background: 'var(--primary)', color: 'var(--text-1)' }}
              >
                <AnimatePresence mode="wait">
                  {status === 'loading' && (
                    <motion.span key="l" {...{ initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 } }}>
                      <Loader2 className="h-4 w-4 animate-spin" />
                    </motion.span>
                  )}
                  {status === 'success' && (
                    <motion.span key="s" initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4" /> ¡Cuenta creada!
                    </motion.span>
                  )}
                  {(status === 'idle' || status === 'error') && (
                    <motion.span key="i" {...{ initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 } }}>
                      Crear cuenta gratis
                    </motion.span>
                  )}
                </AnimatePresence>
              </Button>
            </motion.div>

            <p className="text-xs text-center leading-relaxed" style={{ color: 'var(--text-3)' }}>
              Al registrarte aceptás nuestros términos de uso. Tu cuenta es gratuita.
            </p>
          </motion.form>

          <p className="text-center text-sm mt-6" style={{ color: 'var(--text-3)' }}>
            ¿Ya tenés cuenta?{' '}
            <Link to="/login" className="font-medium hover:underline" style={{ color: 'var(--gold)' }}>
              Ingresá
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  )
}
