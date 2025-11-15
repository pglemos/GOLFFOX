import type { OptimizeRouteRequest, OptimizeRouteResponse } from '@/types/routes'

export async function optimizeRoute(request: OptimizeRouteRequest): Promise<OptimizeRouteResponse> {
  const response = await fetch('/api/admin/optimize-route', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request)
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.message || 'Erro ao otimizar rota')
  }

  return response.json()
}

export function calculateHash(payload: OptimizeRouteRequest): string {
  const str = JSON.stringify({
    companyId: payload.companyId,
    origin: payload.origin,
    destination: payload.destination,
    waypoints: payload.waypoints.sort((a, b) => a.id.localeCompare(b.id))
  })
  
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash
  }
  return Math.abs(hash).toString(36)
}

