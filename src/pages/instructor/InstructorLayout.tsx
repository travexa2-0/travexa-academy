import { useState } from 'react'
import { NavLink, Outlet, useLocation, Link } from 'react-router-dom'
import { LogOut } from 'lucide-react'
import '../admin/admin.css'
import { useAuth } from '@/contexts/AuthContext'
import { useInstructorSelf } from '@/hooks/useInstructorSelf'
import { useOwnCourses } from '@/hooks/instructor/useInstructorCourses'

const CRUMBS: Record<string, string> = {
  '/instructor/resumen': 'Resumen',
  '/instructor/cursos': 'Mis cursos',
  '/instructor/calendario': 'Calendario',
  '/instructor/metricas': 'Métricas',
  '/instructor/pagos': 'Pagos',
  '/instructor/perfil': 'Mi perfil',
}

function NavIcon({ name }: { name: string }) {
  switch (name) {
    case 'resumen': return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><rect x="3" y="3" width="7" height="9" rx="1.5" /><rect x="14" y="3" width="7" height="5" rx="1.5" /><rect x="14" y="12" width="7" height="9" rx="1.5" /><rect x="3" y="16" width="7" height="5" rx="1.5" /></svg>
    case 'cursos': return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><path d="M4 5.5C4 4.7 4.7 4 5.5 4H12v16H5.5A1.5 1.5 0 014 18.5v-13z" /><path d="M20 5.5c0-.8-.7-1.5-1.5-1.5H12v16h6.5a1.5 1.5 0 001.5-1.5v-13z" /></svg>
    case 'calendario': return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M3 10h18M8 3v4M16 3v4" /></svg>
    case 'metricas': return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><path d="M4 20V10M12 20V4M20 20v-7" /></svg>
    case 'pagos': return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><rect x="2" y="6" width="20" height="13" rx="2" /><path d="M2 10h20M6 15h4" /></svg>
    case 'perfil': return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><circle cx="12" cy="8" r="4" /><path d="M4 21c0-4 3.6-7 8-7s8 3 8 7" /></svg>
    default: return null
  }
}

export default function InstructorLayout() {
  const location = useLocation()
  const { signOut } = useAuth()
  const { instructor } = useInstructorSelf()
  const [collapsed, setCollapsed] = useState(false)

  const { data: cursos } = useOwnCourses(instructor?.id)

  // El detalle de curso no está en CRUMBS: cae al label del listado.
  const crumb = CRUMBS[location.pathname]
    ?? (location.pathname.startsWith('/instructor/cursos/') ? 'Mis cursos' : 'Portal')

  const hoy = new Date().toLocaleDateString('es-AR', { day: 'numeric', month: 'long' })
  const nombre = instructor?.nombre ?? 'Instructor'
  const initials = nombre.split(' ').map(p => p[0]).slice(0, 2).join('').toUpperCase()

  const navItem = (page: string, label: string, count?: number) => (
    <NavLink to={`/instructor/${page}`} className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`} title={label}>
      <NavIcon name={page} />
      <span className="nav-label">{label}</span>
      {count !== undefined && <span className="nav-count">{count}</span>}
    </NavLink>
  )

  return (
    <div className="admin-root">
      <div className={`app${collapsed ? ' collapsed' : ''}`}>
        <button className="sidebar-collapse-btn" onClick={() => setCollapsed(v => !v)} title="Contraer menú" aria-label="Contraer menú">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M15 6l-6 6 6 6" /></svg>
        </button>

        <aside className="sidebar">
          <div className="sidebar-brand">
            <div className="sidebar-brand-mark">
              <svg viewBox="0 0 24 24" fill="none" width="18" height="18"><path d="M2 16l20-7-7 20-3-8-8-3z" stroke="#0A1E29" strokeWidth="1.8" strokeLinejoin="round" /></svg>
            </div>
            <div className="sidebar-brand-text">
              <div className="l1">Travexa Academy</div>
              <div className="l2">Portal de instructor</div>
            </div>
          </div>

          <nav className="sidebar-nav" aria-label="Navegación principal">
            <div className="nav-section-label">Panel</div>
            {navItem('resumen', 'Resumen')}
            <div className="nav-section-label">Contenido</div>
            {navItem('cursos', 'Mis cursos', cursos?.length ?? 0)}
            {navItem('calendario', 'Calendario')}
            <div className="nav-section-label">Negocio</div>
            {navItem('metricas', 'Métricas')}
            {navItem('pagos', 'Pagos')}
            <div className="nav-section-label">Cuenta</div>
            {navItem('perfil', 'Mi perfil')}
          </nav>

          <div className="sidebar-foot">
            <Link to="/perfil" className="sidebar-user" style={{ textDecoration: 'none' }}>
              <div className="sidebar-user-avatar" style={instructor?.avatar_url ? { backgroundImage: `url('${instructor.avatar_url}')`, backgroundSize: 'cover', backgroundPosition: 'center' } : undefined}>
                {!instructor?.avatar_url && initials}
              </div>
              <div>
                <div className="sidebar-user-name">{nombre}</div>
                <div className="sidebar-user-role">Instructor</div>
              </div>
            </Link>
          </div>
        </aside>

        <div className="main">
          <header className="topbar">
            <div className="crumb">{crumb} <span className="sep">·</span> <span className="muted">hoy, {hoy}</span></div>
            <div className="topbar-actions" style={{ marginLeft: 'auto' }}>
              <Link to="/cursos" className="btn btn-ghost btn-sm">Ir al sitio</Link>
              <button className="btn btn-ghost btn-sm" onClick={() => { void signOut() }}>
                <LogOut /> Salir
              </button>
            </div>
          </header>

          <div className="main-content">
            <Outlet />
          </div>
        </div>
      </div>
    </div>
  )
}
