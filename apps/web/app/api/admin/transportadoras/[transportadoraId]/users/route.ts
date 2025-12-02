import { NextRequest, NextResponse } from 'next/server'
import { supabaseServiceRole } from '@/lib/supabase-server'
import { requireAuth } from '@/lib/api-auth'

export const runtime = 'nodejs'

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  })
}

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ transportadoraId?: string; carrierId?: string }> }
) {
  const params = await context.params

  try {
    const authErrorResponse = await requireAuth(req, 'admin')
    if (authErrorResponse) return authErrorResponse

    const transportadoraId = params.transportadoraId || params.carrierId
    if (!transportadoraId) {
      return NextResponse.json(
        { success: false, error: 'ID da transportadora não fornecido' },
        { status: 400 }
      )
    }

    // Selecionar apenas colunas necessárias para listagem (otimização de performance)
    const userColumns = 'id,email,name,role,transportadora_id,is_active,created_at,updated_at'
    const { data, error } = await supabaseServiceRole
      .from('users')
      .select(userColumns)
      .eq('transportadora_id', transportadoraId)
      .eq('role', 'transportadora')
      .order('name', { ascending: true })

    if (error) {
      return NextResponse.json(
        { success: false, error: 'Erro ao buscar usuários', message: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      users: data || []
    })
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido'
    return NextResponse.json(
      { success: false, error: 'Erro ao processar requisição', message: errorMessage },
      { status: 500 }
    )
  }
}

