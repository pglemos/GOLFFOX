import { NextRequest, NextResponse } from 'next/server'

import { requireAuth } from '@/lib/api-auth'
import { successResponse, errorResponse, validationErrorResponse } from '@/lib/api-response'
import { supabaseServiceRole } from '@/lib/supabase-server'

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
  context: { params: Promise<{ transportadoraId: string }> }
) {
  try {
    const { transportadoraId } = await context.params
    const authErrorResponse = await requireAuth(req, 'admin')
    if (authErrorResponse) return authErrorResponse

    if (!transportadoraId) {
      return validationErrorResponse('ID da transportadora não fornecido')
    }

    // Selecionar apenas colunas necessárias para listagem
    const userColumns = 'id,email,name,role,transportadora_id,is_active,created_at,updated_at'
    const { data, error } = await supabaseServiceRole
      .from('users')
      .select(userColumns)
      .eq('transportadora_id', transportadoraId)
      .eq('role', 'gestor_transportadora')
      .order('name', { ascending: true })

    if (error) {
      return errorResponse(error, 500, 'Erro ao buscar usuários')
    }

    return successResponse(data || [])
  } catch (err) {
    return errorResponse(err, 500, 'Erro ao processar requisição')
  }
}

