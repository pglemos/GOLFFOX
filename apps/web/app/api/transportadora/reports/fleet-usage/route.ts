import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const startDate = searchParams.get('start_date')
    const endDate = searchParams.get('end_date')
    const carrierId = searchParams.get('carrier_id')

    if (!carrierId) {
      return NextResponse.json({ error: 'carrier_id é obrigatório' }, { status: 400 })
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Buscar veículos da transportadora
    const { data: vehicles, error: vehiclesError } = await supabase
      .from('vehicles')
      .select('id, plate, model, is_active, carrier_id')
      .eq('carrier_id', carrierId)

    if (vehiclesError) throw vehiclesError

    const vehicleIds = vehicles?.map(v => v.id) || []

    // Buscar dados de utilização (trips)
    let tripsQuery = supabase
      .from('trips')
      .select(`
        id,
        route_id,
        created_at,
        routes!inner(carrier_id)
      `)
      .eq('routes.carrier_id', carrierId)

    if (startDate) {
      tripsQuery = tripsQuery.gte('created_at', startDate)
    }
    if (endDate) {
      tripsQuery = tripsQuery.lte('created_at', endDate)
    }

    const { data: trips, error: tripsError } = await tripsQuery

    if (tripsError) throw tripsError

    // Buscar posições dos veículos para calcular tempo em rota
    const { data: positions, error: positionsError } = await supabase
      .from('driver_positions')
      .select('vehicle_id, created_at')
      .in('vehicle_id', vehicleIds)
      .order('created_at', { ascending: false })

    if (positionsError) throw positionsError

    // Calcular estatísticas
    const vehicleUsage = vehicles?.map(vehicle => {
      const vehicleTrips = trips?.filter(t => {
        // Verificar se o veículo está associado à rota da trip
        return true // Simplificado - em produção, verificar associação veículo-rota
      }) || []

      const vehiclePositions = positions?.filter(p => p.vehicle_id === vehicle.id) || []
      
      return {
        vehicle_id: vehicle.id,
        plate: vehicle.plate,
        model: vehicle.model,
        is_active: vehicle.is_active,
        total_trips: vehicleTrips.length,
        trips_in_period: vehicleTrips.filter(t => {
          const tripDate = new Date(t.created_at)
          if (startDate && tripDate < new Date(startDate)) return false
          if (endDate && tripDate > new Date(endDate)) return false
          return true
        }).length,
        last_position: vehiclePositions[0]?.created_at || null,
        utilization_rate: vehicleTrips.length > 0 ? (vehicleTrips.length / (trips?.length || 1)) * 100 : 0
      }
    }) || []

    return NextResponse.json({
      success: true,
      data: vehicleUsage,
      summary: {
        total_vehicles: vehicles?.length || 0,
        active_vehicles: vehicles?.filter(v => v.is_active).length || 0,
        total_trips: trips?.length || 0,
        average_utilization: vehicleUsage.reduce((sum, v) => sum + v.utilization_rate, 0) / (vehicleUsage.length || 1)
      }
    })
  } catch (error: any) {
    console.error('Erro ao gerar relatório de frota:', error)
    return NextResponse.json(
      { error: error.message || 'Erro ao gerar relatório' },
      { status: 500 }
    )
  }
}

