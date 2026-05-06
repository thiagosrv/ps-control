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
  ShieldCheck,
  X,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

const navItems = [
  { label: 'Dashboard', to: '/', icon: LayoutDashboard, end: true },
  { label: 'Departamentos', to: '/departments', icon: Building2 },
  { label: 'Usuários', to: '/users', icon: Users },
  { label: 'Visitas', to: '/visits', icon: ClipboardList },
  { label: 'Veículos', to: '/vehicles', icon: Car },
  { label: 'Relatórios', to: '/reports', icon: FileText },
  { label: 'Configurações', to: '/settings', icon: Settings },
]

interface Props {
  onSignOut: () => void
  companyName?: string | null
  open: boolean
  onClose: () => void
}

export function Sidebar({ onSignOut, companyName, open, onClose }: Props) {
  const location = useLocation()

  // Fecha ao navegar no mobile
  useEffect(() => {
    onClose()
  }, [location.pathname]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <aside
      className={cn(
        'flex flex-col w-64 bg-slate-900 text-slate-100 shrink-0',
        'fixed inset-y-0 left-0 z-30 transition-transform duration-300 ease-in-out',
        'md:relative md:translate-x-0 md:h-full',
        open ? 'translate-x-0' : '-translate-x-full',
      )}
    >
      <div className="flex items-center justify-between px-5 py-5 border-b border-slate-700">
        <div className="flex items-center gap-2 overflow-hidden">
          <ShieldCheck className="h-7 w-7 text-blue-400 shrink-0" />
          <div className="overflow-hidden">
            <p className="font-semibold text-white text-sm leading-tight truncate">PS Control</p>
            <p className="text-xs text-slate-400 truncate">{companyName ?? 'Portaria'}</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="md:hidden text-slate-400 hover:text-white p-1 rounded"
          aria-label="Fechar menu"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map(({ label, to, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                isActive
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white',
              )
            }
          >
            <Icon className="h-4 w-4 shrink-0" />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="px-3 py-4 border-t border-slate-700">
        <Button
          variant="ghost"
          className="w-full justify-start gap-3 text-slate-400 hover:text-white hover:bg-slate-800"
          onClick={onSignOut}
        >
          <LogOut className="h-4 w-4" />
          Sair
        </Button>
      </div>
    </aside>
  )
}
