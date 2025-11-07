"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown,
  AlertCircle,
  BarChart3,
  PieChart
} from "lucide-react"
import { 
  LineChart, 
  Line, 
  BarChart, 
  Bar, 
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from "recharts"
import { formatCurrency } from "@/lib/kpi-utils"

interface CostKPIs {
  total_cost: number
  cost_per_km: number
  cost_per_trip: number
  cost_per_passenger: number
  total_km: number
  total_trips: number
  total_passengers: number
  total_cost_30d: number
  total_cost_90d: number
  budget_variance?: {
    budgeted: number
    actual: number
    variance_percent: number
    variance_absolute: number
  }
}

interface CostDashboardProps {
  companyId: string
  period?: '30' | '90'
}

const COLORS = ['#F97316', '#0A2540', '#2E7D32', '#673AB7', '#D32F2F', '#FFC107', '#2196F3']

export function CostDashboard({ companyId, period = '30' }: CostDashboardProps) {
  const [kpis, setKpis] = useState<CostKPIs | null>(null)
  const [breakdown, setBreakdown] = useState<any[]>([])
  const [monthlyTrend, setMonthlyTrend] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [companyId, period])

  const loadData = async () => {
    try {
      setLoading(true)

      // Buscar KPIs
      const kpisRes = await fetch(`/api/costs/kpis?company_id=${companyId}&period=${period}`)
      if (kpisRes.ok) {
        const kpisData = await kpisRes.json()
        setKpis(kpisData)
      }

      // Buscar breakdown (top 10 categorias)
      const breakdownRes = await fetch(`/api/costs/manual?company_id=${companyId}&limit=100`)
      if (breakdownRes.ok) {
        const { data } = await breakdownRes.json()
        // Agrupar por grupo
        const grouped = data.reduce((acc: any, cost: any) => {
          const group = cost.group_name || 'Outros'
          if (!acc[group]) {
            acc[group] = 0
          }
          acc[group] += parseFloat(cost.amount || 0)
          return acc
        }, {})

        setBreakdown(
          Object.entries(grouped)
            .map(([name, value]) => ({ name, value: value as number }))
            .sort((a, b) => b.value - a.value)
            .slice(0, 7)
        )
      }

      // Buscar tendência mensal (últimos 12 meses)
      // Buscar de mv_costs_monthly ou calcular de v_costs_breakdown
      const trendRes = await fetch(`/api/costs/manual?company_id=${companyId}&limit=1000`)
      if (trendRes.ok) {
        const { data: trendCosts } = await trendRes.json()
        // Agrupar por mês
        const monthlyMap = new Map<string, number>()
        trendCosts?.forEach((cost: any) => {
          const monthKey = new Date(cost.date).toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' })
          monthlyMap.set(monthKey, (monthlyMap.get(monthKey) || 0) + parseFloat(cost.amount || 0))
        })
        const trendData = Array.from(monthlyMap.entries())
          .map(([month, value]) => ({ month, value }))
          .sort((a, b) => {
            const dateA = new Date(`1 ${a.month}`)
            const dateB = new Date(`1 ${b.month}`)
            return dateA.getTime() - dateB.getTime()
          })
          .slice(-12) // Últimos 12 meses
        setMonthlyTrend(trendData.length > 0 ? trendData : [
          { month: 'Jan', value: 0 },
          { month: 'Fev', value: 0 },
          { month: 'Mar', value: 0 },
          { month: 'Abr', value: 0 },
          { month: 'Mai', value: 0 },
          { month: 'Jun', value: 0 },
          { month: 'Jul', value: 0 },
          { month: 'Ago', value: 0 },
          { month: 'Set', value: 0 },
          { month: 'Out', value: 0 },
          { month: 'Nov', value: 0 },
          { month: 'Dez', value: 0 }
        ])
      }

    } catch (error) {
      console.error('Erro ao carregar dados do dashboard:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="grid gap-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-20 bg-gray-200 rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  if (!kpis) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <p className="text-gray-500">Nenhum dado disponível</p>
        </CardContent>
      </Card>
    )
  }

  const budgetVariance = kpis.budget_variance

  return (
    <div className="space-y-6">
      {/* KPIs Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Custo Total</CardTitle>
            <DollarSign className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(kpis.total_cost)}</div>
            <p className="text-xs text-gray-500 mt-1">
              Últimos {period} dias: {formatCurrency(kpis.total_cost_30d || kpis.total_cost_90d)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Custo/KM</CardTitle>
            <TrendingUp className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(kpis.cost_per_km)}</div>
            <p className="text-xs text-gray-500 mt-1">
              Total KM: {kpis.total_km.toLocaleString('pt-BR')}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Custo/Viagem</CardTitle>
            <BarChart3 className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(kpis.cost_per_trip)}</div>
            <p className="text-xs text-gray-500 mt-1">
              Total viagens: {kpis.total_trips}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Variação vs Orçamento</CardTitle>
            {budgetVariance && budgetVariance.variance_percent > 0 ? (
              <TrendingUp className="h-4 w-4 text-red-500" />
            ) : (
              <TrendingDown className="h-4 w-4 text-green-500" />
            )}
          </CardHeader>
          <CardContent>
            {budgetVariance ? (
              <>
                <div className={`text-2xl font-bold ${budgetVariance.variance_percent > 0 ? 'text-red-600' : 'text-green-600'}`}>
                  {budgetVariance.variance_percent > 0 ? '+' : ''}{budgetVariance.variance_percent.toFixed(1)}%
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {formatCurrency(Math.abs(budgetVariance.variance_absolute))}
                </p>
              </>
            ) : (
              <>
                <div className="text-2xl font-bold text-gray-400">-</div>
                <p className="text-xs text-gray-500 mt-1">Sem orçamento</p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Tendência Mensal */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-orange-500" />
              Evolução Mensal (Últimos 12 Meses)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={monthlyTrend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis tickFormatter={(value) => `R$ ${(value / 1000).toFixed(0)}k`} />
                <Tooltip 
                  formatter={(value: number) => formatCurrency(value)}
                  labelStyle={{ color: '#000' }}
                />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="value" 
                  stroke="#F97316" 
                  strokeWidth={2}
                  name="Custo Total"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Breakdown por Grupo */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="h-5 w-5 text-orange-500" />
              Distribuição por Grupo de Custo
            </CardTitle>
          </CardHeader>
          <CardContent>
            {breakdown.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <RechartsPieChart>
                  <Pie
                    data={breakdown}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {breakdown.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => formatCurrency(value)} />
                </RechartsPieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-gray-500">
                Sem dados para exibir
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Alerta de Orçamento */}
      {budgetVariance && Math.abs(budgetVariance.variance_percent) > 5 && (
        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-orange-500" />
              <div>
                <p className="font-semibold text-orange-800">
                  Divergência significativa do orçamento detectada
                </p>
                <p className="text-sm text-orange-600">
                  Variação de {budgetVariance.variance_percent > 0 ? '+' : ''}{budgetVariance.variance_percent.toFixed(1)}% 
                  ({formatCurrency(Math.abs(budgetVariance.variance_absolute))})
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

