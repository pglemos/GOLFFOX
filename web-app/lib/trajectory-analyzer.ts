/**
 * Analisador de Trajetos
 * Compara trajetos planejados vs reais e calcula métricas
 */

export interface PlannedRoutePoint {
  lat: number
  lng: number
  order: number
  estimated_time?: Date // Tempo estimado de chegada
}

export interface ActualPosition {
  lat: number
  lng: number
  timestamp: Date
  speed?: number | null
}

export interface TrajectoryAnalysis {
  // Métricas gerais
  totalDistancePlanned: number // metros
  totalDistanceActual: number // metros
  totalTimePlanned: number // minutos
  totalTimeActual: number // minutos
  
  // Conformidade
  conformityPercentage: number // % de conformidade com rota (0-100)
  extraDistance: number // metros percorridos além do planejado
  timeDelay: number // minutos de atraso
  
  // Desvios
  deviations: Array<{
    timestamp: Date
    lat: number
    lng: number
    distance: number // metros fora da rota
    segmentIndex: number
  }>
  
  // Paradas não planejadas
  unplannedStops: Array<{
    timestamp: Date
    lat: number
    lng: number
    duration: number // minutos parado
  }>
  
  // Segmentos divergentes
  divergentSegments: Array<{
    startIndex: number
    endIndex: number
    plannedDistance: number
    actualDistance: number
    deviation: number
  }>
}

/**
 * Calcula distância entre dois pontos usando Haversine
 */
