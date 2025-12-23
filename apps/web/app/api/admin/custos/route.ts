"use server"

import { NextRequest, NextResponse } from "next/server"

import { requireAuth } from '@/lib/api-auth'
import { logError } from '@/lib/logger'

export async function GET(request: NextRequest) {
  // Verificar autenticação admin
  const authError = await requireAuth(request, 'admin')
  if (authError) return authError
    try {
        // Mock data for cost control
        const kpis = {
            totalRevenue: 1250000,
            operationalCost: 820000,
            profitMargin: 34.4,
            totalKm: 185000,
        }

        const distribution = [
            { name: 'Combustível', value: 35, color: '#ef4444' }, // error
            { name: 'Manutenção', value: 25, color: '#f59e0b' }, // amber-500
            { name: 'Motoristas', value: 30, color: '#3b82f6' }, // info-light0
            { name: 'Outros', value: 10, color: '#64748B' }, // ink-muted
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

        return NextResponse.json({ kpis, distribution, monthlyTrend })
    } catch (error) {
        logError('Erro na rota custos', { error }, 'CustosAPI')
        return NextResponse.json(
            { error: 'Erro ao processar requisição' },
            { status: 500 }
        )
    }
}
