"use client"

import { useState, useEffect } from "react"

import { TrendingUp, ArrowUpRight, ArrowDownRight, Calendar, DollarSign, BarChart3 } from "lucide-react"

import { AppShell } from "@/components/app-shell"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { useAuth } from "@/hooks/use-auth"
import { supabase } from "@/lib/supabase"

interface Forecast {
    month: string
    projected_revenue: number
    projected_costs: number
    projected_margin: number
}

export default function ProjecoesFinanceirasPage() {
    const { user } = useAuth()
    const [forecasts, setForecasts] = useState<Forecast[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        // Mock data for financial projections
        const mockForecasts: Forecast[] = [
            { month: '2025-01', projected_revenue: 150000, projected_costs: 95000, projected_margin: 55000 },
            { month: '2025-02', projected_revenue: 160000, projected_costs: 98000, projected_margin: 62000 },
            { month: '2025-03', projected_revenue: 175000, projected_costs: 102000, projected_margin: 73000 },
            { month: '2025-04', projected_revenue: 180000, projected_costs: 105000, projected_margin: 75000 },
            { month: '2025-05', projected_revenue: 190000, projected_costs: 108000, projected_margin: 82000 },
            { month: '2025-06', projected_revenue: 200000, projected_costs: 115000, projected_margin: 85000 },
        ]
        setForecasts(mockForecasts)
        setLoading(false)
    }, [])

    const formatCurrency = (value: number) =>
        new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)

    const formatMonth = (month: string) => {
        const [year, m] = month.split('-')
        const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']
        return `${months[parseInt(m) - 1]}/${year}`
    }

    const totalProjectedRevenue = forecasts.reduce((sum, f) => sum + f.projected_revenue, 0)
    const totalProjectedCosts = forecasts.reduce((sum, f) => sum + f.projected_costs, 0)
    const totalProjectedMargin = forecasts.reduce((sum, f) => sum + f.projected_margin, 0)

    return (
        <AppShell panel="admin" user={user ? { id: user.id, name: user.name || 'Admin', email: user.email || '', role: user.role || 'admin' } : { id: 'mock', name: 'Admin', email: 'admin@golffox.com', role: 'admin' }}>
            <div className="space-y-4 sm:space-y-6 w-full overflow-x-hidden">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
                    <div className="min-w-0 flex-1">
                        <h1 className="text-2xl sm:text-3xl font-bold mb-1 sm:mb-2 flex items-center gap-2">
                            <TrendingUp className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
                            Projeções Financeiras
                        </h1>
                        <p className="text-sm sm:text-base text-muted-foreground">
                            Previsão de receitas, custos e margens para os próximos meses
                        </p>
                    </div>
                </div>

                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card variant="premium">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium">Receita Projetada (6m)</CardTitle>
                            <ArrowUpRight className="h-4 w-4 text-success" />
                        </CardHeader>
                        <CardContent>
                            <p className="text-2xl font-bold text-success">{formatCurrency(totalProjectedRevenue)}</p>
                        </CardContent>
                    </Card>
                    <Card variant="premium">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium">Custos Projetados (6m)</CardTitle>
                            <ArrowDownRight className="h-4 w-4 text-error" />
                        </CardHeader>
                        <CardContent>
                            <p className="text-2xl font-bold text-error">{formatCurrency(totalProjectedCosts)}</p>
                        </CardContent>
                    </Card>
                    <Card variant="premium">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium">Margem Projetada (6m)</CardTitle>
                            <BarChart3 className="h-4 w-4 text-info" />
                        </CardHeader>
                        <CardContent>
                            <p className="text-2xl font-bold text-info">{formatCurrency(totalProjectedMargin)}</p>
                        </CardContent>
                    </Card>
                </div>

                {/* Forecast Table */}
                <Card variant="premium">
                    <CardHeader>
                        <CardTitle>Projeção Mensal</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="overflow-x-auto rounded-lg border border-white/10 bg-white/5 backdrop-blur-md">
                            <table className="w-full text-sm bg-transparent">
                                <thead className="bg-white/5 backdrop-blur-md">
                                    <tr className="border-b border-white/10">
                                        <th className="text-left p-3 font-medium">Mês</th>
                                        <th className="text-right p-3 font-medium">Receita</th>
                                        <th className="text-right p-3 font-medium">Custos</th>
                                        <th className="text-right p-3 font-medium">Margem</th>
                                        <th className="text-right p-3 font-medium">%</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-transparent">
                                    {forecasts.map((f) => (
                                        <tr key={f.month} className="border-b border-white/10 hover:bg-white/5 transition-colors">
                                            <td className="p-3 flex items-center gap-2">
                                                <Calendar className="h-4 w-4 text-muted-foreground" />
                                                {formatMonth(f.month)}
                                            </td>
                                            <td className="p-3 text-right text-success">{formatCurrency(f.projected_revenue)}</td>
                                            <td className="p-3 text-right text-error">{formatCurrency(f.projected_costs)}</td>
                                            <td className="p-3 text-right font-medium">{formatCurrency(f.projected_margin)}</td>
                                            <td className="p-3 text-right">
                                                <Badge variant="outline">
                                                    {((f.projected_margin / f.projected_revenue) * 100).toFixed(1)}%
                                                </Badge>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </AppShell>
    )
}
