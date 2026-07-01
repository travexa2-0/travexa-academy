import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'react-hot-toast'
import { lazy, Suspense } from 'react'
import { AuthProvider } from '@/contexts/AuthContext'
import ProtectedRoute from '@/components/layout/ProtectedRoute'

const Login               = lazy(() => import('@/pages/public/Login'))
const Registro            = lazy(() => import('@/pages/public/Registro'))
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
const VivencialDetalle  = lazy(() => import('@/pages/private/VivencialDetalle'))

function PageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg)' }}>
      <div className="w-8 h-8 border-2 rounded-full animate-spin" style={{ borderColor: 'var(--primary)', borderTopColor: 'transparent' }} />
    </div>
  )
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
            {/* Public */}
            <Route path="/" element={<Navigate to="/cursos" replace />} />
            <Route path="/login" element={<Login />} />
            <Route path="/registro" element={<Registro />} />
            <Route path="/cursos" element={<Catalog />} />
            <Route path="/cursos/:slug" element={<CourseDetail />} />
            <Route path="/vivencial" element={<VivencialCatalog />} />
            <Route path="/vivencial/:slug" element={<VivencialDetail />} />
            <Route path="/u/:username" element={<PerfilPublico />} />
            <Route path="/pago-confirmado" element={<PagoConfirmado />} />
            <Route path="/pago-error" element={<PagoError />} />

            {/* Auth callback — Google OAuth redirect */}
            <Route path="/auth/callback" element={<Navigate to="/dashboard" replace />} />

            {/* Private */}
            <Route element={<ProtectedRoute />}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/mis-cursos" element={<MisCursos />} />
              <Route path="/viaje/:slug" element={<VivencialDetalle />} />
              <Route path="/cursos/:slug/aprender" element={<Player />} />
              <Route path="/cursos/:slug/aprender/:lessonId" element={<Player />} />
              <Route path="/mi-cuenta" element={<Navigate to="/perfil" replace />} />
              <Route path="/perfil" element={<Profile />} />
            </Route>

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/cursos" replace />} />
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
