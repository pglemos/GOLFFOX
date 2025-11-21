import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const runtime = 'nodejs'

export async function GET(req: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json(
        { success: false, error: 'Configuração do Supabase não encontrada' },
        { status: 500 }
      )
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    // Buscar veículos ativos
    const { data: vehicles, error: vehiclesError } = await supabase
      .from('vehicles')
      .select('id, plate, model, brand, is_active, transportadora_id')
      .eq('is_active', true)
      .order('plate', { ascending: true })

    if (vehiclesError) {
      throw vehiclesError
    }

    // Buscar viagens em andamento para filtrar veículos ocupados
    const { data: activeTrips, error: tripsError } = await supabase
      .from('trips')
      .select('vehicle_id')
      .eq('status', 'inProgress')

    if (tripsError) {
      console.error('Erro ao buscar viagens ativas:', tripsError)
    }

    const activeVehicleIds = new Set(
      (activeTrips || []).map((t: any) => t.vehicle_id).filter(Boolean)
    )

    // Filtrar veículos disponíveis (não estão em viagem)
    const availableVehicles = (vehicles || [])
      .filter(vehicle => !activeVehicleIds.has(vehicle.id))
      .map(vehicle => ({
        id: vehicle.id,
        plate: vehicle.plate,
        model: vehicle.model || 'Sem modelo',
        brand: vehicle.brand || '',
        displayName: `${vehicle.plate}${vehicle.model ? ` (${vehicle.brand || ''} ${vehicle.model})` : ''}`
      }))

    return NextResponse.json({
      success: true,
      vehicles: availableVehicles
    })
  } catch (error: any) {
    console.error('Erro ao buscar veículos disponíveis:', error)
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

