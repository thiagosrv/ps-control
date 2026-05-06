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

  async function search(query: string): Promise<CompanyUser[]> {
    if (query.length < 3) return []
    const { data } = await supabase
      .from('company_users')
      .select('*, department:departments(id, name, description, created_at)')
      .ilike('full_name', `%${query}%`)
      .eq('active', true)
      .order('full_name')
      .limit(10)
    return (data as CompanyUser[]) ?? []
  }

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

  return { companyUsers, loading, search, create, update, remove, refetch: fetch }
}
