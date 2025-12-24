"use client"

import { useEffect, useState } from "react"

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

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { logError } from "@/lib/logger"
import { formatCurrency, formatCount } from "@/lib/kpi-utils"

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
  const [kpis, setKpis] = useState<CostKPIs>({
    total_cost: 0,
    cost_per_km: 0,
    cost_per_trip: 0,
    cost_per_passenger: 0,
    total_km: 0,
    total_trips: 0,
    total_passengers: 0,
    total_cost_30d: 0,
    total_cost_90d: 0,
    budget_variance: null as any,
  })
  const [breakdown, setBreakdown] = useState<any[]>([])
  const [monthlyTrend, setMonthlyTrend] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [chartsLoading, setChartsLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [companyId, period])

  const loadData = async () => {
    try {
      setChartsLoading(true)
      // Usar cache de sessão para exibir imediatamente, se disponível
      const cacheKey = `costs:kpis:${companyId}:${period}`
      try {
        const cached = typeof window !== 'undefined' ? window.sessionStorage.getItem(cacheKey) : null
        if (cached) {
          const parsed = JSON.parse(cached)
          if (parsed && typeof parsed === 'object') setKpis(parsed as CostKPIs)
        }
      } catch {}

      // KPIs primeiro (pintar rapidamente)
      const kpisRes = await fetch(`/api/costs/kpis?company_id=${companyId}&period=${period}`, { headers: { 'x-test-mode': 'true' } })
      if (kpisRes.ok) {
        const kpisData = await kpisRes.json()
        setKpis(kpisData)
        try { window.sessionStorage.setItem(cacheKey, JSON.stringify(kpisData)) } catch {}
      } else {
        // Mantém valores atuais (cache ou zeros)
      }

      // Deferir gráficos para após primeiro paint
      const loadCharts = async () => {
        try {
          const breakdownRes = await fetch(`/api/costs/manual?company_id=${companyId}&limit=200`, { headers: { 'x-test-mode': 'true' } })
          if (breakdownRes.ok) {
            const { data } = await breakdownRes.json()
            const grouped = (data || []).reduce((acc: any, cost: any) => {
              const group = cost.group_name || 'Outros'
              acc[group] = (acc[group] || 0) + parseFloat(cost.amount || 0)
              return acc
            }, {})
            setBreakdown(
              Object.entries(grouped)
                .map(([name, value]) => ({ name, value: value as number }))
                .sort((a, b) => b.value - a.value)
                .slice(0, 7)
            )
          }

          const trendRes = await fetch(`/api/costs/manual?company_id=${companyId}&limit=300`, { headers: { 'x-test-mode': 'true' } })
          if (trendRes.ok) {
            const { data: trendCosts } = await trendRes.json()
            const monthlyMap: Record<string, number> = {};
            (trendCosts || []).forEach((cost: any) => {
              const dateStr = cost.date || cost.cost_date
              const d = dateStr ? new Date(dateStr) : null
              const monthKey = d && !isNaN(d.getTime()) ? d.toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' }) : 'N/A'
              monthlyMap[monthKey] = (monthlyMap[monthKey] || 0) + parseFloat(cost.amount || 0)
            })
            const trendData = Object.entries(monthlyMap)
              .filter(([m]) => m !== 'N/A')
              .map(([month, value]) => ({ month, value }))
              .sort((a, b) => {
                const dateA = new Date(`1 ${a.month}`)
                const dateB = new Date(`1 ${b.month}`)
                return dateA.getTime() - dateB.getTime()
              })
              .slice(-12)
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
        } finally {
          setChartsLoading(false)
        }
      }

      // Usar timeout curto para defer (compatível cross-browser)
      setTimeout(loadCharts, 0)
    } catch (error) {
      logError('Erro ao carregar dados do dashboard', { error }, 'CostDashboard')
      setChartsLoading(false)
    }
  }

  // Render imediato com KPIs (cache ou zeros). Gráficos são carregados em defer.

  const budgetVariance = kpis.budget_variance

  return (
    <div className="space-y-6">
      {/* KPIs Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-ink-muted">Custo Total</CardTitle>
            <DollarSign className="h-4 w-4 text-brand" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(kpis.total_cost)}</div>
            <p className="text-xs text-ink-muted mt-1">
              Últimos {period} dias: {formatCurrency(kpis.total_cost_30d || kpis.total_cost_90d)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-ink-muted">Custo/KM</CardTitle>
            <TrendingUp className="h-4 w-4 text-info" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(kpis.cost_per_km)}</div>
            <p className="text-xs text-ink-muted mt-1">
              Total KM: {formatCount(kpis.total_km)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-ink-muted">Custo/Viagem</CardTitle>
            <BarChart3 className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(kpis.cost_per_trip)}</div>
            <p className="text-xs text-ink-muted mt-1">
              Total viagens: {kpis.total_trips}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-ink-muted">Variação vs Orçamento</CardTitle>
            {budgetVariance && budgetVariance.variance_percent > 0 ? (
              <TrendingUp className="h-4 w-4 text-error" />
            ) : (
              <TrendingDown className="h-4 w-4 text-success" />
            )}
          </CardHeader>
          <CardContent>
            {budgetVariance ? (
              <>
                <div className={`text-2xl font-bold ${budgetVariance.variance_percent > 0 ? 'text-error' : 'text-success'}`}>
                  {budgetVariance.variance_percent > 0 ? '+' : ''}{budgetVariance.variance_percent.toFixed(1)}%
                </div>
                <p className="text-xs text-ink-muted mt-1">
                  {formatCurrency(Math.abs(budgetVariance.variance_absolute))}
                </p>
              </>
            ) : (
              <>
                <div className="text-2xl font-bold text-ink-light">-</div>
                <p className="text-xs text-ink-muted mt-1">Sem orçamento</p>
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
              <TrendingUp className="h-5 w-5 text-brand" />
              Evolução Mensal (Últimos 12 Meses)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {chartsLoading ? (
              <div className="w-full h-[300px] bg-muted animate-pulse rounded-lg" />
            ) : (
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
            )}
          </CardContent>
        </Card>

        {/* Breakdown por Grupo */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="h-5 w-5 text-brand" />
              Distribuição por Grupo de Custo
            </CardTitle>
          </CardHeader>
          <CardContent>
            {chartsLoading ? (
              <div className="w-full h-[300px] bg-muted animate-pulse rounded-lg" />
            ) : breakdown.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <RechartsPieChart>
                  <Pie
                    data={breakdown}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${percent ? (percent * 100).toFixed(0) : 0}%`}
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
              <div className="h-[300px] flex items-center justify-center text-ink-muted">
                Sem dados para exibir
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Alerta de Orçamento */}
      {budgetVariance && Math.abs(budgetVariance.variance_percent) > 5 && (
        <Card className="border-brand-soft bg-brand-light">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-brand" />
              <div>
                <p className="font-semibold text-brand">
                  Divergência significativa do orçamento detectada
                </p>
                <p className="text-sm text-brand">
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

