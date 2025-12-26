import { NextRequest, NextResponse } from 'next/server'

import { requireAuth } from '@/lib/api-auth'
import { logError } from '@/lib/logger'
import { invalidateEntityCache } from '@/lib/next-cache'
import { getSupabaseAdmin } from '@/lib/supabase-client'
import { validateWithSchema, updateAssistanceRequestByIdSchema, uuidSchema } from '@/lib/validation/schemas'
import { validationErrorResponse } from '@/lib/api-response'

export const runtime = 'nodejs'

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ requestId: string }> }
) {
  const params = await context.params
  const { requestId } = params

  try {
    const authErrorResponse = await requireAuth(request, 'admin')
    if (authErrorResponse) return authErrorResponse

    // Validar ID
    const idValidation = uuidSchema.safeParse(requestId)
    if (!idValidation.success) {
      return validationErrorResponse('ID da solicitação inválido')
    }

    const body = await request.json()

    // Validar corpo
    const validation = validateWithSchema(updateAssistanceRequestByIdSchema, body)
    if (!validation.success) {
      return validationErrorResponse(validation.error)
    }

    const data = validation.data
    const supabaseAdmin = getSupabaseAdmin()

    // Verificar se ocorrência existe
    const { data: existingRequest, error: fetchError } = await supabaseAdmin
      .from('gf_assistance_requests')
      .select('id')
      .eq('id', requestId)
      .single()

    if (fetchError || !existingRequest) {
      return NextResponse.json(
        { error: 'Solicitação não encontrada' },
        { status: 404 }
      )
    }

    // Preparar dados para atualização
    const updateData: Record<string, unknown> = {}
    if (data.description !== undefined) updateData.description = data.description?.trim() || null
    if (data.status !== undefined) updateData.status = data.status
    if (data.request_type !== undefined) updateData.request_type = data.request_type
    if (data.address !== undefined) updateData.address = data.address?.trim() || null
    if (data.route_id !== undefined) updateData.rota_id = data.route_id || null
    if (data.dispatched_driver_id !== undefined) updateData.dispatched_driver_id = data.dispatched_driver_id || null
    if (data.dispatched_vehicle_id !== undefined) updateData.dispatched_vehicle_id = data.dispatched_vehicle_id || null
    if (data.notes !== undefined) updateData.notes = data.notes || null

    // Atualizar ocorrência
    const { data: updatedRequest, error: updateError } = await supabaseAdmin
      .from('gf_assistance_requests')
      .update(updateData)
      .eq('id', requestId)
      .select()
      .single()

    if (updateError) {
      logError('Erro ao atualizar solicitação', { error: updateError, requestId }, 'AssistanceRequestsUpdateAPI')
      return NextResponse.json(
        {
          error: 'Erro ao atualizar solicitação',
          message: updateError.message || 'Erro desconhecido',
        },
        { status: 500 }
      )
    }

    // Invalidar cache após atualização
    await invalidateEntityCache('assistance-request', requestId)

    return NextResponse.json({
      success: true,
      request: updatedRequest
    })
  } catch (err) {
    logError('Erro ao atualizar solicitação', { error: err, requestId }, 'AssistanceRequestsUpdateAPI')
    const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido'
    return NextResponse.json(
      {
        error: 'Erro ao atualizar solicitação',
        message: errorMessage,
      },
      { status: 500 }
    )
  }
}

