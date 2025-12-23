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

    const searchParams = request.nextUrl.searchParams
    const pageParam = searchParams.get('page')
    const limitParam = searchParams.get('limit')

    // Se não passar parametros, assumimos comportamento "listar tudo" (ou max 1000) para compatibilidade retroativa
    const page = pageParam ? parseInt(pageParam) : 1
    const limit = limitParam ? parseInt(limitParam) : 1000

    const search = searchParams.get('search') || undefined
    const status = searchParams.get('status') || undefined
    const carrierId = searchParams.get('transportadora_id') || undefined

    const { drivers, total } = await UserService.listDrivers({
      page,
      limit,
      search,
      status,
      carrierId
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
