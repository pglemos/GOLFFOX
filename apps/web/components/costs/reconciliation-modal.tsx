"use client"

import { useState, useEffect } from "react"
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
  Route as RouteIcon,
  Download
} from "lucide-react"
import { supabase } from "@/lib/supabase"
import { notifySuccess, notifyError } from "@/lib/toast"
import { formatCurrency, formatDistance, formatDuration } from "@/lib/kpi-utils"
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
  trip_count?: number
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
      setStatus((invData as any).status || 'pending')

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
        route_name: line.routes?.name || 'Rota não identificada',
        invoiced_trips: line.trip_count || line.invoiced_trips
      }))

      setInvoiceLines(enrichedLines)
    } catch (error: any) {
      console.error('Erro ao carregar dados da fatura:', error)
      notifyError(error, 'Erro inesperado')
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

      notifySuccess('', { i18n: { ns: 'operador', key: 'reconciliation.approved' } })
      onApprove?.()
      onClose()
    } catch (error: any) {
      console.error('Erro ao aprovar fatura:', error)
      notifyError(error, 'Erro inesperado')
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

      notifySuccess('', { i18n: { ns: 'operador', key: 'reconciliation.rejected' } })
      onReject?.()
      onClose()
    } catch (error: any) {
      console.error('Erro ao rejeitar fatura:', error)
      notifyError(error, 'Erro inesperado')
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

      notifySuccess('Revisão solicitada')
      onClose()
    } catch (error: any) {
      console.error('Erro ao solicitar revisão:', error)
      notifyError(error, 'Erro ao solicitar revisão')
    } finally {
      setProcessing(false)
    }
  }

  const handleExport = (format: 'csv' | 'pdf') => {
    if (!invoice || !invoiceLines.length) {
      notifyError('Nenhum dado disponível para exportar')
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

      if (format === 'csv') {
        exportToCSV(reportData, `conciliacao-${invoice.invoice_number || invoiceId}-${new Date().toISOString().split('T')[0]}.csv`)
      } else {
        exportToPDF(reportData, `conciliacao-${invoice.invoice_number || invoiceId}-${new Date().toISOString().split('T')[0]}.pdf`)
      }

      notifySuccess('', { i18n: { ns: 'common', key: 'success.exportGenerated', params: { format: format.toUpperCase() } } })
    } catch (error: any) {
      console.error('Erro ao exportar relatório:', error)
      notifyError('Erro ao exportar', undefined, { i18n: { ns: 'common', key: 'errors.export' } })
    }
  }

  if (!invoiceId) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[95vw] sm:w-[90vw] max-w-5xl max-h-[90vh] overflow-y-auto p-4 sm:p-6 mx-auto">
        <DialogHeader className="pb-4 sm:pb-6">
          <DialogTitle className="text-xl sm:text-2xl font-bold flex items-center gap-2 break-words">
            <FileText className="h-5 w-5 text-brand flex-shrink-0" />
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
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand mx-auto"></div>
            <p className="mt-4 text-ink-muted">Carregando dados...</p>
          </div>
        ) : (
          <div className="space-y-4 sm:space-y-6 py-2 sm:py-4">
            {/* Resumo da Fatura */}
            {invoice && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 p-3 sm:p-4 bg-bg-soft rounded-lg">
                <div>
                  <p className="text-sm text-ink-muted">Período</p>
                  <p className="font-semibold">
                    {new Date(invoice.period_start).toLocaleDateString('pt-BR')} - {new Date(invoice.period_end).toLocaleDateString('pt-BR')}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-ink-muted">Total</p>
                  <p className="font-semibold text-lg">{formatCurrency(invoice.total_amount)}</p>
                </div>
                <div>
                  <p className="text-sm text-ink-muted">Status</p>
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
                  <p className="text-sm text-ink-muted">Linhas</p>
                  <p className="font-semibold">{invoiceLines.length}</p>
                </div>
              </div>
            )}

            {/* Tabela de Conciliação */}
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
                <tbody className="divide-y divide-gray-200">
                  {invoiceLines.map((line) => {
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
                  })}
                </tbody>
              </table>
            </div>

            {/* Resumo de Divergências */}
            <div className="p-4 bg-bg-soft rounded-lg">
              <h4 className="font-semibold mb-2">Resumo de Divergências</h4>
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="text-ink-muted">Total de linhas: </span>
                  <span className="font-semibold">{invoiceLines.length}</span>
                </div>
                <div>
                  <span className="text-ink-muted">Com divergência: </span>
                  <span className="font-semibold text-error">
                    {invoiceLines.filter(l => getDiscrepancyStatus(l).hasSignificantDiscrepancy).length}
                  </span>
                </div>
                <div>
                  <span className="text-ink-muted">Sem divergência: </span>
                  <span className="font-semibold text-success">
                    {invoiceLines.filter(l => !getDiscrepancyStatus(l).hasSignificantDiscrepancy).length}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        <DialogFooter className="flex flex-col sm:flex-row gap-3 pt-4 sm:pt-6 border-t mt-4 sm:mt-6">
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <Button 
              variant="outline" 
              onClick={() => handleExport('csv')}
              disabled={processing || loading}
              className="flex items-center justify-center gap-2 min-h-[44px] text-xs sm:text-sm w-full sm:w-auto"
            >
              <Download className="h-4 w-4 flex-shrink-0" />
              <span className="hidden sm:inline">Exportar CSV</span>
              <span className="sm:hidden">CSV</span>
            </Button>
            <Button 
              variant="outline" 
              onClick={() => handleExport('pdf')}
              disabled={processing || loading}
              className="flex items-center justify-center gap-2 min-h-[44px] text-xs sm:text-sm w-full sm:w-auto"
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
              className="min-h-[44px] text-base font-medium w-full sm:w-auto"
            >
              Fechar
            </Button>
            {status === 'pending' && (
              <>
                <Button 
                  variant="outline" 
                  onClick={handleRequestRevision}
                  disabled={processing}
                  className="min-h-[44px] text-xs sm:text-sm w-full sm:w-auto"
                >
                  <span className="hidden sm:inline">Solicitar Revisão</span>
                  <span className="sm:hidden">Revisão</span>
                </Button>
                <Button 
                  variant="outline" 
                  onClick={handleReject}
                  disabled={processing}
                  className="text-error hover:text-error min-h-[44px] text-xs sm:text-sm w-full sm:w-auto"
                >
                  <XCircle className="h-4 w-4 mr-2 flex-shrink-0" />
                  Rejeitar
                </Button>
                <Button 
                  onClick={handleApprove}
                  disabled={processing}
                  className="bg-success hover:bg-green-700 min-h-[44px] text-xs sm:text-sm w-full sm:w-auto"
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
                  onClick={handleReject}
                  disabled={processing}
                  className="text-error hover:text-error min-h-[44px] text-xs sm:text-sm w-full sm:w-auto"
                >
                  <XCircle className="h-4 w-4 mr-2 flex-shrink-0" />
                  Rejeitar
                </Button>
                <Button 
                  onClick={handleApprove}
                  disabled={processing}
                  className="bg-success hover:bg-green-700 min-h-[44px] text-xs sm:text-sm w-full sm:w-auto"
                >
                  <CheckCircle className="h-4 w-4 mr-2 flex-shrink-0" />
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
