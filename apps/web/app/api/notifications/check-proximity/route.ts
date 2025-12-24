import { NextRequest, NextResponse } from 'next/server'

import { createClient } from '@supabase/supabase-js'

import { requireAuth } from '@/lib/api-auth'
import { debug, error as logError } from '@/lib/logger'
import { checkProximity, findNearestStop, shouldNotify } from '@/lib/notifications/proximity-service'
import { applyRateLimit } from '@/lib/rate-limit'

const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE
  if (!url || !serviceKey) {
    throw new Error('Supabase não configurado')
  }
  return createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false }
  })
}

/**
 * API Route para verificar proximidade de ônibus em relação às paradas
 * 
 * POST /api/notifications/check-proximity
 * Body: {
 *   tripId: string,
 *   routeId: string,
 *   vehicleId: string,
 *   busLat: number,
 *   busLng: number,
 *   thresholdMeters?: number (default: 500)
 * }
 */
export async function POST(request: NextRequest) {
  try {
    // Aplicar rate limiting
    const rateLimitResponse = await applyRateLimit(request, 'api')
    if (rateLimitResponse) return rateLimitResponse

    // Verificar autenticação (requer usuário autenticado)
    const authError = await requireAuth(request)
    if (authError) return authError

    if (!GOOGLE_MAPS_API_KEY) {
      return NextResponse.json(
        { error: 'Google Maps API key não configurada' },
        { status: 500 }
      )
    }

    const body = await request.json()
    const { tripId, routeId, vehicleId, busLat, busLng, thresholdMeters = 500 } = body

    if (!tripId || !routeId || !vehicleId || typeof busLat !== 'number' || typeof busLng !== 'number') {
      return NextResponse.json(
        { error: 'Dados inválidos. Requer: tripId, routeId, vehicleId, busLat, busLng' },
        { status: 400 }
      )
    }

    // Usar service-role para esta operação (necessário para ler dados de múltiplas empresas)
    const supabase = getSupabaseAdmin()

    // Buscar paradas da rota que ainda não foram visitadas
    const { data: routeStops, error: stopsError } = await supabase
      .from('route_stops')
      .select('id, latitude, longitude, seq, name')
      .eq('route_id', routeId)
      .order('seq', { ascending: true })

    if (stopsError) {
      logError('Erro ao buscar paradas', { error: stopsError }, 'CheckProximityAPI')
      return NextResponse.json(
        { error: 'Erro ao buscar paradas da rota' },
        { status: 500 }
      )
    }

    if (!routeStops || routeStops.length === 0) {
      return NextResponse.json({
        nearby: false,
        nearestStop: null,
        checks: []
      })
    }

    // Buscar eventos de chegada já registrados para esta viagem
    const { data: arrivalEvents } = await supabase
      .from('trip_events')
      .select('event_type')
      .eq('trip_id', tripId)
      .like('event_type', 'arrived_at_stop%')

    const visitedStopIds = new Set(
      arrivalEvents?.map(e => e.event_type.replace('arrived_at_stop_', '')) || []
    )

    // Filtrar apenas paradas não visitadas
    const pendingStops = routeStops.filter(stop => !visitedStopIds.has(stop.id))

    if (pendingStops.length === 0) {
      return NextResponse.json({
        nearby: false,
        nearestStop: null,
        checks: [],
        message: 'Todas as paradas já foram visitadas'
      })
    }

    // Verificar proximidade para cada parada pendente
    const busPosition = {
      lat: busLat,
      lng: busLng,
      vehicleId,
      routeId,
      timestamp: new Date()
    }

    const checks = await Promise.all(
      pendingStops.map(async (stop) => {
        const stopPosition = {
          lat: stop.latitude,
          lng: stop.longitude,
          stopId: stop.id,
          routeId,
          passengerIds: [] // Será preenchido se necessário
        }

        const proximity = await checkProximity(busPosition, stopPosition, thresholdMeters)

        return {
          stopId: stop.id,
          stopName: stop.name,
          stopSeq: stop.seq,
          ...proximity
        }
      })
    )

    // Encontrar parada mais próxima
    const stopPositions = pendingStops.map(stop => ({
      lat: stop.latitude,
      lng: stop.longitude,
      stopId: stop.id,
      routeId,
      passengerIds: []
    }))

    const nearest = findNearestStop(busPosition, stopPositions)

    // Determinar se deve notificar
    const nearbyChecks = checks.filter(c => c.isNearby)
    const shouldNotifyResult = nearbyChecks.length > 0
      ? shouldNotify(nearbyChecks[0], undefined) // Primeira vez detectando proximidade
      : { shouldNotify: false, reason: null }

    debug('Proximidade verificada', {
      tripId,
      routeId,
      nearbyCount: nearbyChecks.length,
      nearestDistance: nearest?.distanceMeters,
      shouldNotify: shouldNotifyResult.shouldNotify
    }, 'CheckProximityAPI')

    return NextResponse.json({
      nearby: nearbyChecks.length > 0,
      nearestStop: nearest ? {
        stopId: nearest.stop.stopId,
        distanceMeters: nearest.distanceMeters
      } : null,
      checks,
      shouldNotify: shouldNotifyResult.shouldNotify,
      notifyReason: shouldNotifyResult.reason
    })
  } catch (error: unknown) {
    logError('Erro ao verificar proximidade', { error }, 'CheckProximityAPI')
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erro ao verificar proximidade' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/notifications/check-proximity?tripId=xxx&routeId=xxx&vehicleId=xxx&busLat=xxx&busLng=xxx
 * Versão GET para facilitar testes
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const tripId = searchParams.get('tripId')
    const routeId = searchParams.get('routeId')
    const vehicleId = searchParams.get('vehicleId')
    const busLat = searchParams.get('busLat')
    const busLng = searchParams.get('busLng')
    const thresholdMeters = searchParams.get('thresholdMeters') || '500'

    if (!tripId || !routeId || !vehicleId || !busLat || !busLng) {
      return NextResponse.json(
        { error: 'Parâmetros obrigatórios: tripId, routeId, vehicleId, busLat, busLng' },
        { status: 400 }
      )
    }

    // Criar request POST simulado
    const mockRequest = new NextRequest(request.url, {
      method: 'POST',
      body: JSON.stringify({
        tripId,
        routeId,
        vehicleId,
        busLat: parseFloat(busLat),
        busLng: parseFloat(busLng),
        thresholdMeters: parseFloat(thresholdMeters)
      })
    })

    return POST(mockRequest)
  } catch (error: unknown) {
    logError('Erro no GET check-proximity', { error }, 'CheckProximityAPI')
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erro ao verificar proximidade' },
      { status: 500 }
    )
  }
}

