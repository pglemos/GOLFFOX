"use client"

import { Badge } from "@/components/ui/badge"
import { formatCurrency } from "@/lib/kpi-utils"
import type { Invoice } from "@/hooks/use-reconciliation"

interface InvoiceSummaryProps {
  invoice: Invoice
  invoiceLinesCount: number
}

export function InvoiceSummary({ invoice, invoiceLinesCount }: InvoiceSummaryProps) {
  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'approved':
        return 'default'
      case 'rejected':
        return 'destructive'
      default:
        return 'secondary'
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending':
        return 'Pendente'
      case 'em_analise':
        return 'Em Análise'
      case 'approved':
        return 'Aprovado'
      case 'rejected':
        return 'Rejeitado'
      default:
        return status
    }
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 p-3 sm:p-4 bg-bg-soft rounded-lg">
      <div>
        <p className="text-sm text-ink-muted">Período</p>
        <p className="font-semibold">
          {new Date(invoice.period_start).toLocaleDateString('pt-BR')} -{' '}
          {new Date(invoice.period_end).toLocaleDateString('pt-BR')}
        </p>
      </div>
      <div>
        <p className="text-sm text-ink-muted">Total</p>
        <p className="font-semibold text-lg">{formatCurrency(invoice.total_amount)}</p>
      </div>
      <div>
        <p className="text-sm text-ink-muted">Status</p>
        <Badge variant={getStatusVariant(invoice.status)}>
          {getStatusLabel(invoice.status)}
        </Badge>
      </div>
      <div>
        <p className="text-sm text-ink-muted">Linhas</p>
        <p className="font-semibold">{invoiceLinesCount}</p>
      </div>
    </div>
  )
}
