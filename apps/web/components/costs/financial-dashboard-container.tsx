/**
 * Componente Container para dashboard financeiro
 * Gerencia lógica de negócio e estado
 */

"use client"

import { useState } from "react"
import { useFinancialData, useFinancialKPIs, useCategoryBreakdown, useBudgetVariance } from "@/hooks/use-financial-dashboard"
import { FinancialDashboardExpandedPresentational } from "./financial-dashboard-presentational"
import type { ProfileType } from "@/types/financial"

// Cores para gráficos
const COLORS = ['#F97316', '#2563EB', '#059669', '#7C3AED', '#DC2626', '#0891B2', '#6366F1', '#64748B']

export interface FinancialDashboardContainerProps {
    profileType: ProfileType
    companyId?: string
    carrierId?: string
}

export function FinancialDashboardContainer({
    profileType,
    companyId,
    carrierId,
}: FinancialDashboardContainerProps) {
    const [activeTab, setActiveTab] = useState("overview")
    const [period, setPeriod] = useState(() => {
        const now = new Date()
        return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
    })
    const [showCostForm, setShowCostForm] = useState(false)

    // Usar hooks para buscar dados
    const { data: financialData, isLoading: loading } = useFinancialData(period)
    const costs = financialData?.costs || []
    const revenues = financialData?.revenues || []
    const budgets = financialData?.budgets || []

    // Calcular KPIs e dados processados
    const kpis = useFinancialKPIs(costs, revenues)
    const categoryData = useCategoryBreakdown(costs, COLORS)
    const budgetVsActualData = useBudgetVariance(budgets, costs)

    return (
        <FinancialDashboardExpandedPresentational
            profileType={profileType}
            companyId={companyId}
            carrierId={carrierId}
            costs={costs}
            revenues={revenues}
            budgets={budgets}
            kpis={kpis}
            categoryData={categoryData}
            budgetVsActualData={budgetVsActualData}
            loading={loading}
            activeTab={activeTab}
            period={period}
            showCostForm={showCostForm}
            onTabChange={setActiveTab}
            onPeriodChange={setPeriod}
            onShowCostFormChange={setShowCostForm}
        />
    )
}

