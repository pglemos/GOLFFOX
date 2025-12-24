/**
 * Utilitários para exportação de relatórios (PDF, Excel, CSV)
 */

export interface ReportData {
  headers: string[]
  rows: (string | number | boolean | null)[][]
  title: string
  description?: string
}

// Formatar número para separador decimal BR (vírgula)
function formatNumberBR(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return ''
  const num = typeof value === 'number' ? value : parseFloat(value)
  if (isNaN(num)) return String(value)
  // Formatar com vírgula como separador decimal
  return num.toFixed(2).replace('.', ',')
}

// Exportar para CSV com encoding UTF-8 e separador decimal BR
export function exportToCSV(data: ReportData, filename: string = 'relatorio.csv') {
  const csvContent = [
    data.title,
    data.description || '',
    '',
    data.headers.join(','),
    ...data.rows.map(row => row.map(cell => {
      // Formatar números com vírgula decimal
      let cellStr: string
      if (typeof cell === 'number') {
        cellStr = formatNumberBR(cell)
      } else {
        cellStr = String(cell || '')
        // Tentar converter strings numéricas
        const numMatch = cellStr.match(/^(\d+\.?\d*)$/)
        if (numMatch) {
          cellStr = formatNumberBR(parseFloat(cellStr))
        }
      }

      // Escapar vírgulas e aspas
      if (cellStr.includes(',') || cellStr.includes('"') || cellStr.includes('\n')) {
        return `"${cellStr.replace(/"/g, '""')}"`
      }
      return cellStr
    }).join(','))
  ].join('\n')

  // UTF-8 com BOM para Excel reconhecer corretamente
  const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)

  link.setAttribute('href', url)
  link.setAttribute('download', filename)
  link.style.visibility = 'hidden'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

// Exportar para Excel (formato CSV com extensão .xlsx simulada)
export function exportToExcel(data: ReportData, filename: string = 'relatorio.xlsx') {
  // Por simplicidade, usamos CSV com extensão .xlsx
  // Em produção, seria melhor usar uma biblioteca como xlsx
  exportToCSV(data, filename.replace('.xlsx', '.csv'))
}

// Exportar para PDF (usando window.print ou biblioteca externa)
export function exportToPDF(data: ReportData, filename: string = 'relatorio.pdf') {
  // Criar uma nova janela com o conteúdo formatado
  const printWindow = window.open('', '_blank')
  if (!printWindow) {
    alert('Por favor, permita pop-ups para exportar PDF')
    return
  }

  const htmlContent = `
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
      <meta charset="UTF-8">
      <title>${data.title}</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          padding: 20px;
        }
        h1 {
          color: #F97316;
          margin-bottom: 10px;
        }
        .description {
          color: #666;
          margin-bottom: 20px;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 20px;
        }
        th {
          background-color: #F97316;
          color: white;
          padding: 12px;
          text-align: left;
          font-weight: bold;
        }
        td {
          padding: 10px;
          border-bottom: 1px solid #ddd;
        }
        tr:nth-child(even) {
          background-color: #f9f9f9;
        }
        @media print {
          body { margin: 0; }
        }
      </style>
    </head>
    <body>
      <h1>${data.title}</h1>
      ${data.description ? `<p class="description">${data.description}</p>` : ''}
      <table>
        <thead>
          <tr>
            ${data.headers.map(h => `<th>${h}</th>`).join('')}
          </tr>
        </thead>
        <tbody>
          ${data.rows.map(row => `
            <tr>
              ${row.map(cell => `<td>${String(cell || '')}</td>`).join('')}
            </tr>
          `).join('')}
        </tbody>
      </table>
      <p style="margin-top: 20px; color: #666; font-size: 12px;">
        Gerado em ${new Date().toLocaleString('pt-BR')}
      </p>
    </body>
    </html>
  `

  printWindow.document.write(htmlContent)
  printWindow.document.close()

  // Aguardar carregamento e imprimir/salvar
  printWindow.onload = () => {
    setTimeout(() => {
      printWindow.print()
    }, 250)
  }
}

// Formatar dados de relatório de atrasos
export function formatDelaysReport(rows: Record<string, unknown>[]): ReportData {
  return {
    title: 'Relatório de Atrasos',
    description: `Total de ${rows.length} registros de atrasos`,
    headers: ['Data', 'Rota', 'Motorista', 'Horário Agendado', 'Horário Início', 'Atraso (min)', 'Passageiros', 'Status'],
    rows: rows.map(row => [
      new Date(row.scheduled_at).toLocaleDateString('pt-BR'),
      row.route_name || '-',
      row.motorista_name || '-',
      new Date(row.scheduled_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      row.started_at ? new Date(row.started_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : '-',
      row.delay_start_minutes ? `${Math.round(row.delay_start_minutes)}` : '0',
      row.total_passengers || '0',
      row.status || '-'
    ])
  }
}

// Formatar dados de relatório de ocupação
export function formatOccupancyReport(rows: Record<string, unknown>[]): ReportData {
  return {
    title: 'Relatório de Ocupação',
    description: 'Análise de ocupação por rota e horário',
    headers: ['Data', 'Horário', 'Rota', 'Passageiros', 'Capacidade', 'Ocupação (%)'],
    rows: rows.map(row => [
      row.trip_date ? new Date(row.trip_date).toLocaleDateString('pt-BR') : '-',
      row.time_slot || '-',
      row.route_name || '-',
      row.total_passengers || '0',
      row.capacity || '0',
      row.occupancy_rate ? `${row.occupancy_percentage || row.occupancy_rate}%` : '0%' // Fallback compatibilidade
    ])
  }
}

// Formatar dados de relatório de não embarcados
export function formatNotBoardedReport(rows: Record<string, unknown>[]): ReportData {
  return {
    title: 'Relatório de Passageiros Não Embarcados',
    description: `Total de ${rows.length} passageiros não embarcados`,
    headers: ['Data', 'Rota', 'Motorista', 'Passageiro', 'Localização', 'Motivo'],
    rows: rows.map(row => [
      new Date(row.scheduled_at).toLocaleDateString('pt-BR'),
      row.route_name || '-',
      row.motorista_name || '-',
      row.passenger_name || '-',
      row.missed_pickup_location || '-',
      row.reason || '-'
    ])
  }
}

