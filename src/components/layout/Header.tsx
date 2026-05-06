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
    <header className="h-14 border-b bg-white flex items-center justify-between px-4 md:px-6 shrink-0">
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="md:hidden p-1.5 rounded-md text-slate-500 hover:bg-slate-100"
          aria-label="Abrir menu"
        >
          <Menu className="h-5 w-5" />
        </button>
        <p className="text-sm text-slate-500 capitalize hidden sm:block">
          {format(new Date(), "EEEE, dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
        </p>
        <p className="text-sm text-slate-500 sm:hidden">
          {format(new Date(), 'dd/MM/yyyy')}
        </p>
      </div>
      <div className="flex items-center gap-2 text-sm text-slate-600">
        <User className="h-4 w-4" />
        <span className="truncate max-w-[140px]">
          {profile?.full_name ?? profile?.email ?? 'Porteiro'}
        </span>
      </div>
    </header>
  )
}
