/**
 * Serviço de Proximidade - Calcula distância e ETA para notificações de aproximação
 */

import { calculateDistance } from '@/lib/map-utils'
import { calculateETA } from '@/lib/map-utils'

export interface ProximityCheck {
  isNearby: boolean
  distanceMeters: number
  etaMinutes: number | null
  thresholdMeters: number
}

export interface BusPosition {
  lat: number
  lng: number
  vehicleId: string
  routeId: string
  timestamp: Date
}

export interface StopPosition {
  lat: number
  lng: number
  stopId: string
  routeId: string
  passengerIds: string[] // IDs dos passageiros que embarcam neste ponto
}

/**
 * Verifica se o ônibus está próximo de uma parada
 */
export async function checkProximity(
  bus: BusPosition,
  stop: StopPosition,
  thresholdMeters: number = 500
): Promise<ProximityCheck> {
  const distanceMeters = calculateDistance(
    bus.lat,
    bus.lng,
    stop.lat,
    stop.lng
  )
  
  const isNearby = distanceMeters <= thresholdMeters
  
  let etaMinutes: number | null = null
  
  if (isNearby) {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
    if (apiKey) {
      etaMinutes = await calculateETA(
        bus.lat,
        bus.lng,
        stop.lat,
        stop.lng,
        apiKey
      )
    }
  }
  
  return {
    isNearby,
    distanceMeters: Math.round(distanceMeters),
    etaMinutes,
    thresholdMeters
  }
}

/**
 * Verifica proximidade para múltiplas paradas
 */
export async function checkProximityBatch(
  bus: BusPosition,
  stops: StopPosition[],
  thresholdMeters: number = 500
): Promise<Array<ProximityCheck & { stopId: string }>> {
  const results = await Promise.all(
    stops.map(async (stop) => {
      const check = await checkProximity(bus, stop, thresholdMeters)
      return {
        ...check,
        stopId: stop.stopId
      }
    })
  )
  
  return results
}

/**
 * Determina qual parada está mais próxima
 */
export function findNearestStop(
  bus: BusPosition,
  stops: StopPosition[]
): { stop: StopPosition; distanceMeters: number } | null {
  if (stops.length === 0) return null
  
  let nearestStop: StopPosition | null = null
  let minDistance = Infinity
  
  for (const stop of stops) {
    const distance = calculateDistance(
      bus.lat,
      bus.lng,
      stop.lat,
      stop.lng
    )
    
    if (distance < minDistance) {
      minDistance = distance
      nearestStop = stop
    }
  }
  
  if (!nearestStop) return null
  
  return {
    stop: nearestStop,
    distanceMeters: Math.round(minDistance)
  }
}

/**
 * Determina se deve enviar notificação baseado em proximidade e ETA
 */
export function shouldNotify(
  proximity: ProximityCheck,
  previousCheck?: ProximityCheck
): {
  shouldNotify: boolean
  reason: 'first_approach' | 'eta_threshold' | 'distance_threshold' | null
} {
  // Primeira vez que detecta proximidade
  if (!previousCheck && proximity.isNearby) {
    return {
      shouldNotify: true,
      reason: 'first_approach'
    }
  }
  
  // Se estava próximo e continua próximo, verificar ETA
  if (previousCheck?.isNearby && proximity.isNearby) {
    // Notificar se ETA <= 2 minutos (120 segundos)
    if (proximity.etaMinutes !== null && proximity.etaMinutes <= 2) {
      // Só notificar se não notificou antes (ETA anterior > 2)
      if (previousCheck.etaMinutes === null || previousCheck.etaMinutes > 2) {
        return {
          shouldNotify: true,
          reason: 'eta_threshold'
        }
      }
    }
  }
  
  // Se entrou no raio de proximidade agora
  if (!previousCheck?.isNearby && proximity.isNearby) {
    return {
      shouldNotify: true,
      reason: 'distance_threshold'
    }
  }
  
  return {
    shouldNotify: false,
    reason: null
  }
}

