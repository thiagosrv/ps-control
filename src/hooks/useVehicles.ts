import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import type { Vehicle } from '@/types/app.types'
import type { VehicleFormValues } from '@/lib/validators'

export function useVehicles() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [loading, setLoading] = useState(true)

  const fetch = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase
      .from('vehicles')
      .select('*')
      .order('plate')
    setVehicles((data as Vehicle[]) ?? [])
    setLoading(false)
  }, [])

  useEffect(() => { fetch() }, [fetch])

  async function create(values: VehicleFormValues) {
    const { error } = await supabase.from('vehicles').insert({
      plate: values.plate.toUpperCase(),
      owner_name: values.owner_name,
      company: values.company || null,
      notes: values.notes || null,
    })
    if (!error) await fetch()
    return error
  }

  async function update(id: string, values: VehicleFormValues) {
    const { error } = await supabase.from('vehicles').update({
      plate: values.plate.toUpperCase(),
      owner_name: values.owner_name,
      company: values.company || null,
      notes: values.notes || null,
    }).eq('id', id)
    if (!error) await fetch()
    return error
  }

  async function remove(id: string) {
    const { error } = await supabase.from('vehicles').delete().eq('id', id)
    if (!error) await fetch()
    return error
  }

  async function findByPlate(plate: string): Promise<Vehicle | null> {
    const { data } = await supabase
      .from('vehicles')
      .select('*')
      .ilike('plate', plate.toUpperCase())
      .single()
    return (data as unknown as Vehicle) ?? null
  }

  return { vehicles, loading, create, update, remove, findByPlate, refetch: fetch }
}
