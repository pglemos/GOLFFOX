import { NextRequest } from 'next/server'
import { requireAuth } from '@/lib/api-auth'
import { withRateLimit } from '@/lib/rate-limit'
import { logger, logError } from '@/lib/logger'
import { invalidateEntityCache } from '@/lib/next-cache'
import { getSupabaseAdmin } from '@/lib/supabase-client'
import { validationErrorResponse, errorResponse, successResponse } from '@/lib/api-response'

export const runtime = 'nodejs'

// Aceitar tanto DELETE quanto POST para compatibilidade
async function deleteHandler(request: NextRequest) {
  return handleDelete(request)
}

export const DELETE = withRateLimit(deleteHandler, 'sensitive')
export const POST = withRateLimit(deleteHandler, 'sensitive')

async function handleDelete(request: NextRequest) {
  try {
    const authErrorResponse = await requireAuth(request, 'admin')
    if (authErrorResponse) {
      return authErrorResponse
    }

    // Aceitar tanto query param quanto body
    const { searchParams } = new URL(request.url)
    let userId = searchParams.get('id')
    
    // Se não estiver na query, tentar no body
    if (!userId) {
      try {
        const body = await request.json()
        userId = body.id || body.user_id
      } catch (e) {
        // Body vazio ou inválido, continuar com null
      }
    }

    if (!userId) {
      return NextResponse.json(
        { error: 'ID do usuário é obrigatório' },
        { status: 400 }
      )
    }

    const supabaseAdmin = getSupabaseAdmin()

    // Excluir permanentemente o usuário do banco de dados
    // A tabela users tem referência a auth.users com ON DELETE CASCADE,
    // então excluir da tabela users também excluirá do Auth automaticamente
    // As foreign keys com ON DELETE CASCADE vão excluir automaticamente dados relacionados
    
    logger.log(`🗑️ Tentando excluir usuário: ${userId}`)
    
    // Primeiro, setar motorista_id para NULL em trips se o usuário for motorista
    await supabaseAdmin
      .from('trips')
      .update({ motorista_id: null })
      .eq('motorista_id', userId)
    
    // Agora excluir o usuário
    const { data, error } = await supabaseAdmin
      .from('users')
      .delete()
      .eq('id', userId)
      .select()

    if (error) {
      logError('Erro ao excluir usuário', { error, userId, details: error.details, hint: error.hint, code: error.code }, 'UsersDeleteAPI')
      return errorResponse(error, 500, 'Erro ao excluir usuário')
    }

    // Invalidar cache após exclusão
    await invalidateEntityCache('user', userId)

    logger.log(`✅ Usuário excluído com sucesso: ${userId}`, data)

    return successResponse(null, 200, { message: 'Usuário excluído com sucesso' })
  } catch (error: any) {
    logError('Erro ao excluir usuário', { error, userId: request.nextUrl.searchParams.get('id') }, 'UsersDeleteAPI')
    return errorResponse(error, 500, 'Erro ao excluir usuário')
  }
}

