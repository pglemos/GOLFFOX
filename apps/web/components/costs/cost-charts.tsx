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

type CostsBreakdownRow = Database['public']['Views']['v_costs_breakdown']['Row']
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
      const { data: monthly } = await supabase
        .from('v_costs_breakdown')
        .select('company_id, by_company, by_route, by_vehicle, period_month, period_year')
        .order('company_id')

      if (monthly) {
        // Agrupar por mês
        const grouped: Record<string, { month: string; total: number }> = {}
        monthly.forEach((item: CostsBreakdownRow) => {
          const month = new Date().toISOString().slice(0, 7) // YYYY-MM
          if (!grouped[month]) {
            grouped[month] = { month, total: 0 }
          }
          grouped[month].total += parseFloat(item.by_company || 0)
        })
        setMonthlyData(Object.values(grouped))
      }

      // Dados por rota
      const { data: routes } = await supabase
        .from('v_costs_breakdown')
        .select('by_route')
        .limit(1)
        .single()

      if (routes?.by_route) {
        setByRouteData(Array.isArray(routes.by_route) ? routes.by_route : [])
      }

      // Dados por veículo
      const { data: veiculos } = await supabase
        .from('v_costs_breakdown')
        .select('by_vehicle')
        .limit(1)
        .single()

      if (veiculos?.by_vehicle) {
        setByVehicleData(Array.isArray(veiculos.by_vehicle) ? veiculos.by_vehicle : [])
      }

      // Dados por motorista (usar v_reports_driver_ranking com custos)
      const { data: motoristas } = await supabase
        .from('v_reports_driver_ranking')
        .select('motorista_id, motorista_name, routes_completed')
        .limit(10)

      if (motoristas) {
        setByDriverData(motoristas.map((d: DriverRankingRow) => ({
          name: d.motorista_name || 'Motorista',
          routes: d.routes_completed || 0,
          cost: (d.routes_completed || 0) * 50 // Estimativa
        })))
      }

      // Dados por empresa
      const { data: companies } = await supabase
        .from('v_costs_breakdown')
        .select('company_id, company_name, by_company')
        .limit(20)

      if (companies) {
        setByCompanyData(companies.map((c: { company_id?: string; company_name?: string; by_company?: number | string }) => ({
          name: c.company_name || 'Empresa',
          cost: parseFloat(String(c.by_company || 0))
        })))
      }
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
                  dataKey="route_name" 
                  angle={-45}
                  textAnchor="end"
                  height={100}
                />
                <YAxis tickFormatter={(value) => `R$ ${(value / 1000).toFixed(0)}k`} />
                <Tooltip formatter={(value: number) => formatCurrency(value)} />
                <Legend />
                <Bar dataKey="total_cost" fill="#F97316" name="Custo Total" />
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
                  dataKey="vehicle_plate" 
                  angle={-45}
                  textAnchor="end"
                  height={100}
                />
                <YAxis tickFormatter={(value) => `R$ ${(value / 1000).toFixed(0)}k`} />
                <Tooltip formatter={(value: number) => formatCurrency(value)} />
                <Legend />
                <Bar dataKey="total_cost" fill="#F97316" name="Custo Total" />
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

