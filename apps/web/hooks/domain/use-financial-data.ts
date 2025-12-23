import { useState, useEffect, useMemo } from "react"

import { FinancialService } from "@/lib/services/financial-service"
import { notifyError } from "@/lib/toast"
import type { ManualCost, ManualRevenue, Budget } from "@/types/financial"

export function useFinancialData(period: string) {
    const [loading, setLoading] = useState(true)
    const [costs, setCosts] = useState<ManualCost[]>([])
    const [revenues, setRevenues] = useState<ManualRevenue[]>([])
    const [budgets, setBudgets] = useState<Budget[]>([])

    const loadData = async () => {
        try {
            setLoading(true)
            const [year, month] = period.split('-')

            const [costsData, revenuesData, budgetsData] = await Promise.all([
                FinancialService.getManualCosts(year, month),
                FinancialService.getRevenues(year, month),
                FinancialService.getBudgets(year, month),
            ])

            setCosts(costsData)
            setRevenues(revenuesData)
            setBudgets(budgetsData)
        } catch (error) {
            notifyError(error, "Erro ao carregar dados financeiros")
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        loadData()
    }, [period])

    const kpis = useMemo(() => {
        const totalCosts = costs.reduce((sum, c) => sum + c.amount, 0)
        const totalRevenues = revenues.reduce((sum, r) => sum + r.amount, 0)
        const margin = totalRevenues - totalCosts
        const marginPercent = totalRevenues > 0 ? ((margin / totalRevenues) * 100).toFixed(1) : '0'

        return {
            totalCosts,
            totalRevenues,
            margin,
            marginPercent,
            costEntries: costs.length,
            revenueEntries: revenues.length,
        }
    }, [costs, revenues])

    return {
        costs,
        revenues,
        budgets,
        loading,
        kpis,
        refresh: loadData
    }
}
