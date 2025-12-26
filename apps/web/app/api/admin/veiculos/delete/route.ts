import { NextRequest, NextResponse } from 'next/server'

import { requireAuth } from '@/lib/api-auth'
import { logger, logError } from '@/lib/logger'
import { invalidateEntityCache } from '@/lib/next-cache'
import { getSupabaseAdmin } from '@/lib/supabase-client'
import { validateWithSchema, idQuerySchema } from '@/lib/validation/schemas'
import { validationErrorResponse } from '@/lib/api-response'

export const runtime = 'nodejs'

export async function DELETE(request: NextRequest) {
  try {
    const authErrorResponse = await requireAuth(request, 'admin')
    if (authErrorResponse) return authErrorResponse

    const { searchParams } = new URL(request.url)
    const queryParams = Object.fromEntries(searchParams.entries())

    // Validar query params
    const validation = validateWithSchema(idQuerySchema, queryParams)
    if (!validation.success) {
      return validationErrorResponse(validation.error)
    }

    const { id: vehicleId } = validation.data
    const supabaseAdmin = getSupabaseAdmin()

    logger.log(`🗑️ Tentando excluir veículo: ${vehicleId}`)

    // Primeiro, setar vehicle_id para NULL em viagens
    await supabaseAdmin
      .from('viagens')
      .update({ veiculo_id: null })
      .eq('veiculo_id', vehicleId)

    // Agora excluir o veículo
    const { data, error } = await supabaseAdmin
      .from('veiculos')
      .delete()
      .eq('id', vehicleId)
      .select()

    if (error) {
      logError('Erro ao excluir veículo', { error, vehicleId }, 'VehiclesDeleteAPI')
      return NextResponse.json(
        {
          error: 'Erro ao excluir veículo',
          message: error.message,
          details: error.details || error.hint || 'Sem detalhes adicionais',
          code: error.code
        },
        { status: 500 }
      )
    }

    // Invalidar cache após exclusão
    await invalidateEntityCache('veiculo', vehicleId)

    logger.log(`✅ Veículo excluído com sucesso: ${vehicleId}`, data)

    return NextResponse.json({
      success: true,
      message: 'Veículo excluído com sucesso'
    })
  } catch (error: unknown) {
    logError('Erro ao excluir veículo', { error }, 'VehiclesDeleteAPI')
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido'
    return NextResponse.json(
      { error: 'Erro ao excluir veículo', message: errorMessage },
      { status: 500 }
    )
  }
}

