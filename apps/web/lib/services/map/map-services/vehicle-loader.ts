/**
 * Serviço para carregamento e processamento de veículos para o mapa admin
 */

import { isValidCoordinate, normalizeCoordinate } from "@/lib/coordinate-validator"
import { getErrorMeta } from "@/lib/error-utils"
import { debug, warn, error as logError } from "@/lib/logger"
import { supabase } from "@/lib/supabase"
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
  latitude: number
  longitude: number
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
    debug('Carregando veículos ativos', { companyId, hasCompanyId: !!companyId }, 'VehicleLoader')

    // Buscar veículos ativos - SEMPRE retornar todos os veículos ativos, mesmo sem trips ou posições
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

    // Aplicar filtro de empresa apenas se fornecido e não vazio
    if (companyId && companyId.trim() !== '' && companyId !== 'null' && companyId !== 'undefined') {
      vehiclesQuery = vehiclesQuery.eq('company_id', companyId)
      debug('Aplicando filtro de empresa', { companyId }, 'VehicleLoader')
    } else {
      debug('Sem filtro de empresa - carregando todos os veículos ativos', {}, 'VehicleLoader')
    }

    const { data: veiculosData, error: vehiclesError } = await vehiclesQuery

    let finalVeiculosData: SupabaseVeiculo[] = []

    if (vehiclesError) {
      logError('Erro na query de veículos', getErrorMeta(vehiclesError))
      debug('Detalhes do erro', {
        error: vehiclesError.message,
        code: vehiclesError.code,
        details: vehiclesError.details,
        hint: vehiclesError.hint
      }, 'VehicleLoader')

      // Tentar query alternativa se erro for de coluna inexistente
      if (
        vehiclesError.message?.includes('column') ||
        vehiclesError.message?.includes('does not exist') ||
        vehiclesError.message?.includes('permission denied') ||
        vehiclesError.code === 'PGRST116' // Schema cache error
      ) {
        warn('Tentando query alternativa sem colunas problemáticas', {}, 'VehicleLoader')
        try {
          let fallbackQuery = supabase
            .from('veiculos')
            .select('id, plate, model, is_active, company_id')
            .eq('is_active', true)

          if (companyId && companyId.trim() !== '' && companyId !== 'null' && companyId !== 'undefined') {
            fallbackQuery = fallbackQuery.eq('company_id', companyId)
          }

          const { data: fallbackData, error: fallbackError } = await fallbackQuery

          if (!fallbackError && fallbackData) {
            finalVeiculosData = fallbackData as SupabaseVeiculo[]
            debug(`Query alternativa retornou ${finalVeiculosData.length} veículos`, { companyId }, 'VehicleLoader')
          } else if (fallbackError) {
            logError('Query alternativa também falhou', { error: fallbackError }, 'VehicleLoader')
            // Se ainda falhar, tentar query mínima
            try {
              const { data: minimalData } = await supabase
                .from('veiculos')
                .select('id, plate, is_active')
                .eq('is_active', true)
                .limit(100)

              if (minimalData) {
                finalVeiculosData = minimalData as SupabaseVeiculo[]
                debug(`Query mínima retornou ${finalVeiculosData.length} veículos`, {}, 'VehicleLoader')
              }
            } catch (minimalErr) {
              logError('Query mínima também falhou', { error: minimalErr }, 'VehicleLoader')
            }
          }
        } catch (fallbackErr) {
          logError('Query alternativa também falhou', { error: fallbackErr }, 'VehicleLoader')
        }
      }
    } else {
      finalVeiculosData = (veiculosData as any) || []
      debug(`Query principal retornou ${finalVeiculosData.length} veículos`, {
        companyId,
        total: finalVeiculosData.length,
        sample: finalVeiculosData.slice(0, 3).map(v => ({ id: v.id, plate: v.plate }))
      }, 'VehicleLoader')
    }

    if (!finalVeiculosData || finalVeiculosData.length === 0) {
      warn('Nenhum veículo ativo encontrado', {
        companyId,
        hasError: !!vehiclesError,
        errorMessage: vehiclesError?.message
      }, 'VehicleLoader')

      // Tentar uma última vez com query simples para diagnóstico
      try {
        const { data: testData, error: testError } = await supabase
          .from('veiculos')
          .select('id, plate, is_active')
          .eq('is_active', true)
          .limit(5)

        if (testData && testData.length > 0) {
          warn(`Query de teste encontrou ${testData.length} veículos, mas query principal não`, {
            testData: testData.map(v => ({ id: v.id, plate: v.plate }))
          }, 'VehicleLoader')
        } else if (testError) {
          logError('Query de teste também falhou', { error: testError }, 'VehicleLoader')
        }
      } catch (testErr) {
        logError('Erro na query de teste', { error: testErr }, 'VehicleLoader')
      }

      return []
    }

    // Buscar trips ativas (mas não restringir veículos apenas a esses)
    const vehicleIds = finalVeiculosData.map((v) => v.id)
    const { data: activeTrips } = await (supabase
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
      .eq('status', 'inProgress') as any)

    const tripsByVehicle = new Map<string, SupabaseTrip>()
    if (activeTrips) {
      activeTrips.forEach((trip: SupabaseTrip | any) => {
        const vId = trip.veiculo_id
        if (vId && !tripsByVehicle.has(vId)) {
          tripsByVehicle.set(vId, trip)
        }
      })
    }

    // Buscar últimas posições de TODAS as trips (não apenas inProgress)
    // Primeiro, buscar trips recentes (últimas 24h) para ter mais chances de encontrar posições
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
    const { data: recentTrips } = await (supabase
      .from('trips')
      .select('id, veiculo_id')
      .in('veiculo_id', vehicleIds)
      .gte('created_at', oneDayAgo)
      .order('created_at', { ascending: false }) as any)

    const tripIds = recentTrips?.map((t: { id: string }) => t.id) || []
    let lastPositions: SupabasePosition[] = []

    if (tripIds.length > 0) {
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString()
      const { data: recentPositions } = await (supabase
        .from('motorista_positions')
        .select('trip_id, latitude, longitude, speed, timestamp')
        .in('trip_id', tripIds)
        .gte('timestamp', fiveMinutesAgo)
        .order('timestamp', { ascending: false }) as any)

      if (recentPositions && recentPositions.length > 0) {
        const tripToVehicle = new Map(
          recentTrips?.map((t: any) => [t.id, t.veiculo_id]) || []
        )
        lastPositions = (recentPositions || []).map((pos: SupabasePosition) => ({
          ...pos,
          veiculo_id: tripToVehicle.get(pos.trip_id),
        }))
      } else {
        // Buscar últimas posições conhecidas se não há recentes
        const { data: allPositions } = await supabase
          .from('motorista_positions')
          .select('trip_id, latitude, longitude, speed, timestamp')
          .in('trip_id', tripIds)
          .order('timestamp', { ascending: false })
          .limit(tripIds.length * 10)

        if (allPositions) {
          const tripToVehicle = new Map(
            recentTrips?.map((t: any) => [t.id, t.veiculo_id]) || []
          )
          lastPositions = (allPositions || []).map((pos: any) => ({
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

    // Processar veículos - INCLUIR TODOS os veículos ativos, mesmo sem trips ou posições
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
      } else if (trip) {
        // Se tem trip mas não tem posição, considerar como "garage" ou "stopped_long"
        vehicleStatus = 'stopped_long'
      }

      const lat = lastPos?.latitude || null
      const lng = lastPos?.longitude || null

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

    debug(`Carregados ${normalizedVehicles.length} veículos`, {
      count: normalizedVehicles.length,
      withCoords: normalizedVehicles.filter(v => v.lat && v.lng).length,
      withoutCoords: normalizedVehicles.filter(v => !v.lat || !v.lng).length,
      withTrips: normalizedVehicles.filter(v => v.trip_id).length,
      withoutTrips: normalizedVehicles.filter(v => !v.trip_id).length
    }, 'VehicleLoader')

    return normalizedVehicles as Veiculo[]
  } catch (error) {
    logError('Erro ao carregar veículos', { error }, 'VehicleLoader')
    return []
  }
}
