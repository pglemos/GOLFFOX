import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-client'
import { requireAuth } from '@/lib/api-auth'
import { logError } from '@/lib/logger'

export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  try {
    const authErrorResponse = await requireAuth(request, 'admin')
    if (authErrorResponse) {
      return authErrorResponse
    }

    const supabaseAdmin = getSupabaseAdmin()
    const { searchParams } = new URL(request.url)
    const role = searchParams.get('role')
    const status = searchParams.get('status')
    const companyId = searchParams.get('company_id')

    // Selecionar todas as colunas para evitar erros de colunas inexistentes
    let query = supabaseAdmin
      .from('users')
      .select('*')
      .order('created_at', { ascending: false })

    if (role && role !== 'all') {
      query = query.eq('role', role)
    }

    if (status && status !== 'all') {
      query = query.eq('is_active', status === 'active')
    }

    if (companyId) {
      query = query.eq('company_id', companyId)
    }

    const { data, error } = await query

    if (error) {
      logError('Erro ao buscar usuários', { error }, 'UsersListAPI')
      return NextResponse.json(
        { success: false, error: 'Erro ao buscar usuários', message: error.message },
        { status: 500 }
      )
    }

    // Retornar no formato esperado pelo frontend
    return NextResponse.json({
      success: true,
      users: data || []
    })
  } catch (err) {
    logError('Erro ao listar usuários', { error: err }, 'UsersListAPI')
    const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido'
    return NextResponse.json(
      { success: false, error: 'Erro ao listar usuários', message: errorMessage },
      { status: 500 }
    )
  }
}

