/**
 * Tipos para mapas e visualizações geográficas
 * 
 * Centraliza tipos relacionados a mapas, veículos, rotas e alertas
 */

/**
 * Veículo no mapa
 */
export interface Veiculo {
  veiculo_id: string
  trip_id: string
  route_id: string
  route_name: string
  motorista_id: string
  motorista_name: string
  company_id: string
  company_name: string
  plate: string
  model: string
  lat: number
  lng: number
  speed: number | null
  heading: number | null
  vehicle_status: 'moving' | 'stopped_short' | 'stopped_long' | 'garage'
  passenger_count: number
  last_position_time?: string
}

/**
 * Rota com polilinha
 */
export interface RoutePolyline {
  route_id: string
  route_name: string
  company_id: string
  company_name?: string
  polyline_points: Array<{ lat: number; lng: number; order: number }>
  stops_count: number
  origin_address?: string
  destination_address?: string
}

/**
 * Alerta no mapa
 */
export interface MapAlert {
  alert_id: string
  alert_type: 'incident' | 'assistance'
  company_id: string
  route_id?: string
  veiculo_id?: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  lat?: number
  lng?: number
  description: string
  created_at: string
}

/**
 * Posição de veículo
 */
export interface VehiclePosition {
  veiculo_id: string
  lat: number
  lng: number
  timestamp: Date
  speed?: number | null
  heading?: number | null
}

/**
 * Trajetória histórica
 */
export interface HistoricalTrajectory {
  veiculo_id: string
  trip_id: string
  positions: Array<{ lat: number; lng: number; timestamp: Date }>
  color?: string
}

/**
 * Parada de rota
 */
export interface RouteStop {
  id: string
  route_id: string
  route_name: string
  seq: number
  name: string
  lat: number
  lng: number
  radius_m: number
}

/**
 * Status de billing do Google Maps
 */
export interface MapsBillingStatus {
  quota?: number
  usage?: number
  remaining?: number
}

