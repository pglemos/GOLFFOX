import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { requireAuth } from '@/lib/api-auth'
import { logError } from '@/lib/logger'

export const runtime = 'nodejs'

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !serviceKey) {
    throw new Error('Supabase não configurado')
  }
  return createClient(url, serviceKey)
}

export async function GET(request: NextRequest) {
  try {
    const authErrorResponse = await requireAuth(request, 'admin')
    if (authErrorResponse) {
      return authErrorResponse
    }

    const supabaseAdmin = getSupabaseAdmin()

    // Selecionar todas as colunas para evitar erros de colunas inexistentes
    const { data, error } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('role', 'motorista')
      .order('created_at', { ascending: false })

    if (error) {
      logError('Erro ao buscar motoristas', { error }, 'DriversListAPI')
      return NextResponse.json(
        { error: 'Erro ao buscar motoristas', message: error.message },
        { status: 500 }
      )
    }

    // Retornar array diretamente para compatibilidade
    return NextResponse.json(data || [])
  } catch (err) {
    logError('Erro ao listar motoristas', { error: err }, 'DriversListAPI')
    const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido'
    return NextResponse.json(
      { error: 'Erro ao listar motoristas', message: errorMessage },
      { status: 500 }
    )
  }
}
