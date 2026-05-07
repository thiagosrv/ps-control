import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { AlertCircle, Lock, Mail, ShieldCheck, Clock, FileText } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { loginSchema, type LoginFormValues } from '@/lib/validators'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Toaster } from '@/components/ui/sonner'

const NAVY = 'oklch(0.188 0.075 262)'
const NAVY_DARK = 'oklch(0.13 0.055 262)'
const GOLD = 'oklch(0.838 0.176 86.4)'

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
    <div className="min-h-screen flex" style={{ background: `linear-gradient(160deg, ${NAVY} 0%, ${NAVY_DARK} 100%)` }}>

      {/* ── LADO ESQUERDO — Hero ── */}
      <div className="hidden lg:flex flex-col justify-between w-1/2 p-12 xl:p-16 relative overflow-hidden">

        {/* Círculos decorativos de fundo */}
        <div className="absolute -bottom-32 -left-32 w-96 h-96 rounded-full opacity-10"
          style={{ background: GOLD }} />
        <div className="absolute top-20 -right-20 w-64 h-64 rounded-full opacity-5"
          style={{ background: GOLD }} />

        {/* Logo */}
        <div>
          <div className="inline-flex items-center gap-3 bg-white/10 backdrop-blur-sm rounded-2xl px-5 py-3 mb-16">
            <img
              src="/logo.png"
              alt="PS Control"
              className="h-12 w-auto object-contain"
              onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none' }}
            />
          </div>

          {/* Headline */}
          <h1 className="text-4xl xl:text-5xl font-bold text-white leading-tight mb-4">
            Controle de acesso<br />
            <span style={{ color: GOLD }}>inteligente</span> para<br />
            sua portaria.
          </h1>
          <p className="text-lg leading-relaxed" style={{ color: 'oklch(0.75 0.03 264)' }}>
            Registre visitas, gerencie entradas e saídas e mantenha a segurança do seu condomínio ou empresa em tempo real.
          </p>
        </div>

        {/* Features */}
        <div className="space-y-4 relative z-10">
          {[
            { icon: ShieldCheck, label: 'Controle total de visitantes', desc: 'Cadastro, histórico e blacklist integrados' },
            { icon: Clock,        label: 'Registro em tempo real',       desc: 'Entradas e saídas atualizadas na hora' },
            { icon: FileText,     label: 'Relatórios completos',         desc: 'Exportação em PDF e CSV com filtros' },
          ].map(({ icon: Icon, label, desc }) => (
            <div key={label} className="flex items-start gap-4">
              <div className="flex items-center justify-center h-10 w-10 rounded-xl shrink-0"
                style={{ backgroundColor: `${GOLD}22` }}>
                <Icon className="h-5 w-5" style={{ color: GOLD }} />
              </div>
              <div>
                <p className="text-sm font-semibold text-white">{label}</p>
                <p className="text-xs" style={{ color: 'oklch(0.65 0.03 264)' }}>{desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Rodapé esquerdo */}
        <p className="text-xs" style={{ color: 'oklch(0.45 0.03 264)' }}>
          © PS Control — Proteção &amp; Segurança
        </p>
      </div>

      {/* ── LADO DIREITO — Formulário ── */}
      <div className="flex flex-col items-center justify-center w-full lg:w-1/2 p-6 sm:p-10">

        {/* Logo mobile (só aparece em telas < lg) */}
        <div className="flex lg:hidden items-center gap-3 mb-10">
          <div className="bg-white/10 rounded-xl px-4 py-2.5">
            <img
              src="/logo.png"
              alt="PS Control"
              className="h-10 w-auto object-contain"
              onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none' }}
            />
          </div>
        </div>

        {/* Card */}
        <div className="w-full max-w-md">
          <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
            {/* Barra dourada */}
            <div className="h-1.5 w-full" style={{ background: GOLD }} />

            <div className="p-8 sm:p-10">
              <div className="mb-8">
                <h2 className="text-2xl font-bold mb-1" style={{ color: NAVY }}>
                  Bem-vindo de volta
                </h2>
                <p className="text-sm text-slate-500">
                  Entre com suas credenciais de portaria
                </p>
              </div>

              {error && (
                <Alert variant="destructive" className="mb-6">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-slate-700 font-medium">E-mail</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                            <Input
                              type="email"
                              placeholder="porteiro@empresa.com"
                              autoComplete="username"
                              className="pl-10 h-12 text-sm"
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
                            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                            <Input
                              type="password"
                              placeholder="••••••••"
                              autoComplete="current-password"
                              className="pl-10 h-12 text-sm"
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
                    className="w-full h-12 font-bold text-base mt-2 rounded-xl"
                    disabled={loading}
                  >
                    {loading ? 'Entrando...' : 'Entrar'}
                  </Button>
                </form>
              </Form>
            </div>
          </div>

          {/* Rodapé mobile */}
          <p className="text-center text-xs mt-6 lg:hidden" style={{ color: 'oklch(0.55 0.03 264)' }}>
            © PS Control — Proteção &amp; Segurança
          </p>
        </div>
      </div>

      <Toaster />
    </div>
  )
}
