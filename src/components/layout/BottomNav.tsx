import { useState, useEffect } from 'react'
import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, ClipboardList, FileText, Settings,
  HardHat, Users, Building2, Car, LogOut, X,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const NAVY = 'oklch(0.188 0.075 262)'
const GOLD = 'oklch(0.838 0.176 86.4)'

const MAIN_ITEMS = [
  { to: '/',        label: 'Dashboard',  icon: LayoutDashboard, end: true  },
  { to: '/visits',  label: 'Registros',  icon: ClipboardList,   end: false },
  { to: '/reports', label: 'Relatórios', icon: FileText,         end: false },
]

const ADMIN_ITEMS = [
  { to: '/frentes',      label: 'Frentes de Obra', icon: HardHat   },
  { to: '/responsaveis', label: 'Responsáveis',    icon: Users     },
  { to: '/empreiteiras', label: 'Empreiteiras',    icon: Building2 },
  { to: '/vehicles',     label: 'Veículos',         icon: Car       },
  { to: '/settings',     label: 'Configurações',    icon: Settings  },
]

interface Props {
  role?: 'admin' | 'operator' | null
  onSignOut: () => void
}

export function BottomNav({ role, onSignOut }: Props) {
  const [adminOpen, setAdminOpen] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()

  useEffect(() => {
    setAdminOpen(false)
  }, [location.pathname])

  const isAdminRouteActive = ADMIN_ITEMS.some(
    (item) => location.pathname === item.to || location.pathname.startsWith(item.to + '/')
  )

  function handleAdminNav(to: string) {
    setAdminOpen(false)
    navigate(to)
  }

  return (
    <>
      {/* Admin slide-up drawer */}
      {role === 'admin' && (
        <>
          {/* Backdrop */}
          <div
            className={cn(
              'fixed inset-0 z-40 bg-black/60 transition-opacity duration-300 md:hidden',
              adminOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
            )}
            onClick={() => setAdminOpen(false)}
          />

          {/* Panel */}
          <div
            className={cn(
              'fixed left-0 right-0 z-50 bg-white rounded-t-3xl shadow-2xl transition-transform duration-300 ease-out md:hidden',
              adminOpen ? 'translate-y-0' : 'translate-y-full'
            )}
            style={{ bottom: '64px' }}
          >
            {/* Drag handle */}
            <div className="flex items-center justify-between px-5 pt-4 pb-2">
              <p className="text-xs font-bold uppercase tracking-widest" style={{ color: 'oklch(0.65 0.02 264)' }}>
                Área do Administrador
              </p>
              <button
                onClick={() => setAdminOpen(false)}
                className="h-8 w-8 flex items-center justify-center rounded-full bg-slate-100 text-slate-500"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="pb-2">
              {ADMIN_ITEMS.map(({ to, label, icon: Icon }) => {
                const active = location.pathname === to || location.pathname.startsWith(to + '/')
                return (
                  <button
                    key={to}
                    onClick={() => handleAdminNav(to)}
                    className="flex items-center gap-4 w-full px-5 py-4 text-left transition-colors"
                    style={{ backgroundColor: active ? 'oklch(0.97 0.04 86)' : 'transparent' }}
                  >
                    <div
                      className="h-10 w-10 rounded-xl flex items-center justify-center shrink-0"
                      style={{ backgroundColor: active ? `${GOLD}30` : 'oklch(0.96 0.005 264)' }}
                    >
                      <Icon className="h-5 w-5" style={{ color: active ? NAVY : 'oklch(0.45 0.02 264)' }} />
                    </div>
                    <span
                      className="text-sm font-semibold"
                      style={{ color: active ? NAVY : 'oklch(0.3 0.02 264)' }}
                    >
                      {label}
                    </span>
                    {active && (
                      <div className="ml-auto h-2 w-2 rounded-full" style={{ backgroundColor: GOLD }} />
                    )}
                  </button>
                )
              })}

              <div className="border-t border-slate-100 mx-5 my-1" />

              <button
                onClick={onSignOut}
                className="flex items-center gap-4 w-full px-5 py-4 text-left transition-colors hover:bg-red-50"
              >
                <div className="h-10 w-10 rounded-xl flex items-center justify-center shrink-0 bg-red-50">
                  <LogOut className="h-5 w-5 text-red-500" />
                </div>
                <span className="text-sm font-semibold text-red-600">Sair do sistema</span>
              </button>
            </div>
          </div>
        </>
      )}

      {/* Bottom navigation bar */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-30 bg-white border-t md:hidden"
        style={{
          boxShadow: '0 -4px 16px rgba(0,0,0,0.08)',
          paddingBottom: 'env(safe-area-inset-bottom)',
        }}
      >
        <div className="flex h-16">
          {MAIN_ITEMS.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className="flex-1 flex flex-col items-center justify-center gap-0.5 transition-colors"
            >
              {({ isActive }) => (
                <>
                  <div
                    className="flex items-center justify-center h-8 w-8 rounded-xl transition-all"
                    style={{ backgroundColor: isActive ? `${GOLD}25` : 'transparent' }}
                  >
                    <Icon
                      className="h-[22px] w-[22px] transition-colors"
                      style={{ color: isActive ? NAVY : 'oklch(0.65 0.015 264)' }}
                    />
                  </div>
                  <span
                    className="text-[10px] leading-none transition-colors"
                    style={{
                      color: isActive ? NAVY : 'oklch(0.65 0.015 264)',
                      fontWeight: isActive ? 700 : 500,
                    }}
                  >
                    {label}
                  </span>
                </>
              )}
            </NavLink>
          ))}

          {role === 'admin' && (
            <button
              onClick={() => setAdminOpen((v) => !v)}
              className="flex-1 flex flex-col items-center justify-center gap-0.5 transition-colors"
            >
              <div
                className="flex items-center justify-center h-8 w-8 rounded-xl transition-all"
                style={{ backgroundColor: isAdminRouteActive || adminOpen ? `${GOLD}25` : 'transparent' }}
              >
                <Settings
                  className="h-[22px] w-[22px] transition-colors"
                  style={{ color: isAdminRouteActive || adminOpen ? NAVY : 'oklch(0.65 0.015 264)' }}
                />
              </div>
              <span
                className="text-[10px] leading-none"
                style={{
                  color: isAdminRouteActive || adminOpen ? NAVY : 'oklch(0.65 0.015 264)',
                  fontWeight: isAdminRouteActive || adminOpen ? 700 : 500,
                }}
              >
                Admin
              </span>
            </button>
          )}

          {role !== 'admin' && (
            <button
              onClick={onSignOut}
              className="flex-1 flex flex-col items-center justify-center gap-0.5 transition-colors"
            >
              <div className="flex items-center justify-center h-8 w-8 rounded-xl">
                <LogOut className="h-[22px] w-[22px] text-slate-400" />
              </div>
              <span className="text-[10px] leading-none text-slate-400 font-medium">Sair</span>
            </button>
          )}
        </div>
      </nav>
    </>
  )
}
