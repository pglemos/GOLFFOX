import { NextRequest, NextResponse } from 'next/server'
import { supabaseServiceRole } from '@/lib/supabase-server'
import { requireAuth } from '@/lib/api-auth'
import { logError } from '@/lib/logger'

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

export async function GET(req: NextRequest) {
  try {
    const authErrorResponse = await requireAuth(req, 'admin')
    if (authErrorResponse) return authErrorResponse

    // Selecionar todas as colunas para evitar erros de colunas inexistentes
    const { data, error } = await supabaseServiceRole
      .from('carriers')
      .select('*')
      .order('name', { ascending: true })

    if (error) {
      logError('Erro ao buscar carriers', { error }, 'TransportadorasListAPI')
      return NextResponse.json(
        { success: false, error: 'Erro ao buscar transportadoras', message: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      carriers: data || []
    })
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido'
    return NextResponse.json(
      { success: false, error: 'Erro ao processar requisição', message: errorMessage },
      { status: 500 }
    )
  }
}

