"use client"

import { useState, useEffect, useCallback } from "react"

import { getDiscrepancyStatus } from "@/lib/cost-utils/discrepancy-calculator"
import { logError } from "@/lib/logger"
import { supabase } from "@/lib/supabase"
import { notifyError, notifySuccess } from "@/lib/toast"

export interface InvoiceLine {
  id: string
  invoice_id: string
  route_id: string
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
  notes: string | null
}

export interface Invoice {
  id: string
  invoice_number?: string
  period_start: string
  period_end: string
  total_amount: number
  status: 'pending' | 'em_analise' | 'approved' | 'rejected'
  [key: string]: any
}

export function useReconciliation(invoiceId: string | null, isOpen: boolean) {
  const [loading, setLoading] = useState(true)
  const [invoiceLines, setInvoiceLines] = useState<InvoiceLine[]>([])
  const [invoice, setInvoice] = useState<Invoice | null>(null)
  const [processing, setProcessing] = useState(false)
  const [status, setStatus] = useState<'pending' | 'em_analise' | 'approved' | 'rejected'>('pending')

  const loadInvoiceData = useCallback(async () => {
    if (!invoiceId) return

    try {
      setLoading(true)

      // Buscar fatura
      const { data: invData, error: invError } = await supabase
        .from('gf_invoices')
        .select('id, invoice_number, period_start, period_end, total_amount, status, empresa_id, transportadora_id, notes, approved_at, approved_by, reconciled_by, created_at, updated_at')
        .eq('id', invoiceId)
        .single()

      if (invError) throw invError
      setInvoice(invData as Invoice)
      setStatus((invData as Invoice)?.status || 'pending')

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
      const enrichedLines = (linesData || []).map((line: GfInvoiceLinesRow & { routes: RotasRow | null }) => ({
        ...line,
        route_name: line.routes?.name || 'Rota não identificada',
        invoiced_trips: line.trip_count || line.invoiced_trips
      })) as InvoiceLine[]

      setInvoiceLines(enrichedLines)
    } catch (error: unknown) {
      logError('Erro ao carregar dados da fatura', { error }, 'UseReconciliation')
      notifyError(error, 'Erro inesperado')
    } finally {
      setLoading(false)
    }
  }, [invoiceId])

  useEffect(() => {
    if (isOpen && invoiceId) {
      loadInvoiceData()
    }
  }, [isOpen, invoiceId, loadInvoiceData])

  const hasSignificantDiscrepancies = invoiceLines.some(line => {
    const status = getDiscrepancyStatus(line)
    return status.hasSignificantDiscrepancy
  })

  const handleApprove = useCallback(async (
    onSuccess?: () => void,
    onClose?: () => void
  ) => {
    if (!invoiceId) return

    setProcessing(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) throw new Error('Usuário não autenticado')

      // Verificar se há divergências significativas
      const hasSignificant = invoiceLines.some(line => {
        const status = getDiscrepancyStatus(line)
        return status.hasSignificantDiscrepancy
      })

      if (hasSignificant) {
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
      onSuccess?.()
      onClose?.()
    } catch (error: unknown) {
      logError('Erro ao aprovar fatura', { error }, 'UseReconciliation')
      notifyError(error, 'Erro inesperado')
    } finally {
      setProcessing(false)
    }
  }, [invoiceId, invoiceLines])

  const handleReject = useCallback(async (
    onSuccess?: () => void,
    onClose?: () => void
  ) => {
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
      onSuccess?.()
      onClose?.()
    } catch (error: unknown) {
      logError('Erro ao rejeitar fatura', { error }, 'UseReconciliation')
      notifyError(error, 'Erro inesperado')
    } finally {
      setProcessing(false)
    }
  }, [invoiceId])

  const handleRequestRevision = useCallback(async (onClose?: () => void) => {
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
      onClose?.()
    } catch (error: unknown) {
      logError('Erro ao solicitar revisão', { error }, 'UseReconciliation')
      notifyError(error, 'Erro ao solicitar revisão')
    } finally {
      setProcessing(false)
    }
  }, [invoiceId])

  return {
    loading,
    invoiceLines,
    invoice,
    processing,
    setProcessing,
    status,
    setStatus,
    hasSignificantDiscrepancies,
    reload: loadInvoiceData,
    handleApprove,
    handleReject,
    handleRequestRevision,
  }
}
