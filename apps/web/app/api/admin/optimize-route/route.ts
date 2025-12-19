import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import type { OptimizeRouteRequest, OptimizeRouteResponse } from '@/types/routes'
import { calculateHash } from '@/lib/route-optimization'
import { logError } from '@/lib/logger'
import { requireAuth } from '@/lib/api-auth'

const RATE_LIMIT = new Map<string, { count: number; resetAt: number }>()

function checkRateLimit(ip: string): boolean {
  const now = Date.now()
  const limit = RATE_LIMIT.get(ip)
  
  if (!limit || now > limit.resetAt) {
    RATE_LIMIT.set(ip, { count: 1, resetAt: now + 60000 }) // 1 min
    return true
  }
  
  if (limit.count >= 10) {
    return false
  }
  
  limit.count++
  return true
}

async function optimizeWithGoogle(
  request: OptimizeRouteRequest
): Promise<OptimizeRouteResponse> {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
  if (!apiKey) {
    throw new Error('Google Maps API key não configurada')
  }

  const { origin, destination, waypoints, departureTimeIso } = request

  if (waypoints.length <= 25) {
    // Usar Directions API com optimize:true
    const waypointsStr = waypoints.map(w => `${w.lat},${w.lng}`).join('|')
    const url = new URL('https://maps.googleapis.com/maps/api/directions/json')
    url.searchParams.set('origin', `${origin.lat},${origin.lng}`)
    url.searchParams.set('destination', `${destination.lat},${destination.lng}`)
    url.searchParams.set('waypoints', `optimize:true|${waypointsStr}`)
    url.searchParams.set('departure_time', departureTimeIso || Math.floor(Date.now() / 1000).toString())
    url.searchParams.set('traffic_model', 'best_guess')
    url.searchParams.set('key', apiKey)

    const response = await fetch(url.toString())
    const data = await response.json()

    if (data.status !== 'OK') {
      throw new Error(`Google Directions API error: ${data.status}`)
    }

    const route = data.routes[0]
    const orderedWaypoints = route.waypoint_order.map((idx: number) => waypoints[idx])
    const leg = route.legs[0]

    return {
      ordered: orderedWaypoints.map((wp: typeof waypoints[0], idx: number) => ({
        id: wp.id,
        lat: wp.lat,
        lng: wp.lng,
        order: idx + 1
      })),
      polyline: route.overview_polyline.points,
      totalDistanceMeters: leg.distance.value,
      totalDurationSeconds: leg.duration_in_traffic?.value || leg.duration.value,
      usedLiveTraffic: !!leg.duration_in_traffic,
      warnings: data.geocoded_waypoints?.filter((w: any) => w.geocoder_status !== 'OK').map((w: any) => w.geocoder_status)
    }
  } else {
    // Para >25 pontos: Distance Matrix + TSP heurístico
    return await optimizeWithTSP(origin, destination, waypoints, apiKey, departureTimeIso)
  }
}

