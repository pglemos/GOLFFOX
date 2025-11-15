/**
 * Web Worker para decodificar polylines do Google Maps
 * Executa em background sem bloquear a UI
 */

// Interface para mensagens do worker
interface DecodeMessage {
  type: 'decode'
  encoded: string
  id: string
}

interface DecodeResult {
  type: 'decode_result'
  id: string
  points: Array<{ lat: number; lng: number }>
  error?: string
}

// Decodificar polyline usando algoritmo do Google Maps
function decodePolyline(encoded: string): Array<{ lat: number; lng: number }> {
  if (!encoded || encoded.length === 0) {
    return []
  }

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
    const dlat = (result & 1) !== 0 ? ~(result >> 1) : result >> 1
    lat += dlat

    shift = 0
    result = 0
    do {
      b = encoded.charCodeAt(index++) - 63
      result |= (b & 0x1f) << shift
      shift += 5
    } while (b >= 0x20)
    const dlng = (result & 1) !== 0 ? ~(result >> 1) : result >> 1
    lng += dlng

    points.push({
      lat: lat * 1e-5,
      lng: lng * 1e-5,
    })
  }

  return points
}

// Simplificação de polyline usando Douglas-Peucker
function simplifyPolyline(
  points: Array<{ lat: number; lng: number }>,
  tolerance: number = 0.0001
): Array<{ lat: number; lng: number }> {
  if (points.length <= 2) {
    return points
  }

  // Calcular distância perpendicular de um ponto até uma linha
  function perpendicularDistance(
    point: { lat: number; lng: number },
    lineStart: { lat: number; lng: number },
    lineEnd: { lat: number; lng: number }
  ): number {
    const dx = lineEnd.lng - lineStart.lng
    const dy = lineEnd.lat - lineStart.lat
    const mag = Math.sqrt(dx * dx + dy * dy)
    if (mag < 0.0000001) {
      return 0
    }
    const u = ((point.lat - lineStart.lat) * dx + (point.lng - lineStart.lng) * dy) / (mag * mag)
    const closestLat = lineStart.lat + u * dx
    const closestLng = lineStart.lng + u * dy
    const dx2 = point.lat - closestLat
    const dy2 = point.lng - closestLng
    return Math.sqrt(dx2 * dx2 + dy2 * dy2)
  }

  // Algoritmo Douglas-Peucker recursivo
  function douglasPeucker(
    pointList: Array<{ lat: number; lng: number }>,
    epsilon: number
  ): Array<{ lat: number; lng: number }> {
    if (pointList.length <= 2) {
      return pointList
    }

    let maxDistance = 0
    let maxIndex = 0
    const end = pointList.length - 1

    for (let i = 1; i < end; i++) {
      const distance = perpendicularDistance(pointList[i], pointList[0], pointList[end])
      if (distance > maxDistance) {
        maxIndex = i
        maxDistance = distance
      }
    }

    if (maxDistance > epsilon) {
      const left = douglasPeucker(pointList.slice(0, maxIndex + 1), epsilon)
      const right = douglasPeucker(pointList.slice(maxIndex), epsilon)
      return [...left.slice(0, -1), ...right]
    } else {
      return [pointList[0], pointList[end]]
    }
  }

  return douglasPeucker(points, tolerance)
}

// Listener para mensagens do thread principal
self.addEventListener('message', (event: MessageEvent<DecodeMessage>) => {
  const { type, encoded, id } = event.data

  if (type === 'decode') {
    try {
      // Decodificar polyline
      const points = decodePolyline(encoded)

      // Simplificar se necessário (para polylines muito longas)
      const simplified = points.length > 1000 ? simplifyPolyline(points, 0.0001) : points

      // Enviar resultado
      const result: DecodeResult = {
        type: 'decode_result',
        id,
        points: simplified,
      }
      self.postMessage(result)
    } catch (error: any) {
      // Enviar erro
      const result: DecodeResult = {
        type: 'decode_result',
        id,
        points: [],
        error: error.message || 'Erro ao decodificar polyline',
      }
      self.postMessage(result)
    }
  }
})

// Exportar tipos para uso no thread principal
export type { DecodeMessage, DecodeResult }

