import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import type { Visit, Visitor } from '@/types/app.types'
import type { VisitFormValues } from '@/lib/validators'
import { unformatCPF } from '@/lib/utils'

const VISIT_SELECT = `
  *,
  visitor:visitors(*),
  company_user:company_users(*, department:departments(id, name, description, created_at))
`

export function useVisits() {
  const [activeVisits, setActiveVisits] = useState<Visit[]>([])
  const [loading, setLoading] = useState(true)

  const fetchActive = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase
      .from('visits')
      .select(VISIT_SELECT)
      .eq('status', 'active')
      .order('checked_in_at', { ascending: false })
    setActiveVisits((data as Visit[]) ?? [])
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchActive()

    const channel = supabase
      .channel('active-visits')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'visits' }, () => {
        fetchActive()
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [fetchActive])

  async function createVisit(values: VisitFormValues, existingVisitorId?: string): Promise<{ error: Error | null }> {
    let visitorId = existingVisitorId

    if (!visitorId) {
      const cpfClean = values.cpf ? unformatCPF(values.cpf) : null

      const insertData = {
        full_name: values.visitor_name,
        cpf: cpfClean || null,
        rg: values.rg || null,
        phone: values.phone || null,
      }

      const { data: visitor, error: visitorError } = await supabase
        .from('visitors')
        .insert(insertData)
        .select()
        .single()

      if (visitorError) return { error: visitorError as Error }
      visitorId = (visitor as Visitor).id
    }

    const { error } = await supabase.from('visits').insert({
      visitor_id: visitorId,
      company_user_id: values.company_user_id || null,
      visitor_type: values.visitor_type,
      purpose: values.purpose || null,
      vehicle_plate: values.vehicle_plate ? values.vehicle_plate.toUpperCase() : null,
      notes: values.notes || null,
      status: 'active',
    })

    return { error: error as Error | null }
  }

  async function endVisit(id: string) {
    const { error } = await supabase
      .from('visits')
      .update({ status: 'completed', checked_out_at: new Date().toISOString() })
      .eq('id', id)
    return error
  }

  async function fetchForReport(filters: {
    name?: string
    cpf?: string
    rg?: string
    plate?: string
    visitor_type?: string
    date_from?: string
    date_to?: string
  }) {
    let query = supabase
      .from('visits')
      .select(VISIT_SELECT)
      .order('checked_in_at', { ascending: false })

    if (filters.plate) query = query.ilike('vehicle_plate', `%${filters.plate}%`)
    if (filters.visitor_type) query = query.eq('visitor_type', filters.visitor_type as Visit['visitor_type'])
    if (filters.date_from) query = query.gte('checked_in_at', filters.date_from)
    if (filters.date_to) query = query.lte('checked_in_at', filters.date_to + 'T23:59:59')

    const { data, error } = await query.limit(500)

    if (error) return { data: [], error }

    let results = (data as Visit[]) ?? []

    if (filters.name) {
      const q = filters.name.toLowerCase()
      results = results.filter((v) => v.visitor?.full_name.toLowerCase().includes(q))
    }
    if (filters.cpf) {
      const q = unformatCPF(filters.cpf)
      results = results.filter((v) => v.visitor?.cpf?.includes(q))
    }
    if (filters.rg) {
      const q = filters.rg.toLowerCase()
      results = results.filter((v) => v.visitor?.rg?.toLowerCase().includes(q))
    }

    return { data: results, error: null }
  }

  return { activeVisits, loading, createVisit, endVisit, fetchForReport, refetch: fetchActive }
}

export function useVisitorSearch() {
  async function searchByPrefix(prefix: string): Promise<Visitor[]> {
    if (prefix.replace(/\D/g, '').length < 5) return []
    const clean = prefix.replace(/\D/g, '')

    const { data } = await supabase
      .from('visitors')
      .select('*')
      .or(`cpf.ilike.${clean}%,rg.ilike.${clean}%`)
      .limit(10)

    return (data as Visitor[]) ?? []
  }

  async function findByCPF(cpf: string): Promise<Visitor | null> {
    const clean = unformatCPF(cpf)
    if (clean.length < 11) return null
    const { data } = await supabase
      .from('visitors')
      .select('*')
      .eq('cpf', clean)
      .single()
    return (data as unknown as Visitor) ?? null
  }

  return { searchByPrefix, findByCPF }
}
