/**
 * Validador de Coordenadas Geográficas
 * Garante precisão e validade de coordenadas antes de usar no mapa
 */

/**
 * Valida se uma coordenada de latitude é válida
 * @param lat Latitude em graus
 * @returns true se válida (-90 a 90)
 */
export function isValidLatitude(lat: number): boolean {
  return typeof lat === 'number' && !isNaN(lat) && lat >= -90 && lat <= 90
}

/**
 * Valida se uma coordenada de longitude é válida
 * @param lng Longitude em graus
 * @returns true se válida (-180 a 180)
 */
export function isValidLongitude(lng: number): boolean {
  return typeof lng === 'number' && !isNaN(lng) && lng >= -180 && lng <= 180
}

/**
 * Valida um par de coordenadas (lat, lng)
 * @param lat Latitude
 * @param lng Longitude
 * @returns true se ambas são válidas
 */
export function isValidCoordinate(lat: number, lng: number): boolean {
  return isValidLatitude(lat) && isValidLongitude(lng)
}

/**
 * Valida um array de coordenadas (polyline)
 * @param points Array de pontos com lat/lng
 * @returns true se todos os pontos são válidos
 */
export function isValidPolyline(
  points: Array<{ lat: number; lng: number }>
): boolean {
  if (!Array.isArray(points) || points.length === 0) {
    return false
  }

  return points.every((point) => {
    if (!point || typeof point !== 'object') return false
    return isValidCoordinate(point.lat, point.lng)
  })
}

/**
 * Normaliza coordenadas para garantir precisão máxima
 * @param lat Latitude
 * @param lng Longitude
 * @returns Coordenadas normalizadas (6 casas decimais = ~0.1m de precisão)
 */
export function normalizeCoordinate(
  lat: number,
  lng: number
): { lat: number; lng: number } | null {
  if (!isValidCoordinate(lat, lng)) {
    return null
  }

  // Normalizar para 6 casas decimais (precisão de ~0.1m)
  return {
    lat: Math.round(lat * 1000000) / 1000000,
    lng: Math.round(lng * 1000000) / 1000000,
  }
}

/**
 * Filtra e valida um array de coordenadas
 * @param points Array de pontos
 * @returns Array filtrado com apenas pontos válidos e normalizados
 */
export function filterValidCoordinates(
  points: Array<{ lat: number; lng: number }>
): Array<{ lat: number; lng: number }> {
  if (!Array.isArray(points)) {
    return []
  }

  const valid: Array<{ lat: number; lng: number }> = []

  for (const point of points) {
    if (!point || typeof point !== 'object') continue

    const normalized = normalizeCoordinate(point.lat, point.lng)
    if (normalized) {
      valid.push(normalized)
    }
  }

  return valid
}

/**
 * Calcula a distância entre duas coordenadas (Haversine)
 * @param lat1 Latitude ponto 1
 * @param lng1 Longitude ponto 1
 * @param lat2 Latitude ponto 2
 * @param lng2 Longitude ponto 2
 * @returns Distância em metros
 */
export function calculateDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  if (
    !isValidCoordinate(lat1, lng1) ||
    !isValidCoordinate(lat2, lng2)
  ) {
    return Infinity
  }

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
 * Verifica se uma coordenada está dentro de uma margem de erro aceitável
 * @param lat Latitude
 * @param lng Longitude
 * @param expectedLat Latitude esperada
 * @param expectedLng Longitude esperada
 * @param maxErrorMeters Margem de erro máxima em metros (padrão: 10m)
 * @returns true se está dentro da margem de erro
 */
export function isWithinErrorMargin(
  lat: number,
  lng: number,
  expectedLat: number,
  expectedLng: number,
  maxErrorMeters: number = 10
): boolean {
  const distance = calculateDistance(lat, lng, expectedLat, expectedLng)
  return distance <= maxErrorMeters
}

