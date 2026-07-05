import { Link, useNavigate, useLocation } from 'react-router-dom'
import { BookOpen, LogOut, User, Menu, X, Bell, Library, Globe, Home } from 'lucide-react'
import { useState, useRef } from 'react'
import { motion, AnimatePresence, useScroll, useMotionValueEvent } from 'framer-motion'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { useNotifications } from '@/hooks/useNotifications'
import NotificationsDrawer from './NotificationsDrawer'

// 3 states:
// 'top'    → at page top, bar is transparent and full-width (merges with hero)
// 'pill'   → scrolled, scrolling UP → floating frosted-glass pill
// 'hidden' → scrolled, scrolling DOWN → slides out
type ScrollState = 'top' | 'pill' | 'hidden'

export default function Header() {
  const { user, signOut } = useAuth()
  const navigate  = useNavigate()
  const location  = useLocation()
  const [menuOpen, setMenuOpen]     = useState(false)
  const [notifsOpen, setNotifsOpen] = useState(false)
  const [scroll, setScroll]         = useState<ScrollState>('top')
  const lastY = useRef(0)

  const { unreadCount } = useNotifications(user?.id)

  const { scrollY } = useScroll()
  useMotionValueEvent(scrollY, 'change', (y) => {
    if (y < 20) {
      setScroll('top')
    } else if (y < lastY.current) {
      setScroll('pill')
    } else {
      setScroll('hidden')
    }
    lastY.current = y
  })

  const handleSignOut = async () => {
    setMenuOpen(false)
    await signOut()
    navigate('/')
  }

  const isActive = (path: string) =>
    path === '/' ? location.pathname === '/' : location.pathname.startsWith(path)

  const isPill = scroll !== 'top'

  return (
    <>
      {/* ── Outer wrapper: full-width, centers the pill, CSS transition ── */}
      <div
        style={{
          position: 'fixed',
          top: 0, left: 0, right: 0,
          zIndex: 50,
          display: 'flex',
          justifyContent: 'center',
          pointerEvents: 'none',
          padding: isPill ? '10px 14px' : '0px',
          transform: scroll === 'hidden' ? 'translateY(-130%)' : 'translateY(0)',
          transition: 'transform 220ms cubic-bezier(0.23,1,0.32,1), padding 320ms cubic-bezier(0.23,1,0.32,1)',
        }}
      >
        {/* ── Inner pill / bar ── */}
        <div
          style={{
            width: '100%',
            maxWidth: 1180,
            height: 56,
            padding: '0 20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            pointerEvents: 'auto',
            borderRadius: isPill ? 14 : 0,
            background: isPill ? 'rgba(10,22,32,.78)' : 'rgba(8,18,26,0)',
            backdropFilter: isPill ? 'blur(44px) saturate(190%)' : 'none',
            WebkitBackdropFilter: isPill ? 'blur(44px) saturate(190%)' : 'none',
            border: `1px solid ${isPill ? 'rgba(255,255,255,.1)' : 'transparent'}`,
            boxShadow: isPill
              ? '0 0 0 1px rgba(255,255,255,.05), 0 2px 16px rgba(0,0,0,.35), 0 8px 32px rgba(0,0,0,.25)'
              : 'none',
            transition: 'background 280ms ease, border-color 280ms ease, box-shadow 280ms ease, border-radius 300ms cubic-bezier(0.23,1,0.32,1)',
          }}
        >
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 shrink-0">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: 'var(--primary)' }}>
              <BookOpen className="h-4 w-4 text-white" />
            </div>
            <span className="font-display font-bold text-base leading-none" style={{ color: 'var(--text-1)' }}>
              Travexa <span style={{ color: 'var(--gold)' }}>Academy</span>
            </span>
          </Link>

          {/* Nav desktop */}
          <nav className="hidden md:flex items-center gap-1">
            {[
              { to: '/',           label: 'Inicio',     icon: Home },
              { to: '/cursos',     label: 'Formación',  icon: Library },
              { to: '/vivencial',  label: 'Vivencial',  icon: Globe },
            ].map(({ to, label, icon: Icon }) => (
              <Link
                key={to}
                to={to}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all"
                style={{
                  color:      isActive(to) ? 'var(--text-1)' : 'var(--text-3)',
                  background: isActive(to) ? 'var(--primary-s)' : 'transparent',
                }}
              >
                <Icon className="h-3.5 w-3.5" />
                {label}
              </Link>
            ))}
          </nav>

          {/* Auth desktop */}
          <div className="hidden md:flex items-center gap-2">
            {user ? (
              <>
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setNotifsOpen(true)}
                  className="relative w-9 h-9 rounded-lg flex items-center justify-center transition-colors"
                  style={{ color: notifsOpen ? 'var(--text-1)' : 'var(--text-3)', background: notifsOpen ? 'var(--primary-s)' : 'transparent' }}
                  aria-label="Notificaciones"
                >
                  <Bell className="h-4 w-4" />
                  <AnimatePresence>
                    {unreadCount > 0 && (
                      <motion.span
                        key="badge"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        exit={{ scale: 0 }}
                        className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 rounded-full flex items-center justify-center font-mono text-[9px] font-bold text-white px-0.5"
                        style={{ background: 'var(--pending)' }}
                      >
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </motion.span>
                    )}
                  </AnimatePresence>
                </motion.button>

                <Link to="/perfil">
                  <Button variant="ghost" size="sm" className="gap-1.5 text-sm h-9" style={{ color: 'var(--text-2)' }}>
                    <User className="h-3.5 w-3.5" />
                    Mi perfil
                  </Button>
                </Link>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => { void handleSignOut() }}
                  className="gap-1.5 text-sm h-9"
                  style={{ color: 'var(--text-3)' }}
                >
                  <LogOut className="h-3.5 w-3.5" />
                  Salir
                </Button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="h-9 px-3 inline-flex items-center rounded-lg text-sm font-medium transition-colors"
                  style={{ color: 'var(--text-2)' }}
                >
                  Ingresar
                </Link>
                <Link
                  to="/registro"
                  className="h-9 px-4 inline-flex items-center rounded-lg text-sm font-semibold transition-all"
                  style={{ background: 'var(--neon)', color: '#0A1E29' }}
                >
                  Empezar gratis
                </Link>
              </>
            )}
          </div>

          {/* Mobile: bell + hamburger */}
          <div className="md:hidden flex items-center gap-1">
            {user && (
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={() => setNotifsOpen(true)}
                className="relative w-9 h-9 flex items-center justify-center rounded-lg"
                style={{ color: 'var(--text-2)' }}
                aria-label="Notificaciones"
              >
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 w-2 h-2 rounded-full" style={{ background: 'var(--pending)' }} />
                )}
              </motion.button>
            )}
            <button
              className="w-9 h-9 flex items-center justify-center rounded-lg"
              style={{ color: 'var(--text-2)' }}
              onClick={() => setMenuOpen(!menuOpen)}
              aria-label="Menú"
            >
              {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Spacer — reserva espacio bajo el header fijo */}
      <div className="h-14" />

      {/* Mobile menu */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.18 }}
            className="fixed top-14 left-0 right-0 z-40 border-b px-4 py-4 space-y-1"
            style={{ background: 'var(--bg-2)', borderColor: 'var(--line)' }}
          >
            <Link to="/" onClick={() => setMenuOpen(false)} className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium" style={{ color: 'var(--text-2)' }}>
              <Home className="h-4 w-4" /> Inicio
            </Link>
            <Link to="/cursos" onClick={() => setMenuOpen(false)} className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium" style={{ color: 'var(--text-2)' }}>
              <Library className="h-4 w-4" /> Formación
            </Link>
            <Link to="/vivencial" onClick={() => setMenuOpen(false)} className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium" style={{ color: 'var(--text-2)' }}>
              <Globe className="h-4 w-4" /> Vivencial
            </Link>
            {user ? (
              <>
                <Link to="/perfil" onClick={() => setMenuOpen(false)} className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium" style={{ color: 'var(--text-2)' }}>
                  <User className="h-4 w-4" /> Mi perfil
                </Link>
                <button onClick={() => { void handleSignOut() }} className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium w-full text-left" style={{ color: 'var(--text-3)' }}>
                  <LogOut className="h-4 w-4" /> Cerrar sesión
                </button>
              </>
            ) : (
              <>
                <Link to="/login" onClick={() => setMenuOpen(false)} className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium" style={{ color: 'var(--text-2)' }}>
                  Ingresar
                </Link>
                <Link
                  to="/registro"
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center justify-center w-full rounded-lg px-4 py-2.5 text-sm font-semibold"
                  style={{ background: 'var(--neon)', color: '#0A1E29' }}
                >
                  Empezar gratis
                </Link>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Notifications drawer */}
      <NotificationsDrawer open={notifsOpen} onClose={() => setNotifsOpen(false)} />
    </>
  )
}
