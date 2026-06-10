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
    employee: 'Encarregado',
    supplier: 'Fornecedor',
    contractor: 'Prestador',
    other: 'Visitante',
  }
  return map[type] ?? type
}

export function formatVisitStatus(status: string): string {
  return status === 'active' ? 'Em andamento' : 'Encerrada'
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
