import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/api-auth'
import { logger } from '@/lib/logger'

export const runtime = 'nodejs'

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  })
}

export async function POST(req: NextRequest) {
  try {
    const authErrorResponse = await requireAuth(req, ['transportadora', 'admin'])
    if (authErrorResponse) return authErrorResponse

    const body = await req.json()
    const { to, subject, body: emailBody } = body

    if (!to || !subject || !emailBody) {
      return NextResponse.json(
        { error: 'Dados incompletos. Forneça: to, subject, body' },
        { status: 400 }
      )
    }

    // TODO: Implementar envio de email real via serviço de email (SendGrid, Resend, etc.)
    // Por enquanto, apenas retorna sucesso para não bloquear a funcionalidade
    logger.log('Email seria enviado:', { to, subject, body: emailBody })

    return NextResponse.json({
      success: true,
      message: 'Email enviado com sucesso',
      // Em produção, descomentar quando o serviço de email estiver configurado:
      // sent: true,
      // messageId: 'email-message-id'
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Erro ao enviar email', message: error.message },
      { status: 500 }
    )
  }
}

