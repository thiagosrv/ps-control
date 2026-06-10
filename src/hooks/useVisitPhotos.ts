import { useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import type { VisitPhoto } from '@/types/app.types'

export function useVisitPhotos() {
  const uploadPhoto = useCallback(async (
    visitId: string,
    file: File,
    tipo: 'entrada' | 'saida',
  ): Promise<{ url: string | null; error: Error | null }> => {
    const ext = file.name.split('.').pop()?.toLowerCase() ?? 'jpg'
    const path = `${visitId}/${Date.now()}-${tipo}.${ext}`

    const { error: uploadError } = await supabase.storage
      .from('visit-photos')
      .upload(path, file, { upsert: true })

    if (uploadError) return { url: null, error: uploadError as Error }

    const { data } = supabase.storage.from('visit-photos').getPublicUrl(path)

    const { error: dbError } = await supabase.from('visit_photos').insert({
      visit_id: visitId,
      photo_url: data.publicUrl,
      tipo,
    })

    if (dbError) return { url: null, error: dbError as Error }
    return { url: data.publicUrl, error: null }
  }, [])

  const fetchAll = useCallback(async (filters?: {
    date_from?: string
    date_to?: string
    tipo?: 'entrada' | 'saida' | ''
  }): Promise<VisitPhoto[]> => {
    let query = supabase
      .from('visit_photos')
      .select(`
        *,
        visit:visits(
          id, checked_in_at, checked_out_at, status,
          visitor:visitors(full_name, cpf, rg, funcao, empreiteira:empreiteiras(razao_social))
        )
      `)
      .order('created_at', { ascending: false })
      .limit(300)

    if (filters?.tipo) query = query.eq('tipo', filters.tipo)
    if (filters?.date_from) query = query.gte('created_at', filters.date_from)
    if (filters?.date_to) query = query.lte('created_at', filters.date_to + 'T23:59:59')

    const { data } = await query
    return (data as unknown as VisitPhoto[]) ?? []
  }, [])

  return { uploadPhoto, fetchAll }
}
