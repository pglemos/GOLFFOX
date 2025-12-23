"use client"

import { useState, useEffect } from "react"
import { AppShell } from "@/components/app-shell"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useAuth } from "@/hooks/use-auth"
import { TrendingUp, Route, DollarSign, BarChart3 } from "lucide-react"
import { supabase } from "@/lib/supabase"

interface RouteMargin {
    id: string
    route_name: string
    revenue: number
    cost: number
    margin: number
    margin_percent: number
}

export default function MargensPage() {
    const { user } = useAuth()
    const [margins, setMargins] = useState<RouteMargin[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        // Mock data for route margins
        const mockMargins: RouteMargin[] = [
            { id: '1', route_name: 'Rota Centro-Shopping', revenue: 15000, cost: 9500, margin: 5500, margin_percent: 36.7 },
            { id: '2', route_name: 'Rota Industrial', revenue: 22000, cost: 14000, margin: 8000, margin_percent: 36.4 },
            { id: '3', route_name: 'Rota Universitária', revenue: 18000, cost: 11000, margin: 7000, margin_percent: 38.9 },
            { id: '4', route_name: 'Rota Executiva', revenue: 28000, cost: 18000, margin: 10000, margin_percent: 35.7 },
            { id: '5', route_name: 'Rota Noturna', revenue: 12000, cost: 8500, margin: 3500, margin_percent: 29.2 },
        ]
        setMargins(mockMargins)
        setLoading(false)
    }, [])

    const formatCurrency = (value: number) =>
        new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)

    const totalRevenue = margins.reduce((sum, m) => sum + m.revenue, 0)
    const totalCost = margins.reduce((sum, m) => sum + m.cost, 0)
    const totalMargin = margins.reduce((sum, m) => sum + m.margin, 0)
    const avgMarginPercent = totalRevenue > 0 ? ((totalMargin / totalRevenue) * 100) : 0

    return (
        <AppShell panel="transportadora" user={user ? { id: user.id, name: user.name || 'Operador', email: user.email || '', role: user.role || 'operador' } : { id: 'mock', name: 'Operador', email: 'operador@golffox.com', role: 'operador' }}>
            <div className="space-y-4 sm:space-y-6 w-full overflow-x-hidden">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
                    <div className="min-w-0 flex-1">
                        <h1 className="text-2xl sm:text-3xl font-bold mb-1 sm:mb-2 flex items-center gap-2">
                            <TrendingUp className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
                            Margem por Rota
                        </h1>
                        <p className="text-sm sm:text-base text-muted-foreground">
                            Análise de rentabilidade por rota/contrato
                        </p>
                    </div>
                </div>

                {/* Summary */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <Card>
                        <CardContent className="pt-6">
                            <p className="text-sm text-muted-foreground">Receita Total</p>
                            <p className="text-2xl font-bold text-success">{formatCurrency(totalRevenue)}</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="pt-6">
                            <p className="text-sm text-muted-foreground">Custos Totais</p>
                            <p className="text-2xl font-bold text-error">{formatCurrency(totalCost)}</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="pt-6">
                            <p className="text-sm text-muted-foreground">Margem Total</p>
                            <p className="text-2xl font-bold text-info">{formatCurrency(totalMargin)}</p>
                        </CardContent>
                    </Card>
                    <Card className="bg-primary/5">
                        <CardContent className="pt-6">
                            <p className="text-sm text-muted-foreground">Margem Média</p>
                            <p className="text-2xl font-bold text-primary">{avgMarginPercent.toFixed(1)}%</p>
                        </CardContent>
                    </Card>
                </div>

                {/* Table */}
                <Card>
                    <CardHeader>
                        <CardTitle>Detalhamento por Rota</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b">
                                        <th className="text-left p-3">Rota</th>
                                        <th className="text-right p-3">Receita</th>
                                        <th className="text-right p-3">Custo</th>
                                        <th className="text-right p-3">Margem</th>
                                        <th className="text-right p-3">%</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {margins.map(m => (
                                        <tr key={m.id} className="border-b hover:bg-muted/50">
                                            <td className="p-3 flex items-center gap-2">
                                                <Route className="h-4 w-4 text-muted-foreground" />
                                                {m.route_name}
                                            </td>
                                            <td className="p-3 text-right text-success">{formatCurrency(m.revenue)}</td>
                                            <td className="p-3 text-right text-error">{formatCurrency(m.cost)}</td>
                                            <td className="p-3 text-right font-medium">{formatCurrency(m.margin)}</td>
                                            <td className="p-3 text-right">
                                                <Badge variant={m.margin_percent >= 35 ? 'default' : 'destructive'}>
                                                    {m.margin_percent.toFixed(1)}%
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
