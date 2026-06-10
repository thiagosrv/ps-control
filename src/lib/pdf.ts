import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { formatCPF } from './utils'
import type { Visit } from '@/types/app.types'

export function generateVisitsPDF(visits: Visit[], companyName: string) {
  const doc = new jsPDF({ orientation: 'landscape' })

  doc.setFontSize(16)
  doc.text(companyName || 'PS Control', 14, 15)
  doc.setFontSize(11)
  doc.text('Relatório de Movimentação de Obra', 14, 22)
  doc.setFontSize(9)
  doc.text(
    `Gerado em: ${format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}`,
    14,
    28,
  )

  autoTable(doc, {
    startY: 35,
    head: [
      ['Trabalhador', 'Documento', 'Função', 'Empreiteira', 'Responsável', 'EPI', 'Atividade', 'Entrada', 'Saída', 'Placa'],
    ],
    body: visits.map((v) => [
      v.visitor?.full_name ?? '',
      v.visitor?.cpf ? formatCPF(v.visitor.cpf) : (v.visitor?.rg ?? ''),
      v.visitor?.funcao ?? '',
      v.visitor?.empreiteira?.razao_social ?? '',
      v.company_user?.full_name ?? '',
      v.epi_verificado ? 'Sim' : 'Não',
      v.atividade ?? v.purpose ?? '',
      format(new Date(v.checked_in_at), 'dd/MM/yyyy HH:mm'),
      v.checked_out_at
        ? format(new Date(v.checked_out_at), 'dd/MM/yyyy HH:mm')
        : 'Em andamento',
      v.vehicle_plate ?? '',
    ]),
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
