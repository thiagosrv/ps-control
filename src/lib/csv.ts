import Papa from 'papaparse'
import { format } from 'date-fns'
import { formatCPF, formatVisitorType } from './utils'
import type { Visit } from '@/types/app.types'

export function generateVisitsCSV(visits: Visit[]) {
  const rows = visits.map((v) => ({
    Visitante: v.visitor?.full_name ?? '',
    CPF: v.visitor?.cpf ? formatCPF(v.visitor.cpf) : '',
    RG: v.visitor?.rg ?? '',
    Telefone: v.visitor?.phone ?? '',
    Visitado: v.company_user?.full_name ?? '',
    Ramal: v.company_user?.ramal ?? '',
    Departamento: v.company_user?.department?.name ?? '',
    Tipo: formatVisitorType(v.visitor_type),
    Motivo: v.purpose ?? '',
    Entrada: format(new Date(v.checked_in_at), 'dd/MM/yyyy HH:mm'),
    Saída: v.checked_out_at ? format(new Date(v.checked_out_at), 'dd/MM/yyyy HH:mm') : '',
    Placa: v.vehicle_plate ?? '',
    Situação: v.status === 'active' ? 'Em andamento' : 'Encerrada',
  }))

  const csv = Papa.unparse(rows, { delimiter: ';' })
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `relatorio-visitas-${format(new Date(), 'yyyy-MM-dd')}.csv`
  a.click()
  URL.revokeObjectURL(url)
}
