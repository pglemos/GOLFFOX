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
 * Versão Admin: busca pontos automaticamente da rota
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = getSupabaseAdmin()
    const searchParams = request.nextUrl.searchParams
    const routeId = searchParams.get('routeId')

    if (!routeId) {
      return NextResponse.json(
        { error: 'routeId é obrigatório' },
        { status: 400 }
      )
    }

    if (!GOOGLE_MAPS_API_KEY) {
      return NextResponse.json(
        { error: 'Google Maps API key não configurada' },
        { status: 500 }
      )
    }

    // Buscar pontos da rota (gf_route_plan ou route_stops)
    const { data: routePoints, error: pointsError } = await supabase
      .from('gf_route_plan')
      .select('id, latitude, longitude, stop_order')
      .eq('route_id', routeId)
      .order('stop_order')

    if (pointsError || !routePoints || routePoints.length < 2) {
      // Tentar route_stops como fallback
      const { data: stopsData, error: stopsError } = await supabase
        .from('route_stops')
        .select('id, lat, lng, seq')
        .eq('route_id', routeId)
        .order('seq')

      if (stopsError || !stopsData || stopsData.length < 2) {
        return NextResponse.json(
          { error: 'Rota não possui pontos suficientes (mínimo 2)' },
          { status: 400 }
        )
      }

      // Converter para formato esperado
      const points: RoutePoint[] = stopsData.map((stop: any) => ({
        id: stop.id,
        latitude: stop.lat,
        longitude: stop.lng,
        sequence: stop.seq
      }))

      return await optimizeRoutePoints(supabase, routeId, points)
    }

    // Converter para formato esperado
    const points: RoutePoint[] = routePoints.map((stop: any) => ({
      id: stop.id,
      latitude: stop.latitude,
      longitude: stop.longitude,
      sequence: stop.stop_order
    }))

    return await optimizeRoutePoints(supabase, routeId, points)
  } catch (error: any) {
    console.error('Erro ao otimizar rota:', error)
    return NextResponse.json(
      { error: error.message || 'Erro ao otimizar rota' },
      { status: 500 }
    )
  }
}

async function optimizeRoutePoints(supabase: ReturnType<typeof getSupabaseAdmin>, routeId: string, points: RoutePoint[]) {
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

  // Construir origem e destino
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
  if (!GOOGLE_MAPS_API_KEY) {
    return NextResponse.json(
      { error: 'Google Maps API key não configurada' },
      { status: 500 }
    )
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

  // Atualizar ordem na tabela gf_route_plan
  for (let i = 0; i < optimizedPoints.length; i++) {
    const point = optimizedPoints[i]
    await supabase
      .from('gf_route_plan')
      .update({ 
        stop_order: i + 1,
        estimated_arrival_time: new Date(Date.now() + etas[point.id] * 1000).toISOString()
      })
      .eq('id', point.id)
  }

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
}

