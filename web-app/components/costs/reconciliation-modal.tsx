"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter 
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  FileText,
  DollarSign,
  Clock,
  Route as RouteIcon
} from "lucide-react"
import { supabase } from "@/lib/supabase"
import toast from "react-hot-toast"
import { formatCurrency, formatDistance, formatDuration } from "@/lib/kpi-utils"
import { auditLogs } from "@/lib/audit-log"

interface InvoiceLine {
  id: string
  invoice_id: string
  route_id: string
  route_name?: string
  measured_km: number | null
  invoiced_km: number | null
  measured_time: number | null // minutos
  invoiced_time: number | null
  measured_trips: number | null
  invoiced_trips: number | null
  amount: number
  discrepancy: number | null
  notes: string | null
}

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
  onReject
}: ReconciliationModalProps) {
  const [loading, setLoading] = useState(true)
  const [invoiceLines, setInvoiceLines] = useState<InvoiceLine[]>([])
  const [invoice, setInvoice] = useState<any>(null)
  const [processing, setProcessing] = useState(false)

  useEffect(() => {
    if (isOpen && invoiceId) {
      loadInvoiceData()
    }
  }, [isOpen, invoiceId])

  const loadInvoiceData = async () => {
    if (!invoiceId) return

    try {
      setLoading(true)

      // Buscar fatura
      const { data: invData, error: invError } = await supabase
        .from('gf_invoices')
        .select('*')
        .eq('id', invoiceId)
        .single()

      if (invError) throw invError
      setInvoice(invData)

      // Buscar linhas da fatura
      const { data: linesData, error: linesError } = await supabase
        .from('gf_invoice_lines')
        .select(`
          *,
          routes (
            name
          )
        `)
        .eq('invoice_id', invoiceId)
        .order('route_id')

      if (linesError) throw linesError

      // Enriquecer com nome da rota
      const enrichedLines = (linesData || []).map((line: any) => ({
        ...line,
        route_name: line.routes?.name || 'Rota não identificada'
      }))

      setInvoiceLines(enrichedLines)
    } catch (error: any) {
      console.error('Erro ao carregar dados da fatura:', error)
      toast.error(`Erro: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  const calculateDiscrepancy = (measured: number | null, invoiced: number | null): {
    percentage: number
    isSignificant: boolean
  } => {
    if (!measured || !invoiced || invoiced === 0) {
      return { percentage: 0, isSignificant: false }
    }

    const diff = Math.abs(measured - invoiced)
    const percentage = (diff / invoiced) * 100

    // Significante se >5% ou >R$100
    const isSignificant = percentage > 5 || diff > 100

    return { percentage, isSignificant }
  }

  const getDiscrepancyStatus = (line: InvoiceLine) => {
    const kmDiscrepancy = calculateDiscrepancy(line.measured_km, line.invoiced_km)
    const timeDiscrepancy = calculateDiscrepancy(line.measured_time, line.invoiced_time)
    const tripsDiscrepancy = calculateDiscrepancy(line.measured_trips, line.invoiced_trips)

    const hasSignificantDiscrepancy = 
      kmDiscrepancy.isSignificant || 
      timeDiscrepancy.isSignificant || 
      tripsDiscrepancy.isSignificant

    return {
      hasSignificantDiscrepancy,
      kmDiscrepancy,
      timeDiscrepancy,
      tripsDiscrepancy
    }
  }

  const handleApprove = async () => {
    if (!invoiceId) return

    setProcessing(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) throw new Error('Usuário não autenticado')

      const { error } = await supabase
        .from('gf_invoices')
        .update({
          status: 'approved',
          approved_at: new Date().toISOString(),
          approved_by: session.user.id
        })
        .eq('id', invoiceId)

      if (error) throw error

      // Log de auditoria
      await auditLogs.approve('invoice', invoiceId, {
        companyId: invoice?.empresa_id || invoice?.carrier_id,
        invoiceNumber: invoice?.invoice_number,
        totalAmount: invoice?.total_amount
      })

      toast.success('Fatura aprovada com sucesso!')
      onApprove?.()
      onClose()
    } catch (error: any) {
      console.error('Erro ao aprovar fatura:', error)
      toast.error(`Erro: ${error.message}`)
    } finally {
      setProcessing(false)
    }
  }

  const handleReject = async () => {
    if (!invoiceId) return

    setProcessing(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) throw new Error('Usuário não autenticado')

      const { error } = await supabase
        .from('gf_invoices')
        .update({
          status: 'rejected',
          approved_at: null,
          approved_by: session.user.id
        })
        .eq('id', invoiceId)

      if (error) throw error

      // Log de auditoria
      await auditLogs.reject('invoice', invoiceId, {
        companyId: invoice?.empresa_id || invoice?.carrier_id,
        invoiceNumber: invoice?.invoice_number,
        totalAmount: invoice?.total_amount
      })

      toast.success('Fatura rejeitada')
      onReject?.()
      onClose()
    } catch (error: any) {
      console.error('Erro ao rejeitar fatura:', error)
      toast.error(`Erro: ${error.message}`)
    } finally {
      setProcessing(false)
    }
  }

  const handleRequestRevision = async () => {
    if (!invoiceId) return

    setProcessing(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) throw new Error('Usuário não autenticado')

      const { error } = await supabase
        .from('gf_invoices')
        .update({
          status: 'pending',
          notes: `Revisão solicitada por ${session.user.email} em ${new Date().toLocaleString('pt-BR')}`
        })
        .eq('id', invoiceId)

      if (error) throw error

      toast.success('Revisão solicitada')
      onClose()
    } catch (error: any) {
      console.error('Erro ao solicitar revisão:', error)
      toast.error(`Erro: ${error.message}`)
    } finally {
      setProcessing(false)
    }
  }

  if (!invoiceId) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-[var(--brand)]" />
            Conciliação de Fatura
            {invoice && (
              <Badge variant={invoice.status === 'approved' ? 'default' : 'secondary'}>
                {invoice.status}
              </Badge>
            )}
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--brand)] mx-auto"></div>
            <p className="mt-4 text-[var(--ink-muted)]">Carregando dados...</p>
          </div>
        ) : (
          <div className="space-y-6 py-4">
            {/* Resumo da Fatura */}
            {invoice && (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-[var(--bg-soft)] rounded-lg">
                <div>
                  <p className="text-sm text-[var(--ink-muted)]">Período</p>
                  <p className="font-semibold">
                    {new Date(invoice.period_start).toLocaleDateString('pt-BR')} - {new Date(invoice.period_end).toLocaleDateString('pt-BR')}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-[var(--ink-muted)]">Total</p>
                  <p className="font-semibold text-lg">{formatCurrency(invoice.total_amount)}</p>
                </div>
                <div>
                  <p className="text-sm text-[var(--ink-muted)]">Status</p>
                  <Badge variant={invoice.status === 'approved' ? 'default' : 'secondary'}>
                    {invoice.status}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-[var(--ink-muted)]">Linhas</p>
                  <p className="font-semibold">{invoiceLines.length}</p>
                </div>
              </div>
            )}

            {/* Tabela de Conciliação */}
            <div className="border rounded-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-[var(--bg-soft)]">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-semibold">Rota</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold">KM</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold">Tempo</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold">Viagens</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold">Valor</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border)]">
                  {invoiceLines.map((line) => {
                    const status = getDiscrepancyStatus(line)
                    return (
                      <tr 
                        key={line.id}
                        className={status.hasSignificantDiscrepancy ? 'bg-red-50' : ''}
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <RouteIcon className="h-4 w-4 text-[var(--ink-muted)]" />
                            <span className="font-medium">{line.route_name}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="space-y-1">
                            <div className="text-sm">
                              <span className="text-[var(--ink-muted)]">Medido: </span>
                              {formatDistance(line.measured_km)}
                            </div>
                            <div className="text-sm">
                              <span className="text-[var(--ink-muted)]">Faturado: </span>
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
                              <span className="text-[var(--ink-muted)]">Medido: </span>
                              {formatDuration(line.measured_time)}
                            </div>
                            <div className="text-sm">
                              <span className="text-[var(--ink-muted)]">Faturado: </span>
                              {formatDuration(line.invoiced_time)}
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
                              <span className="text-[var(--ink-muted)]">Medido: </span>
                              {line.measured_trips || 0}
                            </div>
                            <div className="text-sm">
                              <span className="text-[var(--ink-muted)]">Faturado: </span>
                              {line.invoiced_trips || 0}
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
                            <div className="text-xs text-[var(--ink-muted)]">
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
                  })}
                </tbody>
              </table>
            </div>

            {/* Resumo de Divergências */}
            <div className="p-4 bg-[var(--bg-soft)] rounded-lg">
              <h4 className="font-semibold mb-2">Resumo de Divergências</h4>
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="text-[var(--ink-muted)]">Total de linhas: </span>
                  <span className="font-semibold">{invoiceLines.length}</span>
                </div>
                <div>
                  <span className="text-[var(--ink-muted)]">Com divergência: </span>
                  <span className="font-semibold text-red-600">
                    {invoiceLines.filter(l => getDiscrepancyStatus(l).hasSignificantDiscrepancy).length}
                  </span>
                </div>
                <div>
                  <span className="text-[var(--ink-muted)]">Sem divergência: </span>
                  <span className="font-semibold text-green-600">
                    {invoiceLines.filter(l => !getDiscrepancyStatus(l).hasSignificantDiscrepancy).length}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        <DialogFooter className="flex gap-2">
          <Button variant="outline" onClick={onClose} disabled={processing}>
            Fechar
          </Button>
          <Button 
            variant="outline" 
            onClick={handleRequestRevision}
            disabled={processing}
          >
            Solicitar Revisão
          </Button>
          <Button 
            variant="outline" 
            onClick={handleReject}
            disabled={processing}
            className="text-red-600 hover:text-red-700"
          >
            <XCircle className="h-4 w-4 mr-2" />
            Rejeitar
          </Button>
          <Button 
            onClick={handleApprove}
            disabled={processing}
            className="bg-green-600 hover:bg-green-700"
          >
            <CheckCircle className="h-4 w-4 mr-2" />
            {processing ? 'Processando...' : 'Aprovar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

