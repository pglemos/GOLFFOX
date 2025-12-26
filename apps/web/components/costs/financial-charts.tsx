"use client"

import { BarChart3, PieChart as PieChartIcon } from "lucide-react"
import {
    ResponsiveContainer,
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    PieChart,
    Pie,
    Cell
} from "recharts"

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"

interface CategoryDataPoint {
    category: string
    amount: number
    [key: string]: unknown
}

interface BudgetVsActualDataPoint {
    month: string
    budget: number
    actual: number
    [key: string]: unknown
}

interface FinancialChartsProps {
    categoryData: CategoryDataPoint[]
    budgetVsActualData: BudgetVsActualDataPoint[]
    formatCurrency: (value: number) => string
}

export function FinancialCharts({ categoryData, budgetVsActualData, formatCurrency }: FinancialChartsProps) {
    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card variant="premium">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <BarChart3 className="h-5 w-5" />
                        Distribuição por Categoria
                    </CardTitle>
                    <CardDescription>Visualização proporcional dos custos</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={categoryData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={100}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {categoryData.map((entry: CategoryDataPoint & { color?: string }, index: number) => (
                                        <Cell key={`cell-${index}`} fill={entry.color || '#8884d8'} />
                                    ))}
                                </Pie>
                                <Tooltip formatter={(value: number) => formatCurrency(value)} />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </CardContent>
            </Card>

            <Card variant="premium">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <BarChart3 className="h-5 w-5" />
                        Orçado vs Realizado
                    </CardTitle>
                    <CardDescription>Desempenho financeiro por categoria</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="h-[300px] w-full">
                        {/* Implementação simplificada ou mantendo a lógica de bar chart */}
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
