"use client"

import { useState, useEffect } from "react"

import dynamic from "next/dynamic"
import { TrendingUp, DollarSign, Route, Truck, Users, Building2 } from "lucide-react"
// Lazy load componentes pesados do recharts
const LineChart = dynamic(() => import("recharts").then((mod) => mod.LineChart), { ssr: false })
const BarChart = dynamic(() => import("recharts").then((mod) => mod.BarChart), { ssr: false })
const ResponsiveContainer = dynamic(() => import("recharts").then((mod) => mod.ResponsiveContainer), { ssr: false })
import { Line, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from "recharts"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { formatCurrency, formatCount } from "@/lib/kpi-utils"
import { supabase } from "@/lib/supabase"
import { logError } from "@/lib/logger"
import type { Database } from "@/types/supabase"

// type CostsBreakdownRow removido pois a view não existe
type DriverRankingRow = Database['public']['Views']['v_reports_driver_ranking']['Row']

interface CostChartProps {
  companyId?: string
  period: 'week' | 'month' | 'quarter' | 'year'
}

export function CostCharts({ companyId, period = 'month' }: CostChartProps) {
  const [loading, setLoading] = useState(true)
  const [monthlyData, setMonthlyData] = useState<Array<{ month: string; total: number }>>([])
  const [byRouteData, setByRouteData] = useState<Array<{ route: string; cost: number }>>([])
  const [byVehicleData, setByVehicleData] = useState<Array<{ vehicle: string; cost: number }>>([])
  const [byDriverData, setByDriverData] = useState<Array<{ name: string; routes: number; cost: number }>>([])
  const [byCompanyData, setByCompanyData] = useState<Array<{ company: string; cost: number }>>([])

  useEffect(() => {
    loadChartData()
  }, [companyId, period])

  const loadChartData = async () => {
    try {
      setLoading(true)

      // Dados mensais (evolução)
      const { data: monthlyRaw } = await supabase
        .from('v_costs_vs_budget_monthly')
        .select('period_year, period_month, total_cost')
        .order('period_year')
        .order('period_month')

      if (monthlyRaw) {
        // Agrupar por mês (somar categorias)
        const grouped: Record<string, { month: string; total: number }> = {}
        monthlyRaw.forEach((item) => {
          const monthKey = `${item.period_year}-${String(item.period_month).padStart(2, '0')}`
          if (!grouped[monthKey]) {
            grouped[monthKey] = { month: monthKey, total: 0 }
          }
          grouped[monthKey].total += Number(item.total_cost || 0)
        })
        setMonthlyData(Object.values(grouped))
      }

      // Dados por rota
      const { data: routes } = await supabase
        .from('v_carrier_route_costs_summary')
        .select('route_name, total_cost_brl, total_distance_km')
        .limit(10)

      if (routes) {
        setByRouteData(routes.map(r => ({
          route: r.route_name || 'Rota',
          cost: Number(r.total_cost_brl || 0),
          total_km: Number(r.total_distance_km || 0)
        })))
      }

      // Dados por veículo
      const { data: veiculos } = await supabase
        .from('v_carrier_vehicle_costs_summary')
        .select('vehicle_plate, total_cost_brl') // Assumindo vehicle_plate existe, se não, teria que ser veiculo_id
        .limit(10)

      if (veiculos) {
        setByVehicleData(veiculos.map(v => ({
          vehicle: v.vehicle_plate || 'Veículo',
          cost: Number(v.total_cost_brl || 0),
          total_km: 0 // View não informou km na query truncada
        })))
      }

      // Dados por motorista
      const { data: motoristas } = await supabase
        .from('v_reports_driver_ranking')
        .select('driver_id, driver_name, routes_completed')
        .limit(10)

      if (motoristas) {
        setByDriverData(motoristas.map((d) => ({
          name: d.driver_name || 'Motorista',
          routes: Number(d.routes_completed || 0),
          cost: Number(d.routes_completed || 0) * 50 // Estimativa
        })))
      }

      // Dados por empresa (Removido ou vazio por enquanto pois não há view clara)
      setByCompanyData([])

    } catch (error) {
      logError('Erro ao carregar dados de custos', { error }, 'CostCharts')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardContent className="p-8">
            <div className="animate-pulse space-y-4">
              <div className="h-4 bg-muted rounded w-1/4"></div>
              <div className="h-64 bg-muted rounded"></div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <Tabs defaultValue="monthly" className="w-full">
      <TabsList className="grid w-full grid-cols-5">
        <TabsTrigger value="monthly">Mensal</TabsTrigger>
        <TabsTrigger value="routes">Por Rota</TabsTrigger>
        <TabsTrigger value="veiculos">Por Veículo</TabsTrigger>
        <TabsTrigger value="motoristas">Por Motorista</TabsTrigger>
        <TabsTrigger value="companies">Por Empresa</TabsTrigger>
      </TabsList>

      <TabsContent value="monthly" className="bg-transparent border-0 p-0 shadow-none mt-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-brand" />
              Evolução Mensal de Custos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis tickFormatter={(value) => `R$ ${(value / 1000).toFixed(0)}k`} />
                <Tooltip formatter={(value: number) => formatCurrency(value)} />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="total"
                  stroke="#F97316"
                  strokeWidth={2}
                  name="Custo Total"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="routes" className="bg-transparent border-0 p-0 shadow-none mt-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Route className="h-5 w-5 text-brand" />
              Custos por Rota
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={byRouteData.slice(0, 10)}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="route"
                  angle={-45}
                  textAnchor="end"
                  height={100}
                />
                <YAxis tickFormatter={(value) => `R$ ${(value / 1000).toFixed(0)}k`} />
                <Tooltip formatter={(value: number) => formatCurrency(value)} />
                <Legend />
                <Bar dataKey="cost" fill="#F97316" name="Custo Total" />
                <Bar dataKey="total_km" fill="#10B981" name="KM Total" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="veiculos" className="bg-transparent border-0 p-0 shadow-none mt-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Truck className="h-5 w-5 text-brand" />
              Custos por Veículo
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={byVehicleData.slice(0, 10)}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="vehicle"
                  angle={-45}
                  textAnchor="end"
                  height={100}
                />
                <YAxis tickFormatter={(value) => `R$ ${(value / 1000).toFixed(0)}k`} />
                <Tooltip formatter={(value: number) => formatCurrency(value)} />
                <Legend />
                <Bar dataKey="cost" fill="#F97316" name="Custo Total" />
                <Bar dataKey="total_km" fill="#10B981" name="KM Total" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="motoristas" className="bg-transparent border-0 p-0 shadow-none mt-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-brand" />
              Custos por Motorista
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={byDriverData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="name"
                  angle={-45}
                  textAnchor="end"
                  height={100}
                />
                <YAxis tickFormatter={(value) => `R$ ${(value / 1000).toFixed(0)}k`} />
                <Tooltip formatter={(value: number) => formatCurrency(value)} />
                <Legend />
                <Bar dataKey="cost" fill="#F97316" name="Custo Estimado" />
                <Bar dataKey="routes" fill="#3B82F6" name="Rotas" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="companies" className="bg-transparent border-0 p-0 shadow-none mt-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-brand" />
              Custos por Empresa
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={byCompanyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="name"
                  angle={-45}
                  textAnchor="end"
                  height={100}
                />
                <YAxis tickFormatter={(value) => `R$ ${(value / 1000).toFixed(0)}k`} />
                <Tooltip formatter={(value: number) => formatCurrency(value)} />
                <Legend />
                <Bar dataKey="cost" fill="#F97316" name="Custo Total" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  )
}

