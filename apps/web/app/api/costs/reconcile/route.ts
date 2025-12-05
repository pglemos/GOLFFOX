import { NextRequest, NextResponse } from 'next/server'
import { supabaseServiceRole } from '@/lib/supabase-server'
import { requireAuth } from '@/lib/api-auth'
import { z } from 'zod'
import { withRateLimit } from '@/lib/rate-limit'

const reconcileSchema = z.object({
  invoice_id: z.string().uuid(),
  route_id: z.string().uuid().optional().nullable(),
  action: z.enum(['approve', 'reject', 'request_revision']),
  notes: z.string().optional().nullable(),
  discrepancy_threshold_percent: z.number().default(5),
  discrepancy_threshold_amount: z.number().default(100)
})

async function reconcileHandler(request: NextRequest) {
  try {
    // ✅ Validar autenticação (operador ou admin)
    const authError = await requireAuth(request, ['operador', 'admin'])
    if (authError) {
      return authError
    }

    const body = await request.json()
    const validated = reconcileSchema.parse(body)

    // Buscar dados de conciliação (view materializada - selecionar todas as colunas)
    const { data: conciliation, error: conciliationError } = await supabaseServiceRole
      .from('v_costs_conciliation')
      .select('*')
      .eq('invoice_id', validated.invoice_id)
      .eq('route_id', validated.route_id || '')
      .single()

    if (conciliationError && validated.route_id) {
      // Tentar sem route_id
      const { data: conciliation2 } = await supabaseServiceRole
        .from('v_costs_conciliation')
        .select('*')
        .eq('invoice_id', validated.invoice_id)
        .limit(1)
        .single()

      if (!conciliation2) {
        return NextResponse.json(
          { error: 'Dados de conciliação não encontrados' },
          { status: 404 }
        )
      }
    }

    const conciliationData = conciliation || await supabaseServiceRole
      .from('v_costs_conciliation')
      .select('*')
      .eq('invoice_id', validated.invoice_id)
      .limit(1)
      .single()
      .then((r: { data: unknown }) => r.data)

    if (!conciliationData) {
      return NextResponse.json(
        { error: 'Dados de conciliação não encontrados' },
        { status: 404 }
      )
    }

    // Verificar se há divergência significativa
    const conciliationDataTyped = conciliationData as any
    const hasSignificantDiscrepancy = 
      Math.abs(conciliationDataTyped.discrepancy_amount || 0) > validated.discrepancy_threshold_amount ||
      (conciliationDataTyped.discrepancy_percent || 0) > validated.discrepancy_threshold_percent

    // Atualizar status da fatura
    let status = 'pending'
    if (validated.action === 'approve') {
      status = 'approved'
    } else if (validated.action === 'reject') {
      status = 'rejected'
    } else if (validated.action === 'request_revision') {
      status = 'pending' // Mantém pendente para revisão
    }

    const updateData: Record<string, unknown> = {
      reconciliation_status: status,
      notes: validated.notes || (conciliationData as any).notes
    }

    if (validated.action === 'approve') {
      updateData.approved_by = request.headers.get('x-user-id') || null
      updateData.approved_at = new Date().toISOString()
    }

    const { data: updatedInvoice, error: updateError } = await supabaseServiceRole
      .from('gf_invoices')
      .update(updateData)
      .eq('id', validated.invoice_id)
      .select()
      .single()

    if (updateError) {
      console.error('Erro ao atualizar fatura:', updateError)
      return NextResponse.json(
        { error: updateError.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: {
        invoice: updatedInvoice,
        conciliation: conciliationData,
        has_significant_discrepancy: hasSignificantDiscrepancy,
        action: validated.action
      }
    })
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: err.errors },
        { status: 400 }
      )
    }
    console.error('Erro ao conciliar custo:', err)
    const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido'
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    )
  }
}

export const POST = withRateLimit(reconcileHandler, 'sensitive')

