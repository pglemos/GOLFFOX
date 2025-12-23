import { NextRequest, NextResponse } from "next/server"
import { getSupabaseAdmin } from '@/lib/supabase-client'
import { logError } from '@/lib/logger'
import { requireAuth } from '@/lib/api-auth'

export async function GET(req: NextRequest) {
  // Verificar autenticação (transportadora)
  const authError = await requireAuth(req, ['admin', 'gestor_transportadora', 'operador', 'transportadora'])
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

    // Buscar motoristas da transportadora
    const { data: motoristas, error: driversError } = await supabase
      .from('users')
      .select('id, name, email, phone, transportadora_id')
      .eq('role', 'motorista')
      .eq('transportadora_id', transportadoraId)

    if (driversError) throw driversError

    const driverIds = motoristas?.map(d => d.id) || []

    // Buscar dados de gamificação/ranking (selecionar apenas colunas necessárias)
    const rankingColumns = 'id,motorista_id,trips_completed,total_points,average_rating,on_time_percentage,safety_score,created_at,updated_at'
    const { data: rankings, error: rankingsError } = await supabase
      .from('gf_gamification_scores' as any)
      .select(rankingColumns)
      .in('motorista_id', driverIds)

    if (rankingsError) throw rankingsError

    // Buscar viagens dos motoristas
    let tripsQuery = supabase
      .from('trips')
      .select(`
        id,
        motorista_id,
        route_id,
        created_at,
        routes!inner(transportadora_id)
      `)
      .eq('routes.transportadora_id', transportadoraId)
      .in('motorista_id', driverIds)

    if (startDate) {
      tripsQuery = tripsQuery.gte('created_at', startDate)
    }
    if (endDate) {
      tripsQuery = tripsQuery.lte('created_at', endDate)
    }

    const { data: trips, error: tripsError } = await (tripsQuery as any)

    if (tripsError) throw tripsError

    // Calcular performance por motorista
    const driverPerformance = motoristas?.map(motorista => {
      const driverRanking = (rankings as any[])?.find(r => r.motorista_id === motorista.id)
      const driverTrips = (trips as any[])?.filter(t => t.motorista_id === motorista.id) || []

      return {
        motorista_id: motorista.id,
        name: motorista.name,
        email: motorista.email,
        phone: motorista.phone,
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
        total_drivers: motoristas?.length || 0,
        total_trips: trips?.length || 0,
        average_trips_per_driver: trips?.length ? trips.length / (motoristas?.length || 1) : 0,
        top_performer: driverPerformance[0] || null
      }
    })
  } catch (err: any) {
    logError('Erro ao gerar relatório de performance', { error: err }, 'DriverPerformanceReportAPI')
    const errorMessage = err?.message || 'Erro ao gerar relatório'
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    )
  }
}

