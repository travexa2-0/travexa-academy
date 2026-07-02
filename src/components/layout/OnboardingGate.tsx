import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { useAcademyProfile } from '@/hooks/useProfile'

// Gate global de onboarding. Envuelve TODAS las rutas para que sea el único lugar
// que decide si un usuario autenticado sin onboarding va a /onboarding — sin importar
// dónde aterrice después de loguearse (incluye el fallback de Google OAuth al Site URL).
//
// Rutas exentas: auth, el propio onboarding y el callback (ahí la sesión aún se resuelve).
const EXEMPT = new Set(['/login', '/registro', '/auth/callback', '/onboarding'])

export default function OnboardingGate() {
  const { user, loading } = useAuth()
  const location = useLocation()
  const { data: profile, isLoading } = useAcademyProfile(user?.id)

  // Solo actuamos cuando hay usuario y su perfil ya cargó (evita redirects prematuros).
  if (user && !loading && !isLoading) {
    const done = profile?.onboarding_completo === true
    if (!done && !EXEMPT.has(location.pathname)) {
      return <Navigate to="/onboarding" replace />
    }
  }

  return <Outlet />
}
