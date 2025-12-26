import { NextRequest, NextResponse } from 'next/server'

import { createClient } from '@supabase/supabase-js'

import { requireAuth } from '@/lib/api-auth'
import { successResponse, errorResponse, validationErrorResponse } from '@/lib/api-response'
import { ListVeiculosQuery, cqrsBus } from '@/lib/cqrs'
import '@/lib/cqrs/bus/register-handlers' // Registrar handlers
import { logError } from '@/lib/logger'
import { withRateLimit } from '@/lib/rate-limit'
import { validateWithSchema, vehicleListQuerySchema } from '@/lib/validation/schemas'

export const runtime = 'nodejs'

// Flag para habilitar CQRS (transição gradual)
const USE_CQRS = process.env.ENABLE_CQRS === 'true'

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !serviceKey) {
    throw new Error('Supabase não configurado')
  }
  return createClient(url, serviceKey)
}

/**
 * GET /api/admin/veiculos-list
 * Listar veículos com CQRS opcional
 */
async function listVehiclesHandler(request: NextRequest) {
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

    const { transportadora_id, carrier_id, page = 1, limit = 50 } = validation.data
    const targetCarrierId = transportadora_id || carrier_id

    if (USE_CQRS) {
      // ✅ Usar CQRS Query
      const query = new ListVeiculosQuery({
        transportadora_id: targetCarrierId,
        page,
        limit
      })
      const result = await cqrsBus.executeQuery(query) as {
        success: boolean
        vehicles?: any[]
        count?: number
        page?: number
        limit?: number
        error?: string
      }

      if (!result.success) {
        return errorResponse(result.error || 'Erro desconhecido', 500, 'Erro ao listar veículos')
      }

      return successResponse(result.vehicles || [], 200, {
        count: result.count,
        limit: result.limit,
        offset: ((result.page || 1) - 1) * (result.limit || 50)
      })
    }

    // Fallback: usar Supabase diretamente
    const supabaseAdmin = getSupabaseAdmin()

    // Buscar veículos com relacionamento carriers via transportadora_id
    let query = supabaseAdmin
      .from('veiculos')
      .select('*, transportadora:transportadoras(id, name)')
      .order('created_at', { ascending: false })

    if (targetCarrierId) {
      query = query.eq('transportadora_id', targetCarrierId)
    }

    const { data, error } = await query

    if (error) {
      logError('Erro ao buscar veículos', { error }, 'VehiclesListAPI')
      return errorResponse(error, 500, 'Erro ao buscar veículos')
    }

    // Mapear para incluir transportadora_name de forma plana
    const vehiclesWithTransportadora = (data || []).map((v: any) => ({
      ...v,
      transportadora_name: v.transportadora?.name || null,
      transportadora: undefined  // Remover objeto aninhado para manter resposta limpa
    }))

    return NextResponse.json(vehiclesWithTransportadora)
  } catch (error: unknown) {
    logError('Erro ao listar veículos', { error }, 'VehiclesListAPI')
    return errorResponse(error, 500, 'Erro ao listar veículos')
  }
}

// Exportar com rate limiting
export const GET = withRateLimit(listVehiclesHandler, 'api')
