import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { Plus, Pencil, Trash2, HardHat } from 'lucide-react'
import { useDepartments } from '@/hooks/useDepartments'
import { departmentSchema, type DepartmentFormValues } from '@/lib/validators'
import { PageHeader } from '@/components/layout/PageHeader'
import { DataTable, type Column } from '@/components/shared/DataTable'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import type { Department } from '@/types/app.types'

export function DepartmentsPage() {
  const { departments, loading, create, update, remove } = useDepartments()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<Department | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Department | null>(null)
  const [saving, setSaving] = useState(false)

  const form = useForm<DepartmentFormValues>({
    resolver: zodResolver(departmentSchema),
    defaultValues: { name: '', description: '' },
  })

  function openCreate() {
    setEditing(null)
    form.reset({ name: '', description: '' })
    setDialogOpen(true)
  }

  function openEdit(dept: Department) {
    setEditing(dept)
    form.reset({ name: dept.name, description: dept.description ?? '' })
    setDialogOpen(true)
  }

  async function onSubmit(values: DepartmentFormValues) {
    setSaving(true)
    const error = editing
      ? await update(editing.id, values)
      : await create(values)
    if (error) {
      toast.error('Erro ao salvar: ' + (error as { message?: string }).message)
    } else {
      toast.success(editing ? 'Frente atualizada' : 'Frente criada')
      setDialogOpen(false)
    }
    setSaving(false)
  }

  async function handleDelete() {
    if (!deleteTarget) return
    setSaving(true)
    const error = await remove(deleteTarget.id)
    if (error) {
      toast.error('Erro ao excluir: ' + (error as { message?: string }).message)
    } else {
      toast.success('Frente excluída')
    }
    setDeleteTarget(null)
    setSaving(false)
  }

  const columns: Column<Record<string, unknown>>[] = [
    { key: 'name', label: 'Nome' },
    { key: 'description', label: 'Descrição', render: (row) => (row.description as string) || '—' },
    {
      key: 'actions',
      label: '',
      className: 'w-24 text-right',
      render: (row) => (
        <div className="flex justify-end gap-1">
          <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); openEdit(row as unknown as Department) }}>
            <Pencil className="h-3.5 w-3.5" />
          </Button>
          <Button size="sm" variant="ghost" className="text-red-500 hover:text-red-700" onClick={(e) => { e.stopPropagation(); setDeleteTarget(row as unknown as Department) }}>
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      ),
    },
  ]

  return (
    <div>
      <PageHeader
        title="Frentes de Obra"
        description="Setores e frentes de trabalho da obra"
        action={
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4 mr-2" />
            Nova Frente
          </Button>
        }
      />

      <DataTable
        data={departments as unknown as Record<string, unknown>[]}
        columns={columns}
        loading={loading}
        keyField="id"
      />

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <HardHat className="h-5 w-5" />
              {editing ? 'Editar Frente' : 'Nova Frente de Obra'}
            </DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField control={form.control} name="name" render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome *</FormLabel>
                  <FormControl><Input placeholder="Ex: Estrutura, Hidráulica, Elétrica..." {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="description" render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrição</FormLabel>
                  <FormControl><Input placeholder="Descrição opcional" {...field} /></FormControl>
                  <FormMessage />
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
        title="Excluir frente de obra"
        description={`Tem certeza que deseja excluir "${deleteTarget?.name}"?`}
        confirmLabel="Excluir"
        variant="danger"
        loading={saving}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  )
}

export { DepartmentsPage as FrentesPage }
