import { useState, useCallback, useRef } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import {
  Search, UserCheck, LogOut, AlertCircle, Printer, ClipboardList,
  X, ShieldCheck, HardHat, Package, User, Building2,
} from 'lucide-react'
import { useVisits, useVisitorSearch } from '@/hooks/useVisits'
import { useCompanyUsers } from '@/hooks/useCompanyUsers'
import { useEmpreiteiras } from '@/hooks/useEmpreiteiras'
import { visitFormSchema, type VisitFormValues } from '@/lib/validators'
import { FUNCOES_OBRA } from '@/lib/utils'
import { PageHeader } from '@/components/layout/PageHeader'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Card, CardContent } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import type { Visitor, CompanyUser, Visit } from '@/types/app.types'

const GOLD = 'oklch(0.838 0.176 86.4)'
const NAVY = 'oklch(0.188 0.075 262)'

type VisitTypeUI = 'worker' | 'delivery' | 'visitor'

const VISIT_TYPES: { id: VisitTypeUI; label: string; sublabel: string; icon: React.ElementType }[] = [
  { id: 'worker',   label: 'Trabalhador',     sublabel: 'Empreiteira / Obra',       icon: HardHat  },
  { id: 'delivery', label: 'Entrega / Coleta', sublabel: 'Fornecedor / Transportadora', icon: Package  },
  { id: 'visitor',  label: 'Visitante',        sublabel: 'Reunião / Vistoria / Fiscal', icon: User     },
]

const EMPTY_FORM: VisitFormValues = {
  visitor_name: '',
  documento: '',
  visitor_company: '',
  funcao: '',
  empreiteira_id: '',
  company_user_id: '',
  atividade: '',
  vehicle_plate: '',
  epi_verificado: false,
}

