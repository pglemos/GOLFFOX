"use client"

import { getDiscrepancyStatus } from "@/lib/cost-utils/discrepancy-calculator"
import type { InvoiceLine } from "@/hooks/use-reconciliation"

interface DiscrepancySummaryProps {
  invoiceLines: InvoiceLine[]
}

export function DiscrepancySummary({ invoiceLines }: DiscrepancySummaryProps) {
  const totalLines = invoiceLines.length
  const linesWithDiscrepancy = invoiceLines.filter(l =>
    getDiscrepancyStatus(l).hasSignificantDiscrepancy
  ).length
  const linesWithoutDiscrepancy = totalLines - linesWithDiscrepancy

  return (
    <div className="p-4 bg-bg-soft rounded-lg">
      <h4 className="font-semibold mb-2">Resumo de Divergências</h4>
      <div className="grid grid-cols-3 gap-4 text-sm">
        <div>
          <span className="text-ink-muted">Total de linhas: </span>
          <span className="font-semibold">{totalLines}</span>
        </div>
        <div>
          <span className="text-ink-muted">Com divergência: </span>
          <span className="font-semibold text-error">{linesWithDiscrepancy}</span>
        </div>
        <div>
          <span className="text-ink-muted">Sem divergência: </span>
          <span className="font-semibold text-success">{linesWithoutDiscrepancy}</span>
        </div>
      </div>
    </div>
  )
}
