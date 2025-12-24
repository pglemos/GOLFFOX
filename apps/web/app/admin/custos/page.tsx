"use client"

/**
 * Página de Custos Financeiros - Admin
 * Dashboard expandido com:
 * - Visão consolidada multi-tenant
 * - Abas: Visão Geral | Custos | Receitas | Orçamento
 * - Lançamento de custos/receitas
 * - Gráficos Orçado vs Real
 */

import { useState, useEffect, useMemo, Suspense } from "react"

import { motion, AnimatePresence } from "framer-motion"
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Calendar,
  Plus,
  Download,
  RefreshCw,
  ChevronRight,
  AlertTriangle,
  PieChart as PieChartIcon,
  BarChart3,
  FileText,
  Filter,
} from "lucide-react"
import {
  Tooltip,
  ResponsiveContainer,
  Legend,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Cell
} from 'recharts'

import { AppShell } from "@/components/app-shell"
import { CostForm } from "@/components/costs/cost-form"
import { FinancialCharts } from "@/components/costs/financial-charts"
import { useAuth } from "@/components/providers/auth-provider"
import { LazyPageWrapper, DashboardPageSkeleton } from "@/components/shared/lazy-page-wrapper"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
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
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useFinancialData } from "@/hooks/domain/use-financial-data"
import { formatCurrency } from "@/lib/kpi-utils"
import { notifyError, notifySuccess } from "@/lib/toast"
import type { ManualCost, ManualRevenue, Budget } from "@/types/financial"

// Cores para gráficos
const COLORS = ['#F97316', '#2563EB', '#059669', '#7C3AED', '#DC2626', '#0891B2', '#6366F1', '#64748B']

// Componente de count-up animado
function CountUp({ value, duration = 1500, prefix = "" }: { value: number; duration?: number; prefix?: string }) {
  const [displayValue, setDisplayValue] = useState(0)

  useEffect(() => {
    let startTime: number
    let animationFrame: number

    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp
      const progress = Math.min((timestamp - startTime) / duration, 1)
      const easeOutQuart = 1 - Math.pow(1 - progress, 4)
      setDisplayValue(Math.floor(easeOutQuart * value))

      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate)
      }
    }

    animationFrame = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(animationFrame)
  }, [value, duration])

  return <span>{prefix}{formatCurrency(displayValue)}</span>
}

