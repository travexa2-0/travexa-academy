import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import toast, { Toaster } from 'react-hot-toast'
import { lazy, Suspense, useEffect, useState } from 'react'
import { AuthProvider, useAuth } from '@/contexts/AuthContext'
import ErrorBoundary from '@/components/layout/ErrorBoundary'
import ProtectedRoute from '@/components/layout/ProtectedRoute'
import OnboardingGate from '@/components/layout/OnboardingGate'
import AdminGate from '@/components/layout/AdminGate'
import InstructorGate from '@/components/layout/InstructorGate'
import { useIsAdmin } from '@/hooks/useIsAdmin'
import { safeRedirectPath, POST_LOGIN_REDIRECT_KEY } from '@/lib/utils'

const Home                = lazy(() => import('@/pages/Home'))
const Login               = lazy(() => import('@/pages/public/Login'))
const Registro            = lazy(() => import('@/pages/public/Registro'))
const RecuperarContrasena = lazy(() => import('@/pages/public/RecuperarContrasena'))
const ActualizarContrasena = lazy(() => import('@/pages/public/ActualizarContrasena'))
const Catalog             = lazy(() => import('@/pages/public/Catalog'))
const CourseDetail        = lazy(() => import('@/pages/public/CourseDetail'))
const VivencialCatalog    = lazy(() => import('@/pages/public/VivencialCatalog'))
const VivencialDetail     = lazy(() => import('@/pages/public/VivencialDetail'))
const Instructores        = lazy(() => import('@/pages/public/Instructores'))
const PerfilPublico     = lazy(() => import('@/pages/public/PerfilPublico'))
const Privacidad        = lazy(() => import('@/pages/public/Privacidad'))
const Terminos          = lazy(() => import('@/pages/public/Terminos'))
const PagoConfirmado    = lazy(() => import('@/pages/public/PagoConfirmado'))
const PagoError         = lazy(() => import('@/pages/public/PagoError'))
const Dashboard         = lazy(() => import('@/pages/private/Dashboard'))
const MisCursos         = lazy(() => import('@/pages/private/MisCursos'))
const Player            = lazy(() => import('@/pages/private/Player'))
const Profile           = lazy(() => import('@/pages/private/Profile'))
const Onboarding        = lazy(() => import('@/pages/private/Onboarding'))
const VivencialDetalle  = lazy(() => import('@/pages/private/VivencialDetalle'))
const ReservaConfirmada = lazy(() => import('@/pages/private/ReservaConfirmada'))
const AdminLayout       = lazy(() => import('@/pages/admin/AdminLayout'))
const AdminResumen      = lazy(() => import('@/pages/admin/Resumen'))
const AdminCursos       = lazy(() => import('@/pages/admin/Cursos'))
const AdminVivenciales  = lazy(() => import('@/pages/admin/Vivenciales'))
const AdminMetricas     = lazy(() => import('@/pages/admin/Metricas'))
const AdminComentarios  = lazy(() => import('@/pages/admin/Comentarios'))
const AdminBeneficios   = lazy(() => import('@/pages/admin/Beneficios'))
const AdminInstructores = lazy(() => import('@/pages/admin/Instructores'))
const AdminPagosInstructores = lazy(() => import('@/pages/admin/PagosInstructores'))
const InstructorLayout       = lazy(() => import('@/pages/instructor/InstructorLayout'))
const InstructorResumen      = lazy(() => import('@/pages/instructor/Resumen'))
const InstructorCursos       = lazy(() => import('@/pages/instructor/Cursos'))
const InstructorCursoDetalle = lazy(() => import('@/pages/instructor/CursoDetalle'))
const InstructorCalendario   = lazy(() => import('@/pages/instructor/Calendario'))
const InstructorMetricas     = lazy(() => import('@/pages/instructor/Metricas'))
const InstructorPagos        = lazy(() => import('@/pages/instructor/Pagos'))
const InstructorPerfil       = lazy(() => import('@/pages/instructor/Perfil'))

function PageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg)' }}>
      <div className="w-8 h-8 border-2 rounded-full animate-spin" style={{ borderColor: 'var(--primary)', borderTopColor: 'transparent' }} />
    </div>
  )
}