function calculateDistance(
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
 * Calcula distância total de uma sequência de pontos
 */
function calculateTotalDistance(points: Array<{ lat: number; lng: number }>): number {
  let total = 0
  for (let i = 0; i < points.length - 1; i++) {
    total += calculateDistance(
      points[i].lat,
      points[i].lng,
      points[i + 1].lat,
      points[i + 1].lng
    )
  }
  return total
}

/**
 * Calcula distância de ponto a segmento de linha
 */
function distanceToSegment(
  pointLat: number,
  pointLng: number,
  lineStartLat: number,
  lineStartLng: number,
  lineEndLat: number,
  lineEndLng: number
): number {
  const R = 6371000 // Raio da Terra em metros
  
  const toRad = (deg: number) => deg * (Math.PI / 180)
  const lat1 = toRad(pointLat)
  const lng1 = toRad(pointLng)
  const lat2 = toRad(lineStartLat)
  const lng2 = toRad(lineStartLng)
  const lat3 = toRad(lineEndLat)
  const lng3 = toRad(lineEndLng)

  const haversine = (lat1: number, lng1: number, lat2: number, lng2: number) => {
    const dLat = lat2 - lat1
    const dLng = lng2 - lng1
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2
    return 2 * R * Math.asin(Math.sqrt(a))
  }

  const d12 = haversine(lat1, lng1, lat2, lng2)
  const d13 = haversine(lat1, lng1, lat3, lng3)
  const d23 = haversine(lat2, lng2, lat3, lng3)

  if (d23 < 10) {
    return Math.min(d12, d13)
  }

  const angle = Math.acos((d12 ** 2 + d23 ** 2 - d13 ** 2) / (2 * d12 * d23))
  const perpendicularDistance = d12 * Math.sin(angle)

  if (angle > Math.PI / 2 || d12 * Math.cos(angle) > d23) {
    return Math.min(d12, d13)
  }

  return perpendicularDistance
}

/**
 * Analisa trajeto comparando planejado vs real
 */
export function analyzeTrajectory(
  plannedRoute: PlannedRoutePoint[],
  actualPositions: ActualPosition[],
  deviationThreshold: number = 200 // metros
): TrajectoryAnalysis {
  // Ordenar pontos planejados
  const sortedPlanned = [...plannedRoute].sort((a, b) => a.order - b.order)
  
  // Ordenar posições reais por timestamp
  const sortedActual = [...actualPositions].sort(
    (a, b) => a.timestamp.getTime() - b.timestamp.getTime()
  )

  // Calcular distâncias totais
  const totalDistancePlanned = calculateTotalDistance(sortedPlanned)
  const totalDistanceActual = calculateTotalDistance(sortedActual)

  // Calcular tempos totais
  const totalTimePlanned = sortedPlanned.length > 1 && sortedPlanned[0].estimated_time && sortedPlanned[sortedPlanned.length - 1].estimated_time
    ? (sortedPlanned[sortedPlanned.length - 1].estimated_time!.getTime() - sortedPlanned[0].estimated_time!.getTime()) / (1000 * 60)
    : 0

  const totalTimeActual = sortedActual.length > 1
    ? (sortedActual[sortedActual.length - 1].timestamp.getTime() - sortedActual[0].timestamp.getTime()) / (1000 * 60)
    : 0

  // Detectar desvios
  const deviations: TrajectoryAnalysis['deviations'] = []
  for (const actual of sortedActual) {
    let minDistance = Infinity
    let closestSegmentIndex = -1

    for (let i = 0; i < sortedPlanned.length - 1; i++) {
      const distance = distanceToSegment(
        actual.lat,
        actual.lng,
        sortedPlanned[i].lat,
        sortedPlanned[i].lng,
        sortedPlanned[i + 1].lat,
        sortedPlanned[i + 1].lng
      )

      if (distance < minDistance) {
        minDistance = distance
        closestSegmentIndex = i
      }
    }

    if (minDistance > deviationThreshold) {
      deviations.push({
        timestamp: actual.timestamp,
        lat: actual.lat,
        lng: actual.lng,
        distance: Math.round(minDistance),
        segmentIndex: closestSegmentIndex,
      })
    }
  }

  // Detectar paradas não planejadas (velocidade < 1.4 m/s por > 2 minutos)
  const unplannedStops: TrajectoryAnalysis['unplannedStops'] = []
  let stopStart: { timestamp: Date; lat: number; lng: number } | null = null

  for (let i = 0; i < sortedActual.length; i++) {
    const pos = sortedActual[i]
    const isStopped = !pos.speed || pos.speed < 1.4

    if (isStopped && !stopStart) {
      stopStart = {
        timestamp: pos.timestamp,
        lat: pos.lat,
        lng: pos.lng,
      }
    } else if (!isStopped && stopStart) {
      const duration = (pos.timestamp.getTime() - stopStart.timestamp.getTime()) / (1000 * 60)
      if (duration > 2) {
        // Verificar se é uma parada planejada (proximidade de route_stops)
        // Por enquanto, marcar todas como não planejadas
        unplannedStops.push({
          timestamp: stopStart.timestamp,
          lat: stopStart.lat,
          lng: stopStart.lng,
          duration: Math.round(duration),
        })
      }
      stopStart = null
    }
  }

  // Calcular segmentos divergentes
  const divergentSegments: TrajectoryAnalysis['divergentSegments'] = []
  let currentSegment: { startIndex: number; actualIndices: number[] } | null = null

  for (let i = 0; i < sortedActual.length; i++) {
    const actual = sortedActual[i]
    let isDivergent = false

    // Verificar se está dentro do threshold
    for (let j = 0; j < sortedPlanned.length - 1; j++) {
      const distance = distanceToSegment(
        actual.lat,
        actual.lng,
        sortedPlanned[j].lat,
        sortedPlanned[j].lng,
        sortedPlanned[j + 1].lat,
        sortedPlanned[j + 1].lng
      )
      if (distance > deviationThreshold) {
        isDivergent = true
        break
      }
    }

    if (isDivergent) {
      if (!currentSegment) {
        currentSegment = { startIndex: i, actualIndices: [i] }
      } else {
        currentSegment.actualIndices.push(i)
      }
    } else if (currentSegment) {
      // Finalizar segmento divergente
      const segmentActual = currentSegment.actualIndices.map((idx) => sortedActual[idx])
      const segmentDistance = calculateTotalDistance(segmentActual)
      
      // Encontrar segmento planejado correspondente (aproximação)
      const plannedStartIdx = Math.min(
        Math.floor((currentSegment.startIndex / sortedActual.length) * sortedPlanned.length),
        sortedPlanned.length - 2
      )
      const plannedEndIdx = Math.min(
        Math.floor((currentSegment.actualIndices[currentSegment.actualIndices.length - 1] / sortedActual.length) * sortedPlanned.length),
        sortedPlanned.length - 1
      )
      
      const plannedSegment = sortedPlanned.slice(plannedStartIdx, plannedEndIdx + 1)
      const plannedDistance = calculateTotalDistance(plannedSegment)
      
      divergentSegments.push({
        startIndex: plannedStartIdx,
        endIndex: plannedEndIdx,
        plannedDistance: Math.round(plannedDistance),
        actualDistance: Math.round(segmentDistance),
        deviation: Math.round(segmentDistance - plannedDistance),
      })

      currentSegment = null
    }
  }

  // Calcular conformidade
  const conformityPercentage = totalDistancePlanned > 0
    ? Math.max(0, Math.min(100, (1 - (totalDistanceActual - totalDistancePlanned) / totalDistancePlanned) * 100))
    : 100

  const extraDistance = Math.max(0, totalDistanceActual - totalDistancePlanned)
  const timeDelay = Math.max(0, totalTimeActual - totalTimePlanned)

  return {
    totalDistancePlanned: Math.round(totalDistancePlanned),
    totalDistanceActual: Math.round(totalDistanceActual),
    totalTimePlanned: Math.round(totalTimePlanned),
    totalTimeActual: Math.round(totalTimeActual),
    conformityPercentage: Math.round(conformityPercentage * 10) / 10,
    extraDistance: Math.round(extraDistance),
    timeDelay: Math.round(timeDelay),
    deviations,
    unplannedStops,
    divergentSegments,
  }
}

