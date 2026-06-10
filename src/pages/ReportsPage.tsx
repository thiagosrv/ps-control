import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { Search, FileDown, FileText } from 'lucide-react'
import { useVisits } from '@/hooks/useVisits'
import { useAuth } from '@/hooks/useAuth'
import { useEmpreiteiras } from '@/hooks/useEmpreiteiras'
import { reportFilterSchema, type ReportFilterValues } from '@/lib/validators'
import { formatCPF } from '@/lib/utils'
import { generateVisitsPDF } from '@/lib/pdf'
import { generateVisitsCSV } from '@/lib/csv'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Form, FormControl, FormField, FormItem, FormLabel } from '@/components/ui/form'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import type { Visit, Visitor } from '@/types/app.types'

export function ReportsPage() {
  const { fetchForReport } = useVisits()
  const { profile } = useAuth()
  const { empreiteiras } = useEmpreiteiras()
  const [results, setResults] = useState<Visit[]>([])
  const [searched, setSearched] = useState(false)
  const [loading, setLoading] = useState(false)

  const form = useForm<ReportFilterValues>({
    resolver: zodResolver(reportFilterSchema),
    defaultValues: {
      name: '',
      cpf: '',
      rg: '',
      plate: '',
      visitor_type: '',
      funcao: '',
      empreiteira_id: '',
      date_from: '',
      date_to: '',
    },
  })

  async function onSearch(values: ReportFilterValues) {
    setLoading(true)
    const { data, error } = await fetchForReport({
      ...values,
      visitor_type: values.visitor_type === 'all' ? '' : values.visitor_type,
    })
    if (error) toast.error('Erro ao buscar dados')
    else setResults(data)
    setSearched(true)
    setLoading(false)
  }

  function handlePDF() {
    if (!results.length) return
    generateVisitsPDF(results, profile?.company_name ?? 'PS Control')
  }

  function handleCSV() {
    if (!results.length) return
    generateVisitsCSV(results)
  }

  return (
    <div>
      <PageHeader
        title="Relatórios"
        description="Consulte e exporte registros de movimentação da obra"
        action={
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleCSV} disabled={!results.length}>
              <FileDown className="h-4 w-4 mr-2" />
              CSV
            </Button>
            <Button variant="outline" onClick={handlePDF} disabled={!results.length}>
              <FileText className="h-4 w-4 mr-2" />
              PDF
            </Button>
          </div>
        }
      />

      <Card className="mb-6">
        <CardContent className="pt-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSearch)} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <FormField control={form.control} name="name" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome do trabalhador</FormLabel>
                    <FormControl><Input placeholder="Buscar por nome" {...field} /></FormControl>
                  </FormItem>
                )} />
                <FormField control={form.control} name="cpf" render={({ field }) => (
                  <FormItem>
                    <FormLabel>CPF</FormLabel>
                    <FormControl><Input placeholder="000.000.000-00" {...field} /></FormControl>
                  </FormItem>
                )} />
                <FormField control={form.control} name="rg" render={({ field }) => (
                  <FormItem>
                    <FormLabel>RG</FormLabel>
                    <FormControl><Input placeholder="RG" {...field} /></FormControl>
                  </FormItem>
                )} />
                <FormField control={form.control} name="funcao" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Função</FormLabel>
                    <FormControl><Input placeholder="Ex: Pedreiro, Eletricista..." {...field} /></FormControl>
                  </FormItem>
                )} />
                <FormField control={form.control} name="empreiteira_id" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Empreiteira</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl><SelectTrigger><SelectValue placeholder="Todas" /></SelectTrigger></FormControl>
                      <SelectContent>
                        <SelectItem value="all">Todas</SelectItem>
                        {empreiteiras.map((e) => (
                          <SelectItem key={e.id} value={e.id}>{e.razao_social}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormItem>
                )} />
                <FormField control={form.control} name="plate" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Placa</FormLabel>
                    <FormControl><Input placeholder="ABC1D23" className="font-mono" {...field} onChange={(e) => field.onChange(e.target.value.toUpperCase())} /></FormControl>
                  </FormItem>
                )} />
                <div className="grid grid-cols-2 gap-2">
                  <FormField control={form.control} name="date_from" render={({ field }) => (
                    <FormItem>
                      <FormLabel>De</FormLabel>
                      <FormControl><Input type="date" {...field} /></FormControl>
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="date_to" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Até</FormLabel>
                      <FormControl><Input type="date" {...field} /></FormControl>
                    </FormItem>
                  )} />
                </div>
              </div>
              <div className="flex justify-end">
                <Button type="submit" disabled={loading}>
                  <Search className="h-4 w-4 mr-2" />
                  {loading ? 'Buscando...' : 'Buscar'}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>

      {searched && (
        <div>
          <p className="text-sm text-slate-500 mb-3">{results.length} registro(s) encontrado(s)</p>
          <div className="rounded-lg border bg-white overflow-hidden">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50">
                    <TableHead>Trabalhador</TableHead>
                    <TableHead>Documento</TableHead>
                    <TableHead>Função</TableHead>
                    <TableHead>Empreiteira</TableHead>
                    <TableHead>Responsável</TableHead>
                    <TableHead>Atividade</TableHead>
                    <TableHead>EPI</TableHead>
                    <TableHead>Entrada</TableHead>
                    <TableHead>Saída</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {results.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={10} className="text-center py-12 text-slate-400">
                        Nenhum resultado para os filtros aplicados
                      </TableCell>
                    </TableRow>
                  ) : (
                    results.map((v) => (
                      <TableRow key={v.id}>
                        <TableCell className="font-medium">{v.visitor?.full_name}</TableCell>
                        <TableCell className="text-sm">{v.visitor?.cpf ? formatCPF(v.visitor.cpf) : (v.visitor?.rg ?? '—')}</TableCell>
                        <TableCell className="text-sm">{v.visitor?.funcao ?? '—'}</TableCell>
                        <TableCell className="text-sm">
                          {(v.visitor as Visitor & { empreiteira?: { razao_social: string } })?.empreiteira?.razao_social ?? '—'}
                        </TableCell>
                        <TableCell className="text-sm">{v.company_user?.full_name ?? '—'}</TableCell>
                        <TableCell className="text-sm max-w-[120px] truncate">{v.atividade ?? v.purpose ?? '—'}</TableCell>
                        <TableCell>
                          {v.epi_verificado ? (
                            <Badge variant="outline" className="text-xs text-green-700 border-green-300">✓ OK</Badge>
                          ) : (
                            <Badge variant="outline" className="text-xs text-red-600 border-red-300">Não</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-sm">{format(new Date(v.checked_in_at), 'dd/MM/yyyy HH:mm')}</TableCell>
                        <TableCell className="text-sm">{v.checked_out_at ? format(new Date(v.checked_out_at), 'dd/MM/yyyy HH:mm') : '—'}</TableCell>
                        <TableCell>
                          <Badge variant={v.status === 'active' ? 'default' : 'secondary'} className="text-xs">
                            {v.status === 'active' ? 'Em andamento' : 'Encerrada'}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
