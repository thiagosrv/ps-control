import { createBrowserRouter, Navigate } from 'react-router-dom'
import { AppShell } from '@/components/layout/AppShell'
import { useAuth } from '@/hooks/useAuth'
import { LoginPage } from '@/pages/LoginPage'
import { DashboardPage } from '@/pages/DashboardPage'
import { DepartmentsPage } from '@/pages/DepartmentsPage'
import { CompanyUsersPage } from '@/pages/CompanyUsersPage'
import { VisitsPage } from '@/pages/VisitsPage'
import { VehiclesPage } from '@/pages/VehiclesPage'
import { ReportsPage } from '@/pages/ReportsPage'
import { SettingsPage } from '@/pages/SettingsPage'

// Spinner reutilizável
function LoadingSpinner() {
  return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'oklch(0.188 0.075 262)' }}>
      <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: 'oklch(0.838 0.176 86.4)' }} />
    </div>
  )
}

// Qualquer usuário autenticado
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { session, loading } = useAuth()
  if (loading) return <LoadingSpinner />
  if (!session) return <Navigate to="/login" replace />
  return <>{children}</>
}

// Somente admin
function AdminRoute({ children }: { children: React.ReactNode }) {
  const { session, profile, loading } = useAuth()
  if (loading) return <LoadingSpinner />
  if (!session) return <Navigate to="/login" replace />
  if (profile && profile.role !== 'admin') return <Navigate to="/" replace />
  // profile ainda carregando (null mas session existe) — aguarda
  if (!profile) return <LoadingSpinner />
  return <>{children}</>
}

export const router = createBrowserRouter([
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/',
    element: (
      <ProtectedRoute>
        <AppShell />
      </ProtectedRoute>
    ),
    children: [
      // ── Acesso: admin + porteiro ──
      { index: true,          element: <DashboardPage /> },
      { path: 'visits',       element: <VisitsPage /> },
      { path: 'reports',      element: <ReportsPage /> },

      // ── Acesso: somente admin ──
      { path: 'departments',  element: <AdminRoute><DepartmentsPage /></AdminRoute> },
      { path: 'users',        element: <AdminRoute><CompanyUsersPage /></AdminRoute> },
      { path: 'vehicles',     element: <AdminRoute><VehiclesPage /></AdminRoute> },
      { path: 'settings',     element: <AdminRoute><SettingsPage /></AdminRoute> },
    ],
  },
  { path: '*', element: <Navigate to="/" replace /> },
])
