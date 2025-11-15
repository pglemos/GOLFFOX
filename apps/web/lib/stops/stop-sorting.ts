type LatLng = { lat: number; lng: number }

export interface StopCandidate {
  id: string
  fullName: string
  location: LatLng
  dwellMinutes?: number
}

export interface SortedStop extends StopCandidate {
  sequence: number
  etaMinutes: number
}

function haversine(a: LatLng, b: LatLng) {
  const R = 6371e3
  const toRad = (d: number) => (d * Math.PI) / 180
  const dLat = toRad(b.lat - a.lat)
  const dLng = toRad(b.lng - a.lng)
  const lat1 = toRad(a.lat)
  const lat2 = toRad(b.lat)
  const sa = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2
  const c = 2 * Math.atan2(Math.sqrt(sa), Math.sqrt(1 - sa))
  return R * c // meters
}

// Ordenação por vizinho mais próximo com penalização leve para tráfego (parâmetro opcional)
export function sortStops(candidates: StopCandidate[], origin: LatLng, avgSpeedKmh = 30): SortedStop[] {
  const remaining = [...candidates]
  const ordered: SortedStop[] = []
  let current = origin
  let elapsedMin = 0

  const mps = (avgSpeedKmh * 1000) / 3600

  let seq = 1
  while (remaining.length > 0) {
    // Escolhe o mais próximo
    remaining.sort((a, b) => haversine(current, a.location) - haversine(current, b.location))
    const next = remaining.shift()!
    const distanceM = haversine(current, next.location)
    const travelMin = distanceM / mps / 60
    elapsedMin += travelMin
    const dwell = next.dwellMinutes ?? 2
    const stop: SortedStop = {
      ...next,
      sequence: seq++,
      etaMinutes: Math.round(elapsedMin),
    }
    ordered.push(stop)
    elapsedMin += dwell
    current = next.location
  }
  return ordered
}

