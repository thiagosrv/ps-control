import { useState, useCallback, useRef } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { translateError } from '@/lib/errors'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import {
  Search, UserCheck, LogOut, AlertCircle, Printer, ClipboardList,
  X, HardHat, User, Building2, Camera, CheckCircle2, MessageCircle,
} from 'lucide-react'
import { useVisits, useVisitorSearch } from '@/hooks/useVisits'
import { useVisitPhotos } from '@/hooks/useVisitPhotos'
import { useEmpreiteiras } from '@/hooks/useEmpreiteiras'
import { visitFormSchema, type VisitFormValues } from '@/lib/validators'
import { normalizeText } from '@/lib/utils'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Card, CardContent } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import type { Visitor, Visit } from '@/types/app.types'

const GOLD = 'oklch(0.838 0.176 86.4)'
const NAVY = 'oklch(0.188 0.075 262)'

type VisitTypeUI = 'credenciado' | 'visitor'

const VISIT_TYPES: { id: VisitTypeUI; label: string; sublabel: string; icon: React.ElementType }[] = [
  { id: 'credenciado', label: 'Credenciado',      sublabel: 'Trabalhador da obra — buscar ou cadastrar novo', icon: HardHat },
  { id: 'visitor',     label: 'Não Credenciado',  sublabel: 'Reunião, vistoria, fiscal, entrega ou coleta',  icon: User    },
]

const EMPTY_FORM: VisitFormValues = {
  visitor_name: '',
  visitor_company: '',
  atividade: '',
  vehicle_plate: '',
}

const WHATSAPP_NUMBER = (import.meta.env.VITE_WHATSAPP_NUMBER as string | undefined)?.replace(/\D/g, '')

