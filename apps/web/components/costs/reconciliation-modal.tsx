"use client"

import { FileText } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { useReconciliation } from "@/hooks/use-reconciliation"

import { DiscrepancySummary } from "./reconciliation/discrepancy-summary"
import { DiscrepancyTable } from "./reconciliation/discrepancy-table"
import { InvoiceSummary } from "./reconciliation/invoice-summary"
import { ModalActions } from "./reconciliation/modal-actions"

interface ReconciliationModalProps {
  invoiceId: string | null
  isOpen: boolean
  onClose: () => void
  onApprove?: () => void
  onReject?: () => void
}

export function ReconciliationModal({
  invoiceId,
  isOpen,
  onClose,
  onApprove,
  onReject,
}: ReconciliationModalProps) {
  const {
    loading,
    invoiceLines,
    invoice,
    processing,
    status,
    handleApprove,
    handleReject,
    handleRequestRevision,
  } = useReconciliation(invoiceId, isOpen)

  if (!invoiceId) return null

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
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[95vw] sm:w-[90vw] max-w-5xl max-h-[90vh] overflow-y-auto p-4 sm:p-6 mx-auto">
        <DialogHeader className="pb-4 sm:pb-6">
          <DialogTitle className="text-xl sm:text-2xl font-bold flex items-center gap-2 break-words">
            <FileText className="h-5 w-5 text-brand flex-shrink-0" />
            Conciliação de Fatura
            {invoice && (
              <Badge variant={getStatusVariant(invoice.status)}>
                {getStatusLabel(invoice.status)}
              </Badge>
            )}
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand mx-auto"></div>
            <p className="mt-4 text-ink-muted">Carregando dados...</p>
          </div>
        ) : (
          <div className="space-y-4 sm:space-y-6 py-2 sm:py-4">
            {invoice && (
              <InvoiceSummary invoice={invoice} invoiceLinesCount={invoiceLines.length} />
            )}

            <DiscrepancyTable invoiceLines={invoiceLines} />

            <DiscrepancySummary invoiceLines={invoiceLines} />
          </div>
        )}

        <DialogFooter className="sm:justify-start">
          <ModalActions
            status={status}
            processing={processing}
            loading={loading}
            invoice={invoice}
            invoiceLines={invoiceLines}
            invoiceId={invoiceId}
            onClose={onClose}
            onApprove={() => handleApprove(onApprove, onClose)}
            onReject={() => handleReject(onReject, onClose)}
            onRequestRevision={() => handleRequestRevision(onClose)}
          />
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}