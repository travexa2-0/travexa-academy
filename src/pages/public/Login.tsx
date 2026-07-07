import { useState, type FormEvent } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import { Eye, EyeOff, CheckCircle2, Loader2, BookOpen, Globe, MapPin, Compass } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuth } from '@/contexts/AuthContext'
import { EASE_OUT, shakeX } from '@/lib/motion'

const HERO_QUOTES = [
  { quote: 'El turismo no es un lujo, es una necesidad del alma moderna.', author: 'Travexa Academy' },
  { quote: 'Cada destino que vendés lo tenés que haber sentido primero.', author: 'Metodología Vivencial' },
  { quote: 'Un buen asesor no vende viajes, vende experiencias que cambian vidas.', author: 'Travexa Academy' },
]


export default function Login() {
  const { signIn, signInWithGoogle } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  // Sin destino explícito, pasamos por /auth/callback: es el único punto que decide
  // admin (→ /admin/resumen) vs alumno (→ /cursos, luego OnboardingGate si falta onboarding).
  const from = (location.state as { from?: string } | null)?.from ?? '/auth/callback'
  // Llega true tras completar /actualizar-contrasena; mostramos un aviso de éxito.
  const passwordReset = (location.state as { passwordReset?: boolean } | null)?.passwordReset === true
  const shouldReduce = useReducedMotion()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [error, setError] = useState<string | null>(null)
  const [shake, setShake] = useState(false)
  const quoteIdx = Math.floor(Date.now() / 10000) % HERO_QUOTES.length
  const heroQuote = HERO_QUOTES[quoteIdx]

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setStatus('loading')
    setError(null)

    const { error } = await signIn(email, password)

    if (error) {
      setError('Email o contraseña incorrectos.')
      setStatus('error')
      setLoading(false)
      setShake(true)
      setTimeout(() => setShake(false), 500)
      return
    }

    setStatus('success')
    setTimeout(() => navigate(from, { replace: true }), 600)
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
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-bg-deep">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: 'url(https://images.unsplash.com/photo-1499856871958-5b9627545d1a?w=1200&q=80)' }}
        />
        <div className="absolute inset-0 bg-gradient-to-br from-bg-deep/90 via-primary/20 to-bg-deep/70" />

        {/* Logo */}
        <div className="relative z-10 flex flex-col justify-between p-12 w-full">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center">
              <BookOpen className="h-5 w-5 text-white" />
            </div>
            <span className="font-display font-bold text-lg text-text-1">
              Travexa <span style={{ color: 'var(--gold)' }}>Academy</span>
            </span>
          </Link>

          <div className="space-y-6">
            <div className="flex gap-4 text-text-3 text-sm">
              <span className="flex items-center gap-1.5"><Globe className="h-4 w-4" /> +200 destinos</span>
              <span className="flex items-center gap-1.5"><MapPin className="h-4 w-4" /> Argentina</span>
              <span className="flex items-center gap-1.5"><Compass className="h-4 w-4" /> Turismo profesional</span>
            </div>
            <blockquote>
              <p className="font-display text-2xl font-bold text-text-1 leading-snug">
                &ldquo;{heroQuote.quote}&rdquo;
              </p>
              <footer className="mt-3 font-mono text-xs text-primary-l">— {heroQuote.author}</footer>
            </blockquote>
          </div>
        </div>
      </div>

      {/* Right — form */}
      <div className="flex-1 flex items-center justify-center px-6 py-12 bg-bg">
        <motion.div
          className="w-full max-w-md"
          initial={shouldReduce ? false : { opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: EASE_OUT }}
        >
          {/* Mobile logo */}
          <div className="lg:hidden text-center mb-8">
            <Link to="/" className="inline-flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                <BookOpen className="h-4 w-4 text-white" />
              </div>
              <span className="font-display font-bold text-lg text-text-1">
                Travexa <span style={{ color: 'var(--gold)' }}>Academy</span>
              </span>
            </Link>
          </div>

          <h1 className="font-display font-bold text-2xl text-text-1 mb-1">Ingresá a tu cuenta</h1>
          <p className="text-text-3 text-sm mb-8">Tu formación en turismo continúa acá.</p>

          {passwordReset && (
            <div className="flex items-start gap-2 text-sm text-primary-l bg-primary/10 border border-primary/20 rounded-lg px-3 py-2.5 mb-6">
              <CheckCircle2 className="h-4 w-4 mt-0.5 shrink-0" />
              <span>Tu contraseña se actualizó. Ingresá con la nueva contraseña.</span>
            </div>
          )}

          {/* Google Button */}
          <motion.button
            onClick={() => { void handleGoogle() }}
            disabled={googleLoading || loading}
            whileTap={{ scale: 0.97 }}
            className="w-full flex items-center justify-center gap-3 h-11 rounded-xl border border-line hover:border-line-s bg-card hover:bg-card-h transition-all duration-200 text-text-1 font-medium text-sm mb-4 disabled:opacity-60"
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
            Continuar con Google
          </motion.button>

          <div className="flex items-center gap-3 mb-4">
            <div className="flex-1 h-px bg-line" />
            <span className="text-xs text-text-3 font-mono">o con email</span>
            <div className="flex-1 h-px bg-line" />
          </div>

          {/* Form */}
          <motion.form
            onSubmit={(e) => { void handleSubmit(e) }}
            animate={shake && !shouldReduce ? shakeX : {}}
            className="space-y-4"
          >
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-text-2 text-sm">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="tu@email.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                className="bg-bg-2 border-line text-text-1 placeholder:text-text-3 focus:border-primary h-11"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-text-2 text-sm">Contraseña</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  className="bg-bg-2 border-line text-text-1 placeholder:text-text-3 focus:border-primary h-11 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-text-3 hover:text-text-2"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <div className="flex justify-end">
                <Link
                  to="/recuperar-contrasena"
                  className="text-xs text-text-3 hover:text-text-2 transition-colors"
                >
                  ¿Olvidaste tu contraseña?
                </Link>
              </div>
            </div>

            <AnimatePresence>
              {error && (
                <motion.p
                  key="error"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="text-sm text-red-400 bg-red-400/10 border border-red-400/20 rounded-lg px-3 py-2"
                >
                  {error}
                </motion.p>
              )}
            </AnimatePresence>

            <motion.div whileTap={{ scale: 0.97 }}>
              <Button
                type="submit"
                disabled={loading || googleLoading}
                className="w-full h-11 font-semibold"
                style={{ backgroundColor: 'var(--primary)', color: 'var(--text-1)' }}
              >
                <AnimatePresence mode="wait">
                  {status === 'loading' && (
                    <motion.span key="loading" {...{ initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 } }}>
                      <Loader2 className="h-4 w-4 animate-spin" />
                    </motion.span>
                  )}
                  {status === 'success' && (
                    <motion.span key="success" initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4" /> ¡Listo!
                    </motion.span>
                  )}
                  {(status === 'idle' || status === 'error') && (
                    <motion.span key="idle" {...{ initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 } }}>
                      Ingresar
                    </motion.span>
                  )}
                </AnimatePresence>
              </Button>
            </motion.div>
          </motion.form>

          <p className="text-center text-text-3 text-sm mt-6">
            ¿No tenés cuenta?{' '}
            <Link to="/registro" className="font-medium hover:underline" style={{ color: 'var(--gold)' }}>
              Registrate gratis
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  )
}
