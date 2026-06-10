import { useEffect } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import {
  LayoutDashboard,
  Building2,
  Users,
  ClipboardList,
  Car,
  FileText,
  Settings,
  LogOut,
  X,
  HardHat,
  Camera,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

const ALL_NAV_ITEMS = [
  { label: 'Dashboard',      to: '/',             icon: LayoutDashboard, end: true,  adminOnly: false },
  { label: 'Registros',      to: '/visits',       icon: ClipboardList,   end: false, adminOnly: false },
  { label: 'Relatórios',     to: '/reports',      icon: FileText,        end: false, adminOnly: false },
  { label: 'Frentes de Obra',to: '/frentes',      icon: HardHat,         end: false, adminOnly: true  },
  { label: 'Responsáveis',   to: '/responsaveis', icon: Users,           end: false, adminOnly: true  },
  { label: 'Empreiteiras',   to: '/empreiteiras', icon: Building2,       end: false, adminOnly: true  },
  { label: 'Veículos',       to: '/vehicles',     icon: Car,             end: false, adminOnly: true  },
  { label: 'Evidências',     to: '/evidencias',   icon: Camera,          end: false, adminOnly: true  },
  { label: 'Configurações',  to: '/settings',     icon: Settings,        end: false, adminOnly: true  },
]

interface Props {
  onSignOut: () => void
  companyName?: string | null
  role?: 'admin' | 'operator' | null
  open: boolean
  onClose: () => void
}

export function Sidebar({ onSignOut, companyName, role, open, onClose }: Props) {
  const location = useLocation()

  useEffect(() => {
    onClose()
  }, [location.pathname]) // eslint-disable-line react-hooks/exhaustive-deps

  const navItems = ALL_NAV_ITEMS.filter(item => !item.adminOnly || role === 'admin')

  return (
    <aside
      className={cn(
        'flex flex-col w-64 shrink-0',
        'fixed inset-y-0 left-0 z-30 transition-transform duration-300 ease-in-out',
        'md:relative md:translate-x-0 md:h-full',
        open ? 'translate-x-0' : '-translate-x-full',
      )}
      style={{ backgroundColor: 'oklch(0.188 0.075 262)' }}
    >
      {/* Logo */}
      <div className="flex items-center justify-between px-4 py-4 border-b" style={{ borderColor: 'oklch(0.255 0.065 262)' }}>
        <div className="flex items-center gap-2 overflow-hidden min-w-0">
          <img
            src="/logo.png"
            alt="PS Control"
            className="h-10 w-auto shrink-0 object-contain"
            style={{ mixBlendMode: 'screen' }}
            onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none' }}
          />
          <div className="overflow-hidden min-w-0">
            <p className="font-bold text-white text-sm leading-tight truncate">PS Control</p>
            <p className="text-xs truncate" style={{ color: 'oklch(0.838 0.176 86.4)' }}>
              {companyName ?? 'Portaria'}
            </p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="md:hidden p-1 rounded text-slate-400 hover:text-white"
          aria-label="Fechar menu"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Badge de papel */}
      {role && (
        <div className="px-4 pt-3 pb-1">
          <span
            className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold"
            style={
              role === 'admin'
                ? { backgroundColor: 'oklch(0.838 0.176 86.4)', color: 'oklch(0.188 0.075 262)' }
                : { backgroundColor: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.6)' }
            }
          >
            {role === 'admin' ? '⚙ Administrador' : '🔒 Porteiro'}
          </span>
        </div>
      )}

      {/* Nav */}
      <nav className="flex-1 px-3 py-3 space-y-0.5 overflow-y-auto">
        {navItems.map(({ label, to, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150',
                isActive
                  ? 'text-slate-900 shadow-sm'
                  : 'text-slate-300 hover:text-white',
              )
            }
            style={({ isActive }) => isActive
              ? { backgroundColor: 'oklch(0.838 0.176 86.4)' }
              : {}
            }
          >
            {({ isActive }) => (
              <>
                <Icon className={cn('h-4 w-4 shrink-0', isActive ? 'text-slate-800' : '')} />
                {label}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Quadro cliente */}
      <div className="px-3 pb-3">
        <div className="rounded-xl bg-white p-3">
          <p className="text-center leading-tight mb-2.5" style={{ fontSize: '0.6rem', color: 'oklch(0.45 0.03 264)' }}>
            Criado e Desenvolvido por<br />
            <span className="font-bold" style={{ color: 'oklch(0.188 0.075 262)' }}>PS PROTEÇÃO</span>, para:
          </p>
          <img
            src="/cliente1.png"
            alt="Cliente"
            className="w-full h-12 object-contain"
            onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none' }}
          />
        </div>
      </div>

      {/* Sair */}
      <div className="px-3 py-3 border-t" style={{ borderColor: 'oklch(0.255 0.065 262)' }}>
        <Button
          variant="ghost"
          className="w-full justify-start gap-3 text-slate-400 hover:text-white hover:bg-white/10"
          onClick={onSignOut}
        >
          <LogOut className="h-4 w-4" />
          Sair
        </Button>
      </div>
    </aside>
  )
}
