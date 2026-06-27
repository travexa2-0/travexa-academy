import { Link, useNavigate } from 'react-router-dom'
import { BookOpen, LogOut, User, Menu, X } from 'lucide-react'
import { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'

export default function Header() {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)

  const handleSignOut = async () => {
    await signOut()
    navigate('/')
  }

  return (
    <header className="sticky top-0 z-50 border-b border-surface bg-brand-navy/90 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 shrink-0">
          <BookOpen className="h-5 w-5 text-brand-gold" />
          <span className="font-display font-bold text-text-primary text-lg leading-none">
            Travexa <span className="text-brand-gold">Academy</span>
          </span>
        </Link>

        {/* Nav desktop */}
        <nav className="hidden md:flex items-center gap-6">
          <Link to="/cursos" className="text-text-secondary hover:text-text-primary text-sm font-medium transition-colors">
            Cursos
          </Link>
          {user && (
            <Link to="/dashboard" className="text-text-secondary hover:text-text-primary text-sm font-medium transition-colors">
              Mi panel
            </Link>
          )}
        </nav>

        {/* Auth desktop */}
        <div className="hidden md:flex items-center gap-3">
          {user ? (
            <>
              <Link to="/mi-cuenta">
                <Button variant="ghost" size="sm" className="gap-2 text-text-secondary hover:text-text-primary">
                  <User className="h-4 w-4" />
                  Mi cuenta
                </Button>
              </Link>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSignOut}
                className="gap-2 text-text-muted hover:text-text-primary"
              >
                <LogOut className="h-4 w-4" />
                Salir
              </Button>
            </>
          ) : (
            <>
              <Link to="/login">
                <Button variant="ghost" size="sm" className="text-text-secondary hover:text-text-primary">
                  Ingresar
                </Button>
              </Link>
              <Link to="/registro">
                <Button size="sm" className="bg-brand-gold hover:bg-brand-gold-deep text-brand-navy font-semibold">
                  Empezar gratis
                </Button>
              </Link>
            </>
          )}
        </div>

        {/* Hamburger mobile */}
        <button
          className="md:hidden text-text-secondary hover:text-text-primary"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Menu"
        >
          {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden border-t border-surface bg-brand-navy-2 px-4 py-4 space-y-3">
          <Link to="/cursos" onClick={() => setMenuOpen(false)} className="block text-text-secondary hover:text-text-primary text-sm font-medium py-2">
            Cursos
          </Link>
          {user ? (
            <>
              <Link to="/dashboard" onClick={() => setMenuOpen(false)} className="block text-text-secondary hover:text-text-primary text-sm font-medium py-2">
                Mi panel
              </Link>
              <Link to="/mi-cuenta" onClick={() => setMenuOpen(false)} className="block text-text-secondary hover:text-text-primary text-sm font-medium py-2">
                Mi cuenta
              </Link>
              <button onClick={() => { void handleSignOut(); setMenuOpen(false) }} className="block text-text-muted hover:text-text-primary text-sm font-medium py-2 w-full text-left">
                Cerrar sesión
              </button>
            </>
          ) : (
            <>
              <Link to="/login" onClick={() => setMenuOpen(false)} className="block text-text-secondary hover:text-text-primary text-sm font-medium py-2">
                Ingresar
              </Link>
              <Link to="/registro" onClick={() => setMenuOpen(false)}>
                <Button size="sm" className="w-full bg-brand-gold hover:bg-brand-gold-deep text-brand-navy font-semibold">
                  Empezar gratis
                </Button>
              </Link>
            </>
          )}
        </div>
      )}
    </header>
  )
}