async function optimizeWithTSP(
  origin: { lat: number; lng: number },
  destination: { lat: number; lng: number },
  waypoints: Array<{ id: string; lat: number; lng: number }>,
  apiKey: string,
  departureTimeIso?: string
): Promise<OptimizeRouteResponse> {
  // Nearest Neighbor + 2-opt
  const ordered: Array<{ id: string; lat: number; lng: number; order: number }> = []
  const remaining = [...waypoints]
  let current = origin

  while (remaining.length > 0) {
    let nearestIdx = 0
    let nearestDist = Infinity

    for (let i = 0; i < remaining.length; i++) {
      const dist = Math.sqrt(
        Math.pow(remaining[i].lat - current.lat, 2) +
        Math.pow(remaining[i].lng - current.lng, 2)
      )
      if (dist < nearestDist) {
        nearestDist = dist
        nearestIdx = i
      }
    }

    const nearest = remaining.splice(nearestIdx, 1)[0]
    ordered.push({
      id: nearest.id,
      lat: nearest.lat,
      lng: nearest.lng,
      order: ordered.length + 1
    })
    current = nearest
  }

  // 2-opt improvement
  let improved = true
  while (improved) {
    improved = false
    for (let i = 0; i < ordered.length - 1; i++) {
      for (let j = i + 2; j < ordered.length; j++) {
        const distBefore = 
          distance(ordered[i], ordered[i + 1]) +
          distance(ordered[j], j < ordered.length - 1 ? ordered[j + 1] : destination)
        const distAfter =
          distance(ordered[i], ordered[j]) +
          distance(ordered[i + 1], j < ordered.length - 1 ? ordered[j + 1] : destination)

        if (distAfter < distBefore) {
          const reversed = ordered.slice(i + 1, j + 1).reverse()
          ordered.splice(i + 1, j - i, ...reversed)
          improved = true
        }
      }
    }
  }

  // Calcular distância e tempo total via Directions
  const waypointsStr = ordered.map(w => `${w.lat},${w.lng}`).join('|')
  const url = new URL('https://maps.googleapis.com/maps/api/directions/json')
  url.searchParams.set('origin', `${origin.lat},${origin.lng}`)
  url.searchParams.set('destination', `${destination.lat},${destination.lng}`)
  url.searchParams.set('waypoints', waypointsStr)
  url.searchParams.set('departure_time', departureTimeIso || Math.floor(Date.now() / 1000).toString())
  url.searchParams.set('traffic_model', 'best_guess')
  url.searchParams.set('key', apiKey)

  const response = await fetch(url.toString())
  const data = await response.json()

  if (data.status !== 'OK') {
    throw new Error(`Google Directions API error: ${data.status}`)
  }

  const route = data.routes[0]
  const totalDistance = route.legs.reduce((sum: number, leg: any) => sum + leg.distance.value, 0)
  const totalDuration = route.legs.reduce((sum: number, leg: any) => 
    sum + (leg.duration_in_traffic?.value || leg.duration.value), 0)

  return {
    ordered,
    polyline: route.overview_polyline.points,
    totalDistanceMeters: totalDistance,
    totalDurationSeconds: totalDuration,
    usedLiveTraffic: route.legs.some((leg: any) => leg.duration_in_traffic),
    warnings: []
  }
}

function distance(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
  return Math.sqrt(Math.pow(a.lat - b.lat, 2) + Math.pow(a.lng - b.lng, 2))
}

export async function POST(request: NextRequest) {
  // Verificar autenticação (admin ou empresa podem otimizar rotas)
  const authError = await requireAuth(request, ['admin', 'empresa', 'operator'])
  if (authError) return authError

  try {
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'
    if (!checkRateLimit(ip)) {
      return NextResponse.json(
        { error: 'Rate limit excedido. Tente novamente em 1 minuto.' },
        { status: 429 }
      )
    }

    const body: OptimizeRouteRequest = await request.json()
    const { companyId, origin, destination, waypoints } = body

    if (!companyId || !origin || !destination || !waypoints || waypoints.length === 0) {
      return NextResponse.json(
        { error: 'Dados inválidos' },
        { status: 400 }
      )
    }

    // Verificar cache
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    
    if (supabaseUrl && supabaseKey) {
      const supabase = createClient(supabaseUrl, supabaseKey)
      const hash = calculateHash(body)
      
      const { data: cached } = await supabase
        .from('gf_route_optimization_cache')
        .select('response')
        .eq('company_id', companyId)
        .eq('payload_hash', hash)
        .gt('created_at', new Date(Date.now() - 10 * 60 * 1000).toISOString())
        .maybeSingle()

      if (cached) {
        return NextResponse.json(cached.response)
      }

      // Otimizar
      const result = await optimizeWithGoogle(body)

      // Salvar no cache
      await supabase
        .from('gf_route_optimization_cache')
        .upsert({
          company_id: companyId,
          payload_hash: hash,
          response: result,
          created_at: new Date().toISOString()
        }, {
          onConflict: 'company_id,payload_hash'
        })

      return NextResponse.json(result)
    }

    // Sem cache, apenas otimizar
    const result = await optimizeWithGoogle(body)
    return NextResponse.json(result)

  } catch (error: unknown) {
    logError('Erro ao otimizar rota', { error }, 'OptimizeRouteAPI')
    const errorMessage = error instanceof Error ? error.message : 'Erro ao otimizar rota'
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    )
  }
}
