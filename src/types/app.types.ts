import type { VisitorType, VisitStatus } from './database.types'

export type { VisitorType, VisitStatus }

export interface Profile {
  id: string
  email: string | null
  full_name: string | null
  role: 'admin' | 'operator'
  must_change_password: boolean
  company_name: string | null
  company_logo_url: string | null
}

export interface Department {
  id: string
  name: string
  description: string | null
  created_at: string
}

export interface Empreiteira {
  id: string
  razao_social: string
  cnpj: string | null
  contato: string | null
  active: boolean
  created_at: string
}

export interface CompanyUser {
  id: string
  full_name: string
  department_id: string | null
  ramal: string | null
  phone: string | null
  email: string | null
  active: boolean
  department?: Department
}

export interface Visitor {
  id: string
  full_name: string
  cpf: string | null
  rg: string | null
  phone: string | null
  company: string | null
  funcao: string | null
  empreiteira_id: string | null
  empreiteira?: Empreiteira
  aso_validade: string | null
  epi_ok: boolean
  blacklisted: boolean
  blacklist_reason: string | null
}

export interface Vehicle {
  id: string
  plate: string
  owner_name: string
  company: string | null
  notes: string | null
}

export interface Visit {
  id: string
  visitor_id: string
  company_user_id: string | null
  visitor_type: VisitorType
  purpose: string | null
  atividade: string | null
  epi_verificado: boolean
  vehicle_plate: string | null
  status: VisitStatus
  checked_in_at: string
  checked_out_at: string | null
  notes: string | null
  badge_printed: boolean
  visitor?: Visitor
  company_user?: CompanyUser & { department?: Department }
}

export interface DashboardStats {
  activeVisits: number
  todayEntries: number
  supplierEntries: number
  monthTotal: number
}
