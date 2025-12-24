import { NextRequest, NextResponse } from 'next/server'

import { createClient } from '@supabase/supabase-js'

import { requireAuth } from '@/lib/api-auth'
import { redisCacheService, createCacheKey } from '@/lib/cache/redis-cache.service'
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
    const { searchParams } = new URL(request.url)
    const severity = searchParams.get('severity')
    const status = searchParams.get('status')

    // ✅ Cache Redis para alertas (TTL: 5 minutos)
    const cacheKey = createCacheKey('alerts_v4', severity || 'all', status || 'all')

    const cachedAlerts = await redisCacheService.get<unknown[]>(cacheKey)
    if (cachedAlerts) {
      return NextResponse.json(cachedAlerts)
    }

    // Query principal sem join para evitar erros de relacionamento
    let query = supabaseAdmin
      .from('gf_alerts')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100)

    if (severity && severity !== 'all') {
      query = query.eq('severity', severity)
    }

    if (status && status !== 'all') {
      if (status === 'open') {
        // Simplificado para garantir que retorne dados mesmo se assigned_to não existir
        query = query.eq('is_resolved', false)
      } else if (status === 'resolved') {
        query = query.eq('is_resolved', true)
      } else if (status === 'assigned') {
        // Se a coluna não existir, isso daria erro. Vamos manter apenas o filtro básico ou tentar checar de forma segura?
        // Por segurança, assumimos que 'assigned' é um subestado de open, mas se a coluna faltar, melhor não filtrar por ela.
        query = query.eq('is_resolved', false).not('assigned_to', 'is', null)
      }
    }

    const { data, error } = await query

    if (error) {
      // Se der erro (ex: coluna missing), tentar query fallback mais simples
      if (error.code === '42703') { // Undefined column
        const { data: fallbackData, error: fallbackError } = await supabaseAdmin
          .from('gf_alerts')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(100)

        if (!fallbackError && fallbackData) {
          // Continue com dados de fallback
          const formattedFallbackData = await getFormattedAlertsArray(fallbackData, supabaseAdmin)
          // Cache the fallback data (array)
          await redisCacheService.set(cacheKey, formattedFallbackData, 300)
          return NextResponse.json(formattedFallbackData)
        }
      }

      logError('Erro ao buscar alertas', { error, severity, status }, 'AlertsListAPI')
      return NextResponse.json(
        { error: 'Erro ao buscar alertas', message: error.message },
        { status: 500 }
      )
    }

    const formattedAlerts = await getFormattedAlertsArray(data || [], supabaseAdmin)
    // ✅ Armazenar no cache (TTL: 5 minutos - 300 segundos)
    await redisCacheService.set(cacheKey, formattedAlerts, 300)

    return NextResponse.json(formattedAlerts)
  } catch (error: unknown) {
    logError('Erro ao listar alertas', { error }, 'AlertsListAPI')
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido'
    return NextResponse.json(
      { error: 'Erro ao listar alertas', message: errorMessage },
      { status: 500 }
    )
  }
}

// Função auxiliar para formatar resposta e lidar com mapeamento de colunas (empresa_id vs company_id)
async function getFormattedAlertsArray(alertsData: any[], supabaseAdmin: any) {
  // Buscar empresas manualmente para enriquecer (evita erro de FK inexistente)
  // Suporte para ambos empresa_id (schema BR) e company_id (legacy/mixed)
  const companyIds = Array.from(new Set(alertsData.map((a: any) => a.empresa_id || a.company_id).filter(Boolean)))

  let companyMap: Record<string, string> = {}

  if (companyIds.length > 0) {
    try {
      const { data: companies } = await supabaseAdmin
        .from('empresas')
        .select('id, name')
        .in('id', companyIds)

      if (companies) {
        companyMap = companies.reduce((acc: any, curr: any) => {
          acc[curr.id] = curr.name
          return acc
        }, {})
      }
    } catch (err) {
      logError('Erro ao buscar nomes de empresas', { error: err }, 'AlertsListAPI')
    }
  }

  // Mapear dados para compatibilidade com o frontend
  return alertsData.map((alert: any) => {
    // Tentar extrair informações de detalhes se existirem
    const details = alert.details || {}
    const metadata = alert.metadata || {}

    const vehiclePlate = details.vehicle_plate || metadata.vehicle_plate || details.placa || metadata.placa
    const routeName = details.route_name || metadata.route_name || details.rota || metadata.rota
    const driverName = details.driver_name || metadata.driver_name || details.motorista || metadata.motorista
    const driverEmail = details.driver_email || metadata.driver_email

    const companyId = alert.empresa_id || alert.company_id
    const companyName = companyId ? (companyMap[companyId] || 'Empresa não encontrada') : null

    return {
      id: alert.id,
      message: alert.message || alert.title,
      description: alert.message,
      type: alert.alert_type || alert.type, // Suporte a alert_type
      severity: alert.severity,
      status: alert.is_resolved ? 'resolved' : alert.assigned_to ? 'assigned' : 'open',
      created_at: alert.created_at,
      is_resolved: alert.is_resolved,
      assigned_to: alert.assigned_to,

      // Mapear campos planos
      vehicle_plate: vehiclePlate,
      route_name: routeName,

      // Mapear objetos relacionados
      companies: companyName ? { name: companyName } : null,

      // Simular objetos para UI
      veiculos: vehiclePlate ? { plate: vehiclePlate } : null,
      routes: routeName ? { name: routeName } : null,
      motoristas: (driverName || driverEmail) ? { name: driverName, email: driverEmail } : null
    }
  })
}
