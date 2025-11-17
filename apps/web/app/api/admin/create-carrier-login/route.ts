import { NextRequest, NextResponse } from 'next/server'
import { supabaseServiceRole } from '@/lib/supabase-server'
import { requireAuth } from '@/lib/api-auth'
import { z } from 'zod'

export const runtime = 'nodejs'

const carrierLoginSchema = z.object({
  carrier_id: z.string().uuid('ID da transportadora inválido'),
  email: z.string().email('Email inválido'),
  name: z.string().min(1, 'Nome é obrigatório'),
  password: z.string().min(6, 'Senha deve ter no mínimo 6 caracteres'),
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

    // Criar usuário no Supabase Auth
    const { data: authData, error: authError } = await supabaseServiceRole.auth.admin.createUser({
      email: validated.email,
      password: validated.password,
      email_confirm: true,
      user_metadata: {
        name: validated.name,
        role: 'carrier'
      }
    })

    if (authError) {
      return NextResponse.json(
        { success: false, error: 'Erro ao criar autenticação', message: authError.message },
        { status: 500 }
      )
    }

    // Atualizar registro na tabela users
    const { error: updateError } = await supabaseServiceRole
      .from('users')
      .update({
        name: validated.name,
        role: 'carrier',
        carrier_id: validated.carrier_id,
        updated_at: new Date().toISOString()
      })
      .eq('id', authData.user.id)

    if (updateError) {
      console.error('Erro ao atualizar usuário:', updateError)
      // Não retornar erro pois o usuário foi criado
    }

    return NextResponse.json({
      success: true,
      user: {
        id: authData.user.id,
        email: authData.user.email,
        name: validated.name
      }
    })
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Dados inválidos', details: error.errors },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { success: false, error: 'Erro ao processar requisição', message: error.message },
      { status: 500 }
    )
  }
}

