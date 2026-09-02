import { useState, useEffect, useRef } from 'react'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { Download, Upload, FileDown, ShieldCheck, ShieldOff, Pencil, UserPlus, Search, X } from 'lucide-react'
import { useCredenciadosAdmin, type ImportSummary } from '@/hooks/useCredenciadosAdmin'
import { parseCredenciadosXLSX, downloadCredenciadosTemplate } from '@/lib/xlsx'
import { generateCredenciadosCSV } from '@/lib/csv'
import { PageHeader } from '@/components/layout/PageHeader'
import { DataTable, type Column } from '@/components/shared/DataTable'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import type { Visit, Visitor } from '@/types/app.types'

export function CredenciadosPage() {
  const {
    entries,
    loading,
    fetchEntries,
    searchResults,
    searching,
    searchVisitors,
    updateVisitorInfo,
    updateVisitEntry,
    setStatus,
    createVisitor,
    bulkUpsertFromImport,
  } = useCredenciadosAdmin()
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [search, setSearch] = useState('')
  const [editing, setEditing] = useState<Visit | null>(null)
  const [editForm, setEditForm] = useState({ full_name: '', company: '', atividade: '', authorized_by: '' })
  const [saving, setSaving] = useState(false)
  const [editingVisitor, setEditingVisitor] = useState<Visitor | null>(null)
  const [editVisitorForm, setEditVisitorForm] = useState({ full_name: '', company: '', funcao: '' })
  const [savingVisitor, setSavingVisitor] = useState(false)
  const [createOpen, setCreateOpen] = useState(false)
  const [createForm, setCreateForm] = useState<{ full_name: string; company: string; funcao: string; status: 'autorizado' | 'nao_autorizado' }>({
    full_name: '',
    company: '',
    funcao: '',
    status: 'autorizado',
  })
  const [creating, setCreating] = useState(false)
  const [importing, setImporting] = useState(false)
  const [importSummary, setImportSummary] = useState<ImportSummary | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const isSearching = search.trim().length >= 2

  useEffect(() => { fetchEntries(dateFrom || undefined, dateTo || undefined) }, [fetchEntries, dateFrom, dateTo])

  useEffect(() => {
    const term = search.trim()
    if (term.length < 2) return
    const timeout = setTimeout(() => { searchVisitors(term) }, 300)
    return () => clearTimeout(timeout)
  }, [search, searchVisitors])

  function openEdit(visit: Visit) {
    setEditing(visit)
    setEditForm({
      full_name: visit.visitor?.full_name ?? '',
      company: visit.visitor?.company ?? '',
      atividade: visit.atividade ?? '',
      authorized_by: visit.authorized_by ?? '',
    })
  }

  async function handleSaveEdit() {
    if (!editing || !editing.visitor) return
    setSaving(true)
    const errA = await updateVisitorInfo(editing.visitor.id, {
      full_name: editForm.full_name,
      company: editForm.company,
    })
    const errB = await updateVisitEntry(editing.id, {
      atividade: editForm.atividade,
      authorized_by: editForm.authorized_by,
    })
    if (errA || errB) {
      toast.error('Erro ao salvar alterações')
    } else {
      toast.success('Registro atualizado')
      setEditing(null)
      await fetchEntries(dateFrom || undefined, dateTo || undefined)
    }
    setSaving(false)
  }

  async function handleToggleStatus(visit: Visit) {
    if (!visit.visitor) return
    const newStatus = visit.visitor.status === 'autorizado' ? 'nao_autorizado' : 'autorizado'
    const error = await setStatus(visit.visitor.id, newStatus)
    if (error) toast.error('Erro ao atualizar status')
    else {
      toast.success(newStatus === 'autorizado' ? 'Credenciado' : 'Credencial removida')
      await fetchEntries(dateFrom || undefined, dateTo || undefined)
    }
  }

  function openEditVisitor(visitor: Visitor) {
    setEditingVisitor(visitor)
    setEditVisitorForm({
      full_name: visitor.full_name,
      company: visitor.company ?? '',
      funcao: visitor.funcao ?? '',
    })
  }

  async function handleSaveVisitorEdit() {
    if (!editingVisitor) return
    setSavingVisitor(true)
    const error = await updateVisitorInfo(editingVisitor.id, {
      full_name: editVisitorForm.full_name,
      company: editVisitorForm.company,
      funcao: editVisitorForm.funcao,
    })
    if (error) {
      toast.error('Erro ao salvar alterações')
    } else {
      toast.success('Cadastro atualizado')
      setEditingVisitor(null)
      await searchVisitors(search.trim())
    }
    setSavingVisitor(false)
  }

  async function handleToggleVisitorStatus(visitor: Visitor) {
    const newStatus = visitor.status === 'autorizado' ? 'nao_autorizado' : 'autorizado'
    const error = await setStatus(visitor.id, newStatus)
    if (error) toast.error('Erro ao atualizar status')
    else {
      toast.success(newStatus === 'autorizado' ? 'Credenciado' : 'Credencial removida')
      await searchVisitors(search.trim())
    }
  }

  async function handleCreateVisitor() {
    if (!createForm.full_name.trim()) {
      toast.error('Informe o nome')
      return
    }
    setCreating(true)
    const error = await createVisitor({
      full_name: createForm.full_name.trim(),
      company: createForm.company.trim(),
      funcao: createForm.funcao.trim(),
      status: createForm.status,
    })
    if (error) {
      toast.error('Erro ao cadastrar usuário')
    } else {
      toast.success('Usuário cadastrado')
      setCreateOpen(false)
      const name = createForm.full_name.trim()
      setCreateForm({ full_name: '', company: '', funcao: '', status: 'autorizado' })
      setSearch(name)
      await searchVisitors(name)
    }
    setCreating(false)
  }

  async function handleFileSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setImporting(true)
    setImportSummary(null)
    try {
      const rows = await parseCredenciadosXLSX(file)
      const summary = await bulkUpsertFromImport(rows)
      setImportSummary(summary)
      toast.success(`Importação concluída: ${summary.updated} atualizados, ${summary.created} criados`)
      await fetchEntries(dateFrom || undefined, dateTo || undefined)
    } catch {
      toast.error('Erro ao ler a planilha. Verifique o formato do arquivo.')
    }
    setImporting(false)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  function handleExportCSV() {
    if (!entries.length) return
    generateCredenciadosCSV(entries)
  }

  const searchColumns: Column<Record<string, unknown>>[] = [
    { key: 'full_name', label: 'Nome', render: (row) => (row as unknown as Visitor).full_name },
    {
      key: 'empresa',
      label: 'Empresa',
      render: (row) => {
        const v = row as unknown as Visitor
        return v.empreiteira?.razao_social ?? v.company ?? '—'
      },
    },
    { key: 'funcao', label: 'Função', render: (row) => (row as unknown as Visitor).funcao ?? '—' },
    {
      key: 'status',
      label: 'Status',
      render: (row) => {
        const v = row as unknown as Visitor
        return v.status === 'autorizado' ? (
          <Badge className="bg-green-100 text-green-800 hover:bg-green-100">CREDENCIADO</Badge>
        ) : (
          <Badge variant="secondary">NÃO CREDENCIADO</Badge>
        )
      },
    },
    {
      key: 'actions',
      label: '',
      className: 'w-40 text-right',
      render: (row) => {
        const v = row as unknown as Visitor
        const isAutorizado = v.status === 'autorizado'
        return (
          <div className="flex justify-end gap-1">
            <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); openEditVisitor(v) }}>
              <Pencil className="h-3.5 w-3.5" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className={isAutorizado ? 'text-red-500 hover:text-red-700' : 'text-green-600 hover:text-green-800'}
              onClick={(e) => { e.stopPropagation(); handleToggleVisitorStatus(v) }}
            >
              {isAutorizado ? <ShieldOff className="h-3.5 w-3.5" /> : <ShieldCheck className="h-3.5 w-3.5" />}
            </Button>
          </div>
        )
      },
    },
  ]

  const columns: Column<Record<string, unknown>>[] = [
    {
      key: 'checked_in_at',
      label: 'Data/Hora',
      render: (row) => format(new Date((row as unknown as Visit).checked_in_at), 'dd/MM/yyyy HH:mm'),
    },
    { key: 'nome', label: 'Nome', render: (row) => (row as unknown as Visit).visitor?.full_name ?? '—' },
    {
      key: 'empresa',
      label: 'Empresa',
      render: (row) => {
        const v = row as unknown as Visit
        return v.visitor?.empreiteira?.razao_social ?? v.visitor?.company ?? '—'
      },
    },
    { key: 'atividade', label: 'Motivo da Visita', render: (row) => (row as unknown as Visit).atividade ?? '—' },
    { key: 'authorized_by', label: 'Autorizado por', render: (row) => (row as unknown as Visit).authorized_by ?? '—' },
    {
      key: 'status',
      label: 'Status',
      render: (row) => {
        const v = row as unknown as Visit
        return v.visitor?.status === 'autorizado' ? (
          <Badge className="bg-green-100 text-green-800 hover:bg-green-100">CREDENCIADO</Badge>
        ) : (
          <Badge variant="secondary">NÃO CREDENCIADO</Badge>
        )
      },
    },
    {
      key: 'actions',
      label: '',
      className: 'w-40 text-right',
      render: (row) => {
        const v = row as unknown as Visit
        const isAutorizado = v.visitor?.status === 'autorizado'
        return (
          <div className="flex justify-end gap-1">
            <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); openEdit(v) }}>
              <Pencil className="h-3.5 w-3.5" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className={isAutorizado ? 'text-red-500 hover:text-red-700' : 'text-green-600 hover:text-green-800'}
              onClick={(e) => { e.stopPropagation(); handleToggleStatus(v) }}
            >
              {isAutorizado ? <ShieldOff className="h-3.5 w-3.5" /> : <ShieldCheck className="h-3.5 w-3.5" />}
            </Button>
          </div>
        )
      },
    },
  ]

  return (
    <div>
      <PageHeader
        title="Credenciados"
        description="Histórico de entradas e gestão de credenciamento"
        action={
          <div className="flex flex-wrap gap-2">
            <input ref={fileInputRef} type="file" accept=".xlsx" className="hidden" onChange={handleFileSelected} />
            <Button onClick={() => setCreateOpen(true)}>
              <UserPlus className="h-4 w-4 mr-2" />
              Cadastrar Usuário
            </Button>
            <Button variant="outline" onClick={downloadCredenciadosTemplate}>
              <Download className="h-4 w-4 mr-2" />
              Baixar modelo
            </Button>
            <Button variant="outline" onClick={() => fileInputRef.current?.click()} disabled={importing}>
              <Upload className="h-4 w-4 mr-2" />
              {importing ? 'Importando...' : 'Importar Credenciados'}
            </Button>
            <Button variant="outline" onClick={handleExportCSV} disabled={!entries.length}>
              <FileDown className="h-4 w-4 mr-2" />
              Exportar CSV
            </Button>
          </div>
        }
      />

      {importSummary && (
        <div className="mb-4 rounded-lg border bg-white px-4 py-3 text-sm">
          <p className="font-semibold text-slate-700">Resumo da importação:</p>
          <p className="text-slate-600">
            {importSummary.updated} cadastro(s) atualizado(s), {importSummary.created} criado(s)
          </p>
          {importSummary.duplicatesResolved.length > 0 && (
            <p className="text-amber-600 mt-1">
              Nomes com mais de um cadastro na base (todos foram atualizados): {importSummary.duplicatesResolved.join(', ')}
            </p>
          )}
        </div>
      )}

      <div className="flex flex-wrap items-end gap-4 mb-4 bg-white rounded-lg border p-4">
        <div className="flex-1 min-w-[220px]">
          <label className="text-sm font-medium text-slate-700 block mb-1">Buscar por nome</label>
          <div className="relative">
            <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <Input
              className="pl-9"
              placeholder="Digite o nome do cadastrado..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {search && (
              <button
                type="button"
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                onClick={() => setSearch('')}
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
        <div>
          <label className="text-sm font-medium text-slate-700 block mb-1">De</label>
          <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} disabled={isSearching} />
        </div>
        <div>
          <label className="text-sm font-medium text-slate-700 block mb-1">Até</label>
          <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} disabled={isSearching} />
        </div>
        {(dateFrom || dateTo) && !isSearching && (
          <Button variant="ghost" onClick={() => { setDateFrom(''); setDateTo('') }}>Limpar período</Button>
        )}
      </div>

      {isSearching && (
        <p className="text-sm text-slate-500 mb-3">
          {searchResults.length} cadastro(s) encontrado(s) — gestão de credenciamento, não histórico de entradas.
        </p>
      )}

      <DataTable
        data={isSearching ? (searchResults as unknown as Record<string, unknown>[]) : (entries as unknown as Record<string, unknown>[])}
        columns={isSearching ? searchColumns : columns}
        loading={isSearching ? searching : loading}
        keyField="id"
      />

      <Dialog open={!!editing} onOpenChange={(v) => !v && setEditing(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Editar registro</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-slate-700 block mb-1">Nome</label>
              <Input value={editForm.full_name} onChange={(e) => setEditForm((f) => ({ ...f, full_name: e.target.value }))} />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700 block mb-1">Empresa</label>
              <Input value={editForm.company} onChange={(e) => setEditForm((f) => ({ ...f, company: e.target.value }))} />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700 block mb-1">Motivo da Visita</label>
              <Input value={editForm.atividade} onChange={(e) => setEditForm((f) => ({ ...f, atividade: e.target.value }))} />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700 block mb-1">Autorizado por</label>
              <Input value={editForm.authorized_by} onChange={(e) => setEditForm((f) => ({ ...f, authorized_by: e.target.value }))} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditing(null)} disabled={saving}>Cancelar</Button>
            <Button onClick={handleSaveEdit} disabled={saving}>{saving ? 'Salvando...' : 'Salvar'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!editingVisitor} onOpenChange={(v) => !v && setEditingVisitor(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Editar cadastro</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-slate-700 block mb-1">Nome</label>
              <Input value={editVisitorForm.full_name} onChange={(e) => setEditVisitorForm((f) => ({ ...f, full_name: e.target.value }))} />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700 block mb-1">Empresa</label>
              <Input value={editVisitorForm.company} onChange={(e) => setEditVisitorForm((f) => ({ ...f, company: e.target.value }))} />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700 block mb-1">Função</label>
              <Input value={editVisitorForm.funcao} onChange={(e) => setEditVisitorForm((f) => ({ ...f, funcao: e.target.value }))} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingVisitor(null)} disabled={savingVisitor}>Cancelar</Button>
            <Button onClick={handleSaveVisitorEdit} disabled={savingVisitor}>{savingVisitor ? 'Salvando...' : 'Salvar'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={createOpen} onOpenChange={(v) => !v && setCreateOpen(false)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Cadastrar Usuário</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-slate-700 block mb-1">Nome *</label>
              <Input
                value={createForm.full_name}
                onChange={(e) => setCreateForm((f) => ({ ...f, full_name: e.target.value }))}
                autoFocus
              />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700 block mb-1">Empresa</label>
              <Input value={createForm.company} onChange={(e) => setCreateForm((f) => ({ ...f, company: e.target.value }))} />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700 block mb-1">Função</label>
              <Input value={createForm.funcao} onChange={(e) => setCreateForm((f) => ({ ...f, funcao: e.target.value }))} />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700 block mb-1">Status</label>
              <Select
                value={createForm.status}
                onValueChange={(v) => setCreateForm((f) => ({ ...f, status: v as 'autorizado' | 'nao_autorizado' }))}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="autorizado">Credenciado</SelectItem>
                  <SelectItem value="nao_autorizado">Não Credenciado</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)} disabled={creating}>Cancelar</Button>
            <Button onClick={handleCreateVisitor} disabled={creating || !createForm.full_name.trim()}>
              {creating ? 'Cadastrando...' : 'Cadastrar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
