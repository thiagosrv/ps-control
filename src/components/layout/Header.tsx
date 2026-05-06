import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { User } from 'lucide-react'
import type { Profile } from '@/types/app.types'

interface Props {
  profile: Profile | null
}

export function Header({ profile }: Props) {
  return (
    <header className="h-14 border-b bg-white flex items-center justify-between px-6 shrink-0">
      <p className="text-sm text-slate-500 capitalize">
        {format(new Date(), "EEEE, dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
      </p>
      <div className="flex items-center gap-2 text-sm text-slate-600">
        <User className="h-4 w-4" />
        <span>{profile?.full_name ?? profile?.email ?? 'Porteiro'}</span>
      </div>
    </header>
  )
}
