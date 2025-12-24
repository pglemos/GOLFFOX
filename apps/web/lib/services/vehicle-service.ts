import { supabase } from "@/lib/supabase"
import { Database } from "@/types/supabase"

import { BaseService } from "./base-service"

export type Vehicle = Database['public']['Tables']['veiculos']['Row'] & {
    hasExpiringDocs?: boolean
    expiringDocsCount?: number
    lastMaintenance?: any
}

export interface MaintenanceRecord {
    id: string
    veiculo_id: string
    maintenance_type: string
    description: string
    scheduled_date: string
    completed_date?: string
    cost_parts_brl: number
    cost_labor_brl: number
    workshop_name: string
    mechanic_name: string
    odometer_km: number | null
    status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled'
}

export class VehicleService extends BaseService {
    /**
     * Lista veículos de uma transportadora
     */
    static async listVehicles(transportadoraId: string): Promise<Vehicle[]> {
        const { data: vehicles, error } = await supabase
            .from('veiculos')
            .select('id, plate, model, brand, year, capacity, prefix, vehicle_type, fuel_type, color, chassis, renavam, photo_url, is_active, empresa_id, transportadora_id, created_at, updated_at')
            .eq('transportadora_id', transportadoraId)
            .order('created_at', { ascending: false })

        if (error) throw error
        return vehicles as Vehicle[] || []
    }

    /**
     * Carrega documentos de um veículo via API
     */
    static async listDocuments(vehicleId: string): Promise<any[]> {
        return await this.handleFetch<any[]>(`/api/transportadora/veiculos/${vehicleId}/documents`, {
            credentials: 'include'
        }) || []
    }

    /**
     * Carrega manutenções de um veículo
     */
    static async listMaintenances(vehicleId: string): Promise<MaintenanceRecord[]> {
        return await this.handleFetch<MaintenanceRecord[]>(`/api/transportadora/veiculos/${vehicleId}/maintenances`, {
            credentials: 'include'
        }) || []
    }

    /**
     * Salva nova manutenção
     */
    static async saveMaintenance(vehicleId: string, data: Partial<MaintenanceRecord>): Promise<void> {
        await this.handleFetch(`/api/transportadora/veiculos/${vehicleId}/maintenances`, {
            method: 'POST',
            body: JSON.stringify(data)
        })
    }
}
