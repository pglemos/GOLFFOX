import { NextRequest, NextResponse } from "next/server"

import { requireAuth } from '@/lib/api-auth'
import { logError } from '@/lib/logger'
import { getSupabaseAdmin } from '@/lib/supabase-client'

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

    // Buscar veículos da transportadora
    const { data: veiculos, error: vehiclesError } = await supabase
      .from('veiculos')
      .select('id, plate, model, is_active, transportadora_id')
      .eq('transportadora_id', transportadoraId)

    if (vehiclesError) throw vehiclesError

    const vehicleIds = veiculos?.map(v => v.id) || []

    // Buscar dados de utilização (trips)
    // Nota: Usando scheduled_date como referência de data da viagem, pois created_at não existe no tipo
    let tripsQuery = supabase
      .from('viagens')
      .select(`
        id,
        rota_id,
        scheduled_date,
        started_at,
        veiculo_id,
        rotas!inner(transportadora_id)
      `)
      .eq('rotas.transportadora_id', transportadoraId)

    if (startDate) {
      tripsQuery = tripsQuery.gte('scheduled_date', startDate)
    }
    if (endDate) {
      tripsQuery = tripsQuery.lte('scheduled_date', endDate)
    }

    const { data: trips, error: tripsError } = await tripsQuery

    if (tripsError) throw tripsError

    // Buscar posições dos veículos para calcular tempo em rota
    // Fazendo join com trips para filtrar pelos veículos da transportadora
    const { data: positions, error: positionsError } = await supabase
      .from('motorista_positions')
      .select(`
        latitude,
        longitude,
        recorded_at,
        trip_id,
        viagens!inner (
            veiculo_id
        )
      `)
      .in('viagens.veiculo_id', vehicleIds) // Filtra posições cujas viagens são desses veículos
      .order('recorded_at', { ascending: false })

    if (positionsError) throw positionsError

    // Calcular estatísticas
    const vehicleUsage = veiculos?.map(veiculo => {
      // Filtrar trips deste veículo específico
      const vehicleTrips = trips?.filter(t => t.veiculo_id === veiculo.id) || []

      // Filtrar posições deste veículo (via trip)
      // O cast é necessário pois o tipo retornado pelo join pode ser complexo para inferência
      const vehiclePositions = (positions as Array<{ viagens?: { veiculo_id?: string } | null }>)?.filter(p => p.viagens?.veiculo_id === veiculo.id) || []

      return {
        veiculo_id: veiculo.id,
        plate: veiculo.plate,
        model: veiculo.model,
        is_active: veiculo.is_active,
        total_trips: vehicleTrips.length,
        trips_in_period: vehicleTrips.filter(t => {
          if (!t.scheduled_date) return false
          const tripDate = new Date(t.scheduled_date)
          if (startDate && tripDate < new Date(startDate)) return false
          if (endDate && tripDate > new Date(endDate)) return false
          return true
        }).length,
        last_position: vehiclePositions[0]?.recorded_at || null,
        utilization_rate: (trips?.length || 0) > 0 ? (vehicleTrips.length / trips!.length) * 100 : 0
      }
    }) || []

    return NextResponse.json({
      success: true,
      data: vehicleUsage,
      summary: {
        total_vehicles: veiculos?.length || 0,
        active_vehicles: veiculos?.filter(v => v.is_active).length || 0,
        total_trips: trips?.length || 0,
        average_utilization: vehicleUsage.length > 0
          ? vehicleUsage.reduce((sum, v) => sum + v.utilization_rate, 0) / vehicleUsage.length
          : 0
      }
    })
  } catch (err: unknown) {
    logError('Erro ao gerar relatório de frota', { error: err }, 'FleetUsageReportAPI')
    return NextResponse.json(
      { error: err?.message || 'Erro ao gerar relatório' },
      { status: 500 }
    )
  }
}

