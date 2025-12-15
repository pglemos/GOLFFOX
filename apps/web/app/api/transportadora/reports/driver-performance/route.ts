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

    // Buscar motoristas da transportadora
    const { data: drivers, error: driversError } = await supabase
      .from('users')
      .select('id, name, email, phone, transportadora_id')
      .eq('role', 'motorista')
      .eq('transportadora_id', transportadoraId)

    if (driversError) throw driversError

    const driverIds = drivers?.map(d => d.id) || []

    // Buscar dados de gamificação/ranking (selecionar apenas colunas necessárias)
    const rankingColumns = 'id,driver_id,trips_completed,total_points,average_rating,on_time_percentage,safety_score,created_at,updated_at'
    const { data: rankings, error: rankingsError } = await supabase
      .from('gf_gamification_scores')
      .select(rankingColumns)
      .in('driver_id', driverIds)

    if (rankingsError) throw rankingsError

    // Buscar viagens dos motoristas
    let tripsQuery = supabase
      .from('trips')
      .select(`
        id,
        driver_id,
        route_id,
        created_at,
        routes!inner(transportadora_id)
      `)
      .eq('routes.transportadora_id', transportadoraId)
      .in('driver_id', driverIds)

    if (startDate) {
      tripsQuery = tripsQuery.gte('created_at', startDate)
    }
    if (endDate) {
      tripsQuery = tripsQuery.lte('created_at', endDate)
    }

    const { data: trips, error: tripsError } = await tripsQuery

    if (tripsError) throw tripsError

    // Calcular performance por motorista
    const driverPerformance = drivers?.map(driver => {
      const driverRanking = rankings?.find(r => r.driver_id === driver.id)
      const driverTrips = trips?.filter(t => t.driver_id === driver.id) || []

      return {
        driver_id: driver.id,
        name: driver.name,
        email: driver.email,
        phone: driver.phone,
        total_trips: driverRanking?.trips_completed || driverTrips.length,
        trips_in_period: driverTrips.length,
        total_points: driverRanking?.total_points || 0,
        rating: driverRanking?.total_points ? (driverRanking.total_points / 100).toFixed(1) : '0.0',
        average_rating: driverRanking?.average_rating || 0,
        on_time_percentage: driverRanking?.on_time_percentage || 0,
        safety_score: driverRanking?.safety_score || 0
      }
    }) || []

    // Ordenar por performance
    driverPerformance.sort((a, b) => {
      const scoreA = a.total_points + (a.trips_in_period * 10)
      const scoreB = b.total_points + (b.trips_in_period * 10)
      return scoreB - scoreA
    })

    return NextResponse.json({
      success: true,
      data: driverPerformance,
      summary: {
        total_drivers: drivers?.length || 0,
        total_trips: trips?.length || 0,
        average_trips_per_driver: trips?.length ? trips.length / (drivers?.length || 1) : 0,
        top_performer: driverPerformance[0] || null
      }
    })
  } catch (err) {
    console.error('Erro ao gerar relatório de performance:', err)
    const errorMessage = err instanceof Error ? err.message : 'Erro ao gerar relatório'
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    )
  }
}

