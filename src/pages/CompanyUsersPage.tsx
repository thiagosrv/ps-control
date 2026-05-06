import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { Plus, Pencil, Trash2, Users } from 'lucide-react'
import { useCompanyUsers } from '@/hooks/useCompanyUsers'
import { useDepartments } from '@/hooks/useDepartments'
import { companyUserSchema, type CompanyUserFormValues } from '@/lib/validators'
import { PageHeader } from '@/components/layout/PageHeader'
import { DataTable, type Column } from '@/components/shared/DataTable'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import type { CompanyUser } from '@/types/app.types'

export function CompanyUsersPage() {
  const { companyUsers, loading, create, update, remove } = useCompanyUsers()
  const { departments } = useDepartments()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<CompanyUser | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<CompanyUser | null>(null)
  const [saving, setSaving] = useState(false)
  const [search, setSearch] = useState('')

  const form = useForm<CompanyUserFormValues>({
    resolver: zodResolver(companyUserSchema),
    defaultValues: { full_name: '', department_id: '', ramal: '', phone: '', email: '', active: true },
  })

  function openCreate() {
    setEditing(null)
    form.reset({ full_name: '', department_id: '', ramal: '', phone: '', email: '', active: true })
    setDialogOpen(true)
  }

  function openEdit(user: CompanyUser) {
    setEditing(user)
    form.reset({
      full_name: user.full_name,
      department_id: user.department_id ?? '',
      ramal: user.ramal ?? '',
      phone: user.phone ?? '',
      email: user.email ?? '',
      active: user.active,
    })
    setDialogOpen(true)
  }

  async function onSubmit(values: CompanyUserFormValues) {
    setSaving(true)
    const error = editing ? await update(editing.id, values) : await create(values)
    if (error) {
      toast.error('Erro ao salvar: ' + (error as { message?: string }).message)
    } else {
      toast.success(editing ? 'Usuário atualizado' : 'Usuário criado')
      setDialogOpen(false)
    }
    setSaving(false)
  }

  async function handleDelete() {
    if (!deleteTarget) return
    setSaving(true)
    const error = await remove(deleteTarget.id)
    if (error) toast.error('Erro ao excluir')
    else toast.success('Usuário excluído')
    setDeleteTarget(null)
    setSaving(false)
  }

  const filtered = search
    ? companyUsers.filter((u) => u.full_name.toLowerCase().includes(search.toLowerCase()))
    : companyUsers

  const columns: Column<Record<string, unknown>>[] = [
    { key: 'full_name', label: 'Nome' },
    {
      key: 'department',
      label: 'Departamento',
      render: (row) => {
        const u = row as unknown as CompanyUser
        return u.department?.name ?? '—'
      },
    },
    { key: 'ramal', label: 'Ramal', render: (row) => (row.ramal as string) || '—' },
    { key: 'phone', label: 'Telefone', render: (row) => (row.phone as string) || '—' },
    {
      key: 'active',
      label: 'Status',
      render: (row) => (
        <Badge variant={row.active ? 'default' : 'secondary'}>
          {row.active ? 'Ativo' : 'Inativo'}
        </Badge>
      ),
    },
    {
      key: 'actions',
      label: '',
      className: 'w-24 text-right',
      render: (row) => (
        <div className="flex justify-end gap-1">
          <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); openEdit(row as unknown as CompanyUser) }}>
            <Pencil className="h-3.5 w-3.5" />
          </Button>
          <Button size="sm" variant="ghost" className="text-red-500 hover:text-red-700" onClick={(e) => { e.stopPropagation(); setDeleteTarget(row as unknown as CompanyUser) }}>
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      ),
    },
  ]

  return (
    <div>
      <PageHeader
        title="Usuários Internos"
        description="Funcionários que podem receber visitantes"
        action={
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4 mr-2" />
            Novo Usuário
          </Button>
        }
      />

      <div className="mb-4">
        <Input
          placeholder="Buscar por nome..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-sm"
        />
      </div>

      <DataTable
        data={filtered as unknown as Record<string, unknown>[]}
        columns={columns}
        loading={loading}
        keyField="id"
      />

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              {editing ? 'Editar Usuário' : 'Novo Usuário'}
            </DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField control={form.control} name="full_name" render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome completo *</FormLabel>
                  <FormControl><Input placeholder="João da Silva" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="department_id" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Departamento</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {departments.map((d) => (
                          <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="ramal" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Ramal</FormLabel>
                    <FormControl><Input placeholder="Ex: 1234" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="phone" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Telefone</FormLabel>
                    <FormControl><Input placeholder="(00) 00000-0000" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="email" render={({ field }) => (
                  <FormItem>
                    <FormLabel>E-mail</FormLabel>
                    <FormControl><Input type="email" placeholder="joao@empresa.com" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>
              <FormField control={form.control} name="active" render={({ field }) => (
                <FormItem className="flex items-center gap-3">
                  <FormControl>
                    <input type="checkbox" checked={field.value} onChange={field.onChange} className="h-4 w-4 accent-blue-600" />
                  </FormControl>
                  <FormLabel className="!mt-0">Usuário ativo</FormLabel>
                </FormItem>
              )} />
              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
                <Button type="submit" disabled={saving}>{saving ? 'Salvando...' : 'Salvar'}</Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleteTarget}
        title="Excluir usuário"
        description={`Tem certeza que deseja excluir "${deleteTarget?.full_name}"?`}
        confirmLabel="Excluir"
        variant="danger"
        loading={saving}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  )
}