function CustosPageContent() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("overview")
  const [showCostForm, setShowCostForm] = useState(false)
  const [period, setPeriod] = useState(() => {
    const now = new Date()
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  })

  const {
    costs,
    revenues,
    budgets,
    loading: dataLoading,
    kpis,
    refresh: loadData
  } = useFinancialData(period)

  // Substituído pelo hook useFinancialData

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
        .filter(c => c.category_id === budget.category_id)
        .reduce((sum, c) => sum + c.amount, 0)

      return {
        name: budget.category?.name || budget.category_name || 'Categoria',
        budgeted: budget.budgeted_amount,
        actual,
        variance: actual - budget.budgeted_amount,
      }
    })
  }, [budgets, costs])

  const userForShell = user ? {
    id: user.id,
    name: user.name || 'Admin',
    email: user.email,
    role: user.role || 'admin'
  } : {
    id: 'mock',
    name: 'Admin',
    email: 'admin@golffox.com',
    role: 'admin'
  }

  if (loading || dataLoading) {
    return (
      <AppShell panel="admin" user={userForShell}>
        <div className="p-3 space-y-4 pb-12 sm:pb-16">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <Card key={i} variant="premium">
                <CardHeader className="pb-2">
                  <Skeleton className="h-4 w-24" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-8 w-32" />
                </CardContent>
              </Card>
            ))}
          </div>
          <Card variant="premium">
            <CardContent className="p-3">
              <Skeleton className="h-[300px] w-full" />
            </CardContent>
          </Card>
        </div>
      </AppShell>
    )
  }

  return (
    <AppShell panel="admin" user={userForShell}>
      <div className="space-y-4 sm:space-y-6 w-full overflow-x-hidden">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
          <div className="min-w-0 flex-1">
            <h1 className="text-2xl sm:text-3xl font-bold mb-1 sm:mb-2">Painel Financeiro</h1>
            <p className="text-sm sm:text-base text-muted-foreground">
              Visão consolidada de custos, receitas e orçamentos
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Select value={period} onValueChange={setPeriod}>
              <SelectTrigger className="w-[180px]">
                <Calendar className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
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
                <Button variant="default" className="bg-brand/90 backdrop-blur-md border border-brand/30 hover:bg-brand hover:border-brand/50 hover:shadow-lg">
                  <Plus className="h-4 w-4 mr-2" />
                  Novo Lançamento
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
                    profileType="admin"
                    onSuccess={() => {
                      setShowCostForm(false)
                      notifySuccess("Custo cadastrado com sucesso!")
                      loadData()
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
            <Card variant="premium" className="relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-brand/10 rounded-bl-full" />
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-brand dark:text-brand flex items-center gap-2">
                  <TrendingDown className="h-4 w-4" />
                  Total de Custos
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-brand dark:text-brand-light">
                  <CountUp value={kpis.totalCosts} />
                </div>
                <p className="text-xs text-brand dark:text-brand mt-1">
                  {kpis.costEntries} lançamentos no mês
                </p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card variant="premium" className="relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-success-light0/10 rounded-bl-full" />
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-success dark:text-success flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  Total de Receitas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-success dark:text-success-light">
                  <CountUp value={kpis.totalRevenues} />
                </div>
                <p className="text-xs text-success dark:text-success mt-1">
                  {kpis.revenueEntries} lançamentos no mês
                </p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card variant="premium" className={`relative overflow-hidden ${kpis.margin >= 0
              ? 'bg-gradient-to-br from-info-light to-info-light border-info-light dark:from-info dark:to-info dark:border-info'
              : 'bg-gradient-to-br from-error-light to-error-light border-error-light dark:from-error dark:to-error dark:border-error'
              }`}>
              <div className={`absolute top-0 right-0 w-32 h-32 ${kpis.margin >= 0 ? 'bg-info-light0/10' : 'bg-error-light0/10'} rounded-bl-full`} />
              <CardHeader className="pb-2">
                <CardTitle className={`text-sm font-medium flex items-center gap-2 ${kpis.margin >= 0 ? 'text-info dark:text-info' : 'text-error dark:text-error'
                  }`}>
                  {kpis.margin >= 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                  Margem
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${kpis.margin >= 0 ? 'text-info dark:text-info-light' : 'text-error dark:text-error-light'}`}>
                  <CountUp value={Math.abs(kpis.margin)} prefix={kpis.margin < 0 ? '-' : ''} />
                </div>
                <p className={`text-xs mt-1 ${kpis.margin >= 0 ? 'text-info dark:text-info' : 'text-error dark:text-error'}`}>
                  {kpis.marginPercent}% da receita
                </p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card variant="premium" className="relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 rounded-bl-full" />
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-purple-700 dark:text-purple-300 flex items-center gap-2">
                  <RefreshCw className="h-4 w-4" />
                  Custos Recorrentes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-purple-900 dark:text-purple-100">
                  {kpis.recurring_costs_count}
                </div>
                <p className="text-xs text-purple-600 dark:text-purple-400 mt-1">
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
            <FinancialCharts
              categoryData={categoryData}
              budgetVsActualData={budgetVsActualData}
              formatCurrency={formatCurrency}
            />
          </TabsContent>

          <TabsContent value="costs" className="bg-transparent border-0 p-0 shadow-none space-y-4">
            <Card variant="premium">
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
                    {costs.map((cost) => (
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
                              {cost.category?.name || 'Sem categoria'} • {new Date(cost.cost_date).toLocaleDateString('pt-BR')}
                              {cost.empresa?.name && ` • ${cost.empresa.name}`}
                              {cost.transportadora?.name && ` • ${cost.transportadora.name}`}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {cost.is_recurring && (
                            <Badge variant="outline" className="text-xs">
                              <RefreshCw className="h-3 w-3 mr-1" />
                              Recorrente
                            </Badge>
                          )}
                          <span className="font-semibold text-brand">
                            {formatCurrency(cost.amount)}
                          </span>
                          <ChevronRight className="h-4 w-4 text-muted-foreground" />
                        </div>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Nenhum custo lançado no período</p>
                    <Button
                      variant="outline"
                      className="mt-4"
                      onClick={() => setShowCostForm(true)}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Lançar primeiro custo
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="revenues" className="bg-transparent border-0 p-0 shadow-none space-y-4">
            <Card variant="premium">
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
                            {revenue.category} • {new Date(revenue.revenue_date).toLocaleDateString('pt-BR')}
                            {revenue.contract_reference && ` • Contrato: ${revenue.contract_reference}`}
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
                    <DollarSign className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Nenhuma receita lançada no período</p>
                    <Button variant="outline" className="mt-4">
                      <Plus className="h-4 w-4 mr-2" />
                      Lançar primeira receita
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="budget" className="bg-transparent border-0 p-0 shadow-none space-y-4">
            <Card variant="premium">
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
                    <AlertTriangle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Nenhum orçamento definido para o período</p>
                    <p className="text-sm mt-2">Configure orçamentos por categoria para acompanhar os gastos</p>
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
    </AppShell>
  )
}

export default function CustosPage() {
  return (
    <LazyPageWrapper fallback={<DashboardPageSkeleton />}>
      <CustosPageContent />
    </LazyPageWrapper>
  )
}
