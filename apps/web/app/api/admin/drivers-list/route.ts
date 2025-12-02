import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { requireAuth } from '@/lib/api-auth'

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
    const isDevelopment = process.env.NODE_ENV === 'development'
    const authErrorResponse = await requireAuth(request, 'admin')
    if (authErrorResponse && !isDevelopment) {
      return authErrorResponse
    }
    if (authErrorResponse && isDevelopment) {
      console.warn('⚠️ Autenticação falhou em desenvolvimento, mas continuando...')
    }

    const supabaseAdmin = getSupabaseAdmin()
    
    // Selecionar apenas colunas necessárias para listagem (otimização de performance)
    const driverColumns = 'id,email,name,role,company_id,transportadora_id,is_active,created_at,updated_at'
    const { data, error } = await supabaseAdmin
      .from('users')
      .select(driverColumns)
      .eq('role', 'driver')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Erro ao buscar motoristas:', error)
      return NextResponse.json(
        { error: 'Erro ao buscar motoristas', message: error.message },
        { status: 500 }
      )
    }

    // Retornar array diretamente para compatibilidade
    return NextResponse.json(data || [])
  } catch (err) {
    console.error('Erro ao listar motoristas:', err)
    const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido'
    return NextResponse.json(
      { error: 'Erro ao listar motoristas', message: errorMessage },
      { status: 500 }
    )
  }
}
