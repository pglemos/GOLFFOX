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
  Route as RouteIcon,
  Download
} from "lucide-react"
import { supabase } from "@/lib/supabase"
import toast from "react-hot-toast"
import { formatCurrency, formatDistance, formatDuration } from "@/lib/kpi-utils"
import { auditLogs } from "@/lib/audit-log"
import { exportToCSV, exportToPDF } from "@/lib/export-utils"

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
  const [status, setStatus] = useState<'pending' | 'em_analise' | 'approved' | 'rejected'>('pending')

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
      setStatus(invData.status || 'pending')

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

      // Verificar se há divergências significativas
      const hasSignificantDiscrepancies = invoiceLines.some(line => {
        const status = getDiscrepancyStatus(line)
        return status.hasSignificantDiscrepancy
      })

      if (hasSignificantDiscrepancies) {
        const confirmApprove = confirm(
          'Esta fatura possui divergências significativas (>5% ou >R$100). Deseja realmente aprovar?'
        )
        if (!confirmApprove) {
          setProcessing(false)
          return
        }
      }

      const { error } = await supabase
        .from('gf_invoices')
        .update({
          status: 'approved',
          approved_at: new Date().toISOString(),
          approved_by: session.user.id,
          reconciled_by: session.user.id,
          updated_at: new Date().toISOString()
        })
        .eq('id', invoiceId)

      if (error) throw error

      setStatus('approved')

      // Log de auditoria
      await auditLogs.approve('invoice', invoiceId, {
        companyId: invoice?.empresa_id || invoice?.carrier_id,
        invoiceNumber: invoice?.invoice_number,
        totalAmount: invoice?.total_amount,
        hasDiscrepancies: hasSignificantDiscrepancies
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
          approved_by: session.user.id,
          reconciled_by: session.user.id,
          updated_at: new Date().toISOString()
        })
        .eq('id', invoiceId)

      if (error) throw error

      setStatus('rejected')

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
          status: 'em_analise',
          notes: `Revisão solicitada por ${session.user.email} em ${new Date().toLocaleString('pt-BR')}`,
          updated_at: new Date().toISOString()
        })
        .eq('id', invoiceId)

      if (error) throw error

      setStatus('em_analise')

      // Log de auditoria
      await auditLogs.update('invoice', invoiceId, {
        action: 'request_revision',
        companyId: invoice?.empresa_id || invoice?.carrier_id,
        invoiceNumber: invoice?.invoice_number
      })

      toast.success('Revisão solicitada')
      onClose()
    } catch (error: any) {
      console.error('Erro ao solicitar revisão:', error)
      toast.error(`Erro: ${error.message}`)
    } finally {
      setProcessing(false)
    }
  }

  const handleExport = (format: 'csv' | 'pdf') => {
    if (!invoice || !invoiceLines.length) {
      toast.error('Nenhum dado disponível para exportar')
      return
    }

    try {
      const reportData = {
        title: `Relatório de Conciliação - Fatura ${invoice.invoice_number || invoiceId}`,
        description: `Período: ${new Date(invoice.period_start).toLocaleDateString('pt-BR')} - ${new Date(invoice.period_end).toLocaleDateString('pt-BR')}`,
        headers: ['Rota', 'KM Medido', 'KM Faturado', 'Tempo Medido', 'Tempo Faturado', 'Viagens Medidas', 'Viagens Faturadas', 'Valor', 'Divergência', 'Status'],
        rows: invoiceLines.map(line => {
          const status = getDiscrepancyStatus(line)
          return [
            line.route_name || 'N/A',
            formatDistance(line.measured_km),
            formatDistance(line.invoiced_km),
            formatDuration(line.measured_time),
            formatDuration(line.invoiced_time),
            line.measured_trips?.toString() || '0',
            line.invoiced_trips?.toString() || '0',
            formatCurrency(line.amount),
            line.discrepancy ? formatCurrency(line.discrepancy) : 'R$ 0,00',
            status.hasSignificantDiscrepancy ? 'Divergência' : 'OK'
          ]
        })
      }

      if (format === 'csv') {
        exportToCSV(reportData, `conciliacao-${invoice.invoice_number || invoiceId}-${new Date().toISOString().split('T')[0]}.csv`)
      } else {
        exportToPDF(reportData, `conciliacao-${invoice.invoice_number || invoiceId}-${new Date().toISOString().split('T')[0]}.pdf`)
      }

      toast.success(`Relatório exportado em ${format.toUpperCase()}!`)
    } catch (error: any) {
      console.error('Erro ao exportar relatório:', error)
      toast.error(`Erro ao exportar: ${error.message}`)
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
              <Badge 
                variant={
                  invoice.status === 'approved' ? 'default' : 
                  invoice.status === 'rejected' ? 'destructive' : 
                  'secondary'
                }
              >
                {invoice.status === 'pending' ? 'Pendente' :
                 invoice.status === 'em_analise' ? 'Em Análise' :
                 invoice.status === 'approved' ? 'Aprovado' :
                 invoice.status === 'rejected' ? 'Rejeitado' :
                 invoice.status}
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
                  <Badge 
                    variant={
                      invoice.status === 'approved' ? 'default' : 
                      invoice.status === 'rejected' ? 'destructive' : 
                      'secondary'
                    }
                  >
                    {invoice.status === 'pending' ? 'Pendente' :
                     invoice.status === 'em_analise' ? 'Em Análise' :
                     invoice.status === 'approved' ? 'Aprovado' :
                     invoice.status === 'rejected' ? 'Rejeitado' :
                     invoice.status}
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

        <DialogFooter className="flex gap-2 flex-wrap">
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={() => handleExport('csv')}
              disabled={processing || loading}
              className="flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              Exportar CSV
            </Button>
            <Button 
              variant="outline" 
              onClick={() => handleExport('pdf')}
              disabled={processing || loading}
              className="flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              Exportar PDF
            </Button>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose} disabled={processing}>
              Fechar
            </Button>
            {status === 'pending' && (
              <Button 
                variant="outline" 
                onClick={handleRequestRevision}
                disabled={processing}
              >
                Em Análise
              </Button>
            )}
            {status === 'em_analise' && (
              <>
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
              </>
            )}
            {status === 'pending' && (
              <>
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
              </>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

