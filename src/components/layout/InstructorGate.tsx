import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { useIsAdmin } from '@/hooks/useIsAdmin'
import { useInstructorSelf } from '@/hooks/useInstructorSelf'

// Route-level gate for /instructor/*. Real access control lives in RLS — every query
// under this gate is already scoped to the instructor's own rows. Admin takes priority:
// an admin who also has an instructor row belongs in /admin/*.
export default function InstructorGate() {
  const { user, loading } = useAuth()
  const { isAdmin, isLoading: adminLoading } = useIsAdmin()
  const { isInstructor, isLoading: instructorLoading } = useInstructorSelf()

  if (loading || (user && (adminLoading || instructorLoading))) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#F6F6F2' }}>
        <div className="w-8 h-8 border-2 rounded-full animate-spin" style={{ borderColor: '#0B6B57', borderTopColor: 'transparent' }} />
      </div>
    )
  }

  if (!user) return <Navigate to="/login" replace />
  if (isAdmin) return <Navigate to="/admin/resumen" replace />
  if (!isInstructor) return <Navigate to="/cursos" replace />

  return <Outlet />
}
