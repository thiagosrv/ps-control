import Papa from 'papaparse'
import { format } from 'date-fns'
import { formatVisitorType } from './utils'
import type { Visit } from '@/types/app.types'

export function generateVisitsCSV(visits: Visit[]) {
  const rows = visits.map((v) => {
    const empresa = v.visitor?.empreiteira?.razao_social ?? v.visitor?.company ?? ''
    return {
      Nome: v.visitor?.full_name ?? '',
      Tipo: formatVisitorType(v.visitor_type ?? ''),
      Empresa: empresa,
      'Autorizado por': v.authorized_by ?? '',
      'Atividade / Motivo': v.atividade ?? v.purpose ?? '',
      Entrada: format(new Date(v.checked_in_at), 'dd/MM/yyyy HH:mm'),
      Saída: v.checked_out_at ? format(new Date(v.checked_out_at), 'dd/MM/yyyy HH:mm') : '',
      Placa: v.vehicle_plate ?? '',
      Situação: v.status === 'active' ? 'Em andamento' : 'Encerrada',
    }
  })

  const csv = Papa.unparse(rows, { delimiter: ';' })
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `relatorio-obra-${format(new Date(), 'yyyy-MM-dd')}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

export function generateCredenciadosCSV(visits: Visit[]) {
  const rows = visits.map((v) => ({
    'Data/Hora': format(new Date(v.checked_in_at), 'dd/MM/yyyy HH:mm'),
    Nome: v.visitor?.full_name ?? '',
    Empresa: v.visitor?.empreiteira?.razao_social ?? v.visitor?.company ?? '',
    'Motivo da Visita': v.atividade ?? v.purpose ?? '',
    'Autorizado por': v.authorized_by ?? '',
    Status: v.visitor?.status === 'autorizado' ? 'Credenciado' : 'Não Credenciado',
  }))

  const csv = Papa.unparse(rows, { delimiter: ';' })
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `credenciados-${format(new Date(), 'yyyy-MM-dd')}.csv`
  a.click()
  URL.revokeObjectURL(url)
}
