import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthProvider } from '@/contexts/AuthContext'
import ProtectedRoute from '@/components/layout/ProtectedRoute'
import Login from '@/pages/public/Login'
import Registro from '@/pages/public/Registro'
import Catalog from '@/pages/public/Catalog'
import CourseDetail from '@/pages/public/CourseDetail'
import PagoConfirmado from '@/pages/public/PagoConfirmado'
import PagoError from '@/pages/public/PagoError'
import Dashboard from '@/pages/private/Dashboard'

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
          <Routes>
            {/* Public */}
            <Route path="/" element={<Navigate to="/cursos" replace />} />
            <Route path="/login" element={<Login />} />
            <Route path="/registro" element={<Registro />} />
            <Route path="/cursos" element={<Catalog />} />
            <Route path="/cursos/:slug" element={<CourseDetail />} />
            <Route path="/pago-confirmado" element={<PagoConfirmado />} />
            <Route path="/pago-error" element={<PagoError />} />

            {/* Private */}
            <Route element={<ProtectedRoute />}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/mis-cursos" element={<Navigate to="/dashboard" replace />} />
              <Route path="/mi-cuenta" element={<Navigate to="/dashboard" replace />} />
            </Route>

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/cursos" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  )
}
