import { Database } from "@/types/supabase"

import { BaseService } from "./base-service"

export type Driver = Database['public']['Tables']['users']['Row']

export class DriverService extends BaseService {
    /**
     * Lista motoristas da transportadora logada
     */
    static async listDrivers(): Promise<Driver[]> {
        const data = await this.handleFetch<Driver[] | { motoristas: Driver[] }>(
            '/api/transportadora/motoristas',
            { credentials: 'include' }
        )

        const response = data as any
        return Array.isArray(response) ? response : response.motoristas || []
    }

    /**
     * Remove um motorista
     */
    static async deleteDriver(id: string): Promise<boolean> {
        const data = await this.handleFetch<{ success: boolean }>(
            `/api/transportadora/motoristas/delete?id=${id}`,
            { method: 'DELETE', credentials: 'include' }
        )
        return !!data
    }
}
