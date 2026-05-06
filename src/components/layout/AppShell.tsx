import { Outlet, useNavigate } from 'react-router-dom'
import { Toaster } from '@/components/ui/sonner'
import { Sidebar } from './Sidebar'
import { Header } from './Header'
import { ChangePasswordModal } from '@/components/auth/ChangePasswordModal'
import { useAuth } from '@/hooks/useAuth'

export function AppShell() {
  const { profile, signOut, refetchProfile } = useAuth()
  const navigate = useNavigate()

  async function handleSignOut() {
    await signOut()
    navigate('/login')
  }

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      <Sidebar onSignOut={handleSignOut} companyName={profile?.company_name} />

      <div className="flex flex-col flex-1 overflow-hidden">
        <Header profile={profile} />
        <main className="flex-1 overflow-y-auto p-6">
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
