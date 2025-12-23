"use client"

/**
 * Dashboard Financeiro Expandido
 * Features:
 * - Abas: Visão Geral | Custos | Receitas | Orçamento
 * - KPIs animados com count-up
 * - Gráficos Orçado vs Real
 * - Drill-down em categorias
 */

import { useState, useEffect, useMemo } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
    DollarSign,
    TrendingUp,
    TrendingDown,
    Minus,
    AlertTriangle,
    Bell,
    PieChart,
    BarChart3,
    Calendar,
    Plus,
    Filter,
    Download,
    RefreshCw,
    ChevronRight,
} from "lucide-react"
import {
    LineChart,
    Line,
    BarChart,
    Bar,
    PieChart as RechartsPie,
    Pie,
    Cell,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Legend,
} from "recharts"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet"
import { CostForm } from "./cost-form"
import { formatCurrency } from "@/lib/kpi-utils"
import type {
    ManualCost,
    ManualRevenue,
    Budget,
    FinancialAlert,
    ProfileType,
    AdminFinancialKPIs,
} from "@/types/financial"

interface FinancialDashboardExpandedProps {
    profileType: ProfileType
    companyId?: string
    carrierId?: string
}

interface CountUpProps {
    value: number
    duration?: number
    prefix?: string
    suffix?: string
    className?: string
}

// Componente de count-up animado
function CountUp({ value, duration = 1500, prefix = "", suffix = "", className }: CountUpProps) {
    const [displayValue, setDisplayValue] = useState(0)

    useEffect(() => {
        let startTime: number
        let animationFrame: number

        const animate = (timestamp: number) => {
            if (!startTime) startTime = timestamp
            const progress = Math.min((timestamp - startTime) / duration, 1)

            // Easing function
            const easeOutQuart = 1 - Math.pow(1 - progress, 4)
            setDisplayValue(Math.floor(easeOutQuart * value))

            if (progress < 1) {
                animationFrame = requestAnimationFrame(animate)
            }
        }

        animationFrame = requestAnimationFrame(animate)
        return () => cancelAnimationFrame(animationFrame)
    }, [value, duration])

    return (
        <span className={className}>
            {prefix}{formatCurrency(displayValue)}{suffix}
        </span>
    )
}

// Cores para gráficos
const COLORS = ['#F97316', '#2563EB', '#059669', '#7C3AED', '#DC2626', '#0891B2', '#6366F1', '#64748B']

