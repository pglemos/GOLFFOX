import { NextRequest, NextResponse } from 'next/server'

import { requireAuth } from '@/lib/api-auth'
import { successResponse, errorResponse, validationErrorResponse } from '@/lib/api-response'
import { logError, logger } from '@/lib/logger'
import { supabaseServiceRole } from '@/lib/supabase-server'
import { createTripSchema, validateWithSchema, tripListQuerySchema } from '@/lib/validation/schemas'
import type { Database } from '@/types/supabase'

type ViagensInsert = Database['public']['Tables']['viagens']['Insert']

export const runtime = 'nodejs'

// OPTIONS handler para CORS
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  })
}

/**
 * GET /api/admin/trips
 * Listar viagens
 */
export async function GET(request: NextRequest) {
  try {
    const authErrorResponse = await requireAuth(request, 'admin')
    if (authErrorResponse) return authErrorResponse

    const { searchParams } = new URL(request.url)
    const queryParams = Object.fromEntries(searchParams.entries())

    // Validar query params
    const validation = validateWithSchema(tripListQuerySchema, queryParams)
    if (!validation.success) {
      return validationErrorResponse(validation.error)
    }

    const {
      page, limit, company_id, companyId, veiculo_id, vehicle_id,
      route_id, rota_id, motorista_id, driver_id, status, start_date, end_date
    } = validation.data

    const offset = (page - 1) * limit
    const targetCompanyId = company_id || companyId
    const targetVehicleId = veiculo_id || vehicle_id
    const targetRouteId = route_id || rota_id
    const targetDriverId = motorista_id || driver_id

    // Use supabaseServiceRole directly

    // Selecionar apenas colunas necessárias para listagem
    const tripColumns = 'id,rota_id,veiculo_id,motorista_id,status,scheduled_date,scheduled_start_time,start_time,end_time,actual_start_time,actual_end_time,distance_km,notes,created_at,updated_at'
    let query = supabaseServiceRole.from('viagens').select(tripColumns, { count: 'exact' })

    // Aplicar filtros
    if (targetVehicleId) query = query.eq('veiculo_id', targetVehicleId)
    if (targetRouteId) query = query.eq('rota_id', targetRouteId)
    if (targetDriverId) query = query.eq('motorista_id', targetDriverId)
    if (status) query = query.eq('status', status)
    if (start_date) query = query.gte('scheduled_date', start_date)
    if (end_date) query = query.lte('scheduled_date', end_date)

    if (targetCompanyId) {
      const { data: routes } = await supabaseServiceRole
        .from('rotas')
        .select('id')
        .eq('empresa_id', targetCompanyId)

      if (routes && routes.length > 0) {
        query = query.in('rota_id', routes.map(r => r.id))
      } else {
        return successResponse([], 200, { count: 0, limit, offset })
      }
    }

    const { data, error, count } = await query
      .order('scheduled_date', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      logError('Erro ao buscar viagens', { error }, 'TripsAPI')
      return errorResponse(error, 500, 'Erro ao buscar viagens')
    }

    return successResponse(data || [], 200, {
      count: count || 0,
      limit,
      offset
    })
  } catch (err) {
    logError('Erro ao listar viagens', { error: err }, 'TripsAPI')
    return errorResponse(err, 500, 'Erro ao listar viagens')
  }
}

/**
 * POST /api/admin/trips
 * Criar nova viagem
 */
export async function POST(request: NextRequest) {
  try {
    const authErrorResponse = await requireAuth(request, 'admin')
    if (authErrorResponse) return authErrorResponse

    const body = await request.json()

    // Validar com Zod centralizado
    const validation = validateWithSchema(createTripSchema, body)
    if (!validation.success) {
      return validationErrorResponse(validation.error)
    }

    const validated = validation.data

    let finalScheduledDate = validated.scheduled_date
    if (!finalScheduledDate) {
      finalScheduledDate = new Date().toISOString().split('T')[0]
    }

    // Use supabaseServiceRole directly

    const tripData: Partial<ViagensInsert> = {
      rota_id: validated.rota_id,
      veiculo_id: validated.veiculo_id,
      motorista_id: validated.motorista_id,
      scheduled_date: finalScheduledDate,
      scheduled_start_time: validated.scheduled_start_time,
      start_time: validated.start_time,
      end_time: validated.end_time,
      status: (validated.status === 'inProgress' ? 'in_progress' : validated.status) as any,
      passenger_count: validated.passenger_count,
      notes: validated.notes,
    }

    const { data: newTrip, error: createError } = await supabaseServiceRole
      .from('viagens')
      .insert(tripData)
      .select()
      .single()

    if (createError) {
      logError('Erro ao criar viagem', { error: createError }, 'TripsAPI')
      return errorResponse(createError, 500, 'Erro ao criar viagem')
    }

    return successResponse(newTrip, 201)
  } catch (err) {
    logError('Erro ao processar criação de viagem', { error: err }, 'TripsAPI')
    return errorResponse(err, 500, 'Erro ao processar requisição')
  }
}
