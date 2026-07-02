import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { useAcademyProfile } from '@/hooks/useProfile'

function Spinner() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-8 h-8 rounded-full border-2 border-brand-gold border-t-transparent animate-spin" />
    </div>
  )
}

export default function ProtectedRoute() {
  const { user, loading } = useAuth()
  const location = useLocation()
  const { data: profile, isLoading: profileLoading } = useAcademyProfile(user?.id)

  if (loading || (user && profileLoading)) return <Spinner />
  if (!user) return <Navigate to="/login" replace />

  // Onboarding gate — leído contra la base, nunca localStorage.
  const done = profile?.onboarding_completo === true
  const onOnboarding = location.pathname === '/onboarding'

  if (!done && !onOnboarding) return <Navigate to="/onboarding" replace />
  if (done && onOnboarding) return <Navigate to="/cursos" replace />

  return <Outlet />
}