export function VisitsPage() {
  const { activeVisits, loading: visitsLoading, createVisit, endVisit } = useVisits()
  const { search: searchUsers } = useCompanyUsers()
  const { searchVisitors } = useVisitorSearch()
  const { empreiteiras } = useEmpreiteiras()

  const [visitType, setVisitType] = useState<VisitTypeUI>('worker')
  const [quickQuery, setQuickQuery] = useState('')
  const [quickResults, setQuickResults] = useState<Visitor[]>([])
  const [showQuickDropdown, setShowQuickDropdown] = useState(false)
  const [selectedVisitor, setSelectedVisitor] = useState<Visitor | null>(null)
  const [blacklistAlert, setBlacklistAlert] = useState('')
  const [userQuery, setUserQuery] = useState('')
  const [userResults, setUserResults] = useState<CompanyUser[]>([])
  const [showUserDropdown, setShowUserDropdown] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [endTarget, setEndTarget] = useState<Visit | null>(null)
  const [printVisit, setPrintVisit] = useState<Visit | null>(null)

  const quickTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined)
  const userTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined)

  const form = useForm<VisitFormValues>({
    resolver: zodResolver(visitFormSchema),
    defaultValues: EMPTY_FORM,
  })

  // ── Busca rápida ──────────────────────────────────────────────
  function handleQuickSearch(value: string) {
    setQuickQuery(value)
    clearTimeout(quickTimerRef.current)
    if (value.trim().length < 2) { setQuickResults([]); setShowQuickDropdown(false); return }
    quickTimerRef.current = setTimeout(async () => {
      const results = await searchVisitors(value)
      setQuickResults(results)
      setShowQuickDropdown(results.length > 0)
    }, 300)
  }

  function selectVisitor(visitor: Visitor) {
    setBlacklistAlert('')
    setShowQuickDropdown(false)
    setQuickQuery('')
    if (visitor.blacklisted) {
      setBlacklistAlert(`BLOQUEADO: ${visitor.blacklist_reason ?? 'sem motivo informado'}`)
      return
    }
    setSelectedVisitor(visitor)
    form.setValue('visitor_name', visitor.full_name)
    form.setValue('documento', visitor.cpf ?? visitor.rg ?? '')
    form.setValue('visitor_company', visitor.company ?? '')
    if (visitor.funcao) form.setValue('funcao', visitor.funcao)
    if (visitor.empreiteira_id) form.setValue('empreiteira_id', visitor.empreiteira_id)
    // Detectar tipo automaticamente pelo perfil salvo
    if (visitor.funcao || visitor.empreiteira_id) setVisitType('worker')
    else if (visitor.company) setVisitType('delivery')
  }

  function clearVisitor() {
    setSelectedVisitor(null)
    setBlacklistAlert('')
    form.reset(EMPTY_FORM)
    setUserQuery('')
  }

  // ── Busca de responsável ──────────────────────────────────────
  function handleUserSearch(value: string) {
    setUserQuery(value)
    if (!value) { form.setValue('company_user_id', ''); return }
    clearTimeout(userTimerRef.current)
    if (value.length < 3) { setUserResults([]); setShowUserDropdown(false); return }
    userTimerRef.current = setTimeout(async () => {
      const results = await searchUsers(value)
      setUserResults(results)
      setShowUserDropdown(true)
    }, 300)
  }

  function selectUser(user: CompanyUser) {
    setUserQuery(user.full_name)
    setShowUserDropdown(false)
    form.setValue('company_user_id', user.id)
  }

  // ── Troca de tipo ─────────────────────────────────────────────
  function switchType(type: VisitTypeUI) {
    setVisitType(type)
    // Limpa apenas campos específicos do tipo anterior
    form.setValue('funcao', '')
    form.setValue('empreiteira_id', '')
    form.setValue('atividade', '')
    form.setValue('company_user_id', '')
    form.setValue('epi_verificado', false)
    setUserQuery('')
  }

  const resetForm = useCallback(() => {
    form.reset(EMPTY_FORM)
    setSelectedVisitor(null)
    setQuickQuery('')
    setUserQuery('')
  }, [form])

  // ── Submit ────────────────────────────────────────────────────
  async function onSubmit(values: VisitFormValues) {
    if (blacklistAlert) return
    // Validação de campo obrigatório por tipo
    if (visitType === 'worker' && !values.atividade?.trim()) {
      form.setError('atividade', { message: 'Informe a atividade do dia' })
      return
    }
    setSubmitting(true)
    const { error } = await createVisit(values, selectedVisitor?.id)
    if (error) {
      toast.error('Erro ao registrar: ' + (error as { message?: string }).message)
    } else {
      toast.success('Entrada registrada!')
      resetForm()
    }
    setSubmitting(false)
  }

  async function handleEndVisit() {
    if (!endTarget) return
    const error = await endVisit(endTarget.id)
    if (error) toast.error('Erro ao encerrar')
    else toast.success('Saída registrada')
    setEndTarget(null)
  }

  function handlePrint(visit: Visit) {
    setPrintVisit(visit)
    setTimeout(() => window.print(), 200)
  }

  return (
    <div className="space-y-5">
      <PageHeader title="Registro de Entrada" description="Registre a entrada e saída de pessoas" />

      {/* ── SELETOR DE TIPO ─────────────────────────────────────── */}
      <div className="grid grid-cols-3 gap-2">
        {VISIT_TYPES.map(({ id, label, sublabel, icon: Icon }) => {
          const active = visitType === id
          return (
            <button
              key={id}
              type="button"
              onClick={() => switchType(id)}
              className="flex flex-col items-center gap-1.5 rounded-xl border-2 px-3 py-3 transition-all text-center"
              style={{
                borderColor: active ? GOLD : 'oklch(0.908 0.008 264)',
                backgroundColor: active ? 'oklch(0.97 0.04 86)' : 'white',
              }}
            >
              <Icon
                className="h-6 w-6"
                style={{ color: active ? 'oklch(0.55 0.14 86)' : 'oklch(0.52 0.018 264)' }}
              />
              <span
                className="text-sm font-bold leading-tight"
                style={{ color: active ? NAVY : 'oklch(0.35 0.025 264)' }}
              >
                {label}
              </span>
              <span className="text-xs leading-tight hidden sm:block" style={{ color: 'oklch(0.55 0.015 264)' }}>
                {sublabel}
              </span>
            </button>
          )
        })}
      </div>

      {/* ── BUSCA RÁPIDA ────────────────────────────────────────── */}
      <div className="rounded-xl border-2 bg-white p-4 shadow-sm" style={{ borderColor: GOLD }}>
        <p className="text-xs font-bold uppercase tracking-widest mb-2.5" style={{ color: NAVY }}>
          Buscar pessoa já cadastrada
        </p>
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
          <input
            type="text"
            placeholder="Nome ou documento (CPF, RG)…"
            value={quickQuery}
            onChange={(e) => handleQuickSearch(e.target.value)}
            onBlur={() => setTimeout(() => setShowQuickDropdown(false), 150)}
            onFocus={() => quickResults.length > 0 && setShowQuickDropdown(true)}
            className="w-full h-12 pl-11 pr-10 rounded-lg border-2 text-base outline-none transition-colors"
            style={{ borderColor: quickQuery ? GOLD : 'oklch(0.908 0.008 264)', fontFamily: 'inherit' }}
          />
          {quickQuery && (
            <button
              type="button"
              onClick={() => { setQuickQuery(''); setQuickResults([]); setShowQuickDropdown(false) }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="h-4 w-4" />
            </button>
          )}
          {showQuickDropdown && quickResults.length > 0 && (
            <div className="absolute top-full left-0 right-0 z-50 bg-white border rounded-xl shadow-xl mt-1 max-h-56 overflow-y-auto">
              {quickResults.map((v) => {
                type VisitorWithEmp = Visitor & { empreiteira?: { razao_social: string } }
                const emp = (v as VisitorWithEmp).empreiteira?.razao_social
                return (
                  <button
                    key={v.id}
                    type="button"
                    className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-yellow-50 transition-colors border-b last:border-0"
                    onClick={() => selectVisitor(v)}
                  >
                    <UserCheck className="h-5 w-5 shrink-0" style={{ color: GOLD }} />
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-800 truncate">{v.full_name}</p>
                      <p className="text-xs text-slate-500 truncate">
                        {v.cpf ?? v.rg ?? 'Sem doc.'}
                        {v.funcao && <span className="ml-2">· {v.funcao}</span>}
                        {emp && <span className="ml-2">· {emp}</span>}
                        {v.company && !emp && <span className="ml-2">· {v.company}</span>}
                      </p>
                    </div>
                  </button>
                )
              })}
            </div>
          )}
        </div>

        {blacklistAlert && (
          <div className="mt-3 flex items-center gap-3 bg-red-50 border border-red-300 rounded-lg px-4 py-3">
            <AlertCircle className="h-5 w-5 text-red-500 shrink-0" />
            <p className="text-sm font-semibold text-red-700">{blacklistAlert}</p>
          </div>
        )}

        {selectedVisitor && (
          <div className="mt-3 flex items-center gap-3 rounded-lg px-4 py-2.5" style={{ background: 'oklch(0.97 0.05 140)', border: '1px solid oklch(0.78 0.12 140)' }}>
            <UserCheck className="h-5 w-5 shrink-0" style={{ color: 'oklch(0.5 0.15 140)' }} />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold truncate" style={{ color: 'oklch(0.3 0.1 140)' }}>{selectedVisitor.full_name}</p>
              <p className="text-xs" style={{ color: 'oklch(0.5 0.1 140)' }}>Dados preenchidos automaticamente</p>
            </div>
            <button type="button" onClick={clearVisitor} className="text-xs text-slate-500 hover:text-slate-800 underline shrink-0">
              Limpar
            </button>
          </div>
        )}
      </div>

      {/* ── FORMULÁRIO ──────────────────────────────────────────── */}
      <Card className="shadow-sm">
        <CardContent className="pt-5">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">

              {/* Campos comuns a todos os tipos */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField control={form.control} name="visitor_name" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-semibold text-slate-700">Nome *</FormLabel>
                    <FormControl>
                      <Input placeholder="Nome completo" className="h-11" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                <FormField control={form.control} name="documento" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-semibold text-slate-700">Documento (CPF / RG)</FormLabel>
                    <FormControl>
                      <Input placeholder="Opcional" className="h-11" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>

              {/* ── TRABALHADOR ── */}
              {visitType === 'worker' && (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormField control={form.control} name="funcao" render={({ field }) => (
                      <FormItem>
                        <FormLabel className="font-semibold text-slate-700">Função</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value ?? ''}>
                          <FormControl>
                            <SelectTrigger className="h-11"><SelectValue placeholder="Selecione" /></SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {FUNCOES_OBRA.map((f) => <SelectItem key={f} value={f}>{f}</SelectItem>)}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )} />

                    <FormField control={form.control} name="empreiteira_id" render={({ field }) => (
                      <FormItem>
                        <FormLabel className="font-semibold text-slate-700">Empreiteira</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value ?? ''}>
                          <FormControl>
                            <SelectTrigger className="h-11"><SelectValue placeholder="Selecione" /></SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {empreiteiras.filter((e) => e.active).map((e) => (
                              <SelectItem key={e.id} value={e.id}>{e.razao_social}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )} />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormField control={form.control} name="atividade" render={({ field }) => (
                      <FormItem>
                        <FormLabel className="font-semibold text-slate-700">Atividade do dia *</FormLabel>
                        <FormControl>
                          <Input placeholder="Ex: Concretagem, Elétrica, Acabamento" className="h-11" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />

                    <FormField control={form.control} name="epi_verificado" render={({ field }) => (
                      <FormItem>
                        <FormLabel className="font-semibold text-slate-700">EPI verificado</FormLabel>
                        <FormControl>
                          <button
                            type="button"
                            onClick={() => field.onChange(!field.value)}
                            className="flex items-center gap-3 h-11 w-full px-4 rounded-lg border-2 transition-all text-sm font-semibold"
                            style={{
                              borderColor: field.value ? 'oklch(0.5 0.15 140)' : 'oklch(0.908 0.008 264)',
                              backgroundColor: field.value ? 'oklch(0.97 0.05 140)' : 'white',
                              color: field.value ? 'oklch(0.3 0.12 140)' : 'oklch(0.52 0.018 264)',
                            }}
                          >
                            <ShieldCheck className="h-5 w-5 shrink-0" />
                            {field.value ? '✓ EPI conferido' : 'Toque para confirmar EPI'}
                          </button>
                        </FormControl>
                      </FormItem>
                    )} />
                  </div>
                </>
              )}

              {/* ── ENTREGA / COLETA ── */}
              {visitType === 'delivery' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField control={form.control} name="visitor_company" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-semibold text-slate-700">Empresa</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                          <Input placeholder="Nome da empresa" className="h-11 pl-9" {...field} />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />

                  <FormField control={form.control} name="vehicle_plate" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-semibold text-slate-700">Placa do veículo</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="ABC1D23"
                          className="h-11 font-mono uppercase"
                          {...field}
                          onChange={(e) => field.onChange(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 7))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>
              )}

              {/* ── VISITANTE ── */}
              {visitType === 'visitor' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField control={form.control} name="visitor_company" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-semibold text-slate-700">Empresa</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                          <Input placeholder="Empresa do visitante" className="h-11 pl-9" {...field} />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />

                  <FormField control={form.control} name="company_user_id" render={() => (
                    <FormItem>
                      <FormLabel className="font-semibold text-slate-700">Pessoa a visitar</FormLabel>
                      <div className="relative">
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                          <Input
                            placeholder="Buscar responsável…"
                            className="h-11 pl-9"
                            value={userQuery}
                            onChange={(e) => handleUserSearch(e.target.value)}
                            onFocus={() => userResults.length > 0 && setShowUserDropdown(true)}
                            onBlur={() => setTimeout(() => setShowUserDropdown(false), 150)}
                          />
                        </div>
                        {showUserDropdown && userResults.length > 0 && (
                          <div className="absolute top-full left-0 right-0 z-50 bg-white border rounded-lg shadow-lg mt-1 max-h-40 overflow-y-auto">
                            {userResults.map((u) => (
                              <button key={u.id} type="button"
                                className="w-full flex flex-col px-4 py-2.5 text-left hover:bg-yellow-50 border-b last:border-0"
                                onClick={() => selectUser(u)}>
                                <p className="text-sm font-semibold text-slate-800">{u.full_name}</p>
                                <p className="text-xs text-slate-500">{u.department?.name ?? '—'}</p>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>
              )}

              {/* Placa extra para trabalhador */}
              {visitType === 'worker' && (
                <FormField control={form.control} name="vehicle_plate" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-semibold text-slate-700">Placa do veículo <span className="font-normal text-slate-400">(opcional)</span></FormLabel>
                    <FormControl>
                      <Input
                        placeholder="ABC1D23"
                        className="h-11 font-mono uppercase max-w-[180px]"
                        {...field}
                        onChange={(e) => field.onChange(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 7))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              )}

              <div className="flex justify-end pt-1">
                <Button
                  type="submit"
                  size="lg"
                  className="h-12 px-10 text-base font-bold shadow-md"
                  disabled={submitting || !!blacklistAlert}
                  style={{ backgroundColor: NAVY }}
                >
                  {submitting ? 'Registrando…' : '✓ Registrar Entrada'}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>

      {/* ── ATIVOS ──────────────────────────────────────────────── */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <ClipboardList className="h-5 w-5" style={{ color: NAVY }} />
          <h2 className="text-base font-bold" style={{ color: NAVY }}>No local agora</h2>
          {!visitsLoading && (
            <span className="ml-1 text-xs font-bold px-2 py-0.5 rounded-full text-white"
              style={{ backgroundColor: activeVisits.length > 0 ? NAVY : 'oklch(0.52 0.018 264)' }}>
              {activeVisits.length}
            </span>
          )}
        </div>

        <div className="rounded-xl border bg-white overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow style={{ backgroundColor: NAVY }}>
                  {['Nome', 'Empresa / Empreiteira', 'Função / Tipo', 'Atividade', 'Entrada', 'EPI', ''].map((h) => (
                    <TableHead key={h} className="text-white font-semibold text-xs uppercase tracking-wide">{h}</TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {visitsLoading ? (
                  <TableRow><TableCell colSpan={7} className="text-center py-10 text-slate-400">Carregando…</TableCell></TableRow>
                ) : activeVisits.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-14 text-slate-400">
                      <ClipboardList className="h-8 w-8 mx-auto mb-2 opacity-30" />
                      <p>Nenhuma pessoa registrada no momento</p>
                    </TableCell>
                  </TableRow>
                ) : (
                  activeVisits.map((visit) => {
                    type VisitorWithEmp = Visitor & { empreiteira?: { razao_social: string } }
                    const emp = (visit.visitor as VisitorWithEmp)?.empreiteira?.razao_social
                    const empresa = emp ?? visit.visitor?.company ?? '—'
                    return (
                      <TableRow key={visit.id} className="hover:bg-yellow-50/40 transition-colors">
                        <TableCell>
                          <p className="font-semibold text-slate-800 text-sm">{visit.visitor?.full_name}</p>
                          <p className="text-xs text-slate-400 font-mono">{visit.visitor?.cpf ?? visit.visitor?.rg ?? '—'}</p>
                        </TableCell>
                        <TableCell className="text-sm text-slate-600">{empresa}</TableCell>
                        <TableCell className="text-sm text-slate-600">{visit.visitor?.funcao ?? '—'}</TableCell>
                        <TableCell className="text-sm text-slate-500 max-w-[130px] truncate">{visit.atividade ?? '—'}</TableCell>
                        <TableCell className="text-sm text-slate-600 whitespace-nowrap">
                          {format(new Date(visit.checked_in_at), "HH:mm · dd/MM", { locale: ptBR })}
                        </TableCell>
                        <TableCell>
                          {visit.epi_verificado
                            ? <span className="text-xs font-semibold text-green-700 bg-green-50 px-2 py-0.5 rounded-full">✓ OK</span>
                            : <span className="text-xs text-slate-400">—</span>}
                        </TableCell>
                        <TableCell>
                          <div className="flex justify-end gap-1">
                            <Button size="sm" variant="ghost" title="Imprimir crachá"
                              onClick={() => handlePrint(visit)} className="text-slate-400 hover:text-slate-700">
                              <Printer className="h-4 w-4" />
                            </Button>
                            <Button size="sm" variant="destructive" className="gap-1 font-semibold"
                              onClick={() => setEndTarget(visit)}>
                              <LogOut className="h-3.5 w-3.5" />
                              Saída
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={!!endTarget}
        title="Registrar saída"
        description={`Confirma a saída de "${endTarget?.visitor?.full_name}"?`}
        confirmLabel="Confirmar saída"
        onConfirm={handleEndVisit}
        onCancel={() => setEndTarget(null)}
      />

      {/* Crachá para impressão */}
      {printVisit && (
        <div id="badge-print-root" style={{ display: 'none' }} className="p-8 font-sans">
          <div style={{ border: '3px solid #162050', borderRadius: 12, padding: 32, maxWidth: 320, margin: '0 auto' }}>
            <p style={{ textAlign: 'center', fontWeight: 800, fontSize: 18, color: '#162050', marginBottom: 2, letterSpacing: 3 }}>
              {printVisit.visitor?.funcao ? 'TRABALHADOR' : 'VISITANTE'}
            </p>
            <div style={{ height: 3, background: '#F5C200', borderRadius: 2, marginBottom: 16 }} />
            <p style={{ textAlign: 'center', fontSize: 20, fontWeight: 700, color: '#162050', marginBottom: 16 }}>
              {printVisit.visitor?.full_name}
            </p>
            <hr style={{ borderColor: '#e2e8f0' }} />
            <div style={{ marginTop: 14, fontSize: 13, lineHeight: 1.8, color: '#334155' }}>
              {(printVisit.visitor?.cpf || printVisit.visitor?.rg) && (
                <p>Doc: <strong>{printVisit.visitor.cpf ?? printVisit.visitor.rg}</strong></p>
              )}
              {printVisit.visitor?.funcao && <p>Função: <strong>{printVisit.visitor.funcao}</strong></p>}
              {(() => {
                type VisitorWithEmp = Visitor & { empreiteira?: { razao_social: string } }
                const emp = (printVisit.visitor as VisitorWithEmp)?.empreiteira?.razao_social
                return emp ? <p>Empreiteira: <strong>{emp}</strong></p> : null
              })()}
              {printVisit.visitor?.company && <p>Empresa: <strong>{printVisit.visitor.company}</strong></p>}
              {printVisit.company_user && <p>Visitando: <strong>{printVisit.company_user.full_name}</strong></p>}
              {printVisit.atividade && <p>Atividade: <strong>{printVisit.atividade}</strong></p>}
              <p>Entrada: <strong>{format(new Date(printVisit.checked_in_at), "dd/MM/yyyy 'às' HH:mm")}</strong></p>
              {printVisit.vehicle_plate && <p>Veículo: <strong>{printVisit.vehicle_plate}</strong></p>}
              {printVisit.epi_verificado && <p>EPI: <strong>✓ Verificado</strong></p>}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
