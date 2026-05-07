import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Menu, User } from 'lucide-react'
import type { Profile } from '@/types/app.types'

interface Props {
  profile: Profile | null
  onMenuClick: () => void
}

export function Header({ profile, onMenuClick }: Props) {
  return (
    <header className="h-14 bg-white border-b flex items-center justify-between px-4 md:px-6 shrink-0 shadow-sm">
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="md:hidden p-1.5 rounded-md text-slate-500 hover:bg-slate-100"
          aria-label="Abrir menu"
        >
          <Menu className="h-5 w-5" />
        </button>
        <p className="text-sm text-slate-400 capitalize hidden sm:block">
          {format(new Date(), "EEEE, dd 'de' MMMM", { locale: ptBR })}
        </p>
        <p className="text-sm text-slate-400 sm:hidden">
          {format(new Date(), 'dd/MM/yyyy')}
        </p>
      </div>

      <div className="flex items-center gap-2.5">
        <div className="flex items-center gap-2 bg-slate-50 border rounded-full px-3 py-1.5">
          <div className="h-6 w-6 rounded-full flex items-center justify-center text-white text-xs font-bold"
            style={{ backgroundColor: 'oklch(0.188 0.075 262)' }}>
            <User className="h-3.5 w-3.5" />
          </div>
          <span className="text-sm font-medium text-slate-700 truncate max-w-[120px]">
            {profile?.full_name?.split(' ')[0] ?? profile?.email?.split('@')[0] ?? 'Porteiro'}
          </span>
        </div>
      </div>
    </header>
  )
}
