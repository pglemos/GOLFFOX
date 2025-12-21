/**
 * Tipos para dados retornados do Supabase
 * 
 * Tipos auxiliares para dados brutos do Supabase antes de serem transformados
 */

/**
 * Dados brutos de veículo do Supabase
 */
export interface SupabaseVeiculo {
  id: string
  plate: string
  model: string
  year?: number
  prefix?: string
  capacity?: number
  is_active: boolean
  photo_url?: string
  company_id?: string
  transportadora_id?: string
  companies?: { name: string } | null
}

/**
 * Dados brutos de trip do Supabase
 */
export interface SupabaseTrip {
  id: string
  veiculo_id: string
  motorista_id: string
  route_id: string
  status: string
  routes?: { name: string } | null
  users?: { id: string; name: string } | null
}

/**
 * Dados brutos de posição do Supabase
 */
export interface SupabasePosition {
  trip_id: string
  lat: number
  lng: number
  speed?: number | null
  timestamp: string
}

/**
 * Dados brutos de rota do Supabase
 */
export interface SupabaseRoute {
  id: string
  name: string
  company_id: string
  origin_address?: string
  destination_address?: string
}

/**
 * Dados brutos de parada do Supabase
 */
export interface SupabaseStop {
  id: string
  route_id: string
  seq: number
  name: string
  lat: number
  lng: number
  radius_m: number
}

/**
 * Dados brutos de incidente do Supabase
 */
export interface SupabaseIncident {
  id: string
  alert_type: string
  company_id: string
  route_id?: string
  veiculo_id?: string
  severity: string
  lat?: number
  lng?: number
  description: string
  created_at: string
}

/**
 * Dados brutos de assistência do Supabase
 */
export interface SupabaseAssistance {
  id: string
  company_id: string
  route_id?: string
  veiculo_id?: string
  status: string
  lat?: number
  lng?: number
  description?: string
  created_at: string
}

