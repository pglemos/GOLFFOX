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

    const { id: requestId } = validation.data
    const supabaseAdmin = getSupabaseAdmin()

    logger.log(`🗑️ Tentando excluir solicitação de socorro: ${requestId}`)

    const { data, error } = await supabaseAdmin
      .from('gf_assistance_requests')
      .delete()
      .eq('id', requestId)
      .select()

    if (error) {
      logError('Erro ao excluir solicitação de socorro', { error, requestId }, 'AssistanceRequestsDeleteAPI')
      return NextResponse.json(
        {
          error: 'Erro ao excluir solicitação de socorro',
          message: error.message,
          details: error.details || error.hint || 'Sem detalhes adicionais',
          code: error.code
        },
        { status: 500 }
      )
    }

    // Invalidar cache após exclusão
    await invalidateEntityCache('assistance-request', requestId)

    logger.log(`✅ Solicitação de socorro excluída com sucesso: ${requestId}`, data)

    return NextResponse.json({
      success: true,
      message: 'Solicitação de socorro excluída com sucesso'
    })
  } catch (error: unknown) {
    logError('Erro ao excluir solicitação de socorro', { error }, 'AssistanceRequestsDeleteAPI')
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido'
    return NextResponse.json(
      { error: 'Erro ao excluir solicitação de socorro', message: errorMessage },
      { status: 500 }
    )
  }
}

