"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  LineChart, 
  Line, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from "recharts"
import { TrendingUp, DollarSign, Route, Truck, Users, Building2 } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { formatCurrency, formatCount } from "@/lib/kpi-utils"

interface CostChartProps {
  companyId?: string
  period: 'week' | 'month' | 'quarter' | 'year'
}

export function CostCharts({ companyId, period = 'month' }: CostChartProps) {
  const [loading, setLoading] = useState(true)
  const [monthlyData, setMonthlyData] = useState<any[]>([])
  const [byRouteData, setByRouteData] = useState<any[]>([])
  const [byVehicleData, setByVehicleData] = useState<any[]>([])
  const [byDriverData, setByDriverData] = useState<any[]>([])
  const [byCompanyData, setByCompanyData] = useState<any[]>([])

  useEffect(() => {
    loadChartData()
  }, [companyId, period])

  const loadChartData = async () => {
    try {
      setLoading(true)

      // Dados mensais (evolução)
      const { data: monthly } = await supabase
        .from('v_costs_breakdown')
        .select('*')
        .order('company_id')

      if (monthly) {
        // Agrupar por mês
        const grouped: Record<string, { month: string; total: number }> = {}
        monthly.forEach((item: any) => {
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

      if ((routes as any)?.by_route) {
        setByRouteData(Array.isArray((routes as any).by_route) ? (routes as any).by_route : [])
      }

      // Dados por veículo
      const { data: vehicles } = await supabase
        .from('v_costs_breakdown')
        .select('by_vehicle')
        .limit(1)
        .single()

      if ((vehicles as any)?.by_vehicle) {
        setByVehicleData(Array.isArray((vehicles as any).by_vehicle) ? (vehicles as any).by_vehicle : [])
      }

      // Dados por motorista (usar v_reports_driver_ranking com custos)
      const { data: drivers } = await supabase
        .from('v_reports_driver_ranking')
        .select('driver_id, driver_name, routes_completed')
        .limit(10)

      if (drivers) {
        setByDriverData(drivers.map((d: any) => ({
          name: d.driver_name || 'Motorista',
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
        setByCompanyData(companies.map((c: any) => ({
          name: c.company_name || 'Empresa',
          cost: parseFloat(c.by_company || 0)
        })))
      }
    } catch (error) {
      console.error('Erro ao carregar dados de custos:', error)
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
              <div className="h-4 bg-gray-200 rounded w-1/4"></div>
              <div className="h-64 bg-gray-200 rounded"></div>
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
        <TabsTrigger value="vehicles">Por Veículo</TabsTrigger>
        <TabsTrigger value="drivers">Por Motorista</TabsTrigger>
        <TabsTrigger value="companies">Por Empresa</TabsTrigger>
      </TabsList>

      <TabsContent value="monthly" className="mt-6">
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

      <TabsContent value="routes" className="mt-6">
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

      <TabsContent value="vehicles" className="mt-6">
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

      <TabsContent value="drivers" className="mt-6">
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

      <TabsContent value="companies" className="mt-6">
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

