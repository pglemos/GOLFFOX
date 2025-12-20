import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-client'
import { logError } from '@/lib/logger'
import { requireAuth } from '@/lib/api-auth'

export const runtime = 'nodejs'

export async function GET(req: NextRequest) {
  // Verificar autenticação admin
  const authError = await requireAuth(req, 'admin')
  if (authError) return authError

  try {
    const supabase = getSupabaseAdmin()

    // Buscar rotas ativas
    const { data: allRoutes, error: routesError } = await supabase
      .from('routes')
      .select(`
        id,
        name,
        origin,
        destination,
        company_id
      `)
      .eq('is_active', true)
      .order('name', { ascending: true })

    if (routesError) {
      throw routesError
    }

    // Buscar incidentes abertos relacionados a rotas
    const { data: incidents, error: incidentsError } = await supabase
      .from('gf_incidents')
      .select('route_id, severity, status, description')
      .eq('status', 'open')
      .in('severity', ['high', 'critical'])

    if (incidentsError) {
      logError('Erro ao buscar incidentes', { error: incidentsError }, 'RoutesWithProblemsAPI')
    }

    // Buscar solicitações de socorro abertas
    const { data: assistanceRequests, error: assistanceError } = await supabase
      .from('gf_assistance_requests')
      .select('route_id, status, request_type')
      .eq('status', 'open')

    if (assistanceError) {
      logError('Erro ao buscar solicitações de socorro', { error: assistanceError }, 'EmergencyRoutesWithProblemsAPI')
    }

    // Filtrar rotas que têm problemas
    const routeIdsWithProblems = new Set<string>()
    
    incidents?.forEach(incident => {
      if (incident.route_id) {
        routeIdsWithProblems.add(incident.route_id)
      }
    })

    assistanceRequests?.forEach(request => {
      if (request.route_id) {
        routeIdsWithProblems.add(request.route_id)
      }
    })

    // Buscar informações de veículos e motoristas através das viagens ativas
    const routesWithProblemsList = (allRoutes || []).filter(route => routeIdsWithProblems.has(route.id))
    
    // Buscar viagens ativas para essas rotas
    const routeIdsArray = Array.from(routeIdsWithProblems)
    const { data: activeTrips } = routeIdsArray.length > 0 ? await supabase
      .from('trips')
      .select('route_id, vehicle_id, driver_id')
      .eq('status', 'inProgress')
      .in('route_id', routeIdsArray) : { data: [] }

    // Criar mapas de rota -> veículo/motorista
    const routeVehicleMap = new Map<string, string>()
    const routeDriverMap = new Map<string, string>()
    
    activeTrips?.forEach(trip => {
      if (trip.vehicle_id) routeVehicleMap.set(trip.route_id, trip.vehicle_id)
      if (trip.driver_id) routeDriverMap.set(trip.route_id, trip.driver_id)
    })

    // Buscar veículos
    const vehicleIds = Array.from(routeVehicleMap.values())
    const { data: vehicles } = vehicleIds.length > 0 ? await supabase
      .from('vehicles')
      .select('id, plate, model, brand')
      .in('id', vehicleIds) : { data: [] }

    // Buscar motoristas
    const driverIds = Array.from(routeDriverMap.values())
    const { data: drivers } = driverIds.length > 0 ? await supabase
      .from('users')
      .select('id, name, email')
      .in('id', driverIds) : { data: [] }

    const vehiclesMap = new Map((vehicles || []).map(v => [v.id, v]))
    const driversMap = new Map((drivers || []).map(d => [d.id, d]))

    // Formatar rotas com informações completas
    const formattedRoutes = routesWithProblemsList.map(route => {
      const vehicleId = routeVehicleMap.get(route.id)
      const driverId = routeDriverMap.get(route.id)
      const vehicle = vehicleId ? vehiclesMap.get(vehicleId) : null
      const driver = driverId ? driversMap.get(driverId) : null
      
      return {
        id: route.id,
        name: route.name,
        origin: route.origin || '',
        destination: route.destination || '',
        vehicle: vehicle ? {
          id: vehicle.id,
          plate: vehicle.plate,
          model: vehicle.model
        } : null,
        driver: driver ? {
          id: driver.id,
          name: driver.name,
          email: driver.email
        } : null,
        displayName: `${route.name}${vehicle || motorista ? ` (Veículo: ${vehicle?.plate || 'N/A'} / Motorista: ${motorista?.name || 'N/A'})` : ''}`
      }
    })

    return NextResponse.json({
      success: true,
      routes: formattedRoutes
    })
  } catch (error: any) {
    logError('Erro ao buscar rotas com problemas', { error }, 'RoutesWithProblemsAPI')
    return NextResponse.json(
      {
        success: false,
        error: 'Erro ao buscar rotas com problemas',
        message: error.message
      },
      { status: 500 }
    )
  }
}

