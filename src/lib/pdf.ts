import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { formatCPF } from './utils'
import type { Visit } from '@/types/app.types'

export function generateVisitsPDF(visits: Visit[], companyName: string) {
  const doc = new jsPDF({ orientation: 'landscape' })

  // Cabeçalho
  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.text(companyName || 'PS Control', 14, 14)

  doc.setFontSize(12)
  doc.text('Obra - Paulistão Mococa - SP', 14, 21)

  doc.setFontSize(8)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(100, 100, 100)
  doc.text('Av. João Batista Lima Figueiredo, 497 - Jardim Santa Cecilia, Mococa - SP, 13730-005', 14, 27)

  doc.setFontSize(8)
  doc.text('Relatório de Movimentação de Obra', 14, 33)
  doc.text(
    `Gerado em: ${format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}`,
    14,
    38,
  )
  doc.setTextColor(0, 0, 0)

  autoTable(doc, {
    startY: 46,
    head: [
      ['Nome', 'Documento', 'Função', 'Empresa', 'Responsável', 'Atividade / Motivo', 'EPI', 'Entrada', 'Saída', 'Placa', 'Status'],
    ],
    body: visits.map((v) => {
      const empresa = v.visitor?.empreiteira?.razao_social ?? v.visitor?.company ?? ''
      return [
        v.visitor?.full_name ?? '',
        v.visitor?.cpf ? formatCPF(v.visitor.cpf) : (v.visitor?.rg ?? ''),
        v.visitor?.funcao ?? '',
        empresa,
        v.company_user?.full_name ?? '',
        v.atividade ?? v.purpose ?? '',
        v.epi_verificado ? 'Sim' : '—',
        format(new Date(v.checked_in_at), 'dd/MM/yyyy HH:mm'),
        v.checked_out_at
          ? format(new Date(v.checked_out_at), 'dd/MM/yyyy HH:mm')
          : 'Em andamento',
        v.vehicle_plate ?? '',
        v.status === 'active' ? 'Em andamento' : 'Encerrada',
      ]
    }),
    styles: { fontSize: 7.5 },
    headStyles: { fillColor: [22, 32, 80] },
    alternateRowStyles: { fillColor: [241, 245, 249] },
    didDrawPage: (data) => {
      const pageCount = (doc as jsPDF & { internal: { getNumberOfPages: () => number } })
        .internal.getNumberOfPages()
      doc.setFontSize(8)
      doc.text(
        `Página ${data.pageNumber} de ${pageCount}`,
        doc.internal.pageSize.getWidth() - 30,
        doc.internal.pageSize.getHeight() - 8,
      )
    },
  })

  doc.save(`relatorio-obra-${format(new Date(), 'yyyy-MM-dd')}.pdf`)
}
