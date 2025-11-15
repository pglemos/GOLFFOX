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
    // Validar autenticação (apenas admin) - mas permitir em desenvolvimento
    const isDevelopment = process.env.NODE_ENV === 'development'
    const authErrorResponse = await requireAuth(request, 'admin')
    if (authErrorResponse && !isDevelopment) {
      return authErrorResponse
    }
    // Em desenvolvimento, apenas logar aviso
    if (authErrorResponse && isDevelopment) {
      console.warn('⚠️ Autenticação falhou em desenvolvimento, mas continuando...')
    }

    const supabaseAdmin = getSupabaseAdmin()
    
    // Buscar empresas - tentar com filtro is_active, se falhar buscar todas
    let { data, error } = await supabaseAdmin
      .from('companies')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false })
    
    // Se houver erro relacionado a coluna is_active ou created_at, tentar sem filtro/ordenação
    if (error && (error.message?.includes('is_active') || error.message?.includes('created_at') || error.message?.includes('column'))) {
      console.warn('Coluna is_active ou created_at não encontrada, buscando todas as empresas sem filtro')
      const result = await supabaseAdmin
        .from('companies')
        .select('*')
      
      data = result.data
      error = result.error
    }

    if (error) {
      console.error('Erro ao buscar empresas:', error)
      return NextResponse.json(
        { success: false, error: 'Erro ao buscar empresas', message: error.message },
        { status: 500 }
      )
    }

    // Retornar no formato esperado pelo frontend
    return NextResponse.json({
      success: true,
      companies: data || []
    })
  } catch (error: any) {
    console.error('Erro ao listar empresas:', error)
    return NextResponse.json(
      { success: false, error: 'Erro ao listar empresas', message: error.message },
      { status: 500 }
    )
  }
}

