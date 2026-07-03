import Papa from 'papaparse'
import { format } from 'date-fns'
import { formatCPF, formatVisitorType } from './utils'
import type { Visit } from '@/types/app.types'

export function generateVisitsCSV(visits: Visit[]) {
  const rows = visits.map((v) => {
    const empresa = v.visitor?.empreiteira?.razao_social ?? v.visitor?.company ?? ''
    return {
      Nome: v.visitor?.full_name ?? '',
      Tipo: formatVisitorType(v.visitor_type ?? ''),
      CPF: v.visitor?.cpf ? formatCPF(v.visitor.cpf) : '',
      RG: v.visitor?.rg ?? '',
      Função: v.visitor?.funcao ?? '',
      Empresa: empresa,
      Responsável: v.company_user?.full_name ?? '',
      'Frente de Obra': v.company_user?.department?.name ?? '',
      'Atividade / Motivo': v.atividade ?? v.purpose ?? '',
      EPI_Verificado: v.epi_verificado ? 'Sim' : 'Não',
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
