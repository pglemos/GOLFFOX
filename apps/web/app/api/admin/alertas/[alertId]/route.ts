import { NextRequest, NextResponse } from 'next/server'

import { requireAuth } from '@/lib/api-auth'
import { logError } from '@/lib/logger'
import { invalidateEntityCache } from '@/lib/next-cache'
import { getSupabaseAdmin } from '@/lib/supabase-client'

export const runtime = 'nodejs'

// Accept any valid UUID format (not just v4)
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

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
        { error: 'id do alerta deve ser um UUID válido' },
        { status: 400 }
      )
    }

    const supabaseAdmin = getSupabaseAdmin()
    const body = await request.json()

    // Verificar se alerta existe
    const { data: existingAlert, error: fetchError } = await supabaseAdmin
      .from('gf_alerts')
      .select('id, title, message, severity, is_resolved, assigned_to')
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
    // Mapear campos antigos para novos se necessário
    if (body.description !== undefined) {
      updateData.message = body.description?.trim() || null
      if (!updateData.title) updateData.title = body.description?.slice(0, 50) || 'Alerta'
    } else if (body.message !== undefined) {
      updateData.message = body.message?.trim() || null
    }

    if (body.title !== undefined) updateData.title = body.title?.trim()

    if (body.severity !== undefined) updateData.severity = body.severity

    // Status mapping
    if (body.status !== undefined) {
      if (body.status === 'resolved') {
        updateData.is_resolved = true
      } else if (body.status === 'open') {
        updateData.is_resolved = false
        updateData.assigned_to = null
      } else if (body.status === 'assigned') {
        updateData.is_resolved = false
      }
    }

    if (body.assigned_to !== undefined) updateData.assigned_to = body.assigned_to || null

    // gf_alerts geralmente não tem rota_id/veiculo_id diretos na raiz, mas em update precisamos respeitar o schema
    // Se o user mandar rota_id, podemos tentar jogar em metadata/details se o campo não existir
    // Mas vamos assumir que o frontend vai parar de mandar rota_id direto se alterarmos.
    // Se mandar, ignoramos ou salvamos em details se pudermos (mas precisariamos ler details antes).
    // Como simplificação, focamos nos campos principais.

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
