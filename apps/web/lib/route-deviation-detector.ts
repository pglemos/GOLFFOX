/**
 * Detector de Desvio de Rota
 * Calcula distância do veículo à rota planejada e detecta desvios
 */

export interface RoutePolylinePoint {
  lat: number
  lng: number
  order: number
}

export interface DeviationResult {
  isDeviated: boolean
  distance: number // em metros
  distanceThreshold: number // em metros
  segmentIndex?: number // índice do segmento mais próximo
}

/**
 * Calcula distância de um ponto a um segmento de linha usando Haversine
 */
function distancePointToLineSegment(
  pointLat: number,
  pointLng: number,
  lineStartLat: number,
  lineStartLng: number,
  lineEndLat: number,
  lineEndLng: number
): number {
  const R = 6371000 // Raio da Terra em metros

  // Converter para radianos
  const toRad = (deg: number) => deg * (Math.PI / 180)
  const lat1 = toRad(pointLat)
  const lng1 = toRad(pointLng)
  const lat2 = toRad(lineStartLat)
  const lng2 = toRad(lineStartLng)
  const lat3 = toRad(lineEndLat)
  const lng3 = toRad(lineEndLng)

  // Calcular distâncias usando Haversine
  const haversine = (lat1: number, lng1: number, lat2: number, lng2: number) => {
    const dLat = lat2 - lat1
    const dLng = lng2 - lng1
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2
    return 2 * R * Math.asin(Math.sqrt(a))
  }

  const d12 = haversine(lat1, lng1, lat2, lng2) // Ponto → Início
  const d13 = haversine(lat1, lng1, lat3, lng3) // Ponto → Fim
  const d23 = haversine(lat2, lng2, lat3, lng3) // Início → Fim

  // Se segmento muito curto, retornar distância até ponto mais próximo
  if (d23 < 10) {
    return Math.min(d12, d13)
  }

  // Calcular ângulo usando lei dos cossenos
  const angle = Math.acos((d12 ** 2 + d23 ** 2 - d13 ** 2) / (2 * d12 * d23))

  // Distância perpendicular
  const perpendicularDistance = d12 * Math.sin(angle)

  // Se ponto está fora do segmento, retornar distância até extremidade mais próxima
  if (angle > Math.PI / 2 || d12 * Math.cos(angle) > d23) {
    return Math.min(d12, d13)
  }

  return perpendicularDistance
}

/**
 * Detecta se um veículo desviou da rota planejada
 * @param vehicleLat Latitude do veículo
 * @param vehicleLng Longitude do veículo
 * @param vehicleSpeed Velocidade do veículo em m/s (null se parado)
 * @param routePolyline Pontos da rota planejada ordenados
 * @param threshold Distância máxima em metros antes de considerar desvio (padrão: 200m)
 * @returns Resultado da detecção de desvio
 */
export function detectRouteDeviation(
  vehicleLat: number,
  vehicleLng: number,
  vehicleSpeed: number | null,
  routePolyline: RoutePolylinePoint[],
  threshold: number = 200
): DeviationResult {
  // Se não há rota ou rota muito curta, não há desvio
  if (!routePolyline || routePolyline.length < 2) {
    return {
      isDeviated: false,
      distance: 0,
      distanceThreshold: threshold,
    }
  }

  // Se veículo está parado (< 5 km/h ≈ 1.4 m/s), não considerar desvio
  if (vehicleSpeed === null || vehicleSpeed < 1.4) {
    return {
      isDeviated: false,
      distance: 0,
      distanceThreshold: threshold,
    }
  }

  // Ordenar pontos por ordem
  const sortedPoints = [...routePolyline].sort((a, b) => a.order - b.order)

  // Encontrar distância mínima do veículo a qualquer segmento da rota
  let minDistance = Infinity
  let closestSegmentIndex = -1

  for (let i = 0; i < sortedPoints.length - 1; i++) {
    const start = sortedPoints[i]
    const end = sortedPoints[i + 1]

    const distance = distancePointToLineSegment(
      vehicleLat,
      vehicleLng,
      start.lat,
      start.lng,
      end.lat,
      end.lng
    )

    if (distance < minDistance) {
      minDistance = distance
      closestSegmentIndex = i
    }
  }

  // Verificar se distância excede o threshold
  const isDeviated = minDistance > threshold

  return {
    isDeviated,
    distance: Math.round(minDistance),
    distanceThreshold: threshold,
    segmentIndex: closestSegmentIndex >= 0 ? closestSegmentIndex : undefined,
  }
}

/**
 * Detecta desvios para múltiplos veículos
 */
export function detectMultipleRouteDeviations(
  vehicles: Array<{
    vehicle_id: string
    lat: number
    lng: number
    speed: number | null
    route_id: string
  }>,
  routesMap: Map<string, RoutePolylinePoint[]>,
  threshold: number = 200
): Map<string, DeviationResult> {
  const results = new Map<string, DeviationResult>()

  vehicles.forEach((vehicle) => {
    const routePolyline = routesMap.get(vehicle.route_id)
    if (routePolyline) {
      const deviation = detectRouteDeviation(
        vehicle.lat,
        vehicle.lng,
        vehicle.speed,
        routePolyline,
        threshold
      )
      results.set(vehicle.vehicle_id, deviation)
    }
  })

  return results
}

