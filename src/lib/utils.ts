import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCPF(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 11)
  return digits
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})$/, '$1-$2')
}

export function unformatCPF(value: string): string {
  return value.replace(/\D/g, '')
}

export function formatPlate(value: string): string {
  return value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 7)
}

export function maskCPF(cpf: string): string {
  if (!cpf) return ''
  const digits = cpf.replace(/\D/g, '')
  if (digits.length !== 11) return cpf
  return `${digits.slice(0, 3)}.***.***.${digits.slice(9)}`
}

export function formatVisitorType(type: string): string {
  const map: Record<string, string> = {
    employee:     'Trabalhador Cadastrado',
    unregistered: 'Trabalhador Não Registrado',
    supplier:     'Entrega / Coleta',
    contractor:   'Prestador',
    other:        'Não Credenciado',
  }
  return map[type] ?? type
}

export function formatVisitStatus(status: string): string {
  return status === 'active' ? 'Em andamento' : 'Encerrada'
}

const DIACRITICS_RE = new RegExp('[̀-ͯ]', 'g')

export function normalizeText(value: string): string {
  return value
    .normalize('NFD')
    .replace(DIACRITICS_RE, '')
    .toLowerCase()
    .trim()
}

const NAME_CONNECTORS = new Set(['da', 'de', 'di', 'do', 'du', 'das', 'dos', 'e'])

export function toTitleCase(value: string, allowLeadingConnector = false): string {
  let isFirstWord = true
  return value
    .toLowerCase()
    .split(/(\s+)/)
    .map((part) => {
      if (!part.trim()) return part
      const first = isFirstWord
      isFirstWord = false
      if (NAME_CONNECTORS.has(part) && (!first || allowLeadingConnector)) return part
      return part.replace(/(^|[-'’])(\p{L})/gu, (_, sep: string, ch: string) => sep + ch.toUpperCase())
    })
    .join('')
}

export function splitFullName(fullName: string): { first: string; last: string } {
  const [first = '', ...rest] = fullName.trim().split(/\s+/)
  return { first, last: rest.join(' ') }
}

export const FUNCOES_OBRA = [
  'Pedreiro',
  'Armador',
  'Carpinteiro',
  'Eletricista',
  'Encanador',
  'Pintor',
  'Servente',
  'Técnico',
  'Engenheiro',
  'Encarregado',
  'Fiscal',
  'Visitante',
]
