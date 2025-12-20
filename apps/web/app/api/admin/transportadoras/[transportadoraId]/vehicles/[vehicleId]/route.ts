import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-client'
import { requireAuth } from '@/lib/api-auth'
import { logError } from '@/lib/logger'
import { invalidateEntityCache } from '@/lib/next-cache'

// PUT /api/admin/transportadoras/[transportadoraId]/vehicles/[vehicleId]
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ transportadoraId?: string; carrierId?: string; vehicleId: string }> }
) {
  // Verificar autenticação admin
  const authError = await requireAuth(request, 'admin')
  if (authError) return authError

  const params = await context.params

  try {
    const supabase = getSupabaseAdmin()
    const transportadoraId = params.transportadoraId || params.carrierId
    const { vehicleId } = params
    if (!transportadoraId) {
      return NextResponse.json(
        { success: false, error: 'ID da transportadora não fornecido' },
        { status: 400 }
      )
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
      vehicle_type,
      renavam,
      chassis
    } = body

    if (!plate) {
      return NextResponse.json(
        { success: false, error: 'Placa é obrigatória' },
        { status: 400 }
      )
    }

    const { data: veiculo, error } = await supabase
      .from('vehicles')
      .update({
        plate,
        prefix: prefix || null,
        manufacturer: manufacturer || null,
        model: model || null,
        year: year || null,
        capacity: capacity || null,
        is_active: is_active ?? true,
        vehicle_type: vehicle_type || 'bus',
        renavam: renavam || null,
        chassis: chassis || null
      } as any)
      .eq('id', vehicleId)
      .eq('transportadora_id', transportadoraId)
      .select()
      .single()

    if (error) {
      logError('Erro ao atualizar veículo', { error, vehicleId, transportadoraId }, 'TransportadoraVehicleUpdateAPI')
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      )
    }

    // Invalidar cache após atualização
    await invalidateEntityCache('veiculo', vehicleId)

    return NextResponse.json({ success: true, veiculo })
  } catch (error: any) {
    logError('Erro na API de atualizar veículo', { error, vehicleId: (await context.params).vehicleId }, 'TransportadoraVehicleUpdateAPI')
    return NextResponse.json(
      { success: false, error: error.message || 'Erro desconhecido' },
      { status: 500 }
    )
  }
}

// DELETE /api/admin/transportadoras/[transportadoraId]/vehicles/[vehicleId]
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ transportadoraId?: string; carrierId?: string; vehicleId: string }> }
) {
  // Verificar autenticação admin
  const authError = await requireAuth(request, 'admin')
  if (authError) return authError

  const params = await context.params

  try {
    const supabase = getSupabaseAdmin()
    const transportadoraId = params.transportadoraId || params.carrierId
    const { vehicleId } = params
    if (!transportadoraId) {
      return NextResponse.json(
        { success: false, error: 'ID da transportadora não fornecido' },
        { status: 400 }
      )
    }

    const { error } = await supabase
      .from('vehicles')
      .delete()
      .eq('id', vehicleId)
      .eq('transportadora_id', transportadoraId)

    if (error) {
      logError('Erro ao excluir veículo', { error, vehicleId, transportadoraId }, 'TransportadoraVehicleDeleteAPI')
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      )
    }

    // Invalidar cache após exclusão
    await invalidateEntityCache('veiculo', vehicleId)

    return NextResponse.json({ success: true })
  } catch (error: any) {
    logError('Erro na API de excluir veículo', { error, vehicleId: (await context.params).vehicleId }, 'TransportadoraVehicleDeleteAPI')
    return NextResponse.json(
      { success: false, error: error.message || 'Erro desconhecido' },
      { status: 500 }
    )
  }
}

