import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { requireAuth } from '@/lib/api-auth'
import { z } from 'zod'
import { logError, logger } from '@/lib/logger'

export const runtime = 'nodejs'

// Helper para criar cliente admin
function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !serviceKey) {
    throw new Error('Supabase não configurado')
  }
  return createClient(url, serviceKey)
}

const carrierLoginSchema = z.object({
  transportadora_id: z.string().uuid('ID da transportadora inválido').optional(),
  carrier_id: z.string().uuid('ID da transportadora inválido').optional(),
  email: z.string().email('Email inválido'),
  name: z.string().min(1, 'Nome é obrigatório'),
  password: z.string().min(6, 'Senha deve ter no mínimo 6 caracteres'),
}).refine(data => data.transportadora_id || data.carrier_id, {
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
    const transportadoraId = validated.transportadora_id || validated.carrier_id

    const supabaseAdmin = getSupabaseAdmin()

    // Criar usuário no Supabase Auth
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: validated.email,
      password: validated.password,
      email_confirm: true,
      user_metadata: {
        name: validated.name,
        role: 'transportadora'
      }
    })

    if (authError) {
      return NextResponse.json(
        { success: false, error: 'Erro ao criar autenticação', message: authError.message },
        { status: 500 }
      )
    }

    if (!authData.user) {
      return NextResponse.json(
        { success: false, error: 'Erro ao criar usuário (sem dados)' },
        { status: 500 }
      )
    }

    // Criar ou atualizar registro na tabela users (UPSERT)
    // Usar upsert em vez de update para garantir que o registro seja criado se não existir
    const { error: upsertError } = await supabaseAdmin
      .from('users')
      .upsert({
        id: authData.user.id,
        email: validated.email,
        name: validated.name,
        role: 'transportadora',
        transportadora_id: transportadoraId,
        is_active: true,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'id'
      })

    if (upsertError) {
      logError('Erro ao criar/atualizar usuário na tabela users', {
        message: upsertError.message,
        code: upsertError.code,
        details: upsertError.details,
        hint: upsertError.hint
      }, 'CreateTransportadoraLoginAPI')
      // Tentar remover usuário do Auth se possível
      try {
        await supabaseAdmin.auth.admin.deleteUser(authData.user.id)
        // Usuário removido do Auth após falha ao criar registro
      } catch (deleteError) {
        logError('Erro ao remover usuário do Auth após falha', { error: deleteError }, 'CreateTransportadoraLoginAPI')
      }
      return NextResponse.json(
        {
          success: false,
          error: 'Erro ao criar registro do usuário',
          message: upsertError.message || 'Erro desconhecido',
          details: process.env.NODE_ENV === 'development' ? {
            code: upsertError.code,
            details: upsertError.details,
            hint: upsertError.hint
          } : undefined
        },
        { status: 500 }
      )
    }

    logger.log('✅ Registro criado/atualizado na tabela users para:', validated.email)

    return NextResponse.json({
      success: true,
      user: {
        id: authData.user.id,
        email: authData.user.email,
        name: validated.name
      }
    })
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Dados inválidos', details: error.errors },
        { status: 400 }
      )
    }
    logError('Erro ao criar login transportadora', { error }, 'CreateTransportadoraLoginAPI')
    const errorMessage = error instanceof Error ? error.message : 'Erro ao processar requisição'
    return NextResponse.json(
      { success: false, error: 'Erro ao processar requisição', message: errorMessage },
      { status: 500 }
    )
  }
}
