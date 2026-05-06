import { useState, useEffect, useCallback, useRef } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Search, UserCheck, Phone, LogOut, AlertCircle, Printer, ClipboardList } from 'lucide-react'
import { useVisits, useVisitorSearch } from '@/hooks/useVisits'
import { useCompanyUsers } from '@/hooks/useCompanyUsers'
import { visitFormSchema, type VisitFormValues } from '@/lib/validators'
import { formatCPF, unformatCPF, formatVisitorType } from '@/lib/utils'
import { PageHeader } from '@/components/layout/PageHeader'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Separator } from '@/components/ui/separator'
import type { Visitor, CompanyUser, Visit } from '@/types/app.types'

const VISITOR_TYPE_BADGE: Record<string, string> = {
  employee: 'bg-blue-100 text-blue-700',
  supplier: 'bg-orange-100 text-orange-700',
  contractor: 'bg-purple-100 text-purple-700',
  other: 'bg-slate-100 text-slate-700',
}

export function VisitsPage() {
  const { activeVisits, loading: visitsLoading, createVisit, endVisit } = useVisits()
  const { search: searchUsers } = useCompanyUsers()
  const { searchByPrefix, findByCPF, searchCompanies } = useVisitorSearch()

  const [prefixQuery, setPrefixQuery] = useState('')
  const [prefixResults, setPrefixResults] = useState<Visitor[]>([])
  const [selectedVisitor, setSelectedVisitor] = useState<Visitor | null>(null)
  const [blacklistAlert, setBlacklistAlert] = useState('')
  const [userQuery, setUserQuery] = useState('')
  const [userResults, setUserResults] = useState<CompanyUser[]>([])
  const [selectedUser, setSelectedUser] = useState<CompanyUser | null>(null)
  const [showUserDropdown, setShowUserDropdown] = useState(false)
  const [companyQuery, setCompanyQuery] = useState('')
  const [companySuggestions, setCompanySuggestions] = useState<string[]>([])
  const [showCompanyDropdown, setShowCompanyDropdown] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [endTarget, setEndTarget] = useState<Visit | null>(null)
  const [printVisit, setPrintVisit] = useState<Visit | null>(null)

  const prefixTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined)
  const userTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined)
  const companyTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined)

  const form = useForm<VisitFormValues>({
    resolver: zodResolver(visitFormSchema),
    defaultValues: {
      visitor_name: '',
      cpf: '',
      rg: '',
      phone: '',
      visitor_company: '',
      company_user_id: '',
      purpose: '',
      visitor_type: 'other',
      vehicle_plate: '',
      notes: '',
    },
  })

  // Prefix search (CPF/RG)
  useEffect(() => {
    clearTimeout(prefixTimerRef.current)
    const clean = prefixQuery.replace(/\D/g, '')
    if (clean.length < 5) { setPrefixResults([]); return }
    prefixTimerRef.current = setTimeout(async () => {
      const results = await searchByPrefix(clean)
      setPrefixResults(results)
    }, 300)
    return () => clearTimeout(prefixTimerRef.current)
  }, [prefixQuery, searchByPrefix])

  // Company autocomplete
  useEffect(() => {
    clearTimeout(companyTimerRef.current)
    if (companyQuery.length < 5) { setCompanySuggestions([]); setShowCompanyDropdown(false); return }
    companyTimerRef.current = setTimeout(async () => {
      const results = await searchCompanies(companyQuery)
      setCompanySuggestions(results)
      setShowCompanyDropdown(results.length > 0)
    }, 300)
    return () => clearTimeout(companyTimerRef.current)
  }, [companyQuery, searchCompanies])

  // User autocomplete
  useEffect(() => {
    clearTimeout(userTimerRef.current)
    if (userQuery.length < 3) { setUserResults([]); setShowUserDropdown(false); return }
    userTimerRef.current = setTimeout(async () => {
      const results = await searchUsers(userQuery)
      setUserResults(results)
      setShowUserDropdown(true)
    }, 300)
    return () => clearTimeout(userTimerRef.current)
  }, [userQuery, searchUsers])

  function selectVisitor(visitor: Visitor) {
    setBlacklistAlert('')
    if (visitor.blacklisted) {
      setBlacklistAlert(`Visitante bloqueado: ${visitor.blacklist_reason ?? 'sem motivo informado'}`)
      setPrefixResults([])
      setPrefixQuery('')
      return
    }
    setSelectedVisitor(visitor)
    setPrefixResults([])
    setPrefixQuery('')
    form.setValue('visitor_name', visitor.full_name)
    form.setValue('cpf', visitor.cpf ? formatCPF(visitor.cpf) : '')
    form.setValue('rg', visitor.rg ?? '')
    form.setValue('phone', visitor.phone ?? '')
    form.setValue('visitor_company', visitor.company ?? '')
    setCompanyQuery(visitor.company ?? '')
  }

  function clearVisitor() {
    setSelectedVisitor(null)
    setBlacklistAlert('')
    setCompanyQuery('')
    form.reset({ visitor_name: '', cpf: '', rg: '', phone: '', visitor_company: '', company_user_id: form.getValues('company_user_id'), purpose: form.getValues('purpose'), visitor_type: form.getValues('visitor_type'), vehicle_plate: '', notes: '' })
  }

  function selectUser(user: CompanyUser) {
    setSelectedUser(user)
    setUserQuery(user.full_name)
    setShowUserDropdown(false)
    form.setValue('company_user_id', user.id)
  }

  const handleCPFBlur = useCallback(async (cpf: string) => {
    if (selectedVisitor) return
    const clean = unformatCPF(cpf)
    if (clean.length !== 11) return
    const visitor = await findByCPF(cpf)
    if (visitor) selectVisitor(visitor)
  }, [selectedVisitor, findByCPF])

  async function onSubmit(values: VisitFormValues) {
    if (blacklistAlert) return
    setSubmitting(true)
    const { error } = await createVisit(values, selectedVisitor?.id)
    if (error) {
      toast.error('Erro ao registrar visita: ' + (error as { message?: string }).message)
    } else {
      toast.success('Visita registrada com sucesso!')
      form.reset({ visitor_name: '', cpf: '', rg: '', phone: '', visitor_company: '', company_user_id: '', purpose: '', visitor_type: 'other', vehicle_plate: '', notes: '' })
      setSelectedVisitor(null)
      setSelectedUser(null)
      setUserQuery('')
      setPrefixQuery('')
      setCompanyQuery('')
    }
    setSubmitting(false)
  }

  async function handleEndVisit() {
    if (!endTarget) return
    const error = await endVisit(endTarget.id)
    if (error) toast.error('Erro ao encerrar visita')
    else toast.success('Visita encerrada')
    setEndTarget(null)
  }

  function handlePrint(visit: Visit) {
    setPrintVisit(visit)
    setTimeout(() => window.print(), 200)
  }

  return (
    <div>
      <PageHeader title="Registro de Visitas" description="Registre a entrada e saída de visitantes" />

      {/* Prefix Search */}
      <Card className="mb-6">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Search className="h-4 w-4 text-blue-600" />
            Buscar visitante cadastrado (CPF ou RG)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative max-w-sm">
            <Input
              placeholder="Digite os 5 primeiros dígitos do CPF ou RG..."
              value={prefixQuery}
              onChange={(e) => setPrefixQuery(e.target.value)}
            />
            {prefixResults.length > 0 && (
              <div className="absolute top-full left-0 right-0 z-50 bg-white border rounded-lg shadow-lg mt-1 max-h-56 overflow-y-auto">
                {prefixResults.map((v) => (
                  <button
                    key={v.id}
                    type="button"
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-blue-50 transition-colors"
                    onClick={() => selectVisitor(v)}
                  >
                    <UserCheck className="h-4 w-4 text-blue-500 shrink-0" />
                    <div>
                      <p className="text-sm font-medium">{v.full_name}</p>
                      <p className="text-xs text-slate-500">CPF: {v.cpf ? formatCPF(v.cpf) : '—'} · RG: {v.rg ?? '—'}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {blacklistAlert && (
            <Alert variant="destructive" className="mt-3 max-w-sm">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{blacklistAlert}</AlertDescription>
            </Alert>
          )}

          {selectedVisitor && (
            <div className="mt-3 flex items-center gap-3 bg-green-50 border border-green-200 rounded-lg px-4 py-2.5 max-w-sm">
              <UserCheck className="h-4 w-4 text-green-600" />
              <div className="flex-1">
                <p className="text-sm font-medium text-green-800">{selectedVisitor.full_name}</p>
                <p className="text-xs text-green-600">Cadastro encontrado — dados preenchidos</p>
              </div>
              <button type="button" onClick={clearVisitor} className="text-xs text-slate-500 underline">Limpar</button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Entry Form */}
      <Card className="mb-8">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Dados da visita</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField control={form.control} name="visitor_name" render={({ field }) => (
                  <FormItem className="md:col-span-1">
                    <FormLabel>Nome do visitante *</FormLabel>
                    <FormControl><Input placeholder="Nome completo" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="cpf" render={({ field }) => (
                  <FormItem>
                    <FormLabel>CPF</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="000.000.000-00"
                        {...field}
                        onChange={(e) => field.onChange(formatCPF(e.target.value))}
                        onBlur={(e) => handleCPFBlur(e.target.value)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="rg" render={({ field }) => (
                  <FormItem>
                    <FormLabel>RG</FormLabel>
                    <FormControl><Input placeholder="0000000" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField control={form.control} name="phone" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Telefone</FormLabel>
                    <FormControl><Input placeholder="(00) 00000-0000" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                {/* Visitor Company Autocomplete */}
                <FormField control={form.control} name="visitor_company" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Empresa do visitante</FormLabel>
                    <div className="relative">
                      <FormControl>
                        <Input
                          placeholder="Digite 5 letras para buscar..."
                          {...field}
                          value={companyQuery}
                          onChange={(e) => {
                            setCompanyQuery(e.target.value)
                            field.onChange(e.target.value)
                          }}
                          onFocus={() => companySuggestions.length > 0 && setShowCompanyDropdown(true)}
                          onBlur={() => setTimeout(() => setShowCompanyDropdown(false), 150)}
                        />
                      </FormControl>
                      {showCompanyDropdown && companySuggestions.length > 0 && (
                        <div className="absolute top-full left-0 right-0 z-50 bg-white border rounded-lg shadow-lg mt-1 max-h-40 overflow-y-auto">
                          {companySuggestions.map((name) => (
                            <button
                              key={name}
                              type="button"
                              className="w-full px-4 py-2.5 text-left text-sm hover:bg-blue-50"
                              onClick={() => {
                                setCompanyQuery(name)
                                field.onChange(name)
                                setShowCompanyDropdown(false)
                              }}
                            >
                              {name}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>

              <div className="grid grid-cols-1 gap-4">
                {/* Company User Autocomplete */}
                <FormField control={form.control} name="company_user_id" render={() => (
                  <FormItem>
                    <FormLabel>Pessoa a ser visitada *</FormLabel>
                    <div className="relative">
                      <FormControl>
                        <Input
                          placeholder="Digite 3 letras para buscar..."
                          value={userQuery}
                          onChange={(e) => { setUserQuery(e.target.value); if (!e.target.value) { setSelectedUser(null); form.setValue('company_user_id', '') } }}
                          onFocus={() => userResults.length > 0 && setShowUserDropdown(true)}
                        />
                      </FormControl>
                      {showUserDropdown && userResults.length > 0 && (
                        <div className="absolute top-full left-0 right-0 z-50 bg-white border rounded-lg shadow-lg mt-1 max-h-48 overflow-y-auto">
                          {userResults.map((u) => (
                            <button
                              key={u.id}
                              type="button"
                              className="w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-blue-50"
                              onClick={() => selectUser(u)}
                            >
                              <Phone className="h-4 w-4 text-slate-400 shrink-0" />
                              <div>
                                <p className="text-sm font-medium">{u.full_name}</p>
                                <p className="text-xs text-slate-500">
                                  {u.department?.name ?? 'Sem departamento'}
                                  {u.ramal && <span className="ml-2 font-medium text-blue-600">Ramal: {u.ramal}</span>}
                                </p>
                              </div>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                    {selectedUser?.ramal && (
                      <p className="text-xs text-blue-600 font-medium mt-1 flex items-center gap-1">
                        <Phone className="h-3 w-3" />
                        Ligue para o ramal <strong>{selectedUser.ramal}</strong> para autorizar a entrada
                      </p>
                    )}
                    <FormMessage />
                  </FormItem>
                )} />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField control={form.control} name="visitor_type" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo de visitante *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                      <SelectContent>
                        <SelectItem value="employee">Funcionário</SelectItem>
                        <SelectItem value="supplier">Fornecedor</SelectItem>
                        <SelectItem value="contractor">Prestador</SelectItem>
                        <SelectItem value="other">Outro</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="purpose" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Motivo da visita *</FormLabel>
                    <FormControl><Input placeholder="Ex: Reunião, Entrega..." {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="vehicle_plate" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Placa do veículo</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="ABC1D23"
                        {...field}
                        onChange={(e) => field.onChange(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 7))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>

              <div className="flex justify-end pt-2">
                <Button type="submit" size="lg" disabled={submitting || !!blacklistAlert}>
                  {submitting ? 'Registrando...' : 'Registrar Entrada'}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>

      <Separator className="mb-6" />

      {/* Active Visits */}
      <div className="flex items-center gap-2 mb-4">
        <ClipboardList className="h-5 w-5 text-slate-600" />
        <h2 className="text-lg font-semibold text-slate-800">
          Visitantes em andamento
          {!visitsLoading && (
            <span className="ml-2 text-sm font-normal text-slate-500">({activeVisits.length})</span>
          )}
        </h2>
      </div>

      <div className="rounded-lg border bg-white overflow-hidden">
        <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50">
              <TableHead>Visitante</TableHead>
              <TableHead>Visitando</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Motivo</TableHead>
              <TableHead>Entrada</TableHead>
              <TableHead>Placa</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {visitsLoading ? (
              <TableRow><TableCell colSpan={7} className="text-center py-8 text-slate-400">Carregando...</TableCell></TableRow>
            ) : activeVisits.length === 0 ? (
              <TableRow><TableCell colSpan={7} className="text-center py-12 text-slate-400">Nenhum visitante em andamento</TableCell></TableRow>
            ) : (
              activeVisits.map((visit) => (
                <TableRow key={visit.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium text-slate-800">{visit.visitor?.full_name}</p>
                      <p className="text-xs text-slate-500">{visit.visitor?.cpf ? formatCPF(visit.visitor.cpf) : '—'}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="text-sm">{visit.company_user?.full_name ?? '—'}</p>
                      {visit.company_user?.ramal && (
                        <p className="text-xs text-blue-600">Ramal: {visit.company_user.ramal}</p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${VISITOR_TYPE_BADGE[visit.visitor_type]}`}>
                      {formatVisitorType(visit.visitor_type)}
                    </span>
                  </TableCell>
                  <TableCell className="text-sm text-slate-600">{visit.purpose ?? '—'}</TableCell>
                  <TableCell className="text-sm">
                    {format(new Date(visit.checked_in_at), "HH:mm 'de' dd/MM", { locale: ptBR })}
                  </TableCell>
                  <TableCell className="text-sm font-mono">{visit.vehicle_plate ?? '—'}</TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-1">
                      <Button size="sm" variant="ghost" title="Imprimir crachá" onClick={() => handlePrint(visit)}>
                        <Printer className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        className="gap-1"
                        onClick={() => setEndTarget(visit)}
                      >
                        <LogOut className="h-3.5 w-3.5" />
                        Encerrar
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
        </div>
      </div>

      <ConfirmDialog
        open={!!endTarget}
        title="Encerrar visita"
        description={`Confirma a saída de "${endTarget?.visitor?.full_name}"?`}
        confirmLabel="Encerrar"
        onConfirm={handleEndVisit}
        onCancel={() => setEndTarget(null)}
      />

      {/* Badge print area */}
      {printVisit && (
        <div id="badge-print-root" style={{ display: 'none' }} className="p-8 font-sans">
          <div style={{ border: '2px solid #1e40af', borderRadius: 12, padding: 32, maxWidth: 320, margin: '0 auto' }}>
            <p style={{ textAlign: 'center', fontWeight: 700, fontSize: 22, color: '#1e40af', marginBottom: 4 }}>VISITANTE</p>
            <p style={{ textAlign: 'center', fontSize: 20, fontWeight: 600, marginBottom: 16 }}>{printVisit.visitor?.full_name}</p>
            <hr />
            <p style={{ marginTop: 12, fontSize: 13 }}>CPF: {printVisit.visitor?.cpf ? formatCPF(printVisit.visitor.cpf) : '—'}</p>
            <p style={{ fontSize: 13 }}>RG: {printVisit.visitor?.rg ?? '—'}</p>
            <p style={{ fontSize: 13 }}>Visitando: {printVisit.company_user?.full_name ?? '—'}</p>
            <p style={{ fontSize: 13 }}>Entrada: {format(new Date(printVisit.checked_in_at), "dd/MM/yyyy 'às' HH:mm")}</p>
            {printVisit.vehicle_plate && <p style={{ fontSize: 13 }}>Veículo: {printVisit.vehicle_plate}</p>}
          </div>
        </div>
      )}
    </div>
  )
}
