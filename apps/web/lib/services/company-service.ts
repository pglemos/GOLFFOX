import { supabase } from "@/lib/supabase"
import { Database } from "@/types/supabase"

import { BaseService } from "./base-service"

export type Company = Database['public']['Tables']['companies']['Row']

export class CompanyService extends BaseService {
    /**
     * Lista todas as empresas do sistema (Admin only)
     */
    static async listCompanies(): Promise<Company[]> {
        const session = await supabase.auth.getSession()
        const headers: HeadersInit = {}

        if (session.data.session?.access_token) {
            headers['Authorization'] = `Bearer ${session.data.session.access_token}`
        }

        const data = await this.handleFetch<{ success: boolean; companies?: Company[]; error?: string }>(
            '/api/admin/empresas-list',
            { headers, credentials: 'include' }
        )

        return data?.companies || []
    }

    /**
     * Cria uma nova empresa (Admin only)
     */
    static async createCompany(data: { name: string; cnpj?: string; address?: string; phone?: string; email?: string }): Promise<Company> {
        const response = await this.handleFetch<{ data: Company; error?: string }>(
            '/api/admin/empresas',
            {
                method: 'POST',
                body: JSON.stringify(data),
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include'
            }
        )

        if (!response?.data) {
            throw new Error(response?.error || 'Erro ao criar empresa')
        }

        return response.data
    }

    /**
     * Remove uma empresa do sistema
     */
    static async deleteCompany(id: string): Promise<boolean> {
        const data = await this.handleFetch<{ success: boolean; error?: string }>(
            `/api/admin/empresas/delete?id=${id}`,
            { method: 'DELETE', credentials: 'include' }
        )

        return !!data?.success
    }
}
