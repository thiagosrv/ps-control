import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { AlertCircle, Lock, Mail } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { loginSchema, type LoginFormValues } from '@/lib/validators'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Toaster } from '@/components/ui/sonner'

export function LoginPage() {
  const { signIn } = useAuth()
  const navigate = useNavigate()
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  })

  async function onSubmit(values: LoginFormValues) {
    setError('')
    setLoading(true)
    const { error } = await signIn(values.email, values.password)
    if (error) {
      setError('E-mail ou senha incorretos. Tente novamente.')
    } else {
      navigate('/')
    }
    setLoading(false)
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{ background: 'linear-gradient(135deg, oklch(0.17 0.07 262) 0%, oklch(0.13 0.055 262) 100%)' }}
    >
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <img
            src="/logo.png"
            alt="PS Control"
            className="h-24 w-auto mb-4 object-contain"
            style={{ mixBlendMode: 'screen' }}
            onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none' }}
          />
          {/* Fallback se logo não carregar */}
          <div className="text-center">
            <p className="text-xs tracking-[0.25em] uppercase font-medium mt-1"
              style={{ color: 'oklch(0.838 0.176 86.4)' }}>
              Segurança &amp; Controle de Acesso
            </p>
          </div>
        </div>

        {/* Card de login */}
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          {/* Topo colorido */}
          <div className="h-1.5 w-full" style={{ background: 'oklch(0.838 0.176 86.4)' }} />

          <div className="p-8">
            <h2 className="text-xl font-bold mb-1" style={{ color: 'oklch(0.17 0.055 262)' }}>
              Acesso ao sistema
            </h2>
            <p className="text-sm text-slate-500 mb-6">
              Entre com suas credenciais de portaria
            </p>

            {error && (
              <Alert variant="destructive" className="mb-5">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-slate-700 font-medium">E-mail</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                          <Input
                            type="email"
                            placeholder="porteiro@empresa.com"
                            autoComplete="username"
                            className="pl-9 h-11"
                            {...field}
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-slate-700 font-medium">Senha</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                          <Input
                            type="password"
                            placeholder="••••••••"
                            autoComplete="current-password"
                            className="pl-9 h-11"
                            {...field}
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button
                  type="submit"
                  className="w-full h-11 font-bold text-base mt-2"
                  disabled={loading}
                >
                  {loading ? 'Entrando...' : 'Entrar'}
                </Button>
              </form>
            </Form>
          </div>
        </div>

        <p className="text-center text-xs mt-6" style={{ color: 'oklch(0.55 0.03 264)' }}>
          © PS Control — Proteção &amp; Segurança
        </p>
      </div>
      <Toaster />
    </div>
  )
}
