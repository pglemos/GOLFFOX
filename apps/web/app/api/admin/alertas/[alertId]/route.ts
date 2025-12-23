import { NextRequest, NextResponse } from 'next/server'

import { requireAuth } from '@/lib/api-auth'
import { logError } from '@/lib/logger'
import { invalidateEntityCache } from '@/lib/next-cache'
import { getSupabaseAdmin } from '@/lib/supabase-client'

export const runtime = 'nodejs'

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ alertId: string }> }
) {
  const params = await context.params

  const { alertId: alertIdParam } = params
  try {
    const authErrorResponse = await requireAuth(request, 'admin')
    if (authErrorResponse) {
      return authErrorResponse
    }

    const alertId = alertIdParam?.trim()
    if (!alertId || !UUID_REGEX.test(alertId)) {
      return NextResponse.json(
        { error: 'alert_id deve ser um UUID válido' },
        { status: 400 }
      )
    }

    const supabaseAdmin = getSupabaseAdmin()
    const body = await request.json()

    // Verificar se alerta existe
    const { data: existingAlert, error: fetchError } = await supabaseAdmin
      .from('alerts' as any)
      .select('id, description, severity, status, route_id, veiculo_id')
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
    if (body.description !== undefined) updateData.description = body.description?.trim() || null
    if (body.severity !== undefined) updateData.severity = body.severity
    if (body.status !== undefined) updateData.status = body.status
    if (body.route_id !== undefined) updateData.route_id = body.route_id || null
    if (body.veiculo_id !== undefined) updateData.veiculo_id = body.veiculo_id || null

    // Atualizar alerta
    const { data: updatedAlert, error: updateError } = await (supabaseAdmin
      .from('alerts') as any)
      .update(updateData)
      .eq('id', alertId)
      .select('id, description, severity, status, route_id, veiculo_id, created_at, updated_at')
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
    logError('Erro ao atualizar alerta', { error: err, alertId: (await context.params).alertId }, 'AlertsUpdateAPI')
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

