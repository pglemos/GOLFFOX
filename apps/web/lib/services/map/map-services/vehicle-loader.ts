/**
 * Serviço para carregamento e processamento de veículos para o mapa admin
 */

import { supabase } from "@/lib/supabase"
import { debug, warn, error as logError } from "@/lib/logger"
import { getErrorMeta } from "@/lib/error-utils"
import { isValidCoordinate, normalizeCoordinate } from "@/lib/coordinate-validator"
import type { Veiculo } from "@/types/map"

interface SupabaseVeiculo {
  id: string
  plate: string
  model?: string
  year?: number
  prefix?: string
  capacity?: number
  is_active: boolean
  photo_url?: string
  company_id?: string
  transportadora_id?: string
  companies?: { name: string }
}

interface SupabaseTrip {
  id: string
  veiculo_id: string
  motorista_id: string
  route_id: string
  status: string
  routes?: { name: string }
  users?: { id: string; name: string }
}

interface SupabasePosition {
  trip_id: string
  lat: number
  lng: number
  speed: number | null
  timestamp: string
  veiculo_id?: string
}

/**
 * Carrega e processa veículos ativos para exibição no mapa
 * @param companyId ID da empresa para filtrar (opcional)
 * @returns Array de veículos processados
 */
export async function loadVehicles(companyId?: string): Promise<Veiculo[]> {
  try {
    debug('Carregando veículos ativos', { companyId }, 'VehicleLoader')

    // Buscar veículos ativos
    let vehiclesQuery = supabase
      .from('veiculos')
      .select(`
        id,
        plate,
        model,
        year,
        prefix,
        capacity,
        is_active,
        photo_url,
        company_id,
        transportadora_id,
        companies(name)
      `)
      .eq('is_active', true)

    if (companyId) {
      vehiclesQuery = vehiclesQuery.eq('company_id', companyId)
    }

    const { data: veiculosData, error: vehiclesError } = await vehiclesQuery

    let finalVeiculosData: SupabaseVeiculo[] = []

    if (vehiclesError) {
      logError('Erro na query de veículos', getErrorMeta(vehiclesError))

      // Tentar query alternativa se erro for de coluna inexistente
      if (
        vehiclesError.message?.includes('column') ||
        vehiclesError.message?.includes('does not exist')
      ) {
        warn('Tentando query alternativa sem colunas problemáticas', {}, 'VehicleLoader')
        try {
          const { data: fallbackData, error: fallbackError } = await supabase
            .from('veiculos')
            .select('id, plate, model, is_active, company_id')
            .eq('is_active', true)

          if (!fallbackError && fallbackData) {
            finalVeiculosData = fallbackData as SupabaseVeiculo[]
          }
        } catch (fallbackErr) {
          logError('Query alternativa também falhou', { error: fallbackErr }, 'VehicleLoader')
        }
      }
    } else {
      finalVeiculosData = veiculosData || []
    }

    if (!finalVeiculosData || finalVeiculosData.length === 0) {
      debug('Nenhum veículo ativo encontrado', {}, 'VehicleLoader')
      return []
    }

    // Buscar trips ativas
    const vehicleIds = finalVeiculosData.map((v) => v.id)
    const { data: activeTrips } = await supabase
      .from('trips')
      .select(`
        id,
        veiculo_id,
        motorista_id,
        route_id,
        status,
        routes(name),
        users!trips_driver_id_fkey(id, name)
      `)
      .in('veiculo_id', vehicleIds)
      .eq('status', 'inProgress')

    const tripsByVehicle = new Map<string, SupabaseTrip>()
    if (activeTrips) {
      activeTrips.forEach((trip: SupabaseTrip) => {
        if (!tripsByVehicle.has(trip.veiculo_id)) {
          tripsByVehicle.set(trip.veiculo_id, trip)
        }
      })
    }

    // Buscar últimas posições
    const tripIds = activeTrips?.map((t: SupabaseTrip) => t.id) || []
    let lastPositions: SupabasePosition[] = []

    if (tripIds.length > 0) {
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString()
      const { data: recentPositions } = await supabase
        .from('motorista_positions')
        .select('trip_id, lat, lng, speed, timestamp')
        .in('trip_id', tripIds)
        .gte('timestamp', fiveMinutesAgo)
        .order('timestamp', { ascending: false })

      if (recentPositions && recentPositions.length > 0) {
        const tripToVehicle = new Map(
          activeTrips?.map((t: SupabaseTrip) => [t.id, t.veiculo_id]) || []
        )
        lastPositions = (recentPositions || []).map((pos: SupabasePosition) => ({
          ...pos,
          veiculo_id: tripToVehicle.get(pos.trip_id),
        }))
      } else {
        // Buscar últimas posições conhecidas se não há recentes
        const { data: allPositions } = await supabase
          .from('motorista_positions')
          .select('trip_id, lat, lng, speed, timestamp')
          .in('trip_id', tripIds)
          .order('timestamp', { ascending: false })
          .limit(tripIds.length * 10)

        if (allPositions) {
          const tripToVehicle = new Map(
            activeTrips?.map((t: SupabaseTrip) => [t.id, t.veiculo_id]) || []
          )
          lastPositions = (allPositions || []).map((pos: SupabasePosition) => ({
            ...pos,
            veiculo_id: tripToVehicle.get(pos.trip_id),
          }))
        }
      }
    }

    // Agrupar posições por veiculo_id
    const positionsByVehicle = new Map<string, SupabasePosition>()
    lastPositions.forEach((pos: SupabasePosition) => {
      if (pos.veiculo_id && !positionsByVehicle.has(pos.veiculo_id)) {
        positionsByVehicle.set(pos.veiculo_id, pos)
      }
    })

    // Processar veículos
    const processedVehicles = finalVeiculosData.map((v: SupabaseVeiculo) => {
      const trip = tripsByVehicle.get(v.id)
      const lastPos = positionsByVehicle.get(v.id)

      // Determinar status
      let vehicleStatus: 'moving' | 'stopped_short' | 'stopped_long' | 'garage' = 'garage'
      if (lastPos) {
        const posTime = new Date(lastPos.timestamp)
        const minutesAgo = (Date.now() - posTime.getTime()) / (1000 * 60)

        if (lastPos.speed && lastPos.speed > 0.83) {
          vehicleStatus = 'moving'
        } else if (minutesAgo > 3) {
          vehicleStatus = 'stopped_long'
        } else {
          vehicleStatus = 'stopped_short'
        }
      }

      const lat = lastPos?.lat || null
      const lng = lastPos?.lng || null

      return {
        veiculo_id: v.id,
        plate: v.plate,
        model: v.model || '',
        company_id: v.company_id || '',
        company_name: v.companies?.name || '',
        trip_id: trip?.id || '',
        route_id: trip?.route_id || '',
        route_name: trip?.routes?.name || 'Sem rota ativa',
        motorista_id: trip?.motorista_id || '',
        motorista_name: trip?.users?.name || 'Sem motorista',
        lat,
        lng,
        speed: lastPos?.speed || null,
        heading: null,
        vehicle_status: vehicleStatus,
        passenger_count: 0,
        last_position_time: lastPos?.timestamp || null,
      }
    })

    // Normalizar coordenadas
    const normalizedVehicles = processedVehicles.map((v: Veiculo) => {
      if (v.lat !== null && v.lng !== null && isValidCoordinate(v.lat, v.lng)) {
        const normalized = normalizeCoordinate(v.lat, v.lng)
        if (normalized) {
          return { ...v, lat: normalized.lat, lng: normalized.lng }
        }
      }

      return {
        ...v,
        speed: v.speed !== null && !isNaN(v.speed) ? v.speed : null,
        heading: v.heading !== null && !isNaN(v.heading) ? v.heading : null,
      }
    })

    debug(`Carregados ${normalizedVehicles.length} veículos`, { count: normalizedVehicles.length }, 'VehicleLoader')

    return normalizedVehicles as Veiculo[]
  } catch (error) {
    logError('Erro ao carregar veículos', { error }, 'VehicleLoader')
    return []
  }
}
