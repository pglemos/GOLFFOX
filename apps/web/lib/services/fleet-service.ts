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
        .select('*')
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
        .select('*')
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
