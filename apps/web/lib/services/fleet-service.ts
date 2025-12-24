import { supabase } from "@/lib/supabase"
import { Database } from "@/types/supabase"

import { BaseService } from "./base-service"

type Vehicle = Database['public']['Tables']['veiculos']['Row']
type Driver = Database['public']['Tables']['users']['Row']

export class FleetService extends BaseService {
  /**
   * Busca todos os veículos de uma transportadora
   */
  static async getVehicles(transportadoraId: string): Promise<Vehicle[]> {
    const data = await this.handleRequest<Vehicle[]>(
      supabase
        .from('veiculos')
        .select('id, plate, model, brand, year, capacity, prefix, vehicle_type, fuel_type, color, chassis, renavam, photo_url, is_active, empresa_id, transportadora_id, created_at, updated_at')
        .eq('transportadora_id', transportadoraId)
        .order('plate', { ascending: true })
    )
    return data || []
  }

  /**
   * Busca motoristas ativos de uma transportadora
   */
  static async getDrivers(transportadoraId: string): Promise<Driver[]> {
    const data = await this.handleRequest<Driver[]>(
      supabase
        .from('users')
        .select('id, name, email, cpf, phone, cnh, cnh_category, avatar_url, is_active, transportadora_id, empresa_id, role, created_at, updated_at')
        .eq('transportadora_id', transportadoraId)
        .eq('role', 'motorista')
        .eq('is_active', true)
    )
    return data || []
  }

  /**
   * Busca detalhes completos de um veículo (manutenções e documentos)
   */
  static async getVehicleDetails(vehicleId: string) {
    return this.handleFetch(`/api/transportadora/veiculos/${vehicleId}/details`)
  }
}