function buildWhatsappUrl(authorizedByName: string, personName: string, company?: string) {
  if (!WHATSAPP_NUMBER) return null
  const greeting = authorizedByName.trim() ? `${authorizedByName.trim()}, ` : ''
  const empresaTxt = company ? `, da empresa ${company},` : ''
  const msg = `${greeting}estou com ${personName}${empresaTxt} na portaria. Posso liberar a entrada?`
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(msg)}`
}

// Input de texto com sugestões filtradas 100% no cliente sobre uma lista já carregada.
// Digitação livre continua sempre possível — a lista é só um atalho de preenchimento rápido.
function TextAutocomplete({
  value, onChange, options, placeholder, icon: Icon = Building2,
}: {
  value: string
  onChange: (v: string) => void
  options: string[]
  placeholder?: string
  icon?: React.ElementType
}) {
  const [open, setOpen] = useState(false)
  const query = normalizeText(value)
  const matches = (query.length > 0
    ? options.filter((o) => normalizeText(o).includes(query))
    : options
  ).slice(0, 6)

  return (
    <div className="relative">
      <Icon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
      <Input
        placeholder={placeholder}
        className="h-12 pl-9"
        value={value}
        onChange={(e) => { onChange(e.target.value); setOpen(true) }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        autoComplete="off"
      />
      {open && matches.length > 0 && (
        <div className="absolute top-full left-0 right-0 z-50 bg-white border rounded-lg shadow-lg mt-1 max-h-40 overflow-y-auto">
          {matches.map((m) => (
            <button
              key={m}
              type="button"
              className="w-full flex items-center gap-2 px-4 py-2.5 text-left text-sm font-semibold text-slate-800 hover:bg-yellow-50 border-b last:border-0"
              onMouseDown={(ev) => ev.preventDefault()}
              onClick={() => { onChange(m); setOpen(false) }}
            >
              <Icon className="h-3.5 w-3.5 shrink-0" style={{ color: GOLD }} />
              {m}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

type UnauthorizedTarget = { name: string; company?: string; confirm: (authorizedBy: string) => Promise<boolean> }
type AuthorizedTarget = { visitor: Visitor }

export function VisitsPage() {
  const { activeVisits, loading: visitsLoading, createVisit, checkIn, endVisit } = useVisits()
  const { uploadPhoto } = useVisitPhotos()
  const { searchVisitors } = useVisitorSearch()
  const { empreiteiras } = useEmpreiteiras()

  const [visitType, setVisitType] = useState<VisitTypeUI>('credenciado')
  const [quickQuery, setQuickQuery] = useState('')
  const [quickResults, setQuickResults] = useState<Visitor[]>([])
  const [showQuickDropdown, setShowQuickDropdown] = useState(false)
  const [selectedVisitor, setSelectedVisitor] = useState<Visitor | null>(null)
  const [blacklistAlert, setBlacklistAlert] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [authorizedTarget, setAuthorizedTarget] = useState<AuthorizedTarget | null>(null)
  const [confirmingAuthorized, setConfirmingAuthorized] = useState(false)
  const [unauthorizedTarget, setUnauthorizedTarget] = useState<UnauthorizedTarget | null>(null)
  const [authorizedByInput, setAuthorizedByInput] = useState('')
  const [confirmingUnauthorized, setConfirmingUnauthorized] = useState(false)
  const [endTarget, setEndTarget] = useState<Visit | null>(null)
  const [printVisit, setPrintVisit] = useState<Visit | null>(null)
  const [entryPhoto, setEntryPhoto] = useState<File | null>(null)
  const [entryPhotoPreview, setEntryPhotoPreview] = useState<string | null>(null)
  const [exitPhoto, setExitPhoto] = useState<File | null>(null)
  const [exitPhotoPreview, setExitPhotoPreview] = useState<string | null>(null)
  const entryCameraRef = useRef<HTMLInputElement>(null)
  const entryGalleryRef = useRef<HTMLInputElement>(null)
  const exitCameraRef = useRef<HTMLInputElement>(null)
  const exitGalleryRef = useRef<HTMLInputElement>(null)

  const quickTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined)

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

  function handleVisitorSelect(visitor: Visitor) {
    setBlacklistAlert('')
    setShowQuickDropdown(false)
    setQuickQuery('')
    if (visitor.blacklisted) {
      setBlacklistAlert(`BLOQUEADO: ${visitor.blacklist_reason ?? 'sem motivo informado'}`)
      return
    }
    setSelectedVisitor(visitor)
    form.setValue('visitor_name', visitor.full_name)
    form.setValue('visitor_company', visitor.company ?? '')
  }

  function handleCredenciadoSelect(visitor: Visitor) {
    setBlacklistAlert('')
    setShowQuickDropdown(false)
    setQuickQuery('')
    if (visitor.blacklisted) {
      setBlacklistAlert(`BLOQUEADO: ${visitor.blacklist_reason ?? 'sem motivo informado'}`)
      return
    }
    if (visitor.status === 'autorizado') {
      setAuthorizedTarget({ visitor })
      return
    }
    setUnauthorizedTarget({
      name: visitor.full_name,
      company: visitor.company ?? undefined,
      confirm: async (authorizedBy) => {
        const { error } = await checkIn(visitor.id, 'unregistered', authorizedBy)
        if (error) { toast.error('Erro ao registrar: ' + translateError(error)); return false }
        toast.success('Entrada registrada!')
        return true
      },
    })
  }

  async function confirmAuthorizedEntry() {
    if (!authorizedTarget) return
    setConfirmingAuthorized(true)
    const { error } = await checkIn(authorizedTarget.visitor.id, 'employee')
    if (error) toast.error('Erro ao registrar: ' + translateError(error))
    else toast.success('Entrada registrada!')
    setConfirmingAuthorized(false)
    setAuthorizedTarget(null)
  }

  function closeUnauthorized() {
    setUnauthorizedTarget(null)
    setAuthorizedByInput('')
  }

  async function confirmUnauthorizedEntry() {
    if (!unauthorizedTarget || !authorizedByInput.trim()) return
    setConfirmingUnauthorized(true)
    const ok = await unauthorizedTarget.confirm(authorizedByInput.trim())
    setConfirmingUnauthorized(false)
    if (ok) closeUnauthorized()
  }

  function clearVisitor() {
    setSelectedVisitor(null)
    setBlacklistAlert('')
    form.reset(EMPTY_FORM)
  }

  // ── Troca de tipo ─────────────────────────────────────────────
  function switchType(type: VisitTypeUI) {
    setVisitType(type)
    form.reset(EMPTY_FORM)
    setSelectedVisitor(null)
    setQuickQuery('')
    setQuickResults([])
    setShowQuickDropdown(false)
    setBlacklistAlert('')
    setAuthorizedTarget(null)
    closeUnauthorized()
  }

  function handleEntryPhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setEntryPhoto(file)
    setEntryPhotoPreview(URL.createObjectURL(file))
  }

  function clearEntryPhoto() {
    setEntryPhoto(null)
    setEntryPhotoPreview(null)
    if (entryCameraRef.current) entryCameraRef.current.value = ''
    if (entryGalleryRef.current) entryGalleryRef.current.value = ''
  }

  function handleExitPhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setExitPhoto(file)
    setExitPhotoPreview(URL.createObjectURL(file))
  }

  function clearExitPhoto() {
    setExitPhoto(null)
    setExitPhotoPreview(null)
    if (exitCameraRef.current) exitCameraRef.current.value = ''
    if (exitGalleryRef.current) exitGalleryRef.current.value = ''
  }

  const resetForm = useCallback(() => {
    form.reset(EMPTY_FORM)
    setSelectedVisitor(null)
    setQuickQuery('')
    setEntryPhoto(null)
    setEntryPhotoPreview(null)
    if (entryCameraRef.current) entryCameraRef.current.value = ''
    if (entryGalleryRef.current) entryGalleryRef.current.value = ''
  }, [form])

  // ── Submit ────────────────────────────────────────────────────
  async function onSubmit(values: VisitFormValues) {
    if (blacklistAlert) return
    setSubmitting(true)

    const existingVisitorId = selectedVisitor?.id
    setUnauthorizedTarget({
      name: values.visitor_name,
      company: values.visitor_company,
      confirm: async (authorizedBy) => {
        const { error, visitId } = await createVisit(values, existingVisitorId, 'other', authorizedBy)
        if (error) { toast.error('Erro ao registrar: ' + translateError(error)); return false }
        if (entryPhoto && visitId) {
          const { error: photoErr } = await uploadPhoto(visitId, entryPhoto, 'entrada')
          if (photoErr) toast.error('Entrada registrada, mas erro ao salvar foto.')
          else toast.success('Entrada registrada com foto!')
        } else {
          toast.success('Entrada registrada!')
        }
        resetForm()
        return true
      },
    })
    setSubmitting(false)
  }

  async function handleEndVisit() {
    if (!endTarget) return
    const error = await endVisit(endTarget.id)
    if (error) {
      toast.error('Erro ao encerrar')
    } else {
      if (exitPhoto) {
        const { error: photoErr } = await uploadPhoto(endTarget.id, exitPhoto, 'saida')
        if (photoErr) toast.error('Saída registrada, mas erro ao salvar foto.')
        else toast.success('Saída registrada com foto!')
      } else {
        toast.success('Saída registrada')
      }
    }
    clearExitPhoto()
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
      <div className="grid grid-cols-2 gap-3">
        {VISIT_TYPES.map(({ id, label, sublabel, icon: Icon }) => {
          const active = visitType === id
          return (
            <button
              key={id}
              type="button"
              onClick={() => switchType(id)}
              className="flex flex-col items-center gap-2 rounded-xl border-2 px-3 py-5 transition-all text-center active:scale-95"
              style={{
                borderColor: active ? GOLD : 'oklch(0.30 0.05 262)',
                background: active
                  ? `linear-gradient(150deg, oklch(0.27 0.09 262) 0%, ${NAVY} 100%)`
                  : `linear-gradient(150deg, oklch(0.24 0.06 262) 0%, oklch(0.19 0.06 262) 100%)`,
                boxShadow: active
                  ? '0 8px 20px -6px oklch(0.838 0.176 86.4 / 0.35), 0 2px 8px oklch(0.188 0.075 262 / 0.45)'
                  : '0 1px 3px oklch(0.188 0.075 262 / 0.3)',
              }}
            >
              <Icon
                className="h-8 w-8"
                style={{ color: active ? GOLD : 'oklch(0.838 0.176 86.4 / 0.5)' }}
              />
              <span
                className="text-base font-bold leading-tight"
                style={{ color: active ? GOLD : 'oklch(0.838 0.176 86.4 / 0.55)' }}
              >
                {label}
              </span>
              <span
                className="text-xs leading-tight hidden sm:block"
                style={{ color: active ? 'oklch(0.75 0.03 86)' : 'oklch(0.55 0.03 262)' }}
              >
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
                const isAutorizado = v.status === 'autorizado'
                return (
                  <button
                    key={v.id}
                    type="button"
                    className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-yellow-50 transition-colors border-b last:border-0"
                    onClick={() => (visitType === 'credenciado' ? handleCredenciadoSelect(v) : handleVisitorSelect(v))}
                  >
                    <UserCheck className="h-5 w-5 shrink-0" style={{ color: GOLD }} />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-slate-800 truncate">{v.full_name}</p>
                        {visitType === 'credenciado' && (
                          isAutorizado ? (
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full shrink-0" style={{ backgroundColor: 'oklch(0.93 0.08 140)', color: 'oklch(0.38 0.14 140)' }}>
                              AUTORIZADO
                            </span>
                          ) : (
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full shrink-0 bg-slate-100 text-slate-500">
                              NÃO CREDENCIADO
                            </span>
                          )
                        )}
                      </div>
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

        {visitType === 'credenciado' && !blacklistAlert && !authorizedTarget && !unauthorizedTarget && (
          <div className="mt-3 rounded-lg px-4 py-3 text-center text-sm text-slate-400 border-2 border-dashed" style={{ borderColor: 'oklch(0.85 0.01 264)' }}>
            Busque o nome ou documento acima para registrar a entrada.
            {quickQuery.trim().length >= 2 && quickResults.length === 0 && (
              <p className="mt-1.5 text-slate-500">
                Não encontrado. Novos não credenciados devem ser registrados na aba <strong>Não Credenciado</strong>.
              </p>
            )}
          </div>
        )}
      </div>

      {/* ── FORMULÁRIO (apenas Não Credenciado) ─────────────────── */}
      {visitType === 'visitor' && (
      <Card className="shadow-sm">
        <CardContent className="pt-5">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">

              {/* Campos comuns */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField control={form.control} name="visitor_name" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-semibold text-slate-700">Nome *</FormLabel>
                    <FormControl>
                      <Input placeholder="Nome completo" className="h-12" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                <FormField control={form.control} name="visitor_company" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-semibold text-slate-700">Empresa *</FormLabel>
                    <FormControl>
                      <TextAutocomplete
                        value={field.value ?? ''}
                        onChange={field.onChange}
                        options={empreiteiras.filter((e) => e.active).map((e) => e.razao_social)}
                        placeholder="Empresa do não credenciado"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField control={form.control} name="atividade" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-semibold text-slate-700">Motivo da visita *</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: Reunião, Vistoria, Entrega…" className="h-12" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                <FormField control={form.control} name="vehicle_plate" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-semibold text-slate-700">
                      Placa do veículo <span className="font-normal text-slate-400">(opcional)</span>
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="ABC1D23"
                        className="h-12 font-mono uppercase"
                        {...field}
                        onChange={(e) => field.onChange(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 7))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>

              {/* Foto de evidência de entrada */}
              <div className="border-t pt-4">
                <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-3 flex items-center gap-2">
                  <Camera className="h-3.5 w-3.5" />
                  Foto de Evidência <span className="font-normal normal-case tracking-normal">(opcional)</span>
                </p>
                {/* inputs hidden — câmera e galeria separados */}
                <input ref={entryCameraRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleEntryPhotoChange} />
                <input ref={entryGalleryRef} type="file" accept="image/*" className="hidden" onChange={handleEntryPhotoChange} />

                {entryPhotoPreview ? (
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <img src={entryPhotoPreview} alt="Preview" className="h-20 w-20 object-cover rounded-xl border-2 shadow-sm" style={{ borderColor: GOLD }} />
                      <button type="button" onClick={clearEntryPhoto} className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-red-500 text-white flex items-center justify-center shadow">
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    <p className="text-xs text-slate-500">Foto selecionada</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => entryCameraRef.current?.click()}
                      className="flex items-center justify-center gap-2 h-12 rounded-xl border-2 text-sm font-semibold transition-all active:scale-95"
                      style={{ borderColor: GOLD, backgroundColor: 'oklch(0.97 0.04 86)', color: NAVY }}
                    >
                      <Camera className="h-4 w-4" />
                      Abrir Câmera
                    </button>
                    <button
                      type="button"
                      onClick={() => entryGalleryRef.current?.click()}
                      className="flex items-center justify-center gap-2 h-12 rounded-xl border-2 text-sm font-semibold transition-all active:scale-95"
                      style={{ borderColor: 'oklch(0.85 0.008 264)', color: 'oklch(0.45 0.02 264)' }}
                    >
                      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="m21 15-5-5L5 21"/></svg>
                      Da Galeria
                    </button>
                  </div>
                )}
              </div>

              <div className="flex justify-end pt-1">
                <Button
                  type="submit"
                  size="lg"
                  className="w-full md:w-auto h-14 md:h-12 md:px-10 text-base font-bold shadow-md rounded-xl"
                  disabled={submitting || !!blacklistAlert}
                  style={{ backgroundColor: NAVY, color: 'white' }}
                >
                  {submitting ? 'Verificando…' : 'Continuar'}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
      )}

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

        {/* ── MOBILE: cards ── */}
        <div className="md:hidden space-y-3">
          {visitsLoading ? (
            <div className="bg-white rounded-xl border p-6 text-center text-slate-400 text-sm">Carregando…</div>
          ) : activeVisits.length === 0 ? (
            <div className="bg-white rounded-xl border p-10 flex flex-col items-center gap-2 text-slate-400">
              <ClipboardList className="h-8 w-8 opacity-30" />
              <p className="text-sm">Nenhuma pessoa no local</p>
            </div>
          ) : (
            activeVisits.map((visit) => {
              type VisitorWithEmp = Visitor & { empreiteira?: { razao_social: string } }
              const emp = (visit.visitor as VisitorWithEmp)?.empreiteira?.razao_social
              const empresa = emp ?? visit.visitor?.company
              const isTrabalhador = !!visit.visitor?.funcao || !!emp
              const borderColor = isTrabalhador ? NAVY : 'oklch(0.7 0.12 200)'
              const initials = visit.visitor?.full_name
                .split(' ')
                .filter(Boolean)
                .slice(0, 2)
                .map((n) => n[0])
                .join('')
                .toUpperCase()
              return (
                <div
                  key={visit.id}
                  className="bg-white rounded-xl border shadow-sm overflow-hidden"
                  style={{ borderLeftWidth: 4, borderLeftColor: borderColor }}
                >
                  <div className="flex items-start gap-3 p-4">
                    {/* Avatar */}
                    <div
                      className="h-10 w-10 rounded-full shrink-0 flex items-center justify-center text-sm font-bold text-white"
                      style={{ backgroundColor: borderColor }}
                    >
                      {initials}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className="font-bold text-slate-800 text-sm leading-tight truncate">
                          {visit.visitor?.full_name}
                        </p>
                        {visit.epi_verificado && (
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md shrink-0"
                            style={{ backgroundColor: 'oklch(0.93 0.08 140)', color: 'oklch(0.38 0.14 140)' }}>
                            EPI ✓
                          </span>
                        )}
                      </div>

                      <div className="flex flex-wrap gap-x-2 mt-0.5">
                        {visit.visitor?.funcao && (
                          <span className="text-xs text-slate-500">{visit.visitor.funcao}</span>
                        )}
                        {empresa && (
                          <span className="text-xs text-slate-500 truncate">· {empresa}</span>
                        )}
                      </div>

                      <div className="flex items-center gap-3 mt-1.5">
                        <span className="text-[11px] text-slate-400 font-medium">
                          {format(new Date(visit.checked_in_at), "HH:mm · dd/MM", { locale: ptBR })}
                        </span>
                        {visit.atividade && (
                          <span className="text-[11px] text-slate-500 truncate">· {visit.atividade}</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex border-t">
                    <button
                      type="button"
                      onClick={() => handlePrint(visit)}
                      className="flex-1 flex items-center justify-center gap-2 py-3 text-xs font-semibold text-slate-500 hover:bg-slate-50 transition-colors"
                    >
                      <Printer className="h-4 w-4" />
                      Crachá
                    </button>
                    <div className="w-px bg-slate-100" />
                    <button
                      type="button"
                      onClick={() => setEndTarget(visit)}
                      className="flex-1 flex items-center justify-center gap-2 py-3 text-xs font-bold transition-colors"
                      style={{ color: 'oklch(0.5 0.18 25)' }}
                    >
                      <LogOut className="h-4 w-4" />
                      Registrar Saída
                    </button>
                  </div>
                </div>
              )
            })
          )}
        </div>

        {/* ── DESKTOP: tabela ── */}
        <div className="hidden md:block rounded-xl border bg-white overflow-hidden shadow-sm">
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

      {/* Dialog de saída com foto opcional */}
      {endTarget && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/50"
            onClick={() => { setEndTarget(null); clearExitPhoto() }}
          />
          <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 bg-white rounded-2xl shadow-2xl w-[calc(100vw-2rem)] max-w-sm p-6">
            <h3 className="text-base font-bold mb-1" style={{ color: NAVY }}>Registrar saída</h3>
            <p className="text-sm text-slate-500 mb-5">
              Saída de <strong>{endTarget.visitor?.full_name}</strong>?
            </p>

            {/* Foto de saída */}
            <div className="mb-5">
              <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-2 flex items-center gap-1.5">
                <Camera className="h-3.5 w-3.5" />
                Foto de saída <span className="font-normal normal-case tracking-normal">(opcional)</span>
              </p>
              <input ref={exitCameraRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleExitPhotoChange} />
              <input ref={exitGalleryRef} type="file" accept="image/*" className="hidden" onChange={handleExitPhotoChange} />

              {exitPhotoPreview ? (
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <img src={exitPhotoPreview} alt="Preview saída" className="h-16 w-16 object-cover rounded-xl border-2 shadow-sm" style={{ borderColor: GOLD }} />
                    <button type="button" onClick={clearExitPhoto} className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-red-500 text-white flex items-center justify-center shadow">
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <p className="text-xs text-slate-500">Foto selecionada</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => exitCameraRef.current?.click()}
                    className="flex items-center justify-center gap-2 h-11 rounded-xl border-2 text-sm font-semibold transition-all active:scale-95"
                    style={{ borderColor: GOLD, backgroundColor: 'oklch(0.97 0.04 86)', color: NAVY }}
                  >
                    <Camera className="h-4 w-4" />
                    Câmera
                  </button>
                  <button
                    type="button"
                    onClick={() => exitGalleryRef.current?.click()}
                    className="flex items-center justify-center gap-2 h-11 rounded-xl border-2 text-sm font-semibold transition-all active:scale-95"
                    style={{ borderColor: 'oklch(0.85 0.008 264)', color: 'oklch(0.45 0.02 264)' }}
                  >
                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="m21 15-5-5L5 21"/></svg>
                    Galeria
                  </button>
                </div>
              )}
            </div>

            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => { setEndTarget(null); clearExitPhoto() }}
              >
                Cancelar
              </Button>
              <Button
                className="flex-1 font-bold"
                style={{ backgroundColor: 'oklch(0.5 0.18 25)' }}
                onClick={handleEndVisit}
              >
                Confirmar saída
              </Button>
            </div>
          </div>
        </>
      )}

      {/* Pop-up: Entrada Autorizada (credenciado) */}
      {authorizedTarget && (
        <>
          <div className="fixed inset-0 z-40 bg-black/50" onClick={() => setAuthorizedTarget(null)} />
          <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 bg-white rounded-2xl shadow-2xl w-[calc(100vw-2rem)] max-w-sm p-6 text-center">
            <div className="mx-auto mb-3 h-14 w-14 rounded-full flex items-center justify-center" style={{ backgroundColor: 'oklch(0.93 0.08 140)' }}>
              <CheckCircle2 className="h-8 w-8" style={{ color: 'oklch(0.5 0.15 140)' }} />
            </div>
            <h3 className="text-lg font-bold mb-1" style={{ color: 'oklch(0.4 0.14 140)' }}>Entrada Autorizada</h3>
            <p className="text-sm text-slate-500 mb-4">Pessoa pré-cadastrada e liberada.</p>
            <div className="rounded-lg bg-slate-50 border px-4 py-3 mb-5 text-left">
              <p className="font-bold text-slate-800">{authorizedTarget.visitor.full_name}</p>
              {authorizedTarget.visitor.funcao && <p className="text-sm text-slate-500">{authorizedTarget.visitor.funcao}</p>}
              {authorizedTarget.visitor.company && <p className="text-sm text-slate-500">{authorizedTarget.visitor.company}</p>}
            </div>
            <Button
              className="w-full h-12 font-bold"
              style={{ backgroundColor: 'oklch(0.5 0.15 140)' }}
              disabled={confirmingAuthorized}
              onClick={confirmAuthorizedEntry}
            >
              {confirmingAuthorized ? 'Registrando…' : 'OK, Registrar Entrada'}
            </Button>
          </div>
        </>
      )}

      {/* Pop-up: Entrada Não Autorizada */}
      {unauthorizedTarget && (
        <>
          <div className="fixed inset-0 z-40 bg-black/60" onClick={closeUnauthorized} />
          <div
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 rounded-3xl shadow-2xl w-[calc(100vw-2rem)] max-w-sm p-6"
            style={{
              background: 'linear-gradient(160deg, oklch(0.5 0.2 25) 0%, oklch(0.32 0.16 25) 100%)',
              border: '2px solid oklch(0.62 0.2 25)',
            }}
          >
            <div
              className="mx-auto mb-3 h-14 w-14 rounded-full flex items-center justify-center"
              style={{ backgroundColor: 'oklch(1 0 0 / 0.12)', border: `2px solid ${GOLD}` }}
            >
              <AlertCircle className="h-8 w-8" style={{ color: GOLD }} />
            </div>
            <h3 className="text-lg font-extrabold text-center mb-1" style={{ color: GOLD }}>
              Entrada Não Autorizada
            </h3>
            <p className="text-sm text-center mb-4" style={{ color: 'oklch(0.97 0.01 25 / 0.85)' }}>
              Para registrar essa entrada, contate o responsável da obra.
            </p>
            <div
              className="rounded-lg px-4 py-3 mb-4 text-left"
              style={{ backgroundColor: 'oklch(0 0 0 / 0.22)', border: '1px solid oklch(1 0 0 / 0.15)' }}
            >
              <p className="font-bold text-white">{unauthorizedTarget.name}</p>
              {unauthorizedTarget.company && (
                <p className="text-sm" style={{ color: 'oklch(1 0 0 / 0.7)' }}>{unauthorizedTarget.company}</p>
              )}
            </div>
            <label className="text-sm font-bold mb-1.5 block" style={{ color: GOLD }}>
              Nome de quem autoriza *
            </label>
            <Input
              className="h-12 mb-4 bg-white text-slate-900 border-0 focus-visible:ring-2"
              style={{ ['--tw-ring-color' as string]: GOLD }}
              placeholder="Ex: Raul Ruiz"
              value={authorizedByInput}
              onChange={(e) => setAuthorizedByInput(e.target.value)}
              autoFocus
            />
            {buildWhatsappUrl(authorizedByInput, unauthorizedTarget.name, unauthorizedTarget.company) && (
              <a
                href={buildWhatsappUrl(authorizedByInput, unauthorizedTarget.name, unauthorizedTarget.company) ?? '#'}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 h-11 rounded-lg border-2 text-sm font-semibold mb-4 transition-all active:scale-95 bg-white"
                style={{ borderColor: 'oklch(0.6 0.15 145)', color: 'oklch(0.4 0.14 145)' }}
              >
                <MessageCircle className="h-4 w-4" />
                Chamar no WhatsApp
              </a>
            )}
            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1 font-semibold bg-transparent hover:bg-white/10 hover:text-white"
                style={{ borderColor: 'oklch(1 0 0 / 0.4)', color: 'white' }}
                onClick={closeUnauthorized}
              >
                Cancelar
              </Button>
              <Button
                className="flex-1 font-bold text-white hover:brightness-110"
                style={{ backgroundColor: 'oklch(0.58 0.17 145)' }}
                disabled={!authorizedByInput.trim() || confirmingUnauthorized}
                onClick={confirmUnauthorizedEntry}
              >
                {confirmingUnauthorized ? 'Autorizando…' : 'Autorizar Entrada'}
              </Button>
            </div>
          </div>
        </>
      )}

      {/* Crachá para impressão */}
      {printVisit && (
        <div id="badge-print-root" style={{ display: 'none' }} className="p-8 font-sans">
          <div style={{ border: '3px solid #162050', borderRadius: 12, padding: 32, maxWidth: 320, margin: '0 auto' }}>
            <p style={{ textAlign: 'center', fontWeight: 800, fontSize: 18, color: '#162050', marginBottom: 2, letterSpacing: 3 }}>
              {printVisit.visitor?.funcao ? 'TRABALHADOR' : 'NÃO CREDENCIADO'}
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
