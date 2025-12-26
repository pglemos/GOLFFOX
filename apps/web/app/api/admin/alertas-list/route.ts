import { NextRequest, NextResponse } from 'next/server'

import { requireAuth } from '@/lib/api-auth'
import { successResponse, errorResponse, validationErrorResponse } from '@/lib/api-response'
import { redisCacheService, createCacheKey } from '@/lib/cache/redis-cache.service'
import { logError } from '@/lib/logger'
import { supabaseServiceRole } from '@/lib/supabase-server'
import { validateWithSchema, alertListQuerySchema } from '@/lib/validation/schemas'
import type { Database } from '@/types/supabase'

type GfAlertsRow = Database['public']['Tables']['gf_alerts']['Row']
type EmpresasRow = Database['public']['Tables']['empresas']['Row']

export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  try {
    const authErrorResponse = await requireAuth(request, 'admin')
    if (authErrorResponse) return authErrorResponse

    const { searchParams } = new URL(request.url)
    const queryParams = Object.fromEntries(searchParams.entries())

    // Validar query params
    const validation = validateWithSchema(alertListQuerySchema, queryParams)
    if (!validation.success) {
      return validationErrorResponse(validation.error)
    }

    const { severity, status, page = 1, limit = 20 } = validation.data
    const offset = (page - 1) * limit

    // ✅ Cache Redis para alertas (TTL: 5 minutos)
    const cacheKey = createCacheKey('alerts_v4', severity || 'all', status || 'all', String(page))

    const cachedData = await redisCacheService.get<{ data: unknown[], count: number }>(cacheKey)
    if (cachedData) {
      return successResponse(cachedData.data, 200, { count: cachedData.count, limit, offset })
    }

    // Query principal sem join para evitar erros de relacionamento
    // Colunas existentes: id, message, alert_type, severity, is_resolved, is_read, empresa_id, metadata, created_at, resolved_at, resolved_by, motorista_id, viagem_id, veiculo_id, rota_id, transportadora_id, passenger_id
    let query = supabaseServiceRole
      .from('gf_alerts')
      .select('id, message, alert_type, severity, is_resolved, is_read, empresa_id, metadata, created_at, resolved_at, resolved_by, motorista_id, viagem_id, veiculo_id, rota_id, transportadora_id, passenger_id', { count: 'exact' })
      .order('created_at', { ascending: false })

    if (severity && severity !== 'all') {
      query = query.eq('severity', severity)
    }

    if (status && status !== 'all') {
      if (status === 'open') {
        query = query.eq('is_resolved', false)
      } else if (status === 'resolved') {
        query = query.eq('is_resolved', true)
      }
      // Nota: 'assigned' não tem coluna no schema, então é tratado no frontend via metadata
    }

    const { data, error, count } = await query.range(offset, offset + limit - 1)

    if (error) {
      logError('Erro ao buscar alertas', { error, severity, status }, 'AlertsListAPI')
      return errorResponse(error, 500, 'Erro ao buscar alertas')
    }

    const formattedAlerts = await getFormattedAlertsArray(data || [], supabaseServiceRole)

    const result = { data: formattedAlerts, count: count || 0 }

    // ✅ Armazenar no cache (TTL: 5 minutos - 300 segundos)
    await redisCacheService.set(cacheKey, result, 300)

    return successResponse(formattedAlerts, 200, { count: count || 0, limit, offset })
  } catch (err) {
    logError('Erro ao listar alertas', { error: err }, 'AlertsListAPI')
    return errorResponse(err, 500, 'Erro ao listar alertas')
  }
}

// Função auxiliar para formatar resposta e lidar com mapeamento de colunas
async function getFormattedAlertsArray(alertsData: GfAlertsRow[], supabaseAdmin: typeof supabaseServiceRole) {
  // Buscar empresas manualmente para enriquecer
  const companyIds = Array.from(new Set(alertsData.map((a: GfAlertsRow) => a.empresa_id).filter(Boolean))) as string[]

  let companyMap: Record<string, string> = {}

  if (companyIds.length > 0) {
    try {
      const { data: companies } = await supabaseAdmin
        .from('empresas')
        .select('id, name')
        .in('id', companyIds)

      if (companies) {
        companyMap = companies.reduce((acc: Record<string, string>, curr: EmpresasRow) => {
          acc[curr.id!] = curr.name || ''
          return acc
        }, {})
      }
    } catch (err) {
      logError('Erro ao buscar nomes de empresas', { error: err }, 'AlertsListAPI')
    }
  }

  // Mapear dados para compatibilidade com o frontend
  return alertsData.map((alert: GfAlertsRow) => {
    // Metadata pode conter informações adicionais
    const metadata = (alert.metadata as Record<string, unknown>) || {}

    const vehiclePlate = metadata.vehicle_plate || metadata.placa
    const routeName = metadata.route_name || metadata.rota
    const driverName = metadata.driver_name || metadata.motorista
    const driverEmail = metadata.driver_email
    const assignedTo = metadata.assigned_to

    const companyId = alert.empresa_id
    const companyName = companyId ? (companyMap[companyId] || 'Empresa não encontrada') : null

    return {
      id: alert.id,
      message: alert.message,
      description: alert.message,
      type: alert.alert_type,
      severity: alert.severity,
      status: alert.is_resolved ? 'resolved' : assignedTo ? 'assigned' : 'open',
      created_at: alert.created_at,
      is_resolved: alert.is_resolved,
      is_read: alert.is_read,
      resolved_at: alert.resolved_at,
      resolved_by: alert.resolved_by,

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
