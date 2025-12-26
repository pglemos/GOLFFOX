import { NextRequest, NextResponse } from 'next/server'

import { z } from 'zod'

import { requireAuth } from '@/lib/api-auth'
import { successResponse, errorResponse, validationErrorResponse } from '@/lib/api-response'
import { redisCacheService, createCacheKey, withRedisCache } from '@/lib/cache/redis-cache.service'
import { logger, logError } from '@/lib/logger'
import { supabaseServiceRole } from '@/lib/supabase-server'
import { createVehicleSchema, validateWithSchema, vehicleListQuerySchema } from '@/lib/validation/schemas'
import type { Database } from '@/types/supabase'

type VeiculosInsert = Database['public']['Tables']['veiculos']['Insert']

export const runtime = 'nodejs'

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  })
}

export async function GET(request: NextRequest) {
  try {
    const authErrorResponse = await requireAuth(request, 'admin')
    if (authErrorResponse) return authErrorResponse

    const { searchParams } = new URL(request.url)
    const queryParams = Object.fromEntries(searchParams.entries())

    // Validar query params
    const validation = validateWithSchema(vehicleListQuerySchema, queryParams)
    if (!validation.success) {
      return validationErrorResponse(validation.error)
    }

    const { page, limit, transportadora_id, carrier_id, status } = validation.data
    const offset = (page - 1) * limit
    const targetCarrierId = transportadora_id || carrier_id

    // ✅ Cache Redis para lista de veículos (TTL: 5 minutos)
    const cacheKey = createCacheKey('veiculos', `list-${targetCarrierId || 'all'}-${status || 'all'}-${page}`)

    const result = await withRedisCache(
      cacheKey,
      async () => {
        let query = supabaseServiceRole
          .from('veiculos')
          .select('id, plate, model, brand, year, capacity, prefix, vehicle_type, fuel_type, color, chassis, renavam, photo_url, is_active, empresa_id, transportadora_id, created_at, updated_at', { count: 'exact' })

        if (targetCarrierId) {
          query = query.eq('transportadora_id', targetCarrierId)
        }

        if (status) {
          query = query.eq('is_active', status === 'active')
        }

        const { data, error, count } = await query
          .order('created_at', { ascending: false })
          .range(offset, offset + limit - 1)

        if (error) throw error

        return { data: data || [], count: count || 0 }
      },
      300 // 5 minutos
    )

    return successResponse(result.data, 200, {
      count: result.count,
      limit,
      offset
    })
  } catch (err) {
    logError('Erro ao listar veículos', { error: err }, 'VehiclesAPI')
    return errorResponse(err, 500, 'Erro ao listar veículos')
  }
}

export async function POST(request: NextRequest) {
  try {
    const authErrorResponse = await requireAuth(request, 'admin')
    if (authErrorResponse) return authErrorResponse

    const body = await request.json()

    // ✅ Validar usando schema compartilhado
    const validation = validateWithSchema(createVehicleSchema, body)
    if (!validation.success) {
      return validationErrorResponse(validation.error)
    }
    const validated = validation.data

    const veiculoData: Partial<VeiculosInsert> = {
      plate: validated.plate,
      model: validated.model,
      brand: validated.brand,
      prefix: validated.prefix,
      year: validated.year,
      capacity: validated.capacity,
      empresa_id: validated.empresa_id,
      transportadora_id: validated.transportadora_id,
      is_active: validated.is_active,
    }

    const { data: newVehicle, error: createError } = await supabaseServiceRole
      .from('veiculos')
      .insert(veiculoData)
      .select()
      .single()

    if (createError) {
      logError('Erro ao criar veículo', { error: createError }, 'VehiclesAPI')
      return errorResponse(createError, 500, 'Erro ao criar veículo')
    }

    return successResponse(newVehicle, 201)
  } catch (err) {
    logError('Erro ao processar criação de veículo', { error: err }, 'VehiclesAPI')
    return errorResponse(err, 500, 'Erro ao processar requisição')
  }
}
