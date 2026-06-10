export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type VisitorType = 'employee' | 'supplier' | 'contractor' | 'other'
export type VisitStatus = 'active' | 'completed'

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string | null
          full_name: string | null
          role: 'admin' | 'operator'
          must_change_password: boolean
          company_name: string | null
          company_logo_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email?: string | null
          full_name?: string | null
          role?: 'admin' | 'operator'
          must_change_password?: boolean
          company_name?: string | null
          company_logo_url?: string | null
        }
        Update: {
          id?: string
          email?: string | null
          full_name?: string | null
          role?: 'admin' | 'operator'
          must_change_password?: boolean
          company_name?: string | null
          company_logo_url?: string | null
        }
        Relationships: []
      }
      departments: {
        Row: {
          id: string
          name: string
          description: string | null
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
        }
        Relationships: []
      }
      empreiteiras: {
        Row: {
          id: string
          razao_social: string
          cnpj: string | null
          contato: string | null
          active: boolean
          created_at: string
        }
        Insert: {
          id?: string
          razao_social: string
          cnpj?: string | null
          contato?: string | null
          active?: boolean
        }
        Update: {
          id?: string
          razao_social?: string
          cnpj?: string | null
          contato?: string | null
          active?: boolean
        }
        Relationships: []
      }
      company_users: {
        Row: {
          id: string
          full_name: string
          department_id: string | null
          ramal: string | null
          phone: string | null
          email: string | null
          active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          full_name: string
          department_id?: string | null
          ramal?: string | null
          phone?: string | null
          email?: string | null
          active?: boolean
        }
        Update: {
          id?: string
          full_name?: string
          department_id?: string | null
          ramal?: string | null
          phone?: string | null
          email?: string | null
          active?: boolean
        }
        Relationships: [
          { foreignKeyName: 'company_users_department_id_fkey'; columns: ['department_id']; referencedRelation: 'departments'; referencedColumns: ['id'] }
        ]
      }
      visitors: {
        Row: {
          id: string
          full_name: string
          cpf: string | null
          rg: string | null
          phone: string | null
          company: string | null
          funcao: string | null
          empreiteira_id: string | null
          aso_validade: string | null
          epi_ok: boolean
          blacklisted: boolean
          blacklist_reason: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          full_name: string
          cpf?: string | null
          rg?: string | null
          phone?: string | null
          company?: string | null
          funcao?: string | null
          empreiteira_id?: string | null
          aso_validade?: string | null
          epi_ok?: boolean
          blacklisted?: boolean
          blacklist_reason?: string | null
        }
        Update: {
          id?: string
          full_name?: string
          cpf?: string | null
          rg?: string | null
          phone?: string | null
          company?: string | null
          funcao?: string | null
          empreiteira_id?: string | null
          aso_validade?: string | null
          epi_ok?: boolean
          blacklisted?: boolean
          blacklist_reason?: string | null
        }
        Relationships: [
          { foreignKeyName: 'visitors_empreiteira_id_fkey'; columns: ['empreiteira_id']; referencedRelation: 'empreiteiras'; referencedColumns: ['id'] }
        ]
      }
      vehicles: {
        Row: {
          id: string
          plate: string
          owner_name: string
          company: string | null
          notes: string | null
          created_at: string
        }
        Insert: {
          id?: string
          plate: string
          owner_name: string
          company?: string | null
          notes?: string | null
        }
        Update: {
          id?: string
          plate?: string
          owner_name?: string
          company?: string | null
          notes?: string | null
        }
        Relationships: []
      }
      visits: {
        Row: {
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
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          visitor_id: string
          company_user_id?: string | null
          visitor_type?: VisitorType
          purpose?: string | null
          atividade?: string | null
          epi_verificado?: boolean
          vehicle_plate?: string | null
          status?: VisitStatus
          checked_in_at?: string
          checked_out_at?: string | null
          notes?: string | null
          badge_printed?: boolean
        }
        Update: {
          id?: string
          visitor_id?: string
          company_user_id?: string | null
          visitor_type?: VisitorType
          purpose?: string | null
          atividade?: string | null
          epi_verificado?: boolean
          vehicle_plate?: string | null
          status?: VisitStatus
          checked_in_at?: string
          checked_out_at?: string | null
          notes?: string | null
          badge_printed?: boolean
        }
        Relationships: [
          { foreignKeyName: 'visits_visitor_id_fkey'; columns: ['visitor_id']; referencedRelation: 'visitors'; referencedColumns: ['id'] },
          { foreignKeyName: 'visits_company_user_id_fkey'; columns: ['company_user_id']; referencedRelation: 'company_users'; referencedColumns: ['id'] }
        ]
      }
    }
    Views: Record<string, never>
    Functions: {
      get_hourly_entries: {
        Args: { p_day: string }
        Returns: { hour: number; count: number }[]
      }
      get_weekly_entries: {
        Args: Record<PropertyKey, never>
        Returns: { day: string; count: number }[]
      }
    }
    Enums: Record<string, never>
  }
}