export function FinancialDashboardExpanded({
    profileType,
    companyId,
    carrierId,
}: FinancialDashboardExpandedProps) {
    const [loading, setLoading] = useState(true)
    const [activeTab, setActiveTab] = useState("overview")
    const [period, setPeriod] = useState(() => {
        const now = new Date()
        return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
    })
    const [showCostForm, setShowCostForm] = useState(false)

    // Estados de dados
    const [costs, setCosts] = useState<ManualCost[]>([])
    const [revenues, setRevenues] = useState<ManualRevenue[]>([])
    const [budgets, setBudgets] = useState<Budget[]>([])
    const [alerts, setAlerts] = useState<FinancialAlert[]>([])
    const [kpis, setKpis] = useState<AdminFinancialKPIs | null>(null)

    // Carregar dados
    useEffect(() => {
        const loadData = async () => {
            try {
                setLoading(true)
                const [year, month] = period.split('-')

                // Carregar em paralelo
                const [costsRes, revenuesRes, budgetsRes] = await Promise.all([
                    fetch(`/api/costs/manual-v2?page=1&page_size=100&date_from=${year}-${month}-01&date_to=${year}-${month}-31`),
                    fetch(`/api/revenues?page=1&page_size=100&date_from=${year}-${month}-01&date_to=${year}-${month}-31`),
                    fetch(`/api/budgets?year=${year}&month=${month}`),
                ])

                const [costsData, revenuesData, budgetsData] = await Promise.all([
                    costsRes.json(),
                    revenuesRes.json(),
                    budgetsRes.json(),
                ])

                if (costsData.success) setCosts(costsData.data)
                if (revenuesData.success) setRevenues(revenuesData.data)
                if (budgetsData.success) setBudgets(budgetsData.data)

                // Calcular KPIs
                const totalCosts = (costsData.data || []).reduce((sum: number, c: ManualCost) => sum + c.amount, 0)
                const totalRevenues = (revenuesData.data || []).reduce((sum: number, r: ManualRevenue) => sum + r.amount, 0)

                setKpis({
                    totalCosts30d: totalCosts,
                    totalRevenues30d: totalRevenues,
                    margin30d: totalRevenues - totalCosts,
                    costEntries30d: (costsData.data || []).length,
                    revenueEntries30d: (revenuesData.data || []).length,
                    criticalAlerts: 0,
                    warningAlerts: 0,
                    recurringCostsCount: (costsData.data || []).filter((c: ManualCost) => c.isRecurring).length,
                })
            } catch (error) {
                console.error('Erro ao carregar dados financeiros:', error)
                // Feedback ao usuário
                const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido'
                setKpis({
                    totalCosts30d: 0,
                    totalRevenues30d: 0,
                    margin30d: 0,
                    costEntries30d: 0,
                    revenueEntries30d: 0,
                    criticalAlerts: 0,
                    warningAlerts: 0,
                    recurringCostsCount: 0,
                })
                // Toast de erro se disponível
                if (typeof window !== 'undefined') {
                    import('@/lib/toast').then(({ notifyError }) => {
                        notifyError(`Erro ao carregar dados financeiros: ${errorMessage}`)
                    }).catch(() => {})
                }
            } finally {
                setLoading(false)
            }
        }

        loadData()
    }, [period])

    // Dados para gráfico de categoria
    const categoryData = useMemo(() => {
        const byCategory: Record<string, number> = {}
        costs.forEach(cost => {
            const catName = cost.category?.name || 'Sem categoria'
            byCategory[catName] = (byCategory[catName] || 0) + cost.amount
        })
        return Object.entries(byCategory)
            .map(([name, value], index) => ({
                name,
                value,
                color: COLORS[index % COLORS.length],
            }))
            .sort((a, b) => b.value - a.value)
    }, [costs])

    // Dados para gráfico Orçado vs Real
    const budgetVsActualData = useMemo(() => {
        return budgets.map(budget => {
            const actual = costs
                .filter(c => c.categoryId === budget.categoryId)
                .reduce((sum, c) => sum + c.amount, 0)

            return {
                name: budget.category?.name || budget.categoryName || 'Categoria',
                budgeted: budget.budgetedAmount,
                actual,
                variance: actual - budget.budgetedAmount,
            }
        })
    }, [budgets, costs])

    // Dados para tendência mensal (mock - idealmente viria da API)
    const trendData = useMemo(() => {
        const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']
        const currentMonth = new Date().getMonth()

        return months.slice(0, currentMonth + 1).map((month, i) => ({
            month,
            custos: Math.floor(Math.random() * 50000) + 30000,
            receitas: Math.floor(Math.random() * 60000) + 40000,
        }))
    }, [])

    // Variação percentual
    const marginPercent = kpis && kpis.totalRevenues30d > 0
        ? ((kpis.margin30d / kpis.totalRevenues30d) * 100).toFixed(1)
        : '0'

    if (loading) {
        return (
            <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {[...Array(4)].map((_, i) => (
                        <Card key={i}>
                            <CardHeader className="pb-2">
                                <Skeleton className="h-4 w-24" />
                            </CardHeader>
                            <CardContent>
                                <Skeleton className="h-8 w-32" />
                            </CardContent>
                        </Card>
                    ))}
                </div>
                <Card>
                    <CardContent className="pt-6">
                        <Skeleton className="h-[300px] w-full" />
                    </CardContent>
                </Card>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Header com período e ações */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-bold">Painel Financeiro</h2>
                    <p className="text-muted-foreground">Visão consolidada de custos e receitas</p>
                </div>
                <div className="flex items-center gap-2">
                    <Select value={period} onValueChange={setPeriod}>
                        <SelectTrigger className="w-[180px]">
                            <Calendar className="h-4 w-4 mr-2" />
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {/* Últimos 12 meses */}
                            {Array.from({ length: 12 }, (_, i) => {
                                const d = new Date()
                                d.setMonth(d.getMonth() - i)
                                const value = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
                                const label = d.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
                                return <SelectItem key={value} value={value}>{label}</SelectItem>
                            })}
                        </SelectContent>
                    </Select>

                    <Sheet open={showCostForm} onOpenChange={setShowCostForm}>
                        <SheetTrigger asChild>
                            <Button>
                                <Plus className="h-4 w-4 mr-2" />
                                Novo Custo
                            </Button>
                        </SheetTrigger>
                        <SheetContent side="right" className="w-full sm:max-w-xl overflow-y-auto">
                            <SheetHeader>
                                <SheetTitle>Lançar Custo</SheetTitle>
                                <SheetDescription>
                                    Preencha os dados do custo manual
                                </SheetDescription>
                            </SheetHeader>
                            <div className="mt-6">
                                <CostForm
                                    profileType={profileType}
                                    companyId={companyId}
                                    carrierId={carrierId}
                                    onSuccess={() => {
                                        setShowCostForm(false)
                                        // Recarregar dados
                                        window.location.reload()
                                    }}
                                    onCancel={() => setShowCostForm(false)}
                                />
                            </div>
                        </SheetContent>
                    </Sheet>
                </div>
            </div>

            {/* KPIs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0 }}
                >
                    <Card className="relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-brand/10 rounded-bl-full" />
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                                <TrendingDown className="h-4 w-4 text-brand" />
                                Total de Custos
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-brand">
                                <CountUp value={kpis?.totalCosts30d || 0} />
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                                {kpis?.costEntries30d || 0} lançamentos no mês
                            </p>
                        </CardContent>
                    </Card>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                >
                    <Card className="relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-success-light0/10 rounded-bl-full" />
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                                <TrendingUp className="h-4 w-4 text-success" />
                                Total de Receitas
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-success">
                                <CountUp value={kpis?.totalRevenues30d || 0} />
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                                {kpis?.revenueEntries30d || 0} lançamentos no mês
                            </p>
                        </CardContent>
                    </Card>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                >
                    <Card className="relative overflow-hidden">
                        <div className={`absolute top-0 right-0 w-32 h-32 ${(kpis?.margin30d || 0) >= 0 ? 'bg-info-light0/10' : 'bg-error-light0/10'} rounded-bl-full`} />
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                                {(kpis?.margin30d || 0) >= 0 ? (
                                    <TrendingUp className="h-4 w-4 text-info" />
                                ) : (
                                    <TrendingDown className="h-4 w-4 text-error" />
                                )}
                                Margem
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className={`text-2xl font-bold ${(kpis?.margin30d || 0) >= 0 ? 'text-info' : 'text-error'}`}>
                                <CountUp value={Math.abs(kpis?.margin30d || 0)} prefix={(kpis?.margin30d || 0) < 0 ? '-' : ''} />
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                                {marginPercent}% da receita
                            </p>
                        </CardContent>
                    </Card>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                >
                    <Card className="relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 rounded-bl-full" />
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                                <RefreshCw className="h-4 w-4 text-purple-500" />
                                Custos Recorrentes
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-purple-500">
                                {kpis?.recurringCostsCount || 0}
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                                lançamentos automáticos ativos
                            </p>
                        </CardContent>
                    </Card>
                </motion.div>
            </div>

            {/* Tabs de conteúdo */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
                <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="overview">Visão Geral</TabsTrigger>
                    <TabsTrigger value="costs">Custos</TabsTrigger>
                    <TabsTrigger value="revenues">Receitas</TabsTrigger>
                    <TabsTrigger value="budget">Orçamento</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="bg-transparent border-0 p-0 shadow-none space-y-4">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        {/* Gráfico de tendência */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <BarChart3 className="h-5 w-5" />
                                    Tendência Mensal
                                </CardTitle>
                                <CardDescription>Custos vs Receitas ao longo do ano</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <ResponsiveContainer width="100%" height={300}>
                                    <LineChart data={trendData}>
                                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                                        <XAxis dataKey="month" className="text-xs" />
                                        <YAxis tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} className="text-xs" />
                                        <Tooltip
                                            formatter={(value: number) => formatCurrency(value)}
                                            labelStyle={{ color: 'var(--foreground)' }}
                                            contentStyle={{
                                                backgroundColor: 'hsl(var(--card))',
                                                border: '1px solid hsl(var(--border))',
                                                borderRadius: '8px',
                                            }}
                                        />
                                        <Legend />
                                        <Line
                                            type="monotone"
                                            dataKey="custos"
                                            stroke="#F97316"
                                            strokeWidth={2}
                                            dot={{ fill: '#F97316' }}
                                            name="Custos"
                                        />
                                        <Line
                                            type="monotone"
                                            dataKey="receitas"
                                            stroke="#059669"
                                            strokeWidth={2}
                                            dot={{ fill: '#059669' }}
                                            name="Receitas"
                                        />
                                    </LineChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>

                        {/* Gráfico de pizza por categoria */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <PieChart className="h-5 w-5" />
                                    Custos por Categoria
                                </CardTitle>
                                <CardDescription>Distribuição do mês atual</CardDescription>
                            </CardHeader>
                            <CardContent>
                                {categoryData.length > 0 ? (
                                    <ResponsiveContainer width="100%" height={300}>
                                        <RechartsPie>
                                            <Pie
                                                data={categoryData}
                                                cx="50%"
                                                cy="50%"
                                                innerRadius={60}
                                                outerRadius={100}
                                                paddingAngle={5}
                                                dataKey="value"
                                                label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                                                labelLine={false}
                                            >
                                                {categoryData.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                                ))}
                                            </Pie>
                                            <Tooltip formatter={(value: number) => formatCurrency(value)} />
                                        </RechartsPie>
                                    </ResponsiveContainer>
                                ) : (
                                    <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                                        Nenhum custo lançado no período
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                <TabsContent value="costs" className="bg-transparent border-0 p-0 shadow-none space-y-4">
                    <Card>
                        <CardHeader>
                            <div className="flex justify-between items-center">
                                <CardTitle>Custos do Período</CardTitle>
                                <Button variant="outline" size="sm">
                                    <Download className="h-4 w-4 mr-2" />
                                    Exportar
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent>
                            {costs.length > 0 ? (
                                <div className="space-y-2">
                                    {costs.slice(0, 10).map((cost) => (
                                        <motion.div
                                            key={cost.id}
                                            initial={{ opacity: 0, x: -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div
                                                    className="w-2 h-2 rounded-full"
                                                    style={{ backgroundColor: cost.category?.color || '#94A3B8' }}
                                                />
                                                <div>
                                                    <p className="font-medium">{cost.description}</p>
                                                    <p className="text-xs text-muted-foreground">
                                                        {cost.category?.name || 'Sem categoria'} • {new Date(cost.costDate).toLocaleDateString('pt-BR')}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className="font-semibold text-brand">
                                                    {formatCurrency(cost.amount)}
                                                </span>
                                                <ChevronRight className="h-4 w-4 text-muted-foreground" />
                                            </div>
                                        </motion.div>
                                    ))}
                                    {costs.length > 10 && (
                                        <p className="text-center text-sm text-muted-foreground pt-2">
                                            E mais {costs.length - 10} custos...
                                        </p>
                                    )}
                                </div>
                            ) : (
                                <div className="text-center py-8 text-muted-foreground">
                                    Nenhum custo lançado no período
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="revenues" className="bg-transparent border-0 p-0 shadow-none space-y-4">
                    <Card>
                        <CardHeader>
                            <div className="flex justify-between items-center">
                                <CardTitle>Receitas do Período</CardTitle>
                                <Button variant="outline" size="sm">
                                    <Plus className="h-4 w-4 mr-2" />
                                    Nova Receita
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent>
                            {revenues.length > 0 ? (
                                <div className="space-y-2">
                                    {revenues.map((revenue) => (
                                        <motion.div
                                            key={revenue.id}
                                            initial={{ opacity: 0, x: -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                                        >
                                            <div>
                                                <p className="font-medium">{revenue.description}</p>
                                                <p className="text-xs text-muted-foreground">
                                                    {revenue.category} • {new Date(revenue.revenueDate).toLocaleDateString('pt-BR')}
                                                </p>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className="font-semibold text-success">
                                                    {formatCurrency(revenue.amount)}
                                                </span>
                                                <ChevronRight className="h-4 w-4 text-muted-foreground" />
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-8 text-muted-foreground">
                                    Nenhuma receita lançada no período
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="budget" className="bg-transparent border-0 p-0 shadow-none space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <BarChart3 className="h-5 w-5" />
                                Orçado vs Realizado
                            </CardTitle>
                            <CardDescription>Comparativo por categoria</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {budgetVsActualData.length > 0 ? (
                                <ResponsiveContainer width="100%" height={400}>
                                    <BarChart data={budgetVsActualData} layout="vertical">
                                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                                        <XAxis type="number" tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                                        <YAxis type="category" dataKey="name" width={120} className="text-xs" />
                                        <Tooltip
                                            formatter={(value: number) => formatCurrency(value)}
                                            contentStyle={{
                                                backgroundColor: 'hsl(var(--card))',
                                                border: '1px solid hsl(var(--border))',
                                                borderRadius: '8px',
                                            }}
                                        />
                                        <Legend />
                                        <Bar dataKey="budgeted" fill="#2563EB" name="Orçado" radius={[0, 4, 4, 0]} />
                                        <Bar dataKey="actual" fill="#F97316" name="Realizado" radius={[0, 4, 4, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="text-center py-8 text-muted-foreground">
                                    <p>Nenhum orçamento definido para o período</p>
                                    <Button variant="outline" className="mt-4">
                                        <Plus className="h-4 w-4 mr-2" />
                                        Configurar Orçamento
                                    </Button>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    )
}
