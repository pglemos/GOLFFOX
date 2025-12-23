import { supabase } from "@/lib/supabase"
import type { ManualCost, ManualRevenue, Budget } from "@/types/financial"
import type { Database } from "@/types/supabase"

export class FinancialService {
    /**
     * Busca os custos manuais (V2) para um período específico
     */
    static async getManualCosts(year: string, month: string): Promise<ManualCost[]> {
        const res = await fetch(`/api/costs/manual-v2?page=1&page_size=100&date_from=${year}-${month}-01&date_to=${year}-${month}-31`)
        const result = await res.json()
        if (!result.success) throw new Error(result.error || "Erro ao buscar custos")
        return result.data || []
    }

    /**
     * Busca as receitas para um período específico
     */
    static async getRevenues(year: string, month: string): Promise<ManualRevenue[]> {
        const res = await fetch(`/api/revenues?page=1&page_size=100&date_from=${year}-${month}-01&date_to=${year}-${month}-31`)
        const result = await res.json()
        if (!result.success) throw new Error(result.error || "Erro ao buscar receitas")
        return result.data || []
    }

    /**
     * Busca orçamentos para um período específico
     */
    static async getBudgets(year: string, month: string): Promise<Budget[]> {
        const res = await fetch(`/api/budgets?year=${year}&month=${month}`)
        const result = await res.json()
        if (!result.success) throw new Error(result.error || "Erro ao buscar orçamentos")
        return result.data || []
    }
}
