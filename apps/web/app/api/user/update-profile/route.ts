import { NextRequest, NextResponse } from 'next/server'

import { requireAuth } from '@/lib/api-auth'
import { logError } from '@/lib/logger'
import { withRateLimit } from '@/lib/rate-limit'
import { UserService } from '@/lib/services/server/user-service'

export const runtime = 'nodejs'

async function updateProfileHandler(req: NextRequest) {
  // Verificar autenticação (qualquer usuário autenticado pode atualizar seu próprio perfil)
  const authError = await requireAuth(req)
  if (authError) return authError

  try {
    // Obter dados do usuário autenticado do cookie (mantendo compatibilidade com código existente)
    const cookie = req.cookies.get('golffox-session')?.value
    if (!cookie) {
      return NextResponse.json(
        { success: false, error: 'Não autenticado' },
        { status: 401 }
      )
    }

    function tryDecode(cookieValue: string): Record<string, unknown> | null {
      try {
        const b64 = Buffer.from(cookieValue, 'base64').toString('utf-8')
        const parsed = JSON.parse(b64)
        return typeof parsed === 'object' && parsed !== null ? parsed as Record<string, unknown> : null
      } catch (_) {
        try {
          const uri = decodeURIComponent(cookieValue)
          const parsed = JSON.parse(uri)
          return typeof parsed === 'object' && parsed !== null ? parsed as Record<string, unknown> : null
        } catch {
          return null
        }
      }
    }

    const userData = tryDecode(cookie)
    if (!userData || !userData.id || !userData.role) {
      return NextResponse.json(
        { success: false, error: 'Sessão inválida' },
        { status: 401 }
      )
    }

    const body = await req.json()
    const { name, email, newPassword } = body

    // Validar que o userId do cookie corresponde ao que está sendo atualizado
    const userId = userData.id

    // Delegar atualização para o serviço
    const updatedUser = await UserService.updateUser(userId, {
      name: name,
      email: email,
      password: newPassword
    })

    // Atualizar o objeto userData para refletir as mudanças no cookie
    if (name) userData.name = name.trim()
    if (email) userData.email = email.trim()
    // Nota: senha não fica no cookie

    // Criar nova resposta com sucesso
    const response = NextResponse.json({
      success: true,
      message: 'Perfil atualizado com sucesso'
    })

    // Atualizar o cookie de sessão com os novos dados
    // Isso garante que o AppShell e useAuthFast peguem as mudanças imediatamente
    const newSessionPayload = JSON.stringify(userData)
    const encodedSession = Buffer.from(newSessionPayload).toString('base64')

    response.cookies.set('golffox-session', encodedSession, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7 // 7 dias
    })

    return response
  } catch (error: unknown) {
    logError('Erro ao atualizar perfil', { error }, 'UpdateProfileAPI')
    return NextResponse.json(
      {
        success: false,
        error: 'Erro ao atualizar perfil',
        message: error.message
      },
      { status: 500 }
    )
  }
}

// Exportar com rate limiting (api: 100 requests per minute)
export const POST = withRateLimit(updateProfileHandler, 'api')
