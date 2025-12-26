import { NextRequest, NextResponse } from 'next/server'

import { requireAuth } from '@/lib/api-auth'
import { logError } from '@/lib/logger'
import { UserService } from '@/lib/services/server/user-service'
import { validateWithSchema, driverListQuerySchema } from '@/lib/validation/schemas'
import { validationErrorResponse } from '@/lib/api-response'

export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  try {
    const authErrorResponse = await requireAuth(request, 'admin')
    if (authErrorResponse) return authErrorResponse

    const { searchParams } = new URL(request.url)
    const queryParams = Object.fromEntries(searchParams.entries())

    // Validar query params
    const validation = validateWithSchema(driverListQuerySchema, queryParams)
    if (!validation.success) {
      return validationErrorResponse(validation.error)
    }

    const { page = 1, limit = 1000, search, status, transportadora_id } = validation.data

    const { drivers, total } = await UserService.listDrivers({
      page,
      limit,
      search,
      status,
      carrierId: transportadora_id
    })

    return NextResponse.json({
      motoristas: drivers,
      total,
      success: true
    })
  } catch (err) {
    logError('Erro ao listar motoristas', { error: err }, 'DriversListAPI')
    const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido'
    return NextResponse.json(
      { error: 'Erro ao listar motoristas', message: errorMessage, success: false },
      { status: 500 }
    )
  }
}
