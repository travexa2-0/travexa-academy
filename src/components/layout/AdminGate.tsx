import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { useIsAdmin } from '@/hooks/useIsAdmin'

// Route-level gate for /admin/*. Real access control backed by RLS (profiles.es_admin);
// hiding the menu link is not enough. Non-admins are bounced to the public catalog.
export default function AdminGate() {
  const { user, loading } = useAuth()
  const { isAdmin, isLoading } = useIsAdmin()

  if (loading || (user && isLoading)) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#F6F6F2' }}>
        <div className="w-8 h-8 border-2 rounded-full animate-spin" style={{ borderColor: '#0B6B57', borderTopColor: 'transparent' }} />
      </div>
    )
  }

  if (!user) return <Navigate to="/login" replace />
  if (!isAdmin) return <Navigate to="/cursos" replace />

  return <Outlet />
}
