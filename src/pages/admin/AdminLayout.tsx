import { useEffect, useMemo, useState } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import './admin.css'
import { AdminUIContext } from './adminContext'
import SettingsDrawer from './components/SettingsDrawer'
import CommandPalette from './components/CommandPalette'
import { useAuth } from '@/contexts/AuthContext'
import { useAdminCourses } from '@/hooks/admin/useAdminCourses'
import { useModerationPendingCount } from '@/hooks/admin/useModeration'

const CRUMBS: Record<string, string> = {
  '/admin/resumen': 'Resumen',
  '/admin/cursos': 'Cursos',
  '/admin/vivenciales': 'Vivenciales',
  '/admin/comentarios': 'Moderación',
  '/admin/metricas': 'Métricas',
}

function NavIcon({ name }: { name: string }) {
  switch (name) {
    case 'resumen': return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><rect x="3" y="3" width="7" height="9" rx="1.5" /><rect x="14" y="3" width="7" height="5" rx="1.5" /><rect x="14" y="12" width="7" height="9" rx="1.5" /><rect x="3" y="16" width="7" height="5" rx="1.5" /></svg>
    case 'cursos': return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><path d="M4 5.5C4 4.7 4.7 4 5.5 4H12v16H5.5A1.5 1.5 0 014 18.5v-13z" /><path d="M20 5.5c0-.8-.7-1.5-1.5-1.5H12v16h6.5a1.5 1.5 0 001.5-1.5v-13z" /></svg>
    case 'vivenciales': return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><path d="M3 11l18-7-7 18-2.5-7L3 11z" strokeLinejoin="round" /></svg>
    case 'comentarios': return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" strokeLinejoin="round" /></svg>
    case 'metricas': return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><path d="M4 20V10M12 20V4M20 20v-7" /></svg>
    default: return null
  }
}

export default function AdminLayout() {
  const location = useLocation()
  const { user } = useAuth()
  const [collapsed, setCollapsed] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)

  const { data: cursos } = useAdminCourses(['grabado', 'en_vivo'])
  const { data: vivenciales } = useAdminCourses(['vivencial'])
  const { data: pendingModeration } = useModerationPendingCount()

  // ⌘K / Ctrl+K opens the command palette.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setSearchOpen(v => !v)
      }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [])

  const ui = useMemo(() => ({
    openSettings: () => setSettingsOpen(true),
    openSearch: () => setSearchOpen(true),
  }), [])

  const crumb = CRUMBS[location.pathname] ?? 'Panel'
  const hoy = new Date().toLocaleDateString('es-AR', { day: 'numeric', month: 'long' })
  const userName = user?.email ?? 'Admin'
  const initials = (user?.email ?? 'A').slice(0, 2).toUpperCase()

  const navItem = (page: string, label: string, count?: number) => (
    <NavLink to={`/admin/${page}`} className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`} title={label}>
      <NavIcon name={page} />
      <span className="nav-label">{label}</span>
      {count !== undefined && <span className="nav-count">{count}</span>}
    </NavLink>
  )

  return (
    <AdminUIContext.Provider value={ui}>
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
                <div className="l2">Backoffice</div>
              </div>
            </div>

            <nav className="sidebar-nav" aria-label="Navegación principal">
              <div className="nav-section-label">Panel</div>
              {navItem('resumen', 'Resumen')}
              <div className="nav-section-label">Contenido</div>
              {navItem('cursos', 'Cursos', cursos?.length ?? 0)}
              {navItem('vivenciales', 'Vivenciales', vivenciales?.length ?? 0)}
              <div className="nav-section-label">Comunidad</div>
              {navItem('comentarios', 'Moderación', pendingModeration || undefined)}
              <div className="nav-section-label">Negocio</div>
              {navItem('metricas', 'Métricas')}
            </nav>

            <div className="sidebar-foot">
              <button className="sidebar-user" onClick={() => setSettingsOpen(true)}>
                <div className="sidebar-user-avatar">{initials}</div>
                <div>
                  <div className="sidebar-user-name">{userName}</div>
                  <div className="sidebar-user-role">Administrador</div>
                </div>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.7 1.7 0 00.34 1.87l.06.06a2 2 0 11-2.83 2.83l-.06-.06a1.7 1.7 0 00-1.87-.34 1.7 1.7 0 00-1 1.55V21a2 2 0 11-4 0v-.09a1.7 1.7 0 00-1-1.55 1.7 1.7 0 00-1.87.34l-.06.06a2 2 0 11-2.83-2.83l.06-.06a1.7 1.7 0 00.34-1.87 1.7 1.7 0 00-1.55-1H3a2 2 0 110-4h.09a1.7 1.7 0 001.55-1 1.7 1.7 0 00-.34-1.87l-.06-.06a2 2 0 112.83-2.83l.06.06a1.7 1.7 0 001.87.34H9a1.7 1.7 0 001-1.55V3a2 2 0 114 0v.09a1.7 1.7 0 001 1.55 1.7 1.7 0 001.87-.34l.06-.06a2 2 0 112.83 2.83l-.06.06a1.7 1.7 0 00-.34 1.87V9a1.7 1.7 0 001.55 1H21a2 2 0 110 4h-.09a1.7 1.7 0 00-1.55 1z" /></svg>
              </button>
            </div>
          </aside>

          <div className="main">
            <header className="topbar">
              <div className="crumb">{crumb} <span className="sep">·</span> <span className="muted">hoy, {hoy}</span></div>

              <button className="topbar-search" onClick={() => setSearchOpen(true)}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="7" /><path d="M21 21l-4.3-4.3" /></svg>
                <span className="ts-label">Buscar…</span>
                <kbd>⌘K</kbd>
              </button>

              <div className="topbar-actions">
                <button className="icon-btn" onClick={() => setSettingsOpen(true)} title="Configuración">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.7 1.7 0 00.34 1.87l.06.06a2 2 0 11-2.83 2.83l-.06-.06a1.7 1.7 0 00-1.87-.34 1.7 1.7 0 00-1 1.55V21a2 2 0 11-4 0v-.09a1.7 1.7 0 00-1-1.55 1.7 1.7 0 00-1.87.34l-.06.06a2 2 0 11-2.83-2.83l.06-.06a1.7 1.7 0 00.34-1.87 1.7 1.7 0 00-1.55-1H3a2 2 0 110-4h.09a1.7 1.7 0 001.55-1 1.7 1.7 0 00-.34-1.87l-.06-.06a2 2 0 112.83-2.83l.06.06a1.7 1.7 0 001.87.34H9a1.7 1.7 0 001-1.55V3a2 2 0 114 0v.09a1.7 1.7 0 001 1.55 1.7 1.7 0 001.87-.34l.06-.06a2 2 0 112.83 2.83l-.06.06a1.7 1.7 0 00-.34 1.87V9a1.7 1.7 0 001.55 1H21a2 2 0 110 4h-.09a1.7 1.7 0 00-1.55 1z" /></svg>
                </button>
              </div>
            </header>

            <div className="main-content">
              <Outlet />
            </div>
          </div>
        </div>

        <SettingsDrawer open={settingsOpen} onClose={() => setSettingsOpen(false)} />
        <CommandPalette open={searchOpen} onClose={() => setSearchOpen(false)} onOpenSettings={() => setSettingsOpen(true)} />
      </div>
    </AdminUIContext.Provider>
  )
}
