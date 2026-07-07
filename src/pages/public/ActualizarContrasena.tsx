import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import { Eye, EyeOff, Loader2, BookOpen } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { supabase } from '@/lib/supabase'
import { EASE_OUT, shakeX } from '@/lib/motion'

export default function ActualizarContrasena() {
  const navigate = useNavigate()
  const shouldReduce = useReducedMotion()

  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [shake, setShake] = useState(false)

  const triggerError = (msg: string) => {
    setError(msg)
    setShake(true)
    setTimeout(() => setShake(false), 500)
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)

    if (password.length < 6) {
      triggerError('La contraseña debe tener al menos 6 caracteres.')
      return
    }
    if (password !== confirm) {
      triggerError('Las contraseñas no coinciden.')
      return
    }

    setLoading(true)
    const { error } = await supabase.auth.updateUser({ password })
    setLoading(false)

    if (error) {
      // El link pudo haber expirado o la sesión temporal no estar activa.
      triggerError('No pudimos actualizar la contraseña. El enlace pudo haber expirado, pedí uno nuevo.')
      return
    }

    navigate('/login', { replace: true, state: { passwordReset: true } })
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

        <div className="relative z-10 flex flex-col justify-between p-12 w-full">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center">
              <BookOpen className="h-5 w-5 text-white" />
            </div>
            <span className="font-display font-bold text-lg text-text-1">
              Travexa <span style={{ color: 'var(--gold)' }}>Academy</span>
            </span>
          </Link>

          <blockquote>
            <p className="font-display text-2xl font-bold text-text-1 leading-snug">
              &ldquo;Elegí una contraseña nueva y volvé a lo que importa: tu formación.&rdquo;
            </p>
            <footer className="mt-3 font-mono text-xs text-primary-l">— Travexa Academy</footer>
          </blockquote>
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

          <h1 className="font-display font-bold text-2xl text-text-1 mb-1">Nueva contraseña</h1>
          <p className="text-text-3 text-sm mb-8">Elegí una contraseña nueva para tu cuenta.</p>

          <motion.form
            onSubmit={(e) => { void handleSubmit(e) }}
            animate={shake && !shouldReduce ? shakeX : {}}
            className="space-y-4"
          >
            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-text-2 text-sm">Nueva contraseña</Label>
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
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="confirm" className="text-text-2 text-sm">Repetir contraseña</Label>
              <Input
                id="confirm"
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                value={confirm}
                onChange={e => setConfirm(e.target.value)}
                required
                className="bg-bg-2 border-line text-text-1 placeholder:text-text-3 focus:border-primary h-11"
              />
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
                disabled={loading}
                className="w-full h-11 font-semibold"
                style={{ backgroundColor: 'var(--primary)', color: 'var(--text-1)' }}
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Guardar contraseña'}
              </Button>
            </motion.div>
          </motion.form>

          <p className="text-center text-text-3 text-sm mt-6">
            <Link to="/login" className="font-medium hover:underline" style={{ color: 'var(--gold)' }}>
              Volver al inicio de sesión
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  )
}
