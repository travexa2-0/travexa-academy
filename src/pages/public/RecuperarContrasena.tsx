import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import { Loader2, BookOpen, MailCheck, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { supabase } from '@/lib/supabase'
import { EASE_OUT } from '@/lib/motion'

export default function RecuperarContrasena() {
  const shouldReduce = useReducedMotion()

  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setLoading(true)

    // Deliberadamente ignoramos el error para no revelar si el email existe o no.
    await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/actualizar-contrasena`,
    })

    setLoading(false)
    setSent(true)
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
              &ldquo;Tu formación en turismo continúa. Recuperá el acceso en un minuto.&rdquo;
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

          <AnimatePresence mode="wait">
            {sent ? (
              <motion.div
                key="sent"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center"
              >
                <div className="w-14 h-14 rounded-2xl bg-primary/15 flex items-center justify-center mx-auto mb-5">
                  <MailCheck className="h-7 w-7 text-primary-l" />
                </div>
                <h1 className="font-display font-bold text-2xl text-text-1 mb-2">Revisá tu correo</h1>
                <p className="text-text-3 text-sm mb-8 leading-relaxed">
                  Si hay una cuenta asociada a <span className="text-text-2">{email}</span>, te enviamos un
                  enlace para restablecer tu contraseña. Revisá también la carpeta de spam.
                </p>
                <Link to="/login">
                  <Button
                    className="w-full h-11 font-semibold"
                    style={{ backgroundColor: 'var(--primary)', color: 'var(--text-1)' }}
                  >
                    Volver al inicio de sesión
                  </Button>
                </Link>
              </motion.div>
            ) : (
              <motion.div key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <h1 className="font-display font-bold text-2xl text-text-1 mb-1">¿Olvidaste tu contraseña?</h1>
                <p className="text-text-3 text-sm mb-8">
                  Ingresá tu email y te enviamos instrucciones para recuperar el acceso.
                </p>

                <form onSubmit={(e) => { void handleSubmit(e) }} className="space-y-4">
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

                  <motion.div whileTap={{ scale: 0.97 }}>
                    <Button
                      type="submit"
                      disabled={loading}
                      className="w-full h-11 font-semibold"
                      style={{ backgroundColor: 'var(--primary)', color: 'var(--text-1)' }}
                    >
                      {loading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        'Enviar instrucciones'
                      )}
                    </Button>
                  </motion.div>
                </form>

                <Link
                  to="/login"
                  className="mt-6 inline-flex items-center gap-1.5 text-text-3 text-sm hover:text-text-2 transition-colors"
                >
                  <ArrowLeft className="h-4 w-4" /> Volver al inicio de sesión
                </Link>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  )
}
