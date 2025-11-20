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
    
    console.log('🔍 Buscando empresas no banco de dados...')
    
    // Buscar empresas - tentar com filtro is_active, se falhar buscar todas
    let { data, error } = await supabaseAdmin
      .from('companies')
      .select('id, name, is_active, created_at')
      .eq('is_active', true)
      .order('name', { ascending: true })
    
    // Se houver erro relacionado a coluna is_active ou created_at, tentar sem filtro/ordenação
    if (error && (error.message?.includes('is_active') || error.message?.includes('created_at') || error.message?.includes('column'))) {
      console.warn('⚠️ Coluna is_active ou created_at não encontrada, buscando todas as empresas sem filtro')
      const result = await supabaseAdmin
        .from('companies')
        .select('id, name')
        .order('name', { ascending: true })
      
      data = result.data
      error = result.error
      
      // Se ainda houver erro com ordenação, tentar sem ordenação
      if (error && error.message?.includes('column')) {
        console.warn('⚠️ Erro com ordenação, tentando sem ordenação')
        const resultNoOrder = await supabaseAdmin
          .from('companies')
          .select('id, name')
        
        data = resultNoOrder.data
        error = resultNoOrder.error
        
        // Ordenar manualmente se necessário
        if (data && !error) {
          data.sort((a: any, b: any) => {
            const nameA = (a.name || '').toLowerCase()
            const nameB = (b.name || '').toLowerCase()
            return nameA.localeCompare(nameB)
          })
        }
      }
    }

    if (error) {
      console.error('❌ Erro ao buscar empresas:', error)
      return NextResponse.json(
        { success: false, error: 'Erro ao buscar empresas', message: error.message },
        { status: 500 }
      )
    }

    // Garantir que os dados estão no formato correto
    const formattedCompanies = (data || []).map((c: any) => ({
      id: c.id,
      name: c.name || 'Sem nome'
    })).filter((c: any) => c.id && c.name)

    console.log(`✅ ${formattedCompanies.length} empresas encontradas:`, formattedCompanies.map((c: any) => c.name))

    // Retornar no formato esperado pelo frontend
    return NextResponse.json({
      success: true,
      companies: formattedCompanies
    })
  } catch (error: any) {
    console.error('Erro ao listar empresas:', error)
    return NextResponse.json(
      { success: false, error: 'Erro ao listar empresas', message: error.message },
      { status: 500 }
    )
  }
}

