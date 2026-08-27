import * as XLSX from 'xlsx'

export interface CredenciadoImportRow {
  full_name: string
  company: string | null
  funcao: string | null
  status: 'autorizado' | 'nao_autorizado'
}

export async function parseCredenciadosXLSX(file: File): Promise<CredenciadoImportRow[]> {
  const buffer = await file.arrayBuffer()
  const workbook = XLSX.read(buffer, { type: 'array' })
  const sheet = workbook.Sheets[workbook.SheetNames[0]]
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: '' })

  return rows
    .map((row) => {
      const nome = String(row['Nome'] ?? '').trim()
      const empresa = String(row['Empresa'] ?? '').trim()
      const funcao = String(row['Função'] ?? '').trim()
      const statusText = String(row['Status (Habilitado)'] ?? '').trim().toLowerCase()
      return {
        full_name: nome,
        company: empresa || null,
        funcao: funcao || null,
        status: statusText === 'habilitado' ? 'autorizado' as const : 'nao_autorizado' as const,
      }
    })
    .filter((row) => row.full_name.length > 0)
}

export function downloadCredenciadosTemplate() {
  const worksheet = XLSX.utils.aoa_to_sheet([
    ['Nome', 'Empresa', 'Função', 'Status (Habilitado)'],
    ['Renato Da Silva', 'UX Construções', 'Pedreiro', 'Habilitado'],
  ])
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Credenciados')
  XLSX.writeFile(workbook, 'modelo-credenciados.xlsx')
}
