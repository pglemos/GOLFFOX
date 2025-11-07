import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE
  if (!url || !serviceKey) {
    throw new Error('Supabase não configurado: defina NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY')
  }
  return createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false }
  })
}

const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY

interface RoutePoint {
  id: string
  latitude: number
  longitude: number
  sequence?: number
}

/**
 * Otimiza a ordem dos pontos de uma rota usando heurística TSP
 * baseada em Google Directions + Distance Matrix
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = getSupabaseAdmin()
    const { routeId, points } = await request.json()

    if (!routeId || !points || !Array.isArray(points) || points.length < 2) {
      return NextResponse.json(
        { error: 'routeId e points[] são obrigatórios' },
        { status: 400 }
      )
    }

    if (!GOOGLE_MAPS_API_KEY) {
      return NextResponse.json(
        { error: 'Google Maps API key não configurada' },
        { status: 500 }
      )
    }

    // Verificar cache (5-10 minutos)
    const { data: cached } = await supabase
      .from('gf_route_optimization_cache')
      .select('optimized_order, etas, cached_at')
      .eq('route_id', routeId)
      .single()

    if (cached) {
      const cacheAge = Date.now() - new Date(cached.cached_at).getTime()
      const cacheMaxAge = 10 * 60 * 1000 // 10 minutos

      if (cacheAge < cacheMaxAge) {
        return NextResponse.json({
          optimized_order: cached.optimized_order,
          etas: cached.etas,
          cached: true
        })
      }
    }

    // Construir origem (primeiro ponto ou depósito)
    const origin = `${points[0].latitude},${points[0].longitude}`
    const destination = `${points[points.length - 1].latitude},${points[points.length - 1].longitude}`
    const waypoints = points.slice(1, -1).map(
      (p: RoutePoint) => `${p.latitude},${p.longitude}`
    )

    // Chamar Google Directions API para obter rota otimizada
    const directionsUrl = new URL('https://maps.googleapis.com/maps/api/directions/json')
    directionsUrl.searchParams.set('origin', origin)
    directionsUrl.searchParams.set('destination', destination)
    if (waypoints.length > 0) {
      directionsUrl.searchParams.set('waypoints', `optimize:true|${waypoints.join('|')}`)
    }
    directionsUrl.searchParams.set('key', GOOGLE_MAPS_API_KEY)
    directionsUrl.searchParams.set('language', 'pt-BR')

    const directionsRes = await fetch(directionsUrl.toString())
    const directionsData = await directionsRes.json()

    if (directionsData.status !== 'OK') {
      return NextResponse.json(
        { error: `Google Directions API error: ${directionsData.status}` },
        { status: 500 }
      )
    }

    const route = directionsData.routes[0]
    const optimizedWaypointOrder = route.waypoint_order || []
    const legDurations = route.legs.map((leg: any) => leg.duration.value) // segundos

    // Reconstruir ordem otimizada
    const optimizedPoints: RoutePoint[] = [
      points[0], // origem sempre primeiro
      ...optimizedWaypointOrder.map((idx: number) => points[idx + 1]),
      ...(points.length > 1 ? [points[points.length - 1]] : []) // destino sempre último
    ]

    // Calcular ETAs cumulativos
    let cumulativeTime = 0
    const etas: Record<string, number> = {}
    optimizedPoints.forEach((point, idx) => {
      if (idx > 0) {
        cumulativeTime += legDurations[idx - 1] || 0
      }
      etas[point.id] = cumulativeTime
    })

    // Salvar no cache
    await supabase
      .from('gf_route_optimization_cache')
      .upsert({
        route_id: routeId,
        optimized_order: optimizedPoints.map((p, idx) => ({
          id: p.id,
          sequence: idx + 1,
          latitude: p.latitude,
          longitude: p.longitude
        })),
        etas,
        cached_at: new Date().toISOString()
      })

    return NextResponse.json({
      optimized_order: optimizedPoints.map((p, idx) => ({
        id: p.id,
        sequence: idx + 1,
        latitude: p.latitude,
        longitude: p.longitude
      })),
      etas,
      total_duration_seconds: cumulativeTime,
      cached: false
    })
  } catch (error: any) {
    console.error('Erro ao otimizar rota:', error)
    return NextResponse.json(
      { error: error.message || 'Erro ao otimizar rota' },
      { status: 500 }
    )
  }
}
