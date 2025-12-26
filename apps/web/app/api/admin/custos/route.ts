"use server"

import { NextRequest } from "next/server"

import { requireAuth } from '@/lib/api-auth'
import { successResponse, errorResponse } from '@/lib/api-response'
import { logError } from '@/lib/logger'

export async function GET(request: NextRequest) {
    try {
        const authErrorResponse = await requireAuth(request, 'admin')
        if (authErrorResponse) return authErrorResponse

        // Mock data for cost control
        const kpis = {
            totalRevenue: 1250000,
            operationalCost: 820000,
            profitMargin: 34.4,
            totalKm: 185000,
        }

        const distribution = [
            { name: 'Combustível', value: 35, color: '#ef4444' },
            { name: 'Manutenção', value: 25, color: '#f59e0b' },
            { name: 'Motoristas', value: 30, color: '#3b82f6' },
            { name: 'Outros', value: 10, color: '#64748B' },
        ]

        // Monthly trend data for charts
        const monthlyTrend = [
            { month: 'Jan', revenue: 100000, cost: 70000 },
            { month: 'Fev', revenue: 110000, cost: 75000 },
            { month: 'Mar', revenue: 105000, cost: 72000 },
            { month: 'Abr', revenue: 120000, cost: 80000 },
            { month: 'Mai', revenue: 130000, cost: 85000 },
            { month: 'Jun', revenue: 140000, cost: 90000 },
        ]

        return successResponse({ kpis, distribution, monthlyTrend })
    } catch (error) {
        logError('Erro na rota custos', { error }, 'CustosAPI')
        return errorResponse(error, 500, 'Erro ao processar requisição')
    }
}
