import { NextRequest, NextResponse } from 'next/server'

import { requireAuth } from '@/lib/api-auth'
import { successResponse, errorResponse, validationErrorResponse } from '@/lib/api-response'
import { logger, logError } from '@/lib/logger'
import { supabaseServiceRole } from '@/lib/supabase-server'
import { createRouteSchema, validateWithSchema, routeListQuerySchema } from '@/lib/validation/schemas'
import type { Database } from '@/types/supabase'

export const runtime = 'nodejs'

type RotasInsert = Database['public']['Tables']['rotas']['Insert']

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
 * GET /api/admin/rotas
 * Listar rotas
 */
export async function GET(request: NextRequest) {
  try {
    const authErrorResponse = await requireAuth(request, 'admin')
    if (authErrorResponse) return authErrorResponse

    const { searchParams } = new URL(request.url)
    const queryParams = Object.fromEntries(searchParams.entries())

    // Validar query params
    const validation = validateWithSchema(routeListQuerySchema, queryParams)
    if (!validation.success) {
      return validationErrorResponse(validation.error)
    }

    const { page, limit, empresa_id, company_id } = validation.data
    const offset = (page - 1) * limit
    const targetCompanyId = empresa_id || company_id

    // Selecionar apenas colunas necessárias para listagem (otimização de performance)
    const routeColumns = 'id,name,empresa_id,transportadora_id,origin,destination,origin_lat,origin_lng,destination_lat,destination_lng,polyline,is_active,created_at,updated_at'
    let query = supabaseServiceRole.from('rotas').select(routeColumns, { count: 'exact' })

    if (targetCompanyId) {
      query = query.eq('empresa_id', targetCompanyId)
    }

    const { data, error, count } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      logError('Erro ao buscar rotas', { error }, 'RoutesAPI')
      return errorResponse(error, 500, 'Erro ao buscar rotas')
    }

    return successResponse(data || [], 200, {
      count: count || 0,
      limit,
      offset
    })
  } catch (err) {
    logError('Erro ao listar rotas', { error: err }, 'RoutesAPI')
    return errorResponse(err, 500, 'Erro ao listar rotas')
  }
}

/**
 * POST /api/admin/rotas
 * Criar nova rota (endpoint mínimo para testes)
 */
export async function POST(request: NextRequest) {
  try {
    const authErrorResponse = await requireAuth(request, 'admin')
    if (authErrorResponse) return authErrorResponse

    const body = await request.json()

    // Validar com Zod centralizado
    const validation = validateWithSchema(createRouteSchema, body)
    if (!validation.success) {
      return validationErrorResponse(validation.error)
    }

    const validated = validation.data

    const routeData: Partial<RotasInsert> = {
      name: validated.name,
      empresa_id: validated.empresa_id!,
      transportadora_id: validated.transportadora_id,
      origin: validated.origin,
      destination: validated.destination,
      origin_lat: validated.origin_lat,
      origin_lng: validated.origin_lng,
      destination_lat: validated.destination_lat,
      destination_lng: validated.destination_lng,
      polyline: validated.polyline,
      is_active: validated.is_active,
    }

    const { data: newRoute, error: createError } = await supabaseServiceRole
      .from('rotas')
      .insert(routeData)
      .select()
      .single()

    if (createError) {
      logError('Erro ao criar rota', { error: createError }, 'RoutesAPI')
      return errorResponse(createError, 500, 'Erro ao criar rota')
    }

    return successResponse(newRoute, 201)
  } catch (err) {
    logError('Erro ao processar criação de rota', { error: err }, 'RoutesAPI')
    return errorResponse(err, 500, 'Erro ao processar requisição')
  }
}
