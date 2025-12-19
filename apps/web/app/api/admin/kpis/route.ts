import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { requireAuth } from '@/lib/api-auth'
import { logError, warn } from '@/lib/logger'
import { redisCacheService, createCacheKey } from '@/lib/cache/redis-cache.service'

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

    // ✅ Cache Redis para KPIs (TTL: 1 hora - atualizado via cron)
    const cacheKey = createCacheKey('kpis', 'admin')
    
    const cachedKPIs = await redisCacheService.get<{ success: boolean; kpis: unknown[] }>(cacheKey)
    if (cachedKPIs) {
      return NextResponse.json(cachedKPIs)
    }

    const supabaseAdmin = getSupabaseAdmin()
    
    // Tentar diferentes views em ordem de prioridade
    const views = [
      'v_admin_kpis_materialized',
      'v_admin_kpis',
      'v_operator_kpis'
    ]

    let kpisData: unknown[] = []
    let lastError: unknown = null

    for (const viewName of views) {
      try {
        // Views de KPIs geralmente têm colunas específicas, mas como são views materializadas,
        // selecionar todas as colunas é aceitável (já são agregadas)
        const { data, error } = await supabaseAdmin
          .from(viewName)
          .select('*')
        
        if (error) {
          const code = (error as { code?: string })?.code
          if (code === 'PGRST205') {
            // View não existe, tentar próxima
            continue
          }
          lastError = error
          continue
        }

        if (data && data.length > 0) {
          kpisData = data
          break
        }
      } catch (err) {
        lastError = err
        continue
      }
    }

    if (kpisData.length === 0 && lastError) {
      warn('Nenhuma view de KPIs disponível, retornando array vazio', {}, 'KPIsAPI')
    }

    const response = {
      success: true,
      kpis: kpisData
    }

    // ✅ Armazenar no cache (TTL: 1 hora - 3600 segundos)
    // Nota: Cron job atualiza materialized views e invalida cache
    await redisCacheService.set(cacheKey, response, 3600)

    return NextResponse.json(response)
  } catch (err) {
    logError('Erro ao buscar KPIs', { error: err }, 'KPIsAPI')
    const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido'
    return NextResponse.json(
      { error: 'Erro ao buscar KPIs', message: errorMessage },
      { status: 500 }
    )
  }
}

