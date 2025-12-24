/**
 * Utilitário para exportação de relatórios de conciliação
 */

import { exportToCSV, exportToPDF } from "@/lib/export-utils"
import { formatCurrency, formatDistance, formatDuration } from "@/lib/kpi-utils"
import { notifySuccess, notifyError } from "@/lib/toast"
import { logError } from "@/lib/logger"

import type { getDiscrepancyStatus } from "./discrepancy-calculator"

export interface InvoiceLine {
  id: string
  route_name?: string
  measured_km: number | null
  invoiced_km: number | null
  measured_time: number | null
  invoiced_time: number | null
  measured_trips: number | null
  invoiced_trips: number | null
  trip_count?: number
  amount: number
  discrepancy: number | null
}

export interface Invoice {
  id: string
  invoice_number?: string
  period_start: string
  period_end: string
  total_amount: number
}

/**
 * Exporta relatório de conciliação no formato especificado
 * @param format Formato de exportação (csv ou pdf)
 * @param invoice Dados da fatura
 * @param invoiceLines Linhas da fatura
 * @param getDiscrepancyStatusFn Função para calcular status de discrepância
 */
export function exportReconciliationReport(
  format: 'csv' | 'pdf',
  invoice: Invoice,
  invoiceLines: InvoiceLine[],
  getDiscrepancyStatusFn: (line: InvoiceLine) => ReturnType<typeof getDiscrepancyStatus>
): void {
  if (!invoice || !invoiceLines.length) {
    notifyError('Nenhum dado disponível para exportar')
    return
  }

  try {
    const reportData = {
      title: `Relatório de Conciliação - Fatura ${invoice.invoice_number || invoice.id}`,
      description: `Período: ${new Date(invoice.period_start).toLocaleDateString('pt-BR')} - ${new Date(invoice.period_end).toLocaleDateString('pt-BR')}`,
      headers: [
        'Rota',
        'KM Medido',
        'KM Faturado',
        'Tempo Medido',
        'Tempo Faturado',
        'Viagens Medidas',
        'Viagens Faturadas',
        'Valor',
        'Divergência',
        'Status'
      ],
      rows: invoiceLines.map(line => {
        const status = getDiscrepancyStatusFn(line)
        return [
          line.route_name || 'N/A',
          formatDistance(line.measured_km),
          formatDistance(line.invoiced_km),
          formatDuration(line.measured_time || 0),
          formatDuration(line.invoiced_time || 0),
          line.measured_trips?.toString() || '0',
          (line.invoiced_trips || line.trip_count || 0).toString(),
          formatCurrency(line.amount),
          line.discrepancy ? formatCurrency(line.discrepancy) : 'R$ 0,00',
          status.hasSignificantDiscrepancy ? 'Divergência' : 'OK'
        ]
      })
    }

    const fileName = `conciliacao-${invoice.invoice_number || invoice.id}-${new Date().toISOString().split('T')[0]}.${format}`

    if (format === 'csv') {
      exportToCSV(reportData, fileName)
    } else {
      exportToPDF(reportData, fileName)
    }

    notifySuccess('', {
      i18n: {
        ns: 'common',
        key: 'success.exportGenerated',
        params: { format: format.toUpperCase() }
      }
    })
  } catch (error: any) {
    logError('Erro ao exportar relatório', { error }, 'ExportHandler')
    notifyError('Erro ao exportar', undefined, {
      i18n: { ns: 'common', key: 'errors.export' }
    })
  }
}
