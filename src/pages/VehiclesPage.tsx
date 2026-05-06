import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { Plus, Pencil, Trash2, Car } from 'lucide-react'
import { useVehicles } from '@/hooks/useVehicles'
import { vehicleSchema, type VehicleFormValues } from '@/lib/validators'
import { PageHeader } from '@/components/layout/PageHeader'
import { DataTable, type Column } from '@/components/shared/DataTable'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import type { Vehicle } from '@/types/app.types'

export function VehiclesPage() {
  const { vehicles, loading, create, update, remove } = useVehicles()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<Vehicle | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Vehicle | null>(null)
  const [saving, setSaving] = useState(false)
  const [search, setSearch] = useState('')

  const form = useForm<VehicleFormValues>({
    resolver: zodResolver(vehicleSchema),
    defaultValues: { plate: '', owner_name: '', company: '', notes: '' },
  })

  function openCreate() {
    setEditing(null)
    form.reset({ plate: '', owner_name: '', company: '', notes: '' })
    setDialogOpen(true)
  }

  function openEdit(v: Vehicle) {
    setEditing(v)
    form.reset({ plate: v.plate, owner_name: v.owner_name, company: v.company ?? '', notes: v.notes ?? '' })
    setDialogOpen(true)
  }

  async function onSubmit(values: VehicleFormValues) {
    setSaving(true)
    const error = editing ? await update(editing.id, values) : await create(values)
    if (error) toast.error('Erro ao salvar')
    else { toast.success(editing ? 'Veículo atualizado' : 'Veículo cadastrado'); setDialogOpen(false) }
    setSaving(false)
  }

  async function handleDelete() {
    if (!deleteTarget) return
    setSaving(true)
    const error = await remove(deleteTarget.id)
    if (error) toast.error('Erro ao excluir')
    else toast.success('Veículo excluído')
    setDeleteTarget(null)
    setSaving(false)
  }

  const filtered = search
    ? vehicles.filter((v) =>
        v.plate.includes(search.toUpperCase()) ||
        v.owner_name.toLowerCase().includes(search.toLowerCase()) ||
        (v.company ?? '').toLowerCase().includes(search.toLowerCase()))
    : vehicles

  const columns: Column<Record<string, unknown>>[] = [
    { key: 'plate', label: 'Placa', render: (row) => <span className="font-mono font-semibold">{row.plate as string}</span> },
    { key: 'owner_name', label: 'Proprietário' },
    { key: 'company', label: 'Empresa', render: (row) => (row.company as string) || '—' },
    { key: 'notes', label: 'Observações', render: (row) => (row.notes as string) || '—' },
    {
      key: 'actions',
      label: '',
      className: 'w-24 text-right',
      render: (row) => (
        <div className="flex justify-end gap-1">
          <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); openEdit(row as unknown as Vehicle) }}>
            <Pencil className="h-3.5 w-3.5" />
          </Button>
          <Button size="sm" variant="ghost" className="text-red-500 hover:text-red-700" onClick={(e) => { e.stopPropagation(); setDeleteTarget(row as unknown as Vehicle) }}>
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      ),
    },
  ]

  return (
    <div>
      <PageHeader
        title="Veículos"
        description="Placas de veículos frequentes"
        action={
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4 mr-2" />
            Novo Veículo
          </Button>
        }
      />

      <div className="mb-4">
        <Input
          placeholder="Buscar por placa, proprietário ou empresa..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-sm"
        />
      </div>

      <DataTable data={filtered as unknown as Record<string, unknown>[]} columns={columns} loading={loading} keyField="id" />

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Car className="h-5 w-5" />
              {editing ? 'Editar Veículo' : 'Novo Veículo'}
            </DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField control={form.control} name="plate" render={({ field }) => (
                <FormItem>
                  <FormLabel>Placa *</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="ABC1D23"
                      {...field}
                      onChange={(e) => field.onChange(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 7))}
                      className="font-mono"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="owner_name" render={({ field }) => (
                <FormItem>
                  <FormLabel>Proprietário *</FormLabel>
                  <FormControl><Input placeholder="Nome do proprietário" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="company" render={({ field }) => (
                <FormItem>
                  <FormLabel>Empresa</FormLabel>
                  <FormControl><Input placeholder="Empresa (opcional)" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="notes" render={({ field }) => (
                <FormItem>
                  <FormLabel>Observações</FormLabel>
                  <FormControl><Input placeholder="Observações opcionais" {...field} /></FormControl>
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
        title="Excluir veículo"
        description={`Excluir a placa "${deleteTarget?.plate}"?`}
        confirmLabel="Excluir"
        variant="danger"
        loading={saving}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  )
}
