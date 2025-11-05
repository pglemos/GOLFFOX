/**
 * Utilitários para manipulação do mapa
 */

declare global {
  interface Window {
    google: any
  }
}

/**
 * Ajusta o bounds do mapa com margem
 */
export function fitBoundsWithMargin(
  map: google.maps.Map,
  bounds: google.maps.LatLngBoundsLiteral | google.maps.LatLngBounds,
  marginPixels: number = 64
): void {
  const b = bounds instanceof google.maps.LatLngBounds
    ? bounds
    : new google.maps.LatLngBounds(bounds.southWest, bounds.northEast)

  map.fitBounds(b, {
    top: marginPixels,
    right: marginPixels,
    bottom: marginPixels,
    left: marginPixels,
  })
}

/**
 * Calcula o heading (direção) entre duas posições
 * Retorna graus [0-360] onde 0 é Norte, 90 é Leste, etc.
 */
export function calculateHeading(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const dLng = (lng2 - lng1) * (Math.PI / 180)
  const lat1Rad = lat1 * (Math.PI / 180)
  const lat2Rad = lat2 * (Math.PI / 180)

  const y = Math.sin(dLng) * Math.cos(lat2Rad)
  const x =
    Math.cos(lat1Rad) * Math.sin(lat2Rad) -
    Math.sin(lat1Rad) * Math.cos(lat2Rad) * Math.cos(dLng)

  let heading = Math.atan2(y, x) * (180 / Math.PI)
  heading = (heading + 360) % 360 // Normalizar para [0-360]

  return heading
}

/**
 * Calcula a distância em metros entre duas posições (Haversine)
 */
export function calculateDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371000 // Raio da Terra em metros
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLng = ((lng2 - lng1) * Math.PI) / 180

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2)

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

/**
 * Calcula o atraso em minutos comparando com a rota planejada
 * Compara a posição atual com a posição esperada na rota no mesmo momento
 */
export function calculateDelay(
  currentLat: number,
  currentLng: number,
  currentTime: Date,
  routePolyline: Array<{ lat: number; lng: number; time?: Date }>,
  scheduledStartTime: Date
): number | null {
  if (routePolyline.length === 0) return null

  // Encontrar a posição esperada na rota para o momento atual
  // Assumindo progresso linear ao longo do tempo
  const totalDuration = routePolyline.length > 0
    ? (routePolyline[routePolyline.length - 1].time?.getTime() || 0) -
      (routePolyline[0].time?.getTime() || scheduledStartTime.getTime())
    : 0

  if (totalDuration <= 0) return null

  const elapsed = currentTime.getTime() - scheduledStartTime.getTime()
  const progress = Math.min(elapsed / totalDuration, 1)

  const expectedIndex = Math.floor(progress * (routePolyline.length - 1))
  const expectedPoint = routePolyline[expectedIndex] || routePolyline[0]

  // Calcular distância entre posição atual e esperada
  const distance = calculateDistance(
    currentLat,
    currentLng,
    expectedPoint.lat,
    expectedPoint.lng
  )

  // Converter distância em tempo de atraso (assumindo velocidade média de 30 km/h)
  const avgSpeedMps = (30 * 1000) / 3600 // 30 km/h em m/s
  const delaySeconds = distance / avgSpeedMps
  const delayMinutes = delaySeconds / 60

  return delayMinutes > 0 ? Math.round(delayMinutes) : 0
}

/**
 * Detecta se o veículo está desviado da rota
 * Retorna true se distância > 100m por ≥ 60s
 */
export function detectDeviation(
  currentLat: number,
  currentLng: number,
  routePolyline: Array<{ lat: number; lng: number }>,
  positionHistory: Array<{ lat: number; lng: number; timestamp: Date }>
): { isDeviated: boolean; distance: number; durationSeconds: number } {
  if (routePolyline.length === 0) {
    return { isDeviated: false, distance: 0, durationSeconds: 0 }
  }

  // Encontrar o ponto mais próximo na rota
  let minDistance = Infinity
  let closestPoint = routePolyline[0]

  for (const point of routePolyline) {
    const dist = calculateDistance(currentLat, currentLng, point.lat, point.lng)
    if (dist < minDistance) {
      minDistance = dist
      closestPoint = point
    }
  }

  // Verificar se está desviado (> 100m)
  const isCurrentlyDeviated = minDistance > 100

  if (!isCurrentlyDeviated) {
    return { isDeviated: false, distance: minDistance, durationSeconds: 0 }
  }

  // Verificar há quanto tempo está desviado
  // Buscar na posição histórica quando começou o desvio
  const now = new Date()
  let deviationStartTime: Date | null = null

  // Ordenar histórico do mais antigo para o mais recente
  const sortedHistory = [...positionHistory].sort(
    (a, b) => a.timestamp.getTime() - b.timestamp.getTime()
  )

  for (const pos of sortedHistory) {
    const dist = calculateDistance(
      pos.lat,
      pos.lng,
      closestPoint.lat,
      closestPoint.lng
    )

    if (dist > 100) {
      if (!deviationStartTime) {
        deviationStartTime = pos.timestamp
      }
    } else {
      deviationStartTime = null // Reset se voltou para a rota
    }
  }

  if (!deviationStartTime) {
    return { isDeviated: false, distance: minDistance, durationSeconds: 0 }
  }

  const durationSeconds = (now.getTime() - deviationStartTime.getTime()) / 1000
  const isDeviated = durationSeconds >= 60

  return {
    isDeviated,
    distance: minDistance,
    durationSeconds,
  }
}

