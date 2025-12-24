import { NextRequest, NextResponse } from "next/server"

import { requireAuth } from '@/lib/api-auth'
import { logError } from '@/lib/logger'
import { getSupabaseAdmin } from '@/lib/supabase-client'
import type { Database } from '@/types/supabase'

type ViagemRow = Database['public']['Tables']['viagens']['Row'] & {
  rotas?: { name: string } | null
  users?: { name: string; email: string } | null
}

export async function GET(req: NextRequest) {
  // Verificar autenticação (transportadora)
  const authError = await requireAuth(req, ['admin', 'gestor_transportadora', 'gestor_empresa', 'gestor_transportadora'])
  if (authError) return authError

  try {
    const { searchParams } = new URL(req.url)
    const startDate = searchParams.get('start_date')
    const endDate = searchParams.get('end_date')
    const transportadoraId = searchParams.get('transportadora_id')

    if (!transportadoraId) {
      return NextResponse.json({ error: 'transportadora_id é obrigatório' }, { status: 400 })
    }

    const supabase = getSupabaseAdmin()

    // Buscar rotas da transportadora
    const { data: routes, error: routesError } = await supabase
      .from('rotas')
      .select('id, name, transportadora_id')
      .eq('transportadora_id', transportadoraId)

    if (routesError) throw routesError

    const routeIds = routes?.map(r => r.id) || []

    // Buscar viagens
    let tripsQuery = supabase
      .from('viagens')
      .select(`
        id,
        rota_id,
        motorista_id,
        created_at,
        completed_at,
        status,
        rotas(name),
        users!trips_driver_id_fkey(name, email)
      `)
      .in('rota_id', routeIds)

    if (startDate) {
      tripsQuery = tripsQuery.gte('created_at', startDate)
    }
    if (endDate) {
      tripsQuery = tripsQuery.lte('created_at', endDate)
    }

    const { data: trips, error: tripsError } = await tripsQuery.order('created_at', { ascending: false })

    if (tripsError) throw tripsError

    // Buscar passageiros por viagem
    const tripIds = trips?.map((t) => t.id) || []
    const { data: passengers, error: passengersError } = await supabase
      .from('viagem_passageiros')
      .select('viagem_id')
      .in('viagem_id', tripIds)

    if (passengersError) throw passengersError

    // Contar passageiros por viagem
    const passengersByTrip = passengers?.reduce((acc: Record<string, number>, p) => {
      acc[p.viagem_id] = (acc[p.viagem_id] || 0) + 1
      return acc
    }, {}) || {}

    // Formatar dados das viagens
    const tripsData = trips?.map((trip: ViagemRow) => ({
      trip_id: trip.id,
      route_name: trip.rotas?.name || 'N/A',
      motorista_name: trip.users?.name || 'N/A',
      driver_email: trip.users?.email || 'N/A',
      created_at: trip.created_at,
      completed_at: trip.completed_at,
      status: trip.status,
      passenger_count: passengersByTrip[trip.id] || 0,
      duration_minutes: trip.completed_at && trip.created_at
        ? Math.round((new Date(trip.completed_at).getTime() - new Date(trip.created_at).getTime()) / 60000)
        : null
    })) || []

    // Calcular estatísticas
    const completedTrips = tripsData.filter((t) => t.status === 'completed')
    const totalPassengers = tripsData.reduce((sum: number, t) => sum + t.passenger_count, 0)
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
  } catch (err: unknown) {
    logError('Erro ao gerar relatório de viagens', { error: err }, 'TripsReportAPI')
    return NextResponse.json(
      { error: err?.message || 'Erro ao gerar relatório' },
      { status: 500 }
    )
  }
}

