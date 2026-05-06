import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { Lock } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { changePasswordSchema, type ChangePasswordValues } from '@/lib/validators'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

interface Props {
  userId: string
  onSuccess: () => void
}

export function ChangePasswordModal({ userId, onSuccess }: Props) {
  const [saving, setSaving] = useState(false)

  const form = useForm<ChangePasswordValues>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: { password: '', confirm: '' },
  })

  async function onSubmit(values: ChangePasswordValues) {
    setSaving(true)
    const { error: authError } = await supabase.auth.updateUser({ password: values.password })
    if (authError) {
      toast.error('Erro ao alterar senha: ' + authError.message)
      setSaving(false)
      return
    }

    await supabase.from('profiles').update({ must_change_password: false }).eq('id', userId)
    toast.success('Senha alterada com sucesso!')
    onSuccess()
    setSaving(false)
  }

  return (
    <Dialog open modal>
      <DialogContent
        className="sm:max-w-md"
        onInteractOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
        hideCloseButton
      >
        <DialogHeader>
          <div className="flex items-center gap-2 mb-1">
            <Lock className="h-5 w-5 text-blue-600" />
            <DialogTitle>Defina sua senha</DialogTitle>
          </div>
          <DialogDescription>
            Por segurança, você precisa definir uma nova senha antes de continuar.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mt-2">
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nova senha</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="Mínimo 8 caracteres" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="confirm"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Confirmar senha</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="Repita a senha" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full" disabled={saving}>
              {saving ? 'Salvando...' : 'Definir senha e continuar'}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
