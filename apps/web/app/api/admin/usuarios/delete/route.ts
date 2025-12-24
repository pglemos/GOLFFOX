import { NextRequest, NextResponse } from 'next/server'

import { requireAuth } from '@/lib/api-auth'
import { validationErrorResponse, errorResponse, successResponse } from '@/lib/api-response'
import { logger, logError } from '@/lib/logger'
import { withRateLimit } from '@/lib/rate-limit'
import { UserService } from '@/lib/services/server/user-service'
import { getSupabaseAdmin } from '@/lib/supabase-client'

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

    logger.log(`🗑️ Tentando excluir usuário: ${userId}`)

    // Delegar para UserService
    await UserService.deleteUser(userId)

    logger.log(`✅ Usuário excluído com sucesso: ${userId}`)

    return successResponse(null, 200, { message: 'Usuário excluído com sucesso' })
  } catch (error: unknown) {
    const userId = request.nextUrl.searchParams.get('id')
    logError('Erro ao excluir usuário', { error, userId }, 'UsersDeleteAPI')
    return errorResponse(error, 500, 'Erro ao excluir usuário')
  }
}

