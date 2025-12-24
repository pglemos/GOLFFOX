import { NextRequest, NextResponse } from 'next/server'

import { requireAuth } from '@/lib/api-auth'
import { logError } from '@/lib/logger'
import { getSupabaseAdmin } from '@/lib/supabase-client'
import type { Database } from '@/types/supabase'

type IncidentRow = Database['public']['Tables']['gf_incidents']['Row']
type AssistanceRequestRow = Database['public']['Tables']['gf_assistance_requests']['Row']
type RotasRow = Database['public']['Tables']['rotas']['Row']
type ViagemRow = Database['public']['Tables']['viagens']['Row']
type VeiculoRow = Database['public']['Tables']['veiculos']['Row']
type UserRow = Database['public']['Tables']['users']['Row']

export const runtime = 'nodejs'

export async function GET(req: NextRequest) {
  // Verificar autenticação admin
  const authError = await requireAuth(req, 'admin')
  if (authError) return authError

  try {
    const supabase = getSupabaseAdmin()

    // Buscar rotas ativas
    const { data: allRoutes, error: routesError } = await supabase
      .from('rotas')
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
      .select('rota_id, severity, status, description')
      .eq('status', 'open')
      .in('severity', ['high', 'critical'])

    if (incidentsError) {
      logError('Erro ao buscar incidentes', { error: incidentsError }, 'RoutesWithProblemsAPI')
    }

    // Buscar solicitações de socorro abertas
    const { data: assistanceRequests, error: assistanceError } = await supabase
      .from('gf_assistance_requests')
      .select('rota_id, status, request_type')
      .eq('status', 'open')

    if (assistanceError) {
      logError('Erro ao buscar solicitações de socorro', { error: assistanceError }, 'EmergencyRoutesWithProblemsAPI')
    }

    // Filtrar rotas que têm problemas
    const routeIdsWithProblems = new Set<string>()
    
    ;(incidents || [] as IncidentRow[]).forEach((incident) => {
      if (incident.rota_id) {
        routeIdsWithProblems.add(incident.rota_id)
      }
    })

    ;(assistanceRequests || [] as AssistanceRequestRow[]).forEach((request) => {
      if (request.rota_id) {
        routeIdsWithProblems.add(request.rota_id)
      }
    })

    // Buscar informações de veículos e motoristas através das viagens ativas
    const routesWithProblemsList = ((allRoutes || []) as RotasRow[]).filter((route) => routeIdsWithProblems.has(route.id))
    
    // Buscar viagens ativas para essas rotas
    const routeIdsArray = Array.from(routeIdsWithProblems)
    const { data: activeTrips } = routeIdsArray.length > 0 ? await supabase
      .from('viagens')
      .select('rota_id, veiculo_id, motorista_id')
      .eq('status', 'in_progress')
      .in('rota_id', routeIdsArray) : { data: [] }

    // Criar mapas de rota -> veículo/motorista
    const routeVehicleMap = new Map<string, string>()
    const routeDriverMap = new Map<string, string>()
    
    ;(activeTrips?.data || [] as ViagemRow[]).forEach((trip) => {
      if (trip.veiculo_id) routeVehicleMap.set(trip.rota_id, trip.veiculo_id)
      if (trip.motorista_id) routeDriverMap.set(trip.rota_id, trip.motorista_id)
    })

    // Buscar veículos
    const vehicleIds = Array.from(routeVehicleMap.values())
    const { data: veiculos } = vehicleIds.length > 0 ? await supabase
      .from('veiculos')
      .select('id, plate, model, brand')
      .in('id', vehicleIds) : { data: [] }

    // Buscar motoristas
    const driverIds = Array.from(routeDriverMap.values())
    const { data: motoristas } = driverIds.length > 0 ? await supabase
      .from('users')
      .select('id, name, email')
      .in('id', driverIds) : { data: [] }

    const vehiclesMap = new Map(((veiculos || []) as VeiculoRow[]).map((v) => [v.id, v]))
    const driversMap = new Map(((motoristas || []) as UserRow[]).map((d) => [d.id, d]))

    // Formatar rotas com informações completas
    const formattedRoutes = routesWithProblemsList.map((route: RotasRow) => {
      const vehicleId = routeVehicleMap.get(route.id)
      const driverId = routeDriverMap.get(route.id)
      const veiculo = vehicleId ? vehiclesMap.get(vehicleId) : null
      const motorista = driverId ? driversMap.get(driverId) : null
      
      return {
        id: route.id,
        name: route.name,
        origin: route.origin || '',
        destination: route.destination || '',
        veiculo: veiculo ? {
          id: veiculo.id,
          plate: veiculo.plate,
          model: veiculo.model
        } : null,
        motorista: motorista ? {
          id: motorista.id,
          name: motorista.name,
          email: motorista.email
        } : null,
        displayName: `${route.name}${veiculo || motorista ? ` (Veículo: ${veiculo?.plate || 'N/A'} / Motorista: ${motorista?.name || 'N/A'})` : ''}`
      }
    })

    return NextResponse.json({
      success: true,
      routes: formattedRoutes
    })
  } catch (error: unknown) {
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

