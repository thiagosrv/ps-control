import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import type { Department } from '@/types/app.types'

export function useDepartments() {
  const [departments, setDepartments] = useState<Department[]>([])
  const [loading, setLoading] = useState(true)

  const fetch = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase
      .from('departments')
      .select('*')
      .order('name')
    setDepartments((data as Department[]) ?? [])
    setLoading(false)
  }, [])

  useEffect(() => { fetch() }, [fetch])

  async function create(values: { name: string; description?: string }) {
    const { error } = await supabase.from('departments').insert(values)
    if (!error) await fetch()
    return error
  }

  async function update(id: string, values: { name: string; description?: string }) {
    const { error } = await supabase.from('departments').update(values).eq('id', id)
    if (!error) await fetch()
    return error
  }

  async function remove(id: string) {
    const { error } = await supabase.from('departments').delete().eq('id', id)
    if (!error) await fetch()
    return error
  }

  return { departments, loading, create, update, remove, refetch: fetch }
}
