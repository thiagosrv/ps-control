import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { Plus, Pencil, Trash2, Building2 } from 'lucide-react'
import { useEmpreiteiras } from '@/hooks/useEmpreiteiras'
import { empreiteiraSchema, type EmpreiteiraFormValues } from '@/lib/validators'
import { PageHeader } from '@/components/layout/PageHeader'
import { DataTable, type Column } from '@/components/shared/DataTable'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import type { Empreiteira } from '@/types/app.types'

export function EmpreiteirasPage() {
  const { empreiteiras, loading, create, update, remove } = useEmpreiteiras()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<Empreiteira | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Empreiteira | null>(null)
  const [saving, setSaving] = useState(false)

  const form = useForm<EmpreiteiraFormValues>({
    resolver: zodResolver(empreiteiraSchema),
    defaultValues: { razao_social: '', cnpj: '', contato: '', active: true },
  })

  function openCreate() {
    setEditing(null)
    form.reset({ razao_social: '', cnpj: '', contato: '', active: true })
    setDialogOpen(true)
  }

  function openEdit(emp: Empreiteira) {
    setEditing(emp)
    form.reset({
      razao_social: emp.razao_social,
      cnpj: emp.cnpj ?? '',
      contato: emp.contato ?? '',
      active: emp.active,
    })
    setDialogOpen(true)
  }

  async function onSubmit(values: EmpreiteiraFormValues) {
    setSaving(true)
    const error = editing
      ? await update(editing.id, values)
      : await create(values)
    if (error) {
      toast.error('Erro ao salvar: ' + (error as { message?: string }).message)
    } else {
      toast.success(editing ? 'Empreiteira atualizada' : 'Empreiteira cadastrada')
      setDialogOpen(false)
    }
    setSaving(false)
  }

  async function handleDelete() {
    if (!deleteTarget) return
    setSaving(true)
    const error = await remove(deleteTarget.id)
    if (error) toast.error('Erro ao excluir: ' + (error as { message?: string }).message)
    else toast.success('Empreiteira excluída')
    setDeleteTarget(null)
    setSaving(false)
  }

  const columns: Column<Record<string, unknown>>[] = [
    { key: 'razao_social', label: 'Razão Social' },
    { key: 'cnpj', label: 'CNPJ', render: (row) => (row.cnpj as string) || '—' },
    { key: 'contato', label: 'Contato', render: (row) => (row.contato as string) || '—' },
    {
      key: 'active',
      label: 'Status',
      render: (row) => (
        <Badge variant={row.active ? 'default' : 'secondary'}>
          {row.active ? 'Ativa' : 'Inativa'}
        </Badge>
      ),
    },
    {
      key: 'actions',
      label: '',
      className: 'w-24 text-right',
      render: (row) => (
        <div className="flex justify-end gap-1">
          <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); openEdit(row as unknown as Empreiteira) }}>
            <Pencil className="h-3.5 w-3.5" />
          </Button>
          <Button size="sm" variant="ghost" className="text-red-500 hover:text-red-700" onClick={(e) => { e.stopPropagation(); setDeleteTarget(row as unknown as Empreiteira) }}>
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      ),
    },
  ]

  return (
    <div>
      <PageHeader
        title="Empreiteiras"
        description="Empresas e subcontratadas que atuam na obra"
        action={
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4 mr-2" />
            Nova Empreiteira
          </Button>
        }
      />

      <DataTable
        data={empreiteiras as unknown as Record<string, unknown>[]}
        columns={columns}
        loading={loading}
        keyField="id"
      />

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              {editing ? 'Editar Empreiteira' : 'Nova Empreiteira'}
            </DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField control={form.control} name="razao_social" render={({ field }) => (
                <FormItem>
                  <FormLabel>Razão Social *</FormLabel>
                  <FormControl><Input placeholder="Ex: Construtora Silva Ltda" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="cnpj" render={({ field }) => (
                  <FormItem>
                    <FormLabel>CNPJ</FormLabel>
                    <FormControl><Input placeholder="00.000.000/0001-00" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="contato" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Contato</FormLabel>
                    <FormControl><Input placeholder="(00) 00000-0000" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>
              <FormField control={form.control} name="active" render={({ field }) => (
                <FormItem className="flex items-center gap-3">
                  <FormControl>
                    <input type="checkbox" checked={field.value} onChange={field.onChange} className="h-4 w-4 accent-blue-600" />
                  </FormControl>
                  <FormLabel className="!mt-0">Empreiteira ativa</FormLabel>
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
        title="Excluir empreiteira"
        description={`Tem certeza que deseja excluir "${deleteTarget?.razao_social}"?`}
        confirmLabel="Excluir"
        variant="danger"
        loading={saving}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  )
}
