import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'react-hot-toast'
import { lazy, Suspense, useEffect, useState } from 'react'
import { AuthProvider, useAuth } from '@/contexts/AuthContext'
import ProtectedRoute from '@/components/layout/ProtectedRoute'
import OnboardingGate from '@/components/layout/OnboardingGate'
import AdminGate from '@/components/layout/AdminGate'
import { useIsAdmin } from '@/hooks/useIsAdmin'

const Home                = lazy(() => import('@/pages/Home'))
const Login               = lazy(() => import('@/pages/public/Login'))
const Registro            = lazy(() => import('@/pages/public/Registro'))
const RecuperarContrasena = lazy(() => import('@/pages/public/RecuperarContrasena'))
const ActualizarContrasena = lazy(() => import('@/pages/public/ActualizarContrasena'))
const Catalog             = lazy(() => import('@/pages/public/Catalog'))
const CourseDetail        = lazy(() => import('@/pages/public/CourseDetail'))
const VivencialCatalog    = lazy(() => import('@/pages/public/VivencialCatalog'))
const VivencialDetail     = lazy(() => import('@/pages/public/VivencialDetail'))
const PerfilPublico     = lazy(() => import('@/pages/public/PerfilPublico'))
const PagoConfirmado    = lazy(() => import('@/pages/public/PagoConfirmado'))
const PagoError         = lazy(() => import('@/pages/public/PagoError'))
const Dashboard         = lazy(() => import('@/pages/private/Dashboard'))
const MisCursos         = lazy(() => import('@/pages/private/MisCursos'))
const Player            = lazy(() => import('@/pages/private/Player'))
const Profile           = lazy(() => import('@/pages/private/Profile'))
const Onboarding        = lazy(() => import('@/pages/private/Onboarding'))
const VivencialDetalle  = lazy(() => import('@/pages/private/VivencialDetalle'))
const AdminLayout       = lazy(() => import('@/pages/admin/AdminLayout'))
const AdminResumen      = lazy(() => import('@/pages/admin/Resumen'))
const AdminCursos       = lazy(() => import('@/pages/admin/Cursos'))
const AdminVivenciales  = lazy(() => import('@/pages/admin/Vivenciales'))
const AdminMetricas     = lazy(() => import('@/pages/admin/Metricas'))
const AdminComentarios  = lazy(() => import('@/pages/admin/Comentarios'))
const AdminBeneficios   = lazy(() => import('@/pages/admin/Beneficios'))
const AdminInstructores = lazy(() => import('@/pages/admin/Instructores'))

function PageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg)' }}>
      <div className="w-8 h-8 border-2 rounded-full animate-spin" style={{ borderColor: 'var(--primary)', borderTopColor: 'transparent' }} />
    </div>
  )
}

// Aterrizaje de OAuth (Google). Espera a que la sesión se resuelva desde la URL antes de
// navegar a una ruta real; el OnboardingGate decide luego si va a /onboarding o /cursos.
function AuthCallback() {
  const { user, loading } = useAuth()
  const { isAdmin, isLoading: adminLoading } = useIsAdmin()
  const [timedOut, setTimedOut] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setTimedOut(true), 6000)
    return () => clearTimeout(t)
  }, [])

  // Un admin aterriza directo en el backoffice, salteando el onboarding de alumno.
  if (!loading && user && !adminLoading) {
    return <Navigate to={isAdmin ? '/admin/resumen' : '/cursos'} replace />
  }
  if (timedOut && !user) return <Navigate to="/login" replace />
  return <PageLoader />
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, refetchOnWindowFocus: false },
  },
})

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <Suspense fallback={<PageLoader />}>
          <Routes>
            {/* OnboardingGate global: único decisor del gate de onboarding para todas las rutas */}
            <Route element={<OnboardingGate />}>
              {/* Public */}
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/registro" element={<Registro />} />
              <Route path="/recuperar-contrasena" element={<RecuperarContrasena />} />
              <Route path="/actualizar-contrasena" element={<ActualizarContrasena />} />
              <Route path="/cursos" element={<Catalog />} />
              <Route path="/cursos/:slug" element={<CourseDetail />} />
              <Route path="/vivencial" element={<VivencialCatalog />} />
              <Route path="/vivencial/:slug" element={<VivencialDetail />} />
              <Route path="/u/:username" element={<PerfilPublico />} />
              <Route path="/pago-confirmado" element={<PagoConfirmado />} />
              <Route path="/pago-error" element={<PagoError />} />

              {/* Auth callback — Google OAuth redirect (espera la sesión, luego gate) */}
              <Route path="/auth/callback" element={<AuthCallback />} />

              {/* Private */}
              <Route element={<ProtectedRoute />}>
                <Route path="/onboarding" element={<Onboarding />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/mis-cursos" element={<MisCursos />} />
                <Route path="/viaje/:slug" element={<VivencialDetalle />} />
                <Route path="/cursos/:slug/aprender" element={<Player />} />
                <Route path="/cursos/:slug/aprender/:lessonId" element={<Player />} />
                <Route path="/mi-cuenta" element={<Navigate to="/perfil" replace />} />
                <Route path="/perfil" element={<Profile />} />
              </Route>

              {/* Admin backoffice — real route-level gate (AdminGate) + RLS */}
              <Route element={<ProtectedRoute />}>
                <Route element={<AdminGate />}>
                  <Route path="/admin" element={<AdminLayout />}>
                    <Route index element={<Navigate to="/admin/resumen" replace />} />
                    <Route path="resumen" element={<AdminResumen />} />
                    <Route path="cursos" element={<AdminCursos />} />
                    <Route path="vivenciales" element={<AdminVivenciales />} />
                    <Route path="instructores" element={<AdminInstructores />} />
                    <Route path="beneficios" element={<AdminBeneficios />} />
                    <Route path="comentarios" element={<AdminComentarios />} />
                    <Route path="metricas" element={<AdminMetricas />} />
                  </Route>
                </Route>
              </Route>

              {/* Fallback */}
              <Route path="*" element={<Navigate to="/cursos" replace />} />
            </Route>
          </Routes>
          </Suspense>

          <Toaster
            position="bottom-right"
            toastOptions={{
              style: {
                background: 'var(--bg-2)',
                color: 'var(--text-1)',
                border: '1px solid var(--line)',
                borderRadius: '12px',
                fontFamily: 'var(--font-body)',
                fontSize: '14px',
              },
              success: { iconTheme: { primary: 'var(--primary)', secondary: 'var(--text-1)' } },
            }}
          />
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  )
}
