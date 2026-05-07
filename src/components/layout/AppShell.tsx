import { useState } from 'react'
import { Outlet, useNavigate } from 'react-router-dom'
import { Toaster } from '@/components/ui/sonner'
import { Sidebar } from './Sidebar'
import { Header } from './Header'
import { ChangePasswordModal } from '@/components/auth/ChangePasswordModal'
import { useAuth } from '@/hooks/useAuth'

export function AppShell() {
  const { profile, signOut, refetchProfile } = useAuth()
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  async function handleSignOut() {
    await signOut()
    navigate('/login')
  }

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/50 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <Sidebar
        onSignOut={handleSignOut}
        companyName={profile?.company_name}
        role={profile?.role}
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <div className="flex flex-col flex-1 overflow-hidden min-w-0">
        <Header profile={profile} onMenuClick={() => setSidebarOpen(true)} />
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          <Outlet />
        </main>
      </div>

      {profile?.must_change_password && (
        <ChangePasswordModal userId={profile.id} onSuccess={refetchProfile} />
      )}

      <Toaster richColors position="top-right" />
    </div>
  )
}
