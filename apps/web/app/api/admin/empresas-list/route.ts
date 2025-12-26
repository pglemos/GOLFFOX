import { NextRequest, NextResponse } from 'next/server'

import { createClient } from '@supabase/supabase-js'

import { requireAuth } from '@/lib/api-auth'
import { redisCacheService, createCacheKey, withRedisCache } from '@/lib/cache/redis-cache.service'
import { info, logError, logger } from '@/lib/logger'

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
    
    // ✅ Cache Redis para lista de empresas (TTL: 5 minutos)
    const cacheKey = createCacheKey('empresas', 'list')
    
    const result = await withRedisCache(
      cacheKey,
      async () => {
        // Buscar TODAS as empresas primeiro (sem filtro)
        let { data, error } = await supabaseAdmin
          .from('empresas')
          .select('id, name, is_active')
    
        // Se houver erro, tentar com seleção mínima
        if (error) {
          logger.warn('⚠️ Erro na busca inicial, tentando com seleção mínima:', error.message)
          const result = await supabaseAdmin
            .from('empresas')
            .select('id, name, is_active')
          
          data = result.data?.map((c: { id: string; name: string; is_active?: boolean }) => ({ ...c, is_active: c.is_active ?? true })) || null
          error = result.error
        }
        
        // Filtrar empresas inativas se a coluna existir (sem usar .eq() na query)
        if (data && !error) {
          // Tentar filtrar is_active se existir na resposta
          const activeCompanies = data.filter((c: { id: string; name: string; is_active?: boolean }) => {
            // Se não tem campo is_active ou se is_active é true/null/undefined, incluir
            return c.is_active !== false
          })
          
          // Ordenar por nome manualmente
          activeCompanies.sort((a: { name?: string }, b: { name?: string }) => {
            const nameA = (a.name || '').toLowerCase()
            const nameB = (b.name || '').toLowerCase()
            return nameA.localeCompare(nameB)
          })
          
          data = activeCompanies
        }

        if (error) {
          throw error
        }

        // Garantir que os dados estão no formato correto
        const formattedCompanies = (data || []).map((c: { id: string; name: string }) => ({
          id: c.id,
          name: c.name || 'Sem nome'
        })).filter((c: { id: string; name: string }) => c.id && c.name)

        return formattedCompanies
      },
      300 // 5 minutos
    )

    // Log apenas em desenvolvimento
    if (isDevelopment) {
      info(`✅ ${result.length} empresas encontradas`)
    }

    // Retornar no formato esperado pelo frontend
    return NextResponse.json({
      success: true,
      companies: result
    })
  } catch (error: unknown) {
    const err = error as { message?: string }
    logError('Erro ao listar empresas', { error }, 'CompaniesListAPI')
    return NextResponse.json(
      { success: false, error: 'Erro ao listar empresas', message: err.message },
      { status: 500 }
    )
  }
}

