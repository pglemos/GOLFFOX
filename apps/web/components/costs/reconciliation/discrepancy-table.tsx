"use client"

import type { InvoiceLine } from "@/hooks/use-reconciliation"

import { DiscrepancyRow } from "./discrepancy-row"

interface DiscrepancyTableProps {
  invoiceLines: InvoiceLine[]
}

export function DiscrepancyTable({ invoiceLines }: DiscrepancyTableProps) {
  return (
    <div className="border rounded-lg overflow-hidden">
      <table className="w-full">
        <thead className="bg-bg-soft">
          <tr>
            <th className="px-4 py-3 text-left text-sm font-semibold">Rota</th>
            <th className="px-4 py-3 text-left text-sm font-semibold">KM</th>
            <th className="px-4 py-3 text-left text-sm font-semibold">Tempo</th>
            <th className="px-4 py-3 text-left text-sm font-semibold">Viagens</th>
            <th className="px-4 py-3 text-left text-sm font-semibold">Valor</th>
            <th className="px-4 py-3 text-left text-sm font-semibold">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border-light">
          {invoiceLines.map((line) => (
            <DiscrepancyRow key={line.id} line={line} />
          ))}
        </tbody>
      </table>
    </div>
  )
}
