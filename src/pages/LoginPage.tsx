import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { AlertCircle, Lock, User, ShieldCheck, Clock, FileText } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { loginSchema, type LoginFormValues } from '@/lib/validators'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Toaster } from '@/components/ui/sonner'

const NAVY = 'oklch(0.188 0.075 262)'
const GOLD  = 'oklch(0.838 0.176 86.4)'

export function LoginPage() {
  const { signIn } = useAuth()
  const navigate = useNavigate()
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { username: '', password: '' },
  })

  async function onSubmit(values: LoginFormValues) {
    setError('')
    setLoading(true)
    const { error } = await signIn(values.username, values.password)
    if (error) {
      setError('Usuário ou senha incorretos. Tente novamente.')
    } else {
      navigate('/')
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex">

      {/* ══════════════════════════════════
          ESQUERDA — Fundo branco / Hero
      ══════════════════════════════════ */}
      <div className="hidden lg:flex flex-col justify-between w-1/2 bg-white p-14 xl:p-20 relative overflow-hidden">

        {/* Textura pontilhada sutil */}
        <div
          className="absolute inset-0 opacity-[0.025]"
          style={{
            backgroundImage: `radial-gradient(${NAVY} 1px, transparent 1px)`,
            backgroundSize: '24px 24px',
          }}
        />

        {/* Círculo decorativo canto inferior */}
        <div
          className="absolute -bottom-48 -left-48 w-[520px] h-[520px] rounded-full opacity-[0.06]"
          style={{ background: NAVY }}
        />

        <div className="relative z-10">
          {/* Logo */}
          <img
            src="/logo.png"
            alt="PS Control"
            className="h-48 w-auto object-contain mb-14"
            onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none' }}
          />

          {/* Headline */}
          <h1 className="text-4xl xl:text-5xl font-extrabold leading-[1.15] mb-5" style={{ color: NAVY }}>
            Controle de acesso<br />
            <span style={{ color: GOLD }}>inteligente</span><br />
            para sua portaria.
          </h1>
          <p className="text-base leading-relaxed text-slate-400 max-w-sm">
            Registre visitas, gerencie entradas e saídas e mantenha a segurança do seu condomínio em tempo real.
          </p>
        </div>

        {/* Features */}
        <div className="relative z-10 space-y-5">
          {[
            { icon: ShieldCheck, label: 'Controle total de visitantes', desc: 'Cadastro, histórico e blacklist integrados' },
            { icon: Clock,        label: 'Atualizações em tempo real',   desc: 'Entradas e saídas sem precisar recarregar' },
            { icon: FileText,     label: 'Relatórios completos',         desc: 'Exportação em PDF e CSV com filtros avançados' },
          ].map(({ icon: Icon, label, desc }) => (
            <div key={label} className="flex items-center gap-4">
              <div
                className="flex items-center justify-center h-10 w-10 rounded-xl shrink-0"
                style={{ backgroundColor: `${GOLD}22` }}
              >
                <Icon className="h-5 w-5" style={{ color: GOLD }} />
              </div>
              <div>
                <p className="text-sm font-semibold" style={{ color: NAVY }}>{label}</p>
                <p className="text-xs text-slate-400">{desc}</p>
              </div>
            </div>
          ))}
        </div>

        <p className="relative z-10 text-xs text-slate-300">
          © {new Date().getFullYear()} PS Control — Proteção &amp; Segurança
        </p>
      </div>

      {/* ══════════════════════════════════
          DIREITA — Fundo navy / Login
      ══════════════════════════════════ */}
      <div
        className="flex flex-col items-center justify-center w-full lg:w-1/2 p-6 sm:p-10 relative overflow-hidden"
        style={{ backgroundColor: NAVY }}
      >
        {/* Textura pontilhada sutil no navy */}
        <div
          className="absolute inset-0 opacity-[0.06]"
          style={{
            backgroundImage: `radial-gradient(rgba(255,255,255,0.8) 1px, transparent 1px)`,
            backgroundSize: '28px 28px',
          }}
        />

        {/* Círculo decorativo dourado difuso */}
        <div
          className="absolute -top-40 -right-40 w-96 h-96 rounded-full opacity-10 blur-3xl"
          style={{ background: GOLD }}
        />
        <div
          className="absolute -bottom-32 -left-32 w-72 h-72 rounded-full opacity-10 blur-3xl"
          style={{ background: GOLD }}
        />

        {/* Logo mobile */}
        <div className="flex lg:hidden mb-10 relative z-10">
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl px-6 py-4">
            <img
              src="/logo.png"
              alt="PS Control"
              className="h-20 w-auto object-contain"
              onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none' }}
            />
          </div>
        </div>

        {/* ── Card glass ── */}
        <div className="w-full max-w-md relative z-10">
          <div
            className="rounded-3xl overflow-hidden"
            style={{
              background: 'rgba(255, 255, 255, 0.07)',
              backdropFilter: 'blur(24px)',
              WebkitBackdropFilter: 'blur(24px)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              boxShadow: '0 32px 64px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.1)',
            }}
          >
            {/* Barra dourada topo */}
            <div className="h-1 w-full" style={{ background: GOLD }} />

            <div className="p-8 sm:p-10">
              {/* Cabeçalho */}
              <div className="mb-8">
                <p className="text-xs font-semibold tracking-[0.2em] uppercase mb-2" style={{ color: GOLD }}>
                  Portaria
                </p>
                <h2 className="text-2xl font-bold text-white">
                  Acesso ao sistema
                </h2>
                <p className="text-sm mt-1" style={{ color: 'rgba(255,255,255,0.45)' }}>
                  Entre com suas credenciais
                </p>
              </div>

              {error && (
                <Alert variant="destructive" className="mb-6 border-red-500/30 bg-red-500/10 text-red-300">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                  <FormField
                    control={form.control}
                    name="username"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium" style={{ color: 'rgba(255,255,255,0.7)' }}>
                          Usuário
                        </FormLabel>
                        <FormControl>
                          <div className="relative">
                            <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: 'rgba(255,255,255,0.35)' }} />
                            <Input
                              type="text"
                              placeholder="seu usuário"
                              autoComplete="username"
                              autoCapitalize="none"
                              spellCheck={false}
                              className="pl-10 h-12 text-sm text-white placeholder:text-white/30"
                              style={{
                                background: 'rgba(255,255,255,0.08)',
                                border: '1px solid rgba(255,255,255,0.12)',
                              }}
                              {...field}
                            />
                          </div>
                        </FormControl>
                        <FormMessage className="text-red-400" />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium" style={{ color: 'rgba(255,255,255,0.7)' }}>
                          Senha
                        </FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: 'rgba(255,255,255,0.35)' }} />
                            <Input
                              type="password"
                              placeholder="••••••••"
                              autoComplete="current-password"
                              className="pl-10 h-12 text-sm text-white placeholder:text-white/30"
                              style={{
                                background: 'rgba(255,255,255,0.08)',
                                border: '1px solid rgba(255,255,255,0.12)',
                              }}
                              {...field}
                            />
                          </div>
                        </FormControl>
                        <FormMessage className="text-red-400" />
                      </FormItem>
                    )}
                  />

                  <Button
                    type="submit"
                    className="w-full h-12 font-bold text-base rounded-xl mt-2 border-0"
                    style={{
                      background: GOLD,
                      color: NAVY,
                      boxShadow: `0 4px 24px ${GOLD}55`,
                    }}
                    disabled={loading}
                  >
                    {loading ? 'Entrando...' : 'Entrar'}
                  </Button>
                </form>
              </Form>
            </div>
          </div>

          <p className="text-center text-xs mt-6" style={{ color: 'rgba(255,255,255,0.2)' }}>
            © {new Date().getFullYear()} PS Control — Proteção &amp; Segurança
          </p>
        </div>
      </div>

      <Toaster />
    </div>
  )
}
