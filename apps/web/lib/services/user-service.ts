import { Database } from "@/types/supabase"

import { BaseService } from "./base-service"

export type UserProfile = Database['public']['Tables']['users']['Row']

export class UserService extends BaseService {
    /**
     * Lista usuários com filtros (Admin only)
     */
    static async listUsers(filters: { role?: string; status?: string } = {}): Promise<UserProfile[]> {
        const params = new URLSearchParams()
        if (filters.role && filters.role !== 'all') params.append('role', filters.role)
        if (filters.status && filters.status !== 'all') params.append('status', filters.status)

        const data = await this.handleFetch<{ success: boolean; users?: UserProfile[]; error?: string }>(
            `/api/admin/usuarios-list?${params.toString()}`,
            { credentials: 'include' }
        )

        return data?.users || []
    }

    /**
     * Atualiza o perfil do usuário logado
     */
    static async updateProfile(data: { name?: string; email?: string; newPassword?: string }): Promise<boolean> {
        const response = await this.handleFetch<{ success: boolean; error?: string }>(
            '/api/user/update-profile',
            {
                method: 'POST',
                body: JSON.stringify(data),
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json'
                }
            }
        )

        return !!response?.success
    }

    /**
     * Remove um usuário
     */
    static async deleteUser(id: string): Promise<boolean> {
        const data = await this.handleFetch<{ success: boolean; error?: string }>(
            `/api/admin/usuarios/delete?id=${id}`,
            { method: 'DELETE', credentials: 'include' }
        )

        return !!data?.success
    }
}
