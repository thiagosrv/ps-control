import { useState } from 'react'
import { Outlet, useNavigate } from 'react-router-dom'
import { Toaster } from '@/components/ui/sonner'
import { Sidebar } from './Sidebar'
import { Header } from './Header'
import { BottomNav } from './BottomNav'
import { ChangePasswordModal } from '@/components/auth/ChangePasswordModal'
import { useAuth } from '@/hooks/useAuth'

const NAVY = 'oklch(0.188 0.075 262)'
const GOLD = 'oklch(0.838 0.176 86.4)'

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
      {/* Desktop sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/50 hidden md:block"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar — visible only on desktop */}
      <Sidebar
        onSignOut={handleSignOut}
        companyName={profile?.company_name}
        role={profile?.role}
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <div className="flex flex-col flex-1 overflow-hidden min-w-0">
        {/* Desktop header */}
        <div className="hidden md:block">
          <Header profile={profile} onMenuClick={() => setSidebarOpen(true)} />
        </div>

        {/* Mobile top bar */}
        <div
          className="md:hidden flex items-center justify-between px-4 h-14 shrink-0"
          style={{ backgroundColor: NAVY }}
        >
          <div className="flex items-center gap-3">
            <img
              src="/logo.png"
              alt="PS Control"
              className="h-8 w-auto object-contain"
              style={{ filter: 'brightness(0) invert(1)' }}
              onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none' }}
            />
            <div>
              <p className="text-white font-bold text-sm leading-none">PS Control</p>
              {profile?.company_name && (
                <p className="text-[11px] leading-none mt-0.5" style={{ color: GOLD }}>
                  {profile.company_name}
                </p>
              )}
            </div>
          </div>
          <span
            className="text-xs font-semibold px-2.5 py-1 rounded-full"
            style={
              profile?.role === 'admin'
                ? { backgroundColor: GOLD, color: NAVY }
                : { backgroundColor: 'rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.65)' }
            }
          >
            {profile?.role === 'admin' ? 'Admin' : 'Porteiro'}
          </span>
        </div>

        {/* Main content — extra bottom padding on mobile for the nav bar */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 pb-24 md:pb-6">
          <Outlet />
        </main>
      </div>

      {/* Mobile bottom navigation */}
      <BottomNav role={profile?.role} onSignOut={handleSignOut} />

      {profile?.must_change_password && (
        <ChangePasswordModal userId={profile.id} onSuccess={refetchProfile} />
      )}

      <Toaster richColors position="top-center" />
    </div>
  )
}
