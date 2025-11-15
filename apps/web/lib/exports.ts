import type { SortedStop } from './stops/stop-sorting'

export function toJSON(stops: SortedStop[]) {
  return JSON.stringify({
    generatedAt: new Date().toISOString(),
    count: stops.length,
    stops: stops.map(s => ({
      id: s.id,
      name: s.fullName,
      sequence: s.sequence,
      etaMinutes: s.etaMinutes,
      lat: s.location.lat,
      lng: s.location.lng,
    })),
  }, null, 2)
}

export function toCSV(stops: SortedStop[]) {
  const header = ['id','name','sequence','etaMinutes','lat','lng']
  const rows = stops.map(s => [s.id, s.fullName, s.sequence, s.etaMinutes, s.location.lat, s.location.lng])
  const csv = [header.join(','), ...rows.map(r => r.join(','))].join('\n')
  return csv
}

