import { NextRequest, NextResponse } from 'next/server'

import { requireAuth } from '@/lib/api-auth'
import { logError } from '@/lib/logger'
import { UserService } from '@/lib/services/server/user-service'

export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  try {
    const authErrorResponse = await requireAuth(request, 'admin')
    if (authErrorResponse) {
      return authErrorResponse
    }

    const { searchParams } = new URL(request.url)
    const role = searchParams.get('role') || undefined
    const status = searchParams.get('status') || undefined
    const companyId = searchParams.get('company_id') || undefined

    const users = await UserService.listUsers({ role, status, companyId })

    // Retornar no formato esperado pelo frontend
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

