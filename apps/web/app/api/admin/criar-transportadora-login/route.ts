import { NextRequest, NextResponse } from 'next/server'

import { z } from 'zod'

import { requireAuth } from '@/lib/api-auth'
import { successResponse, errorResponse, validationErrorResponse } from '@/lib/api-response'
import { logError, logger } from '@/lib/logger'
import { supabaseServiceRole } from '@/lib/supabase-server'

export const runtime = 'nodejs'

const carrierLoginSchema = z.object({
  transportadora_id: z.string().uuid('ID da transportadora inválido').optional(),
  email: z.string().email('Email inválido'),
  name: z.string().min(1, 'Nome é obrigatório'),
  password: z.string().min(6, 'Senha deve ter no mínimo 6 caracteres'),
}).refine(data => data.transportadora_id, {
  message: 'ID da transportadora é obrigatório'
})

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
    const authErrorResponse = await requireAuth(req, 'admin')
    if (authErrorResponse) return authErrorResponse

    const body = await req.json()
    const validated = carrierLoginSchema.parse(body)
    const transportadoraId = validated.transportadora_id

    // Criar usuário no Supabase Auth
    const { data: authData, error: authError } = await supabaseServiceRole.auth.admin.createUser({
      email: validated.email,
      password: validated.password,
      email_confirm: true,
      user_metadata: {
        name: validated.name,
        role: 'gestor_transportadora'
      }
    })

    if (authError) {
      return errorResponse(authError, 500, 'Erro ao criar autenticação')
    }

    if (!authData.user) {
      return errorResponse('Erro ao criar usuário (sem dados)', 500)
    }

    // Criar ou atualizar registro na tabela users (UPSERT)
    const { error: upsertError } = await supabaseServiceRole
      .from('users')
      .upsert({
        id: authData.user.id,
        email: validated.email,
        name: validated.name,
        role: 'gestor_transportadora',
        transportadora_id: transportadoraId,
        is_active: true,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'id'
      })

    if (upsertError) {
      logError('Erro ao criar/atualizar usuário na tabela users', upsertError, 'CreateTransportadoraLoginAPI')
      // Tentar remover usuário do Auth se possível
      try {
        await supabaseServiceRole.auth.admin.deleteUser(authData.user.id)
      } catch (deleteError) {
        logError('Erro ao remover usuário do Auth após falha', deleteError, 'CreateTransportadoraLoginAPI')
      }
      return errorResponse(upsertError, 500, 'Erro ao criar registro do usuário')
    }

    logger.log('✅ Registro criado/atualizado na tabela users para:', validated.email)

    return successResponse({
      id: authData.user.id,
      email: authData.user.email,
      name: validated.name
    })
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      return validationErrorResponse('Dados inválidos', { details: error.errors })
    }
    logError('Erro ao criar login transportadora', { error }, 'CreateTransportadoraLoginAPI')
    return errorResponse(error, 500, 'Erro ao processar requisição')
  }
}
