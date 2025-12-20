import { NextRequest } from 'next/server'
import { requireAuth } from '@/lib/api-auth'
import { logger, logError } from '@/lib/logger'
import { invalidateEntityCache } from '@/lib/next-cache'
import { getSupabaseAdmin } from '@/lib/supabase-client'
import { validationErrorResponse, errorResponse, successResponse } from '@/lib/api-response'

export const runtime = 'nodejs'

export async function DELETE(request: NextRequest) {
  try {
    const authErrorResponse = await requireAuth(request, 'admin')
    if (authErrorResponse) {
      return authErrorResponse
    }

    const { searchParams } = new URL(request.url)
    const driverId = searchParams.get('id')

    if (!driverId) {
      return validationErrorResponse('ID do motorista é obrigatório')
    }

    const supabaseAdmin = getSupabaseAdmin()

    // Excluir permanentemente o motorista (usuário com role 'motorista')
    // A tabela users tem referência a auth.users com ON DELETE CASCADE,
    // então excluir da tabela users também excluirá do Auth automaticamente
    // As foreign keys com ON DELETE CASCADE vão excluir automaticamente:
    // - gf_driver_documents (documentos do motorista)
    // - gf_driver_events (eventos do motorista)
    // - trips.motorista_id tem ON DELETE SET NULL, então setamos manualmente

    logger.log(`🗑️ Tentando excluir motorista: ${driverId}`)

    // Primeiro, setar motorista_id para NULL em trips (mesmo que seja SET NULL, fazemos explicitamente)
    await supabaseAdmin
      .from('trips')
      .update({ motorista_id: null })
      .eq('motorista_id', driverId)

    // Agora excluir o motorista
    const { data, error } = await supabaseAdmin
      .from('users')
      .delete()
      .eq('id', driverId)
      .eq('role', 'motorista')
      .select()

    if (error) {
      logError('Erro ao excluir motorista', { error, driverId, details: error.details, hint: error.hint, code: error.code }, 'DriversDeleteAPI')
      return errorResponse(error, 500, 'Erro ao excluir motorista')
    }

    // Invalidar cache após exclusão
    await invalidateEntityCache('motorista', driverId)

    logger.log(`✅ Motorista excluído com sucesso: ${driverId}`, data)

    return successResponse(null, 200, { message: 'Motorista excluído com sucesso' })
  } catch (error: any) {
    logError('Erro ao excluir motorista', { error, driverId: request.nextUrl.searchParams.get('id') }, 'DriversDeleteAPI')
    return errorResponse(error, 500, 'Erro ao excluir motorista')
  }
}

