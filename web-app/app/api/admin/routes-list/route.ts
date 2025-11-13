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
    
    const { data, error } = await supabaseAdmin
      .from('routes')
      .select('*, companies(id, name)')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Erro ao buscar rotas:', error)
      return NextResponse.json(
        { error: 'Erro ao buscar rotas', message: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      routes: data || []
    })
  } catch (error: any) {
    console.error('Erro ao listar rotas:', error)
    return NextResponse.json(
      { error: 'Erro ao listar rotas', message: error.message },
      { status: 500 }
    )
  }
}

