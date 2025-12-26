import { NextRequest, NextResponse } from 'next/server'

import { requireAuth } from '@/lib/api-auth'
import { validationErrorResponse, errorResponse, successResponse } from '@/lib/api-response'
import { logger, logError } from '@/lib/logger'
import { withRateLimit } from '@/lib/rate-limit'
import { UserService } from '@/lib/services/server/user-service'
import { validateWithSchema, idQuerySchema } from '@/lib/validation/schemas'

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
    if (authErrorResponse) return authErrorResponse

    const { searchParams } = new URL(request.url)
    const queryParams = Object.fromEntries(searchParams.entries())

    // Validar query params
    const validation = validateWithSchema(idQuerySchema, queryParams)
    if (!validation.success) {
      return validationErrorResponse(validation.error)
    }

    const { id: userId } = validation.data

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

