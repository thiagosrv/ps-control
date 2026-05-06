import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { Save, Download, Upload } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { settingsSchema, type SettingsFormValues } from '@/lib/validators'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'

export function SettingsPage() {
  const { profile, refetchProfile } = useAuth()
  const [saving, setSaving] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [uploading, setUploading] = useState(false)

  const form = useForm<SettingsFormValues>({
    resolver: zodResolver(settingsSchema),
    values: { company_name: profile?.company_name ?? '' },
  })

  async function onSave(values: SettingsFormValues) {
    setSaving(true)
    const { error } = await supabase
      .from('profiles')
      .update({ company_name: values.company_name })
      .eq('id', profile!.id)
    if (error) toast.error('Erro ao salvar')
    else { toast.success('Configurações salvas'); await refetchProfile() }
    setSaving(false)
  }

  async function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !profile) return
    setUploading(true)
    const ext = file.name.split('.').pop()
    const path = `${profile.id}/logo.${ext}`
    const { error: uploadError } = await supabase.storage
      .from('company-assets')
      .upload(path, file, { upsert: true })
    if (uploadError) { toast.error('Erro ao enviar logo'); setUploading(false); return }
    const { data } = supabase.storage.from('company-assets').getPublicUrl(path)
    await supabase.from('profiles').update({ company_logo_url: data.publicUrl }).eq('id', profile.id)
    await refetchProfile()
    toast.success('Logo atualizada')
    setUploading(false)
  }

  async function handleBackup() {
    setExporting(true)
    try {
      const [deps, users, visitors, vehicles, visits] = await Promise.all([
        supabase.from('departments').select('*'),
        supabase.from('company_users').select('*'),
        supabase.from('visitors').select('*'),
        supabase.from('vehicles').select('*'),
        supabase.from('visits').select('*'),
      ])

      const backup = {
        exported_at: new Date().toISOString(),
        company: profile?.company_name,
        departments: deps.data,
        company_users: users.data,
        visitors: visitors.data,
        vehicles: vehicles.data,
        visits: visits.data,
      }

      const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `pscontrol-backup-${new Date().toISOString().slice(0, 10)}.json`
      a.click()
      URL.revokeObjectURL(url)
      toast.success('Backup exportado com sucesso')
    } catch {
      toast.error('Erro ao gerar backup')
    }
    setExporting(false)
  }

  return (
    <div>
      <PageHeader title="Configurações" description="Informações do sistema e opções gerais" />

      <div className="space-y-6 max-w-2xl">
        {/* Company info */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Informações da empresa</CardTitle>
            <CardDescription>Nome exibido no sistema e na sidebar</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSave)} className="space-y-4">
                <FormField control={form.control} name="company_name" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome da empresa</FormLabel>
                    <FormControl><Input placeholder="Minha Empresa Ltda." {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <Button type="submit" disabled={saving}>
                  <Save className="h-4 w-4 mr-2" />
                  {saving ? 'Salvando...' : 'Salvar'}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>

        {/* Logo */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Logo da empresa</CardTitle>
            <CardDescription>Exibida na sidebar (PNG, JPG, SVG — máx. 2MB)</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {profile?.company_logo_url && (
              <img src={profile.company_logo_url} alt="Logo" className="h-16 object-contain" />
            )}
            <label className="cursor-pointer">
              <Button variant="outline" asChild disabled={uploading}>
                <span>
                  <Upload className="h-4 w-4 mr-2" />
                  {uploading ? 'Enviando...' : 'Enviar logo'}
                </span>
              </Button>
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp,image/svg+xml"
                className="hidden"
                onChange={handleLogoUpload}
                disabled={uploading}
              />
            </label>
          </CardContent>
        </Card>

        <Separator />

        {/* Backup */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Backup dos dados</CardTitle>
            <CardDescription>Exporta todos os dados em formato JSON</CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" onClick={handleBackup} disabled={exporting}>
              <Download className="h-4 w-4 mr-2" />
              {exporting ? 'Exportando...' : 'Exportar backup (JSON)'}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
