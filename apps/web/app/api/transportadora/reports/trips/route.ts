import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const startDate = searchParams.get('start_date')
    const endDate = searchParams.get('end_date')
    const transportadoraId = searchParams.get('transportadora_id') || searchParams.get('carrier_id') // Compatibilidade

    if (!transportadoraId) {
      return NextResponse.json({ error: 'transportadora_id é obrigatório' }, { status: 400 })
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Buscar rotas da transportadora
    const { data: routes, error: routesError } = await supabase
      .from('routes')
      .select('id, name, transportadora_id')
      .eq('transportadora_id', transportadoraId)

    if (routesError) throw routesError

    const routeIds = routes?.map(r => r.id) || []

    // Buscar viagens
    let tripsQuery = supabase
      .from('trips')
      .select(`
        id,
        route_id,
        driver_id,
        created_at,
        completed_at,
        status,
        routes(name),
        users!trips_driver_id_fkey(name, email)
      `)
      .in('route_id', routeIds)

    if (startDate) {
      tripsQuery = tripsQuery.gte('created_at', startDate)
    }
    if (endDate) {
      tripsQuery = tripsQuery.lte('created_at', endDate)
    }

    const { data: trips, error: tripsError } = await tripsQuery.order('created_at', { ascending: false })

    if (tripsError) throw tripsError

    // Buscar passageiros por viagem
    const tripIds = trips?.map(t => t.id) || []
    const { data: passengers, error: passengersError } = await supabase
      .from('trip_passengers')
      .select('trip_id')
      .in('trip_id', tripIds)

    if (passengersError) throw passengersError

    // Contar passageiros por viagem
    const passengersByTrip = passengers?.reduce((acc: any, p) => {
      acc[p.trip_id] = (acc[p.trip_id] || 0) + 1
      return acc
    }, {}) || {}

    // Formatar dados das viagens
    const tripsData = trips?.map(trip => ({
      trip_id: trip.id,
      route_name: (trip.routes as any)?.name || 'N/A',
      driver_name: (trip.users as any)?.name || 'N/A',
      driver_email: (trip.users as any)?.email || 'N/A',
      created_at: trip.created_at,
      completed_at: trip.completed_at,
      status: trip.status,
      passenger_count: passengersByTrip[trip.id] || 0,
      duration_minutes: trip.completed_at && trip.created_at
        ? Math.round((new Date(trip.completed_at).getTime() - new Date(trip.created_at).getTime()) / 60000)
        : null
    })) || []

    // Calcular estatísticas
    const completedTrips = tripsData.filter(t => t.status === 'completed')
    const totalPassengers = tripsData.reduce((sum, t) => sum + t.passenger_count, 0)
    const averagePassengers = completedTrips.length > 0
      ? totalPassengers / completedTrips.length
      : 0

    return NextResponse.json({
      success: true,
      data: tripsData,
      summary: {
        total_trips: tripsData.length,
        completed_trips: completedTrips.length,
        total_passengers: totalPassengers,
        average_passengers_per_trip: averagePassengers,
        completion_rate: tripsData.length > 0
          ? (completedTrips.length / tripsData.length) * 100
          : 0
      }
    })
  } catch (error: any) {
    console.error('Erro ao gerar relatório de viagens:', error)
    return NextResponse.json(
      { error: error.message || 'Erro ao gerar relatório' },
      { status: 500 }
    )
  }
}

