// Traduz erros do Supabase (Postgres/Auth) para mensagens amigáveis em pt-BR.
// Erros não reconhecidos caem no fallback genérico (o original vai pro console, não pro usuário).

const CONSTRAINT_MESSAGES: Record<string, string> = {
  visitors_cpf_key:    'Já existe um cadastro com este CPF.',
  vehicles_plate_key:  'Esta placa já está cadastrada.',
  departments_name_key: 'Já existe um setor com este nome.',
}

const PATTERN_MESSAGES: Array<[RegExp, string]> = [
  [/new password should be different/i, 'A nova senha deve ser diferente da senha atual.'],
  [/password should be at least/i, 'A senha é muito curta.'],
  [/invalid login credentials/i, 'Usuário ou senha inválidos.'],
  [/email not confirmed/i, 'E-mail não confirmado.'],
  [/user already registered/i, 'Este usuário já está cadastrado.'],
  [/rate limit/i, 'Muitas tentativas. Aguarde um instante e tente novamente.'],
  [/failed to fetch|network/i, 'Falha de conexão. Verifique sua internet e tente novamente.'],
]

export function translateError(
  error: unknown,
  fallback = 'Ocorreu um erro inesperado. Tente novamente.',
): string {
  if (!error || typeof error !== 'object') return fallback

  const err = error as { code?: string; message?: string }
  const message = err.message ?? ''

  if (err.code === '23505') {
    for (const [key, text] of Object.entries(CONSTRAINT_MESSAGES)) {
      if (message.includes(key)) return text
    }
    return 'Já existe um registro com esses dados.'
  }

  if (err.code === '23503') return 'Não é possível concluir: este registro está em uso em outro cadastro.'
  if (err.code === '23502') return 'Preencha todos os campos obrigatórios.'

  for (const [pattern, text] of PATTERN_MESSAGES) {
    if (pattern.test(message)) return text
  }

  if (message) console.error('[PS Control] Erro não traduzido:', message)
  return fallback
}
