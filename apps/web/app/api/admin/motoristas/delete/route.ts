import { NextRequest } from 'next/server'

import { requireAuth } from '@/lib/api-auth'
import { validationErrorResponse, errorResponse, successResponse } from '@/lib/api-response'
import { logger, logError } from '@/lib/logger'
import { invalidateEntityCache } from '@/lib/next-cache'
import { UserService } from '@/lib/services/server/user-service'
import { validateWithSchema, idQuerySchema } from '@/lib/validation/schemas'

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

    const { id: driverId } = validation.data

    // Excluir permanentemente o motorista usando UserService
    // Isso garante limpeza correta de referências (trips.driver_id) e Auth
    await UserService.deleteUser(driverId)

    // Invalidar cache de motorista especificamente (além do cache de usuário que o Service já limpa)
    await invalidateEntityCache('motorista', driverId)

    logger.log(`✅ Motorista excluído com sucesso: ${driverId}`)

    return successResponse(null, 200, { message: 'Motorista excluído com sucesso' })
  } catch (error: unknown) {
    const driverId = request.nextUrl.searchParams.get('id')
    logError('Erro ao excluir motorista', { error, driverId }, 'DriversDeleteAPI')
    return errorResponse(error, 500, 'Erro ao excluir motorista')
  }
}
