/**
 * Utilitário para carregar dados de rotas do Supabase
 */

import { supabase } from "@/lib/supabase"

export interface PassageiroInfo {
  id: string
  name: string
  phone?: string
  email?: string
  photo?: string
  type: 'student' | 'employee' | 'visitor'
  observations?: string
}

export interface RouteStop {
  id: string
  route_id: string
  stop_order: number
  lat: number
  lng: number
  address: string
  stop_name: string
  passageiro_id?: string
  passenger_name?: string
  estimated_arrival?: string
  stop_type: 'pickup' | 'dropoff'
  passenger_photo?: string
  observations?: string
  passageiro?: PassageiroInfo
}

export interface RouteData {
  id: string
  name: string
  description?: string
  totalDistance?: number
  estimatedDuration?: number
  stops: RouteStop[]
}

/**
 * Carrega dados completos de uma rota incluindo paradas e informações dos passageiros
 * @param routeId ID da rota
 * @returns Dados formatados da rota
 */
export async function loadRouteData(routeId: string): Promise<RouteData> {
  // Buscar dados da rota
  const { data: route, error: routeError } = await supabase
    .from('rotas')
    .select('*')
    .eq('id', routeId)
    .single()

  if (routeError) throw routeError

  // Buscar pontos de parada com informações dos passageiros
  const { data: stops, error: stopsError } = await supabase
    .from('gf_rota_plano')
    .select(`
      *,
      gf_employee_company!inner(name, photo_url, phone, email, type, observations)
    `)
    .eq('route_id', routeId)
    .order('stop_order')

  if (stopsError) throw stopsError

  const processedStops: RouteStop[] =
    stops?.map((stop: any, index: number) => ({
      id: stop.id,
      route_id: stop.route_id,
      stop_order: stop.stop_order,
      lat: stop.latitude,
      lng: stop.longitude,
      address: stop.address || '',
      stop_name: stop.stop_name || `Parada ${index + 1}`,
      passageiro_id: stop.passageiro_id,
      passenger_name: stop.gf_employee_company?.name || '',
      estimated_arrival: stop.estimated_arrival_time,
      stop_type: index === 0 ? 'pickup' : 'dropoff',
      passenger_photo: stop.gf_employee_company?.photo_url,
      observations: stop.observations,
      passageiro: {
        id: stop.passageiro_id || '',
        name: stop.gf_employee_company?.name || 'Passageiro não identificado',
        phone: stop.gf_employee_company?.phone,
        email: stop.gf_employee_company?.email,
        photo: stop.gf_employee_company?.photo_url,
        type: stop.gf_employee_company?.type || 'visitor',
        observations: stop.gf_employee_company?.observations,
      },
    })) || []

  return {
    id: route.id,
    name: route.name,
    description: (route as { description?: string | null }).description || '',
    totalDistance: (route as { distance?: number | null }).distance || 0,
    estimatedDuration: (route as { estimated_duration?: number | null }).estimated_duration || 0,
    stops: processedStops,
  }
}
