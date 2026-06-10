import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { toast } from 'sonner'
import { HardHat, LogIn, Building2, Calendar, LogOut } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, CartesianGrid } from 'recharts'
import { useDashboardStats } from '@/hooks/useDashboardStats'
import { useVisits } from '@/hooks/useVisits'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { formatCPF } from '@/lib/utils'
import type { Visit, Visitor } from '@/types/app.types'
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
    if (error) toast.error('Erro ao encerrar registro')
    else toast.success('Registro encerrado')
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
        <StatCard title="Trabalhadores no local" value={stats.activeVisits} icon={HardHat} color="bg-blue-600" loading={loading} />
        <StatCard title="Entradas hoje" value={stats.todayEntries} icon={LogIn} color="bg-green-600" loading={loading} />
        <StatCard title="Empreiteiras ativas" value={stats.supplierEntries} icon={Building2} color="bg-orange-500" loading={loading} />
        <StatCard title="Total do mês" value={stats.monthTotal} icon={Calendar} color="bg-purple-600" loading={loading} />
      </div>

      {/* Trabalhadores ativos */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <HardHat className="h-4 w-4 text-blue-600" />
            Trabalhadores no local
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-4 space-y-3">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}</div>
          ) : activeVisits.length === 0 ? (
            <p className="text-center text-slate-400 py-8 text-sm">Nenhum trabalhador no local</p>
          ) : (
            <div className="divide-y">
              {activeVisits.map((v) => (
                <div key={v.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between px-4 md:px-6 py-3 gap-2">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-800 truncate">{v.visitor?.full_name}</p>
                    <p className="text-xs text-slate-500">
                      {v.visitor?.funcao ?? 'Sem função'} ·{' '}
                      {(v.visitor as Visitor & { empreiteira?: { razao_social: string } })?.empreiteira?.razao_social ?? 'Sem empreiteira'} ·{' '}
                      {format(new Date(v.checked_in_at), "HH:mm", { locale: ptBR })}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {v.epi_verificado ? (
                      <Badge variant="outline" className="text-xs text-green-700 border-green-300">EPI ✓</Badge>
                    ) : (
                      <Badge variant="outline" className="text-xs text-red-600 border-red-300">Sem EPI</Badge>
                    )}
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

      {/* Últimas entradas */}
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
                      {v.visitor?.cpf ? formatCPF(v.visitor.cpf) : '—'} · {v.visitor?.funcao ?? '—'}
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
        title="Encerrar registro"
        description={`Confirma a saída de "${endTarget?.visitor?.full_name}"?`}
        confirmLabel="Encerrar"
        onConfirm={handleEnd}
        onCancel={() => setEndTarget(null)}
      />
    </div>
  )
}
