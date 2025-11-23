"use client"

import { useState, useEffect } from "react"
import { AppShell } from "@/components/app-shell"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { BarChart3, DollarSign, TrendingUp, TrendingDown, Calendar, Search, PieChart as PieChartIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { notifyError } from "@/lib/toast"
import { useAuth } from "@/hooks/use-auth"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area
} from 'recharts'

export default function CustosPage() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<any>(null)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/admin/custos')
      const result = await response.json()
      setData(result)
    } catch (error) {
      notifyError(error, "Erro ao carregar dados de custos")
    } finally {
      setLoading(false)
    }
  }

  if (loading || !data) {
    return (
      <AppShell panel="admin" user={user || { id: 'mock', name: 'Admin', email: 'admin@golffox.com', role: 'admin' }}>
        <div className="flex items-center justify-center h-full">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500" />
        </div>
      </AppShell>
    )
  }

  const { kpis, distribution, monthlyTrend } = data

  return (
    <AppShell panel="admin" user={user || { id: 'mock', name: 'Admin', email: 'admin@golffox.com', role: 'admin' }}>
      <div className="p-4 sm:p-6 lg:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Controle de Custos</h1>
            <p className="text-sm text-[var(--ink-muted)] mt-1">
              Visão geral das finanças da operação
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline">
              <Calendar className="h-4 w-4 mr-2" />
              Últimos 6 meses
            </Button>
            <Button className="bg-orange-500 hover:bg-orange-600">
              <DollarSign className="h-4 w-4 mr-2" />
              Exportar Relatório
            </Button>
          </div>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="p-4 bg-gradient-to-br from-green-50 to-green-100 border-green-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-green-700 mb-1">Receita Total</p>
                <p className="text-2xl font-bold text-green-900">R$ {kpis.totalRevenue.toLocaleString('pt-BR')}</p>
              </div>
              <div className="h-10 w-10 rounded-full bg-green-200 flex items-center justify-center">
                <DollarSign className="h-6 w-6 text-green-700" />
              </div>
            </div>
          </Card>
          <Card className="p-4 bg-gradient-to-br from-red-50 to-red-100 border-red-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-red-700 mb-1">Custo Operacional</p>
                <p className="text-2xl font-bold text-red-900">R$ {kpis.operationalCost.toLocaleString('pt-BR')}</p>
              </div>
              <div className="h-10 w-10 rounded-full bg-red-200 flex items-center justify-center">
                <TrendingDown className="h-6 w-6 text-red-700" />
              </div>
            </div>
          </Card>
          <Card className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-blue-700 mb-1">Margem de Lucro</p>
                <p className="text-2xl font-bold text-blue-900">{kpis.profitMargin}%</p>
              </div>
              <div className="h-10 w-10 rounded-full bg-blue-200 flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-blue-700" />
              </div>
            </div>
          </Card>
          <Card className="p-4 bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-purple-700 mb-1">Quilometragem Total</p>
                <p className="text-2xl font-bold text-purple-900">{kpis.totalKm.toLocaleString('pt-BR')} km</p>
              </div>
              <div className="h-10 w-10 rounded-full bg-purple-200 flex items-center justify-center">
                <BarChart3 className="h-6 w-6 text-purple-700" />
              </div>
            </div>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Gráfico de Tendência (Receita x Custo) */}
          <Card className="p-6 lg:col-span-2">
            <h2 className="text-lg font-semibold mb-6">Evolução Financeira</h2>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={monthlyTrend}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#22c55e" stopOpacity={0.1} />
                      <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorCost" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ef4444" stopOpacity={0.1} />
                      <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip
                    formatter={(value: number) => [`R$ ${value.toLocaleString('pt-BR')}`, '']}
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                  <Legend />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    name="Receita"
                    stroke="#22c55e"
                    fillOpacity={1}
                    fill="url(#colorRevenue)"
                  />
                  <Area
                    type="monotone"
                    dataKey="cost"
                    name="Custo"
                    stroke="#ef4444"
                    fillOpacity={1}
                    fill="url(#colorCost)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Card>

          {/* Gráfico de Distribuição */}
          <Card className="p-6">
            <h2 className="text-lg font-semibold mb-6">Distribuição de Custos</h2>
            <div className="h-[300px] w-full relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={distribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {distribution.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: number) => [`${value}%`, '']}
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                </PieChart>
              </ResponsiveContainer>
              {/* Legenda Customizada */}
              <div className="mt-4 space-y-2">
                {distribution.map((item: any) => (
                  <div key={item.name} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                      <span className="text-gray-600">{item.name}</span>
                    </div>
                    <span className="font-medium">{item.value}%</span>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        </div>
      </div>
    </AppShell>
  )
}
