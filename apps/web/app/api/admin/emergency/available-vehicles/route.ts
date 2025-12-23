import { NextRequest, NextResponse } from 'next/server'

import { requireAuth } from '@/lib/api-auth'
import { logError } from '@/lib/logger'
import { getSupabaseAdmin } from '@/lib/supabase-client'

export const runtime = 'nodejs'

export async function GET(req: NextRequest) {
  // Verificar autenticação admin
  const authError = await requireAuth(req, 'admin')
  if (authError) return authError

  try {
    const supabase = getSupabaseAdmin()

    // Buscar veículos ativos
    const { data: veiculos, error: vehiclesError } = await supabase
      .from('veiculos')
      .select('id, plate, model, brand, is_active, transportadora_id')
      .eq('is_active', true)
      .order('plate', { ascending: true })

    if (vehiclesError) {
      throw vehiclesError
    }

    // Buscar viagens em andamento para filtrar veículos ocupados
    const { data: activeTrips, error: tripsError } = await supabase
      .from('trips')
      .select('veiculo_id')
      .eq('status', 'inProgress')

    if (tripsError) {
      logError('Erro ao buscar viagens ativas', { error: tripsError }, 'AvailableVehiclesAPI')
    }

    const activeVehicleIds = new Set(
      (activeTrips || []).map((t: any) => t.veiculo_id).filter(Boolean)
    )

    // Filtrar veículos disponíveis (não estão em viagem)
    const availableVehicles = ((veiculos || []) as any[])
      .filter((veiculo: any) => !activeVehicleIds.has(veiculo.id))
      .map((veiculo: any) => ({
        id: veiculo.id,
        plate: veiculo.plate,
        model: veiculo.model || 'Sem modelo',
        brand: veiculo.brand || '',
        displayName: `${veiculo.plate}${veiculo.model ? ` (${veiculo.brand || ''} ${veiculo.model})` : ''}`
      }))

    return NextResponse.json({
      success: true,
      vehicles: availableVehicles
    })
  } catch (error: any) {
    logError('Erro ao buscar veículos disponíveis', { error }, 'AvailableVehiclesAPI')
    return NextResponse.json(
      {
        success: false,
        error: 'Erro ao buscar veículos disponíveis',
        message: error.message
      },
      { status: 500 }
    )
  }
}