/**
 * Calcula ETA para a próxima parada usando Google Distance Matrix API
 * Retorna minutos até a chegada
 */
export async function calculateETA(
  currentLat: number,
  currentLng: number,
  destinationLat: number,
  destinationLng: number,
  apiKey: string
): Promise<number | null> {
  try {
    const origin = `${currentLat},${currentLng}`
    const destination = `${destinationLat},${destinationLng}`

    const url = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${origin}&destinations=${destination}&key=${apiKey}&mode=driving&language=pt-BR&units=metric`

    const response = await fetch(url)
    const data = await response.json()

    if (data.status === 'OK' && data.rows?.[0]?.elements?.[0]?.duration) {
      const durationSeconds = data.rows[0].elements[0].duration.value
      const durationMinutes = Math.ceil(durationSeconds / 60)
      return durationMinutes
    }

    // Fallback: calcular distância linear e estimar tempo
    const distance = calculateDistance(
      currentLat,
      currentLng,
      destinationLat,
      destinationLng
    )
    const avgSpeedKmh = 30 // 30 km/h média
    const avgSpeedMps = (avgSpeedKmh * 1000) / 3600
    const estimatedSeconds = distance / avgSpeedMps
    return Math.ceil(estimatedSeconds / 60)
  } catch (error) {
    console.error('Erro ao calcular ETA:', error)
    
    // Fallback: calcular distância linear
    const distance = calculateDistance(
      currentLat,
      currentLng,
      destinationLat,
      destinationLng
    )
    const avgSpeedKmh = 30
    const avgSpeedMps = (avgSpeedKmh * 1000) / 3600
    const estimatedSeconds = distance / avgSpeedMps
    return Math.ceil(estimatedSeconds / 60)
  }
}

/**
 * Decodifica polyline encoded (Google Maps)
 */
export function decodePolyline(encoded: string): Array<{ lat: number; lng: number }> {
  const points: Array<{ lat: number; lng: number }> = []
  let index = 0
  const len = encoded.length
  let lat = 0
  let lng = 0

  while (index < len) {
    let b
    let shift = 0
    let result = 0
    do {
      b = encoded.charCodeAt(index++) - 63
      result |= (b & 0x1f) << shift
      shift += 5
    } while (b >= 0x20)
    const dlat = result & 1 ? ~(result >> 1) : result >> 1
    lat += dlat

    shift = 0
    result = 0
    do {
      b = encoded.charCodeAt(index++) - 63
      result |= (b & 0x1f) << shift
      shift += 5
    } while (b >= 0x20)
    const dlng = result & 1 ? ~(result >> 1) : result >> 1
    lng += dlng

    points.push({
      lat: lat * 1e-5,
      lng: lng * 1e-5,
    })
  }

  return points
}

/**
 * Cria bounds a partir de um array de posições
 */
export function createBoundsFromPositions(
  positions: Array<{ lat: number; lng: number }>
): google.maps.LatLngBounds | null {
  if (positions.length === 0) return null

  const bounds = new google.maps.LatLngBounds()

  positions.forEach((pos) => {
    bounds.extend(new google.maps.LatLng(pos.lat, pos.lng))
  })

  return bounds
}

/**
 * Formata coordenadas para uso em URLs/deep links
 */
export function formatCoordinatesForUrl(lat: number, lng: number): string {
  return `${lat.toFixed(6)},${lng.toFixed(6)}`
}

/**
 * Parse coordenadas de URL
 */
export function parseCoordinatesFromUrl(coords: string): { lat: number; lng: number } | null {
  const parts = coords.split(',')
  if (parts.length !== 2) return null

  const lat = parseFloat(parts[0])
  const lng = parseFloat(parts[1])

  if (isNaN(lat) || isNaN(lng)) return null

  return { lat, lng }
}

