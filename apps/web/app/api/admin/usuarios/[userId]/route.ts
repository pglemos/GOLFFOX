import { NextRequest, NextResponse } from 'next/server'

import { requireAuth } from '@/lib/api-auth'
import { logError } from '@/lib/logger'
import { UserService } from '@/lib/services/server/user-service'

export const runtime = 'nodejs'

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ userId: string }> }
) {
  const params = await context.params
  const { userId: userIdParam } = params

  try {
    const authErrorResponse = await requireAuth(request, 'admin')
    if (authErrorResponse) {
      return authErrorResponse
    }

    const userId = userIdParam?.trim()
    if (!userId) {
      return NextResponse.json({ error: 'user_id é obrigatório' }, { status: 400 })
    }

    const body = await request.json()

    // Delegar atualização para o serviço
    const updatedUser = await UserService.updateUser(userId, {
      name: body.name,
      email: body.email,
      role: body.role,
      is_active: body.is_active,
      company_id: body.company_id,
      phone: body.phone,
      cpf: body.cpf,
      password: body.password,
      address_zip_code: body.address_zip_code,
      address_street: body.address_street,
      address_number: body.address_number,
      address_neighborhood: body.address_neighborhood,
      address_complement: body.address_complement,
      address_city: body.address_city,
      address_state: body.address_state
    })

    return NextResponse.json({
      success: true,
      user: updatedUser
    })
  } catch (err: any) {
    // Mapear erros conhecidos
    const message = err.message
    const status = message.includes('inválido') || message.includes('obrigatório') || message.includes('encontrado') ? 400 : 500

    // Se for erro de validação do serviço, retornar 400; se 'não encontrado' talvez 404
    const finalStatus = message === 'Usuário não encontrado' ? 404 : status

    logError('Erro ao atualizar usuário', { error: err, userId: userIdParam }, 'UsersUpdateAPI')
    return NextResponse.json(
      {
        error: 'Erro ao atualizar usuário',
        message: message,
      },
      { status: finalStatus }
    )
  }
}

