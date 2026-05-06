import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { startOfDay, startOfMonth } from 'date-fns'
import type { DashboardStats } from '@/types/app.types'

interface HourlyEntry { hour: number; count: number }
interface WeeklyEntry { day: string; count: number }

export function useDashboardStats() {
  const [stats, setStats] = useState<DashboardStats>({ activeVisits: 0, todayEntries: 0, supplierEntries: 0, monthTotal: 0 })
  const [hourlyData, setHourlyData] = useState<HourlyEntry[]>([])
  const [weeklyData, setWeeklyData] = useState<WeeklyEntry[]>([])
  const [recentVisits, setRecentVisits] = useState<unknown[]>([])
  const [loading, setLoading] = useState(true)

  const fetch = useCallback(async () => {
    setLoading(true)
    const todayStart = startOfDay(new Date()).toISOString()
    const monthStart = startOfMonth(new Date()).toISOString()
    const todayDate = new Date().toISOString().slice(0, 10)

    const [activeRes, todayRes, supplierRes, monthRes, recentRes, hourlyRes, weeklyRes] =
      await Promise.all([
        supabase.from('visits').select('id', { count: 'exact', head: true }).eq('status', 'active'),
        supabase.from('visits').select('id', { count: 'exact', head: true }).gte('checked_in_at', todayStart),
        supabase.from('visits').select('id', { count: 'exact', head: true }).gte('checked_in_at', todayStart).eq('visitor_type', 'supplier'),
        supabase.from('visits').select('id', { count: 'exact', head: true }).gte('checked_in_at', monthStart),
        supabase.from('visits').select('*, visitor:visitors(full_name, cpf), company_user:company_users(full_name, ramal)').order('checked_in_at', { ascending: false }).limit(10),
        supabase.rpc('get_hourly_entries', { p_day: todayDate }),
        supabase.rpc('get_weekly_entries'),
      ])

    setStats({
      activeVisits: activeRes.count ?? 0,
      todayEntries: todayRes.count ?? 0,
      supplierEntries: supplierRes.count ?? 0,
      monthTotal: monthRes.count ?? 0,
    })
    setRecentVisits(recentRes.data ?? [])
    setHourlyData((hourlyRes.data as unknown as HourlyEntry[]) ?? [])
    setWeeklyData((weeklyRes.data as unknown as WeeklyEntry[]) ?? [])
    setLoading(false)
  }, [])

  useEffect(() => { fetch() }, [fetch])

  return { stats, hourlyData, weeklyData, recentVisits, loading, refetch: fetch }
}
