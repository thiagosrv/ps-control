import { useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { normalizeText } from '@/lib/utils'
import type { Visit, Visitor } from '@/types/app.types'
import type { CredenciadoImportRow } from '@/lib/xlsx'

const VISIT_SELECT = `
  *,
  visitor:visitors(*, empreiteira:empreiteiras(*))
`

export interface ImportSummary {
  updated: number
  created: number
  duplicatesResolved: string[]
}

export function useCredenciadosAdmin() {
  const [entries, setEntries] = useState<Visit[]>([])
  const [loading, setLoading] = useState(true)
  const [searchResults, setSearchResults] = useState<Visitor[]>([])
  const [searching, setSearching] = useState(false)

  const fetchEntries = useCallback(async (dateFrom?: string, dateTo?: string) => {
    setLoading(true)
    let query = supabase
      .from('visits')
      .select(VISIT_SELECT)
      .order('checked_in_at', { ascending: false })

    if (dateFrom) query = query.gte('checked_in_at', dateFrom)
    if (dateTo) query = query.lte('checked_in_at', dateTo + 'T23:59:59')

    const { data } = await query.limit(1000)
    setEntries((data as unknown as Visit[]) ?? [])
    setLoading(false)
  }, [])

  const searchVisitors = useCallback(async (query: string) => {
    const term = query.trim()
    if (!term) {
      setSearchResults([])
      return
    }
    setSearching(true)
    const { data } = await supabase
      .from('visitors')
      .select('*, empreiteira:empreiteiras(*)')
      .ilike('full_name', `%${term}%`)
      .order('full_name')
      .limit(50)
    setSearchResults((data as unknown as Visitor[]) ?? [])
    setSearching(false)
  }, [])

  async function updateVisitorInfo(visitorId: string, values: { full_name?: string; company?: string; funcao?: string }) {
    const { error } = await supabase.from('visitors').update(values).eq('id', visitorId)
    return error
  }

  async function createVisitor(values: { full_name: string; company: string; funcao: string; status: 'autorizado' | 'nao_autorizado' }) {
    const { error } = await supabase.from('visitors').insert(values)
    return error
  }

  async function updateVisitEntry(visitId: string, values: { atividade?: string; authorized_by?: string }) {
    const { error } = await supabase.from('visits').update(values).eq('id', visitId)
    return error
  }

  async function setStatus(visitorId: string, status: 'autorizado' | 'nao_autorizado') {
    const { error } = await supabase.from('visitors').update({ status }).eq('id', visitorId)
    return error
  }

  async function bulkUpsertFromImport(rows: CredenciadoImportRow[]): Promise<ImportSummary> {
    const { data: existing } = await supabase.from('visitors').select('id, full_name')
    const existingList = (existing as { id: string; full_name: string }[]) ?? []

    const byNormalizedName = new Map<string, { id: string; full_name: string }[]>()
    for (const v of existingList) {
      const key = normalizeText(v.full_name)
      const list = byNormalizedName.get(key) ?? []
      list.push(v)
      byNormalizedName.set(key, list)
    }

    const summary: ImportSummary = { updated: 0, created: 0, duplicatesResolved: [] }

    for (const row of rows) {
      const matches = byNormalizedName.get(normalizeText(row.full_name)) ?? []
      if (matches.length >= 1) {
        // Cadastros duplicados do mesmo nome (mesma pessoa que entrou sem CPF em ocasiões diferentes)
        // recebem todos a mesma atualização, em vez de serem pulados.
        for (const match of matches) {
          const { error } = await supabase
            .from('visitors')
            .update({ company: row.company, funcao: row.funcao, status: row.status })
            .eq('id', match.id)
          if (!error) summary.updated++
        }
        if (matches.length > 1) summary.duplicatesResolved.push(row.full_name)
      } else {
        const { error } = await supabase.from('visitors').insert({
          full_name: row.full_name,
          company: row.company,
          funcao: row.funcao,
          status: row.status,
        })
        if (!error) summary.created++
      }
    }

    return summary
  }

  return {
    entries,
    loading,
    fetchEntries,
    searchResults,
    searching,
    searchVisitors,
    updateVisitorInfo,
    updateVisitEntry,
    setStatus,
    createVisitor,
    bulkUpsertFromImport,
  }
}

export type { Visitor }
