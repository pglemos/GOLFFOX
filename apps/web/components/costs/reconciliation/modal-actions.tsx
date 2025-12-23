"use client"

import { Button } from "@/components/ui/button"
import { CheckCircle, XCircle, Download } from "lucide-react"
import { exportReconciliationReport } from "@/lib/cost-utils/export-handler"
import { getDiscrepancyStatus } from "@/lib/cost-utils/discrepancy-calculator"
import type { Invoice, InvoiceLine } from "@/hooks/use-reconciliation"

interface ModalActionsProps {
  status: 'pending' | 'em_analise' | 'approved' | 'rejected'
  processing: boolean
  loading: boolean
  invoice: Invoice | null
  invoiceLines: InvoiceLine[]
  invoiceId: string | null
  onClose: () => void
  onApprove: () => void
  onReject: () => void
  onRequestRevision: () => void
}

export function ModalActions({
  status,
  processing,
  loading,
  invoice,
  invoiceLines,
  invoiceId,
  onClose,
  onApprove,
  onReject,
  onRequestRevision,
}: ModalActionsProps) {
  const handleExport = (format: 'csv' | 'pdf') => {
    if (!invoice || !invoiceId) return
    exportReconciliationReport(format, invoice, invoiceLines, getDiscrepancyStatus)
  }

  return (
    <div className="flex flex-col sm:flex-row gap-3 w-full">
      <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
        <Button
          variant="outline"
          onClick={() => handleExport('csv')}
          disabled={processing || loading}
          size="sm"
          className="flex items-center justify-center gap-2 w-full sm:w-auto"
        >
          <Download className="h-4 w-4 flex-shrink-0" />
          <span className="hidden sm:inline">Exportar CSV</span>
          <span className="sm:hidden">CSV</span>
        </Button>
        <Button
          variant="outline"
          onClick={() => handleExport('pdf')}
          disabled={processing || loading}
          size="sm"
          className="flex items-center justify-center gap-2 w-full sm:w-auto"
        >
          <Download className="h-4 w-4 flex-shrink-0" />
          <span className="hidden sm:inline">Exportar PDF</span>
          <span className="sm:hidden">PDF</span>
        </Button>
      </div>
      <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
        <Button
          variant="outline"
          onClick={onClose}
          disabled={processing}
          className="text-base font-medium w-full sm:w-auto"
        >
          Fechar
        </Button>
        {status === 'pending' && (
          <>
            <Button
              variant="outline"
              onClick={onRequestRevision}
              disabled={processing}
              size="sm"
              className="w-full sm:w-auto"
            >
              <span className="hidden sm:inline">Solicitar Revisão</span>
              <span className="sm:hidden">Revisão</span>
            </Button>
            <Button
              variant="outline"
              onClick={onReject}
              disabled={processing}
              size="sm"
              className="text-error hover:text-error w-full sm:w-auto"
            >
              <XCircle className="h-4 w-4 mr-2 flex-shrink-0" />
              Rejeitar
            </Button>
            <Button
              onClick={onApprove}
              disabled={processing}
              size="sm"
              className="bg-success hover:bg-success w-full sm:w-auto"
            >
              <CheckCircle className="h-4 w-4 mr-2 flex-shrink-0" />
              {processing ? 'Processando...' : 'Aprovar'}
            </Button>
          </>
        )}
        {status === 'em_analise' && (
          <>
            <Button
              variant="outline"
              onClick={onReject}
              disabled={processing}
              size="sm"
              className="text-error hover:text-error w-full sm:w-auto"
            >
              <XCircle className="h-4 w-4 mr-2 flex-shrink-0" />
              Rejeitar
            </Button>
            <Button
              onClick={onApprove}
              disabled={processing}
              size="sm"
              className="bg-success hover:bg-success w-full sm:w-auto"
            >
              <CheckCircle className="h-4 w-4 mr-2 flex-shrink-0" />
              {processing ? 'Processando...' : 'Aprovar'}
            </Button>
          </>
        )}
      </div>
    </div>
  )
}