// Aterrizaje de OAuth (Google) y del link de confirmación de email. En ambos casos
// la sesión llega en el hash de la URL (flujo implícito) y supabase-js la resuelve
// solo; acá esperamos a que aparezca antes de navegar a una ruta real. El
// OnboardingGate decide luego si va a /onboarding o /cursos.
function AuthCallback() {
  const { user, loading } = useAuth()
  const { isAdmin, isLoading: adminLoading } = useIsAdmin()
  const [timedOut, setTimedOut] = useState(false)
  // Leemos una sola vez lo que trae el hash: `type` (signup/recovery/…) para el mensaje
  // de éxito, y `error`/`error_code` cuando el link de confirmación venció o es inválido.
  const [hashInfo] = useState(() => {
    const h = new URLSearchParams(window.location.hash.replace(/^#/, ''))
    return {
      type: h.get('type'),
      error: h.get('error'),
      errorCode: h.get('error_code'),
    }
  })

  useEffect(() => {
    const t = setTimeout(() => setTimedOut(true), 6000)
    return () => clearTimeout(t)
  }, [])

  // Confirmación de email OK: avisamos una sola vez cuando la sesión ya se resolvió.
  useEffect(() => {
    if (!loading && user && (hashInfo.type === 'signup' || hashInfo.type === 'email')) {
      toast.success('¡Email confirmado! Ya podés empezar.')
    }
  }, [loading, user, hashInfo.type])

  // Link vencido / inválido: Supabase redirige con #error=...&error_code=otp_expired.
  // Mandamos a /login con un mensaje accionable (ahí puede reenviar el mail).
  if (hashInfo.error) {
    return (
      <Navigate
        to="/login"
        replace
        state={{ confirmError: hashInfo.errorCode === 'otp_expired' ? 'expired' : 'invalid' }}
      />
    )
  }

  // Un admin aterriza directo en el backoffice, salteando el onboarding de alumno.
  if (!loading && user && !adminLoading) {
    // Gate de comprar/reservar: si venías de una acción que exigía login, el destino
    // quedó stasheado antes del round-trip de Google OAuth. El admin igual va al backoffice.
    let stashed: string | null = null
    try {
      stashed = safeRedirectPath(sessionStorage.getItem(POST_LOGIN_REDIRECT_KEY))
      sessionStorage.removeItem(POST_LOGIN_REDIRECT_KEY)
    } catch { /* no-op */ }
    const dest = isAdmin ? '/admin/resumen' : (stashed ?? '/cursos')
    return <Navigate to={dest} replace />
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
          <ErrorBoundary>
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
              <Route path="/instructores" element={<Instructores />} />
              <Route path="/u/:username" element={<PerfilPublico />} />
              <Route path="/privacidad" element={<Privacidad />} />
              <Route path="/terminos" element={<Terminos />} />
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
                <Route path="/reserva/:slug" element={<ReservaConfirmada />} />
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
                    <Route path="pagos-instructores" element={<AdminPagosInstructores />} />
                  </Route>
                </Route>
              </Route>

              {/* Portal de instructores — solo lectura salvo perfil, factura y respuestas */}
              <Route element={<ProtectedRoute />}>
                <Route element={<InstructorGate />}>
                  <Route path="/instructor" element={<InstructorLayout />}>
                    <Route index element={<Navigate to="/instructor/resumen" replace />} />
                    <Route path="resumen" element={<InstructorResumen />} />
                    <Route path="cursos" element={<InstructorCursos />} />
                    <Route path="cursos/:id" element={<InstructorCursoDetalle />} />
                    <Route path="calendario" element={<InstructorCalendario />} />
                    <Route path="metricas" element={<InstructorMetricas />} />
                    <Route path="pagos" element={<InstructorPagos />} />
                    <Route path="perfil" element={<InstructorPerfil />} />
                  </Route>
                </Route>
              </Route>

              {/* Fallback */}
              <Route path="*" element={<Navigate to="/cursos" replace />} />
            </Route>
          </Routes>
          </Suspense>
          </ErrorBoundary>

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
