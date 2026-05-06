import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { toast } from 'sonner'
import { Users, LogIn, Truck, Calendar, LogOut } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, CartesianGrid } from 'recharts'
import { useDashboardStats } from '@/hooks/useDashboardStats'
import { useVisits } from '@/hooks/useVisits'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { formatCPF, formatVisitorType } from '@/lib/utils'
import type { Visit } from '@/types/app.types'
import { useState } from 'react'

interface StatCardProps { title: string; value: number; icon: React.ElementType; color: string; loading: boolean }

function StatCard({ title, value, icon: Icon, color, loading }: StatCardProps) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-slate-500">{title}</p>
            {loading ? (
              <Skeleton className="h-8 w-16 mt-1" />
            ) : (
              <p className="text-3xl font-bold text-slate-900 mt-1">{value}</p>
            )}
          </div>
          <div className={`p-3 rounded-full ${color}`}>
            <Icon className="h-6 w-6 text-white" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export function DashboardPage() {
  const { stats, hourlyData, weeklyData, recentVisits, loading } = useDashboardStats()
  const { activeVisits, endVisit } = useVisits()
  const [endTarget, setEndTarget] = useState<Visit | null>(null)

  async function handleEnd() {
    if (!endTarget) return
    const error = await endVisit(endTarget.id)
    if (error) toast.error('Erro ao encerrar visita')
    else toast.success('Visita encerrada')
    setEndTarget(null)
  }

  const hourlyChartData = Array.from({ length: 24 }, (_, h) => ({
    hour: `${String(h).padStart(2, '0')}h`,
    entradas: hourlyData.find((d) => d.hour === h)?.count ?? 0,
  }))

  const weeklyChartData = weeklyData.map((d) => ({
    dia: format(new Date(d.day + 'T12:00:00'), 'EEE', { locale: ptBR }),
    entradas: Number(d.count),
  }))

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Visitas em andamento" value={stats.activeVisits} icon={Users} color="bg-blue-600" loading={loading} />
        <StatCard title="Entradas hoje" value={stats.todayEntries} icon={LogIn} color="bg-green-600" loading={loading} />
        <StatCard title="Fornecedores hoje" value={stats.supplierEntries} icon={Truck} color="bg-orange-500" loading={loading} />
        <StatCard title="Total do mês" value={stats.monthTotal} icon={Calendar} color="bg-purple-600" loading={loading} />
      </div>

      {/* Active visits */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Users className="h-4 w-4 text-blue-600" />
            Visitantes em andamento
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-4 space-y-3">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}</div>
          ) : activeVisits.length === 0 ? (
            <p className="text-center text-slate-400 py-8 text-sm">Nenhum visitante em andamento</p>
          ) : (
            <div className="divide-y">
              {activeVisits.map((v) => (
                <div key={v.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between px-4 md:px-6 py-3 gap-2">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-800 truncate">{v.visitor?.full_name}</p>
                    <p className="text-xs text-slate-500">
                      Visitando: {v.company_user?.full_name ?? '—'} ·{' '}
                      {format(new Date(v.checked_in_at), "HH:mm", { locale: ptBR })}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Badge variant="outline" className="text-xs">
                      {formatVisitorType(v.visitor_type)}
                    </Badge>
                    <Button size="sm" variant="destructive" className="gap-1 h-7" onClick={() => setEndTarget(v)}>
                      <LogOut className="h-3 w-3" />
                      Encerrar
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Hourly chart */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Entradas por hora — hoje</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={hourlyChartData} margin={{ top: 0, right: 8, left: -20, bottom: 0 }}>
                <XAxis dataKey="hour" tick={{ fontSize: 10 }} interval={3} />
                <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="entradas" fill="#2563eb" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Weekly chart */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Entradas — últimos 7 dias</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={weeklyChartData} margin={{ top: 0, right: 8, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="dia" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                <Tooltip />
                <Line type="monotone" dataKey="entradas" stroke="#2563eb" strokeWidth={2} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Recent entries */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Últimas entradas</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-4 space-y-3">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-8 w-full" />)}</div>
          ) : (recentVisits as Visit[]).length === 0 ? (
            <p className="text-center text-slate-400 py-8 text-sm">Nenhuma entrada registrada</p>
          ) : (
            <div className="divide-y">
              {(recentVisits as Visit[]).map((v) => (
                <div key={v.id} className="flex items-center justify-between px-6 py-3">
                  <div>
                    <p className="text-sm font-medium">{v.visitor?.full_name}</p>
                    <p className="text-xs text-slate-500">
                      {v.visitor?.cpf ? formatCPF(v.visitor.cpf) : '—'} · {v.company_user?.full_name ?? '—'}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-slate-500">{format(new Date(v.checked_in_at), "dd/MM HH:mm")}</p>
                    <Badge variant={v.status === 'active' ? 'default' : 'secondary'} className="text-xs mt-0.5">
                      {v.status === 'active' ? 'Em andamento' : 'Encerrada'}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <ConfirmDialog
        open={!!endTarget}
        title="Encerrar visita"
        description={`Confirma a saída de "${endTarget?.visitor?.full_name}"?`}
        confirmLabel="Encerrar"
        onConfirm={handleEnd}
        onCancel={() => setEndTarget(null)}
      />
    </div>
  )
}
