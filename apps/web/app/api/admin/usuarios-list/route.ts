import { NextRequest, NextResponse } from 'next/server'

import { requireAuth } from '@/lib/api-auth'
import { logError } from '@/lib/logger'
import { UserService } from '@/lib/services/server/user-service'
import { validateWithSchema, userListQuerySchema } from '@/lib/validation/schemas'
import { validationErrorResponse } from '@/lib/api-response'

export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  try {
    const authErrorResponse = await requireAuth(request, 'admin')
    if (authErrorResponse) return authErrorResponse

    const { searchParams } = new URL(request.url)
    const queryParams = Object.fromEntries(searchParams.entries())

    // Validar query params
    const validation = validateWithSchema(userListQuerySchema, queryParams)
    if (!validation.success) {
      return validationErrorResponse(validation.error)
    }

    const { role, status, company_id, empresa_id } = validation.data
    const targetCompanyId = empresa_id || company_id

    const users = await UserService.listUsers({
      role,
      status,
      companyId: targetCompanyId
    })

    return NextResponse.json({
      success: true,
      users: users
    })
  } catch (err) {
    logError('Erro ao listar usuários', { error: err }, 'UsersListAPI')
    const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido'
    return NextResponse.json(
      { success: false, error: 'Erro ao listar usuários', message: errorMessage },
      { status: 500 }
    )
  }
}

