import { createBrowserRouter, Navigate } from 'react-router-dom'
import { AppShell } from '@/components/layout/AppShell'
import { useAuth } from '@/hooks/useAuth'
import { LoginPage } from '@/pages/LoginPage'
import { DashboardPage } from '@/pages/DashboardPage'
import { DepartmentsPage } from '@/pages/DepartmentsPage'
import { CompanyUsersPage } from '@/pages/CompanyUsersPage'
import { EmpreiteirasPage } from '@/pages/EmpreiteirasPage'
import { VisitsPage } from '@/pages/VisitsPage'
import { VehiclesPage } from '@/pages/VehiclesPage'
import { ReportsPage } from '@/pages/ReportsPage'
import { SettingsPage } from '@/pages/SettingsPage'

function LoadingSpinner() {
  return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'oklch(0.188 0.075 262)' }}>
      <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: 'oklch(0.838 0.176 86.4)' }} />
    </div>
  )
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { session, loading } = useAuth()
  if (loading) return <LoadingSpinner />
  if (!session) return <Navigate to="/login" replace />
  return <>{children}</>
}

function AdminRoute({ children }: { children: React.ReactNode }) {
  const { session, profile, loading } = useAuth()
  if (loading) return <LoadingSpinner />
  if (!session) return <Navigate to="/login" replace />
  if (profile && profile.role !== 'admin') return <Navigate to="/" replace />
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
      { index: true,            element: <DashboardPage /> },
      { path: 'visits',         element: <VisitsPage /> },
      { path: 'reports',        element: <ReportsPage /> },

      // ── Acesso: somente admin ──
      { path: 'frentes',        element: <AdminRoute><DepartmentsPage /></AdminRoute> },
      { path: 'responsaveis',   element: <AdminRoute><CompanyUsersPage /></AdminRoute> },
      { path: 'empreiteiras',   element: <AdminRoute><EmpreiteirasPage /></AdminRoute> },
      { path: 'vehicles',       element: <AdminRoute><VehiclesPage /></AdminRoute> },
      { path: 'settings',       element: <AdminRoute><SettingsPage /></AdminRoute> },

      // Compatibilidade com rotas antigas
      { path: 'departments',    element: <Navigate to="/frentes" replace /> },
      { path: 'users',          element: <Navigate to="/responsaveis" replace /> },
    ],
  },
  { path: '*', element: <Navigate to="/" replace /> },
])
