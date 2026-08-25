import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import type { CompanyUser } from '@/types/app.types'
import type { CompanyUserFormValues } from '@/lib/validators'

export function useCompanyUsers() {
  const [companyUsers, setCompanyUsers] = useState<CompanyUser[]>([])
  const [loading, setLoading] = useState(true)

  const fetch = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase
      .from('company_users')
      .select('*, department:departments(id, name, description, created_at)')
      .order('full_name')
    setCompanyUsers((data as CompanyUser[]) ?? [])
    setLoading(false)
  }, [])

  useEffect(() => { fetch() }, [fetch])

  const search = useCallback(async (query: string): Promise<CompanyUser[]> => {
    if (query.length < 3) return []
    const { data } = await supabase
      .from('company_users')
      .select('*, department:departments(id, name, description, created_at)')
      .ilike('full_name', `%${query}%`)
      .eq('active', true)
      .order('full_name')
      .limit(10)
    return (data as CompanyUser[]) ?? []
  }, [])

  async function create(values: CompanyUserFormValues) {
    const { error } = await supabase.from('company_users').insert({
      full_name: values.full_name,
      department_id: values.department_id || null,
      ramal: values.ramal || null,
      phone: values.phone || null,
      email: values.email || null,
      active: values.active,
    })
    if (!error) await fetch()
    return error
  }

  async function update(id: string, values: CompanyUserFormValues) {
    const { error } = await supabase.from('company_users').update({
      full_name: values.full_name,
      department_id: values.department_id || null,
      ramal: values.ramal || null,
      phone: values.phone || null,
      email: values.email || null,
      active: values.active,
    }).eq('id', id)
    if (!error) await fetch()
    return error
  }

  async function remove(id: string) {
    const { error } = await supabase.from('company_users').delete().eq('id', id)
    if (!error) await fetch()
    return error
  }

  // Reaproveita um responsável já cadastrado (match por nome) ou cria um novo
  // "rápido" (sem departamento/contato) — mesmo padrão usado para visitantes,
  // permite digitar um nome ou setor novo e ele fica disponível para próximas buscas.
  async function findOrCreate(name: string): Promise<{ id: string | null; error: Error | null }> {
    const clean = name.trim()
    if (!clean) return { id: null, error: null }

    const existing = companyUsers.find((u) => u.full_name.trim().toLowerCase() === clean.toLowerCase())
    if (existing) return { id: existing.id, error: null }

    const { data, error } = await supabase
      .from('company_users')
      .insert({ full_name: clean, active: true })
      .select('id')
      .single()
    if (error) return { id: null, error: error as Error }
    await fetch()
    return { id: (data as { id: string }).id, error: null }
  }

  return { companyUsers, loading, search, create, update, remove, findOrCreate, refetch: fetch }
}
