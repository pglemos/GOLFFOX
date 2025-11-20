"use client"

import { useState, useEffect } from 'react'
import { AppShell } from '@/components/app-shell'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { DollarSign, TrendingUp, TrendingDown, BarChart3, FileText, Truck, Route, Calendar, Users } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'

export default function CarrierCustosPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [vehicleCosts, setVehicleCosts] = useState<any[]>([])
  const [routeCosts, setRouteCosts] = useState<any[]>([])
  const [summary, setSummary] = useState({
    total_this_month: 0,
    fuel_percentage: 0,
    maintenance_percentage: 0,
    total_vehicles: 0,
    total_routes: 0,
    cost_per_km: 0,
    cost_per_passenger: 0,
    previous_month_total: 0,
    trend_percentage: 0
  })
  const [advancedAnalysis, setAdvancedAnalysis] = useState<any>({
    costByCategory: [],
    costByVehicle: [],
    costByRoute: [],
    monthlyTrend: []
  })
  const [dateStart, setDateStart] = useState(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
  const [dateEnd, setDateEnd] = useState(new Date().toISOString().split('T')[0])
  const [activeTab, setActiveTab] = useState('overview')

  useEffect(() => {
    const getUser = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.push("/")
        return
      }
      setUser({ ...session.user })
      setLoading(false)
      loadCosts()
    }
    getUser()
  }, [router])

  useEffect(() => {
    if (user) {
      loadCosts()
    }
  }, [dateStart, dateEnd, user])

  const loadCosts = async () => {
    try {
      // Buscar custos de veículos
      const vehicleRes = await fetch(`/api/carrier/costs/vehicle?start_date=${dateStart}&end_date=${dateEnd}`)
      if (vehicleRes.ok) {
        const vehicleData = await vehicleRes.json()
        setVehicleCosts(vehicleData || [])
        
        // Calcular sumário
        const thisMonth = vehicleData.filter((c: any) => {
          const costDate = new Date(c.cost_date)
          return costDate.getMonth() === new Date().getMonth() && costDate.getFullYear() === new Date().getFullYear()
        })
        
        const total = thisMonth.reduce((sum: number, c: any) => sum + parseFloat(c.amount_brl.toString() || '0'), 0)
        const fuel = thisMonth.filter((c: any) => c.cost_category === 'combustivel').reduce((sum: number, c: any) => sum + parseFloat(c.amount_brl.toString() || '0'), 0)
        const maintenance = thisMonth.filter((c: any) => c.cost_category === 'manutencao').reduce((sum: number, c: any) => sum + parseFloat(c.amount_brl.toString() || '0'), 0)
        
        setSummary(prev => ({
          ...prev,
          total_this_month: total,
          fuel_percentage: total > 0 ? (fuel / total * 100) : 0,
          maintenance_percentage: total > 0 ? (maintenance / total * 100) : 0,
          total_vehicles: new Set(vehicleData.map((c: any) => c.vehicle_id)).size
        }))
      }

      // Buscar custos de rotas
      const routeRes = await fetch(`/api/carrier/costs/route?start_date=${dateStart}&end_date=${dateEnd}`)
      if (routeRes.ok) {
        const routeData = await routeRes.json()
        setRouteCosts(routeData || [])
        
        // Calcular custo por passageiro
        const totalPassengers = routeData.reduce((sum: number, r: any) => sum + (r.passengers_transported || 0), 0)
        const totalRouteCosts = routeData.reduce((sum: number, r: any) => sum + parseFloat(r.total_cost_brl?.toString() || '0'), 0)
        const costPerPassenger = totalPassengers > 0 ? totalRouteCosts / totalPassengers : 0

        // Calcular custo por km
        const totalKm = routeData.reduce((sum: number, r: any) => sum + parseFloat(r.distance_km?.toString() || '0'), 0)
        const costPerKm = totalKm > 0 ? totalRouteCosts / totalKm : 0

        // Buscar dados do mês anterior para comparação
        const previousMonthStart = new Date(dateStart)
        previousMonthStart.setMonth(previousMonthStart.getMonth() - 1)
        const previousMonthEnd = new Date(dateStart)

        const [prevVehicleRes, prevRouteRes] = await Promise.all([
          fetch(`/api/carrier/costs/vehicle?start_date=${previousMonthStart.toISOString().split('T')[0]}&end_date=${previousMonthEnd.toISOString().split('T')[0]}`),
          fetch(`/api/carrier/costs/route?start_date=${previousMonthStart.toISOString().split('T')[0]}&end_date=${previousMonthEnd.toISOString().split('T')[0]}`)
        ])

        let previousMonthTotal = 0
        if (prevVehicleRes.ok) {
          const prevVehicleData = await prevVehicleRes.json()
          previousMonthTotal += prevVehicleData.reduce((sum: number, c: any) => sum + parseFloat(c.amount_brl?.toString() || '0'), 0)
        }
        if (prevRouteRes.ok) {
          const prevRouteData = await prevRouteRes.json()
          previousMonthTotal += prevRouteData.reduce((sum: number, r: any) => sum + parseFloat(r.total_cost_brl?.toString() || '0'), 0)
        }

        const trendPercentage = previousMonthTotal > 0
          ? ((totalCostsThisMonth - previousMonthTotal) / previousMonthTotal) * 100
          : 0

        setSummary(prev => ({
          ...prev,
          total_routes: new Set(routeData.map((c: any) => c.route_id)).size,
          cost_per_km: costPerKm,
          cost_per_passenger: costPerPassenger,
          previous_month_total: previousMonthTotal,
          trend_percentage: trendPercentage
        }))

        // Análise avançada
        const costByCategory = vehicleCosts.reduce((acc: any, cost: any) => {
          const category = cost.cost_category || 'outros'
          if (!acc[category]) {
            acc[category] = 0
          }
          acc[category] += parseFloat(cost.amount_brl?.toString() || '0')
          return acc
        }, {})

        setAdvancedAnalysis({
          costByCategory: Object.entries(costByCategory).map(([name, value]) => ({ name, value })),
          costByVehicle: vehicleCosts.reduce((acc: any, cost: any) => {
            const vehicleId = cost.vehicle_id
            if (!acc[vehicleId]) {
              acc[vehicleId] = { vehicle_id: vehicleId, plate: cost.vehicles?.plate || 'N/A', total: 0 }
            }
            acc[vehicleId].total += parseFloat(cost.amount_brl?.toString() || '0')
            return acc
          }, {}),
          costByRoute: routeData.map((r: any) => ({
            route_id: r.route_id,
            route_name: r.routes?.name || 'N/A',
            total: parseFloat(r.total_cost_brl?.toString() || '0'),
            passengers: r.passengers_transported || 0,
            cost_per_passenger: costPerPassenger
          })),
          monthlyTrend: [] // Seria preenchido com dados históricos
        })
      }
    } catch (error) {
      console.error("Erro ao carregar custos:", error)
    }
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }

  // Preparar dados para gráficos
  const monthlyCosts = vehicleCosts.reduce((acc: any, cost: any) => {
    const month = new Date(cost.cost_date).toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' })
    if (!acc[month]) {
      acc[month] = {
        month,
        combustivel: 0,
        manutencao: 0,
        seguro: 0,
        outros: 0
      }
    }
    const category = cost.cost_category === 'combustivel' ? 'combustivel' :
                     cost.cost_category === 'manutencao' ? 'manutencao' :
                     cost.cost_category === 'seguro' ? 'seguro' : 'outros'
    acc[month][category] += parseFloat(cost.amount_brl.toString() || '0')
    return acc
  }, {})

  const chartData = Object.values(monthlyCosts).slice(-6) // Últimos 6 meses

  const categoryData = [
    { name: 'Combustível', value: vehicleCosts.filter((c: any) => c.cost_category === 'combustivel').reduce((sum: number, c: any) => sum + parseFloat(c.amount_brl.toString() || '0'), 0) },
    { name: 'Manutenção', value: vehicleCosts.filter((c: any) => c.cost_category === 'manutencao').reduce((sum: number, c: any) => sum + parseFloat(c.amount_brl.toString() || '0'), 0) },
    { name: 'Seguro', value: vehicleCosts.filter((c: any) => c.cost_category === 'seguro').reduce((sum: number, c: any) => sum + parseFloat(c.amount_brl.toString() || '0'), 0) },
    { name: 'Outros', value: vehicleCosts.filter((c: any) => !['combustivel', 'manutencao', 'seguro'].includes(c.cost_category)).reduce((sum: number, c: any) => sum + parseFloat(c.amount_brl.toString() || '0'), 0) }
  ].filter(item => item.value > 0)

  const COLORS = ['#F59E0B', '#EF4444', '#3B82F6', '#10B981']

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center"><div className="w-16 h-16 border-4 border-[var(--brand)] border-t-transparent rounded-full animate-spin mx-auto"></div></div>
  }

  return (
    <AppShell user={{ id: user?.id || "", name: user?.name || "Transportadora", email: user?.email || "", role: "transportadora" }}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Controle de Custos</h1>
            <p className="text-[var(--ink-muted)]">Monitore e gerencie os custos da transportadora</p>
          </div>
        </div>

        {/* Filtros de Data */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-end gap-4">
              <div className="flex-1">
                <Label>Data Início</Label>
                <Input
                  type="date"
                  value={dateStart}
                  onChange={(e) => setDateStart(e.target.value)}
                />
              </div>
              <div className="flex-1">
                <Label>Data Fim</Label>
                <Input
                  type="date"
                  value={dateEnd}
                  onChange={(e) => setDateEnd(e.target.value)}
                />
              </div>
              <Button onClick={loadCosts}>
                <Calendar className="h-4 w-4 mr-2" />
                Filtrar
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-[var(--ink-muted)]">Total do Mês</p>
                  <p className="text-2xl font-bold">{formatCurrency(summary.total_this_month)}</p>
                  {summary.previous_month_total > 0 && (
                    <p className={`text-xs mt-1 ${summary.trend_percentage >= 0 ? 'text-red-600' : 'text-green-600'}`}>
                      {summary.trend_percentage >= 0 ? '↑' : '↓'} {Math.abs(summary.trend_percentage).toFixed(1)}% vs mês anterior
                    </p>
                  )}
                </div>
                <DollarSign className="h-8 w-8 text-[var(--brand)]" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-[var(--ink-muted)]">Combustível</p>
                  <p className="text-2xl font-bold">{summary.fuel_percentage.toFixed(1)}%</p>
                </div>
                <TrendingUp className="h-8 w-8 text-yellow-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-[var(--ink-muted)]">Custo por KM</p>
                  <p className="text-2xl font-bold">{formatCurrency(summary.cost_per_km)}</p>
                </div>
                <Route className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-[var(--ink-muted)]">Custo por Passageiro</p>
                  <p className="text-2xl font-bold">{formatCurrency(summary.cost_per_passenger)}</p>
                </div>
                <Users className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="overview" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Visão Geral</TabsTrigger>
            <TabsTrigger value="vehicles">Por Veículo</TabsTrigger>
            <TabsTrigger value="routes">Por Rota</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Gráfico de Custos por Mês */}
            <Card>
              <CardHeader>
                <CardTitle>Custos por Categoria (Últimos 6 Meses)</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip formatter={(value: number) => formatCurrency(value)} />
                    <Legend />
                    <Bar dataKey="combustivel" stackId="a" fill="#F59E0B" name="Combustível" />
                    <Bar dataKey="manutencao" stackId="a" fill="#EF4444" name="Manutenção" />
                    <Bar dataKey="seguro" stackId="a" fill="#3B82F6" name="Seguro" />
                    <Bar dataKey="outros" stackId="a" fill="#10B981" name="Outros" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Gráfico de Pizza - Distribuição */}
            {categoryData.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Distribuição de Custos</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={400}>
                    <PieChart>
                      <Pie
                        data={categoryData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        outerRadius={120}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {categoryData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value: number) => formatCurrency(value)} />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="vehicles" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Custos por Veículo</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {vehicleCosts.length === 0 ? (
                    <div className="text-center py-12">
                      <Truck className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-[var(--ink-muted)]">Nenhum custo encontrado no período</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {Array.from(new Set(vehicleCosts.map((c: any) => c.vehicle_id))).map((vehicleId: string) => {
                        const vehicleCostsFiltered = vehicleCosts.filter((c: any) => c.vehicle_id === vehicleId)
                        const total = vehicleCostsFiltered.reduce((sum: number, c: any) => sum + parseFloat(c.amount_brl.toString() || '0'), 0)
                        const vehicle = vehicleCostsFiltered[0]?.vehicles

                        return (
                          <Card key={vehicleId} className="p-4">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <Truck className="h-5 w-5 text-[var(--brand)]" />
                                <div>
                                  <h3 className="font-bold">{vehicle?.plate || 'N/A'}</h3>
                                  <p className="text-sm text-[var(--ink-muted)]">{vehicle?.model || 'Sem modelo'}</p>
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="text-xl font-bold">{formatCurrency(total)}</p>
                                <p className="text-xs text-[var(--ink-muted)]">{vehicleCostsFiltered.length} registros</p>
                              </div>
                            </div>
                            <div className="mt-3 pt-3 border-t border-[var(--border)]">
                              <div className="grid grid-cols-3 gap-4 text-sm">
                                <div>
                                  <p className="text-[var(--ink-muted)]">Combustível</p>
                                  <p className="font-semibold">
                                    {formatCurrency(vehicleCostsFiltered.filter((c: any) => c.cost_category === 'combustivel').reduce((sum: number, c: any) => sum + parseFloat(c.amount_brl.toString() || '0'), 0))}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-[var(--ink-muted)]">Manutenção</p>
                                  <p className="font-semibold">
                                    {formatCurrency(vehicleCostsFiltered.filter((c: any) => c.cost_category === 'manutencao').reduce((sum: number, c: any) => sum + parseFloat(c.amount_brl.toString() || '0'), 0))}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-[var(--ink-muted)]">Outros</p>
                                  <p className="font-semibold">
                                    {formatCurrency(vehicleCostsFiltered.filter((c: any) => !['combustivel', 'manutencao'].includes(c.cost_category)).reduce((sum: number, c: any) => sum + parseFloat(c.amount_brl.toString() || '0'), 0))}
                                  </p>
                                </div>
                              </div>
                            </div>
                          </Card>
                        )
                      })}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="routes" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Custos por Rota</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {routeCosts.length === 0 ? (
                    <div className="text-center py-12">
                      <Route className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-[var(--ink-muted)]">Nenhum custo de rota encontrado no período</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {routeCosts.map((routeCost: any) => {
                        const route = routeCost.routes
                        return (
                          <Card key={routeCost.id} className="p-4">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <Route className="h-5 w-5 text-[var(--brand)]" />
                                <div>
                                  <h3 className="font-bold">{route?.name || 'Rota sem nome'}</h3>
                                  <p className="text-sm text-[var(--ink-muted)]">
                                    {new Date(routeCost.cost_date).toLocaleDateString('pt-BR')}
                                  </p>
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="text-xl font-bold">{formatCurrency(parseFloat(routeCost.total_cost_brl.toString() || '0'))}</p>
                                {routeCost.passengers_transported > 0 && (
                                  <p className="text-xs text-[var(--ink-muted)]">
                                    {formatCurrency(parseFloat(routeCost.cost_per_passenger_brl.toString() || '0'))} por passageiro
                                  </p>
                                )}
                              </div>
                            </div>
                            <div className="mt-3 pt-3 border-t border-[var(--border)]">
                              <div className="grid grid-cols-4 gap-4 text-sm">
                                <div>
                                  <p className="text-[var(--ink-muted)]">Combustível</p>
                                  <p className="font-semibold">{formatCurrency(parseFloat(routeCost.fuel_cost_brl.toString() || '0'))}</p>
                                </div>
                                <div>
                                  <p className="text-[var(--ink-muted)]">Mão de Obra</p>
                                  <p className="font-semibold">{formatCurrency(parseFloat(routeCost.labor_cost_brl.toString() || '0'))}</p>
                                </div>
                                <div>
                                  <p className="text-[var(--ink-muted)]">Manutenção</p>
                                  <p className="font-semibold">{formatCurrency(parseFloat(routeCost.maintenance_cost_brl.toString() || '0'))}</p>
                                </div>
                                <div>
                                  <p className="text-[var(--ink-muted)]">Pedágio</p>
                                  <p className="font-semibold">{formatCurrency(parseFloat(routeCost.toll_cost_brl.toString() || '0'))}</p>
                                </div>
                              </div>
                              {routeCost.passengers_transported > 0 && (
                                <div className="mt-2 text-sm text-[var(--ink-muted)]">
                                  <p>{routeCost.passengers_transported} passageiros transportados</p>
                                  {routeCost.distance_km && (
                                    <p>Distância: {parseFloat(routeCost.distance_km.toString() || '0').toLocaleString('pt-BR')} km</p>
                                  )}
                                </div>
                              )}
                            </div>
                          </Card>
                        )
                      })}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppShell>
  )
}

