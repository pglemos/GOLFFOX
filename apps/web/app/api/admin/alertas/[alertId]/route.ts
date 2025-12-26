import { NextRequest, NextResponse } from 'next/server'

import { requireAuth } from '@/lib/api-auth'
import { logError } from '@/lib/logger'
import { invalidateEntityCache } from '@/lib/next-cache'
import { getSupabaseAdmin } from '@/lib/supabase-client'
import { validateWithSchema, updateAlertSchema, uuidSchema } from '@/lib/validation/schemas'
import { validationErrorResponse } from '@/lib/api-response'

export const runtime = 'nodejs'

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ alertId: string }> }
) {
  const params = await context.params
  const { alertId } = params

  try {
    const authErrorResponse = await requireAuth(request, 'admin')
    if (authErrorResponse) return authErrorResponse

    // Validar ID
    const idValidation = uuidSchema.safeParse(alertId)
    if (!idValidation.success) {
      return validationErrorResponse('ID do alerta inválido')
    }

    const body = await request.json()

    // Validar corpo
    const validation = validateWithSchema(updateAlertSchema, body)
    if (!validation.success) {
      return validationErrorResponse(validation.error)
    }

    const data = validation.data
    const supabaseAdmin = getSupabaseAdmin()

    // Verificar se alerta existe
    const { data: existingAlert, error: fetchError } = await supabaseAdmin
      .from('gf_alerts')
      .select('id')
      .eq('id', alertId)
      .single()

    if (fetchError || !existingAlert) {
      return NextResponse.json(
        { error: 'Alerta não encontrado' },
        { status: 404 }
      )
    }

    // Preparar dados para atualização
    const updateData: Record<string, unknown> = {}

    if (data.message !== undefined) updateData.message = data.message?.trim() || null
    if (data.description !== undefined && data.message === undefined) {
      updateData.message = data.description?.trim() || null
    }

    if (data.title !== undefined) updateData.title = data.title?.trim()
    else if (data.description !== undefined && !updateData.title) {
      updateData.title = data.description?.slice(0, 50) || 'Alerta'
    }

    if (data.severity !== undefined) updateData.severity = data.severity

    // Status mapping
    if (data.status !== undefined) {
      if (data.status === 'resolved') {
        updateData.is_resolved = true
        updateData.resolved_at = new Date().toISOString()
      } else if (data.status === 'open') {
        updateData.is_resolved = false
        updateData.assigned_to = null
        updateData.resolved_at = null
      } else if (data.status === 'assigned') {
        updateData.is_resolved = false
      }
    }

    if (data.assigned_to !== undefined) updateData.assigned_to = data.assigned_to || null
    if (data.resolved_by !== undefined) updateData.resolved_by = data.resolved_by || null
    if (data.resolution_notes !== undefined) updateData.resolution_notes = data.resolution_notes || null

    // Atualizar alerta
    const { data: updatedAlert, error: updateError } = await supabaseAdmin
      .from('gf_alerts')
      .update(updateData)
      .eq('id', alertId)
      .select()
      .single()

    if (updateError) {
      logError('Erro ao atualizar alerta', { error: updateError, alertId }, 'AlertsUpdateAPI')
      return NextResponse.json(
        {
          error: 'Erro ao atualizar alerta',
          message: updateError.message || 'Erro desconhecido',
        },
        { status: 500 }
      )
    }

    // Invalidar cache após atualização
    await invalidateEntityCache('alert', alertId)

    return NextResponse.json({
      success: true,
      alert: updatedAlert
    })
  } catch (err) {
    logError('Erro ao atualizar alerta', { error: err, alertId }, 'AlertsUpdateAPI')
    const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido'
    return NextResponse.json(
      {
        error: 'Erro ao atualizar alerta',
        message: errorMessage,
      },
      { status: 500 }
    )
  }
}
