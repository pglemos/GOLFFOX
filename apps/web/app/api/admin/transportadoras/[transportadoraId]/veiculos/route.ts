import { NextRequest, NextResponse } from 'next/server'

import { requireAuth } from '@/lib/api-auth'
import { successResponse, errorResponse, validationErrorResponse, unauthorizedResponse } from '@/lib/api-response'
import { logError } from '@/lib/logger'
import { getSupabaseAdmin } from '@/lib/supabase-client'

// GET /api/admin/transportadoras/[transportadoraId]/veiculos
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ transportadoraId: string }> }
) {
  try {
    const { transportadoraId } = await context.params

    // Verificar autenticação admin
    const authError = await requireAuth(request, 'admin')
    if (authError) return authError

    if (!transportadoraId) {
      return validationErrorResponse('ID da transportadora não fornecido')
    }

    const supabase = getSupabaseAdmin()

    // Buscar veículos da transportadora
    const { data: veiculos, error } = await supabase
      .from('veiculos')
      .select('id, plate, model, brand, year, capacity, prefix, vehicle_type, fuel_type, color, chassis, renavam, photo_url, is_active, empresa_id, transportadora_id, created_at, updated_at')
      .eq('transportadora_id', transportadoraId)
      .order('created_at', { ascending: false })

    if (error) {
      logError('Erro ao buscar veículos', { error, transportadoraId }, 'TransportadoraVehiclesAPI')
      return errorResponse(error, 500, 'Erro ao buscar veículos')
    }

    return successResponse(veiculos || [])
  } catch (err) {
    logError('Erro na API de veículos', { error: err }, 'TransportadoraVehiclesAPI')
    return errorResponse(err, 500, 'Erro interno do servidor')
  }
}

// POST /api/admin/transportadoras/[transportadoraId]/veiculos
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ transportadoraId: string }> }
) {
  try {
    const { transportadoraId } = await context.params

    // Verificar autenticação admin
    const authError = await requireAuth(request, 'admin')
    if (authError) return authError

    if (!transportadoraId) {
      return validationErrorResponse('ID da transportadora não fornecido')
    }

    const body = await request.json()
    const {
      plate,
      prefix,
      manufacturer,
      model,
      year,
      capacity,
      is_active,
      veiculo_type,
      renavam,
      chassis
    } = body

    if (!plate) return validationErrorResponse('Placa é obrigatória')

    const supabase = getSupabaseAdmin()

    const { data: veiculo, error } = await supabase
      .from('veiculos')
      .insert([
        {
          transportadora_id: transportadoraId,
          plate,
          prefix: prefix || null,
          manufacturer: manufacturer || null,
          model: model || null,
          year: year || null,
          capacity: capacity || null,
          is_active: is_active ?? true,
          veiculo_type: veiculo_type || 'bus',
          renavam: renavam || null,
          chassis: chassis || null
        }
      ])
      .select()
      .single()

    if (error) {
      logError('Erro ao criar veículo', { error, transportadoraId }, 'TransportadoraVehiclesAPI')
      return errorResponse(error, 500, 'Erro ao criar veículo no banco de dados')
    }

    return successResponse(veiculo)
  } catch (err) {
    logError('Erro na API de criar veículo', { error: err }, 'TransportadoraVehiclesAPI')
    return errorResponse(err, 500, 'Erro ao processar requisição')
  }
}
