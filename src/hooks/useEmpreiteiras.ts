import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import type { Empreiteira } from '@/types/app.types'

export function useEmpreiteiras() {
  const [empreiteiras, setEmpreiteiras] = useState<Empreiteira[]>([])
  const [loading, setLoading] = useState(true)

  const fetch = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase
      .from('empreiteiras')
      .select('*')
      .order('razao_social')
    setEmpreiteiras((data as Empreiteira[]) ?? [])
    setLoading(false)
  }, [])

  useEffect(() => { fetch() }, [fetch])

  async function create(values: { razao_social: string; cnpj?: string; contato?: string; active: boolean }) {
    const { error } = await supabase.from('empreiteiras').insert(values)
    if (!error) await fetch()
    return error
  }

  async function update(id: string, values: { razao_social?: string; cnpj?: string; contato?: string; active?: boolean }) {
    const { error } = await supabase.from('empreiteiras').update(values).eq('id', id)
    if (!error) await fetch()
    return error
  }

  async function remove(id: string) {
    const { error } = await supabase.from('empreiteiras').delete().eq('id', id)
    if (!error) await fetch()
    return error
  }

  return { empreiteiras, loading, create, update, remove, refetch: fetch }
}
