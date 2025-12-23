"use client"

import { Route as RouteIcon, AlertTriangle, CheckCircle } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import type { InvoiceLine } from "@/hooks/use-reconciliation"
import { getDiscrepancyStatus } from "@/lib/cost-utils/discrepancy-calculator"
import { formatCurrency, formatDistance, formatDuration } from "@/lib/kpi-utils"

interface DiscrepancyRowProps {
  line: InvoiceLine
}

export function DiscrepancyRow({ line }: DiscrepancyRowProps) {
  const status = getDiscrepancyStatus(line)

  return (
    <tr
      key={line.id}
      className={status.hasSignificantDiscrepancy ? 'bg-error-light' : ''}
    >
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          <RouteIcon className="h-4 w-4 text-ink-light" />
          <span className="font-medium">{line.route_name}</span>
        </div>
      </td>
      <td className="px-4 py-3">
        <div className="space-y-1">
          <div className="text-sm">
            <span className="text-ink-muted">Medido: </span>
            {formatDistance(line.measured_km)}
          </div>
          <div className="text-sm">
            <span className="text-ink-muted">Faturado: </span>
            {formatDistance(line.invoiced_km)}
          </div>
          {status.kmDiscrepancy.isSignificant && (
            <Badge variant="destructive" className="text-xs">
              {status.kmDiscrepancy.percentage.toFixed(1)}% divergência
            </Badge>
          )}
        </div>
      </td>
      <td className="px-4 py-3">
        <div className="space-y-1">
          <div className="text-sm">
            <span className="text-ink-muted">Medido: </span>
            {formatDuration(line.measured_time || 0)}
          </div>
          <div className="text-sm">
            <span className="text-ink-muted">Faturado: </span>
            {formatDuration(line.invoiced_time || 0)}
          </div>
          {status.timeDiscrepancy.isSignificant && (
            <Badge variant="destructive" className="text-xs">
              {status.timeDiscrepancy.percentage.toFixed(1)}% divergência
            </Badge>
          )}
        </div>
      </td>
      <td className="px-4 py-3">
        <div className="space-y-1">
          <div className="text-sm">
            <span className="text-ink-muted">Medido: </span>
            {line.measured_trips || 0}
          </div>
          <div className="text-sm">
            <span className="text-ink-muted">Faturado: </span>
            {line.invoiced_trips || line.trip_count || 0}
          </div>
          {status.tripsDiscrepancy.isSignificant && (
            <Badge variant="destructive" className="text-xs">
              {status.tripsDiscrepancy.percentage.toFixed(1)}% divergência
            </Badge>
          )}
        </div>
      </td>
      <td className="px-4 py-3">
        <div className="font-semibold">{formatCurrency(line.amount)}</div>
        {line.discrepancy && Math.abs(line.discrepancy) > 0.01 && (
          <div className="text-xs text-ink-muted">
            Diferença: {formatCurrency(line.discrepancy)}
          </div>
        )}
      </td>
      <td className="px-4 py-3">
        {status.hasSignificantDiscrepancy ? (
          <Badge variant="destructive" className="flex items-center gap-1 w-fit">
            <AlertTriangle className="h-3 w-3" />
            Divergência
          </Badge>
        ) : (
          <Badge variant="default" className="flex items-center gap-1 w-fit">
            <CheckCircle className="h-3 w-3" />
            OK
          </Badge>
        )}
      </td>
    </tr>
  )
}
