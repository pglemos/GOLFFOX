/**
 * Helper para usar o Web Worker de decodificação de polyline
 */

let worker: Worker | null = null

interface DecodeOptions {
  simplify?: boolean
  tolerance?: number
}

/**
 * Decodifica uma polyline usando Web Worker
 */
export function decodePolylineAsync(
  encoded: string,
  options: DecodeOptions = {}
): Promise<Array<{ lat: number; lng: number }>> {
  return new Promise((resolve, reject) => {
    // Criar worker se não existir
    if (!worker) {
      try {
        // Verificar suporte a Worker (SSR/Node não têm Worker)
        if (typeof Worker === 'undefined') {
          throw new Error('Web Worker não suportado neste ambiente')
        }

        // Usar blob URL para importar o worker com funções necessárias
        const workerCode = `
          ${decodePolylineSync.toString()}
          ${simplifyPolyline.toString()}

          self.addEventListener('message', (event) => {
            const { type, encoded, id } = event.data
            if (type === 'decode') {
              try {
                const points = decodePolylineSync(encoded)
                const simplified = points.length > 1000 ? simplifyPolyline(points, 0.0001) : points
                self.postMessage({ type: 'decode_result', id, points: simplified })
              } catch (error) {
                self.postMessage({ type: 'decode_result', id, points: [], error: error.message })
              }
            }
          })
        `
        const blob = new Blob([workerCode], { type: 'application/javascript' })
        worker = new Worker(URL.createObjectURL(blob))
      } catch (error) {
        // Fallback: decodificar sem worker
        if (typeof window !== 'undefined') {
          const { warn } = await import('./logger')
          warn('Erro ao criar worker, usando decodificação síncrona', { error }, 'PolylineDecoder')
        }
        try {
          const points = decodePolylineSync(encoded, options)
          resolve(points)
        } catch (err) {
          reject(err)
        }
        return
      }
    }

    const id = `${Date.now()}-${Math.random()}`
    const timeout = setTimeout(() => {
      reject(new Error('Timeout ao decodificar polyline'))
    }, 10000) // 10 segundos timeout

    const handler = (event: MessageEvent) => {
      if (event.data.id === id) {
        clearTimeout(timeout)
        worker?.removeEventListener('message', handler)
        if (event.data.error) {
          reject(new Error(event.data.error))
        } else {
          resolve(event.data.points)
        }
      }
    }

    worker.addEventListener('message', handler)
    worker.postMessage({ type: 'decode', encoded, id })
  })
}

/**
 * Decodifica polyline síncronamente (fallback)
 */
function decodePolylineSync(
  encoded: string,
  options: DecodeOptions = {}
): Array<{ lat: number; lng: number }> {
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

/**
 * Simplifica polyline usando Douglas-Peucker
 */
function simplifyPolyline(
  points: Array<{ lat: number; lng: number }>,
  tolerance: number = 0.0001
): Array<{ lat: number; lng: number }> {
  if (points.length <= 2) {
    return points
  }

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

/**
 * Limpa o worker
 */
export function cleanupPolylineWorker(): void {
  if (worker) {
    worker.terminate()
    worker = null
  }
}

