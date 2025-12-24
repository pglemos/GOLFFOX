import { NextRequest, NextResponse } from 'next/server'

import { createClient } from '@supabase/supabase-js'

import { requireAuth } from '@/lib/api-auth'
import { redisCacheService, createCacheKey } from '@/lib/cache/redis-cache.service'
import { logError, warn } from '@/lib/logger'

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
      'v_admin_dashboard_kpis',
      'v_operador_dashboard_kpis',
      'v_operador_dashboard_kpis_secure'
    ]

    let kpisData: unknown[] = []
    let lastError: unknown = null

    for (const viewName of views) {
      try {
        // Views de KPIs geralmente têm colunas específicas, mas como são views materializadas,
        // selecionar todas as colunas é aceitável (já são agregadas)
        // Otimização: selecionar apenas colunas usadas
        const { data, error } = await supabaseAdmin
          .from(viewName)
          .select('active_trips, active_vehicles, total_passengers, total_companies, total_operators, total_drivers')

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

    // Buscar contagem real de alertas críticos (unresolved)
    const { count: alertsCount } = await supabaseAdmin
      .from('gf_alerts')
      .select('*', { count: 'exact', head: true })
      .eq('is_resolved', false)
      .in('severity', ['critical', 'error'])

    // Mapear campos da view para a interface esperada pelo componente AdminDashboardClient
    // A view v_admin_dashboard_kpis retorna: total_companies, total_operators, total_drivers, total_passengers, active_trips, active_vehicles
    // O componente espera: company_id, company_name, trips_today, vehicles_active, employees_in_transit, critical_alerts, routes_today, trips_completed, trips_in_progress
    interface ViewKpiData {
      active_trips?: number
      active_vehicles?: number
      total_passengers?: number
      [key: string]: unknown
    }
    const mappedKpis = kpisData.map((viewData: ViewKpiData) => ({
      company_id: 'all',
      company_name: 'Todas as Empresas',
      trips_today: viewData.active_trips || 0,
      vehicles_active: viewData.active_vehicles || 0,
      employees_in_transit: viewData.total_passengers || 0,
      critical_alerts: alertsCount || 0,
      routes_today: viewData.active_trips || 0, // Aproximação
      trips_completed: 0, // Não disponível na view atualmente
      trips_in_progress: viewData.active_trips || 0,
    }))

    const response = {
      success: true,
      kpis: mappedKpis
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

