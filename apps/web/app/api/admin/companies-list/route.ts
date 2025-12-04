import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { requireAuth } from '@/lib/api-auth'
import { logger } from '@/lib/logger'

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
    // Validar autenticação (apenas admin)
    const isDevelopment = process.env.NODE_ENV === 'development'
    const isVercelProduction = process.env.VERCEL === '1' && process.env.VERCEL_ENV === 'production'
    
    // ✅ NUNCA pular autenticação em produção (Vercel)
    const authErrorResponse = await requireAuth(request, 'admin')
    if (authErrorResponse) {
      // Em desenvolvimento local, apenas logar aviso (mas retornar erro em produção)
      if (isDevelopment && !isVercelProduction) {
        logger.warn('⚠️ Autenticação falhou em desenvolvimento, mas continuando...')
        // Ainda assim retornar erro para forçar correção
        return authErrorResponse
      }
      return authErrorResponse
    }

    const supabaseAdmin = getSupabaseAdmin()
    
    logger.log('🔍 Buscando empresas no banco de dados...')
    
    // Buscar TODAS as empresas primeiro (sem filtro)
    logger.log('🔍 Buscando todas as empresas...')
    let { data, error } = await supabaseAdmin
      .from('companies')
      .select('id, name, is_active')
    
    // Se houver erro, tentar com seleção mínima
    if (error) {
      logger.warn('⚠️ Erro na busca inicial, tentando com seleção mínima:', error.message)
      const result = await supabaseAdmin
        .from('companies')
        .select('id, name')
      
      data = result.data
      error = result.error
    }
    
    // Filtrar empresas inativas se a coluna existir (sem usar .eq() na query)
    if (data && !error) {
      // Tentar filtrar is_active se existir na resposta
      const activeCompanies = data.filter((c: any) => {
        // Se não tem campo is_active ou se is_active é true/null/undefined, incluir
        return c.is_active !== false
      })
      
      // Ordenar por nome manualmente
      activeCompanies.sort((a: any, b: any) => {
        const nameA = (a.name || '').toLowerCase()
        const nameB = (b.name || '').toLowerCase()
        return nameA.localeCompare(nameB)
      })
      
      data = activeCompanies
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

    logger.log(`✅ ${formattedCompanies.length} empresas encontradas:`, formattedCompanies.map((c: any) => c.name))

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

