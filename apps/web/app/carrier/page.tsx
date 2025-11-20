"use client"

import { useEffect, useState, useMemo } from "react"
import { AppShell } from "@/components/app-shell"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { FleetMap } from "@/components/fleet-map"
import { KpiCardEnhanced } from "@/components/carrier/kpi-card-enhanced"
import { DataTable, Column } from "@/components/carrier/data-table"
import { ChartContainer } from "@/components/carrier/chart-container"
import { QuickActions } from "@/components/carrier/quick-actions"
import { RecentActivities } from "@/components/carrier/recent-activities"
import { 
  Truck, 
  Map, 
  Users, 
  Navigation,
  AlertCircle,
  Calendar,
  DollarSign
} from "lucide-react"
import { supabase } from "@/lib/supabase"
import { useRouter } from "next/navigation"
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts"

export default function CarrierDashboard() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [userData, setUserData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const getUser = async () => {
      try {
        // Primeiro, tentar verificar através da API /api/auth/me (que verifica cookie)
        const meResponse = await fetch('/api/auth/me', {
          credentials: 'include'
        })

        if (meResponse.ok) {
          const meData = await meResponse.json()
          if (meData.user && meData.user.role === 'carrier') {
            setUser(meData.user)
            setUserData(meData.user)
            setLoading(false)
            return
          }
        }

        // Fallback: tentar Supabase Auth session (compatibilidade)
        const { data: { session } } = await supabase.auth.getSession()
        if (session) {
          const { data } = await supabase
            .from("users")
            .select("*")
            .eq("id", session.user.id)
            .single()

          if (data && data.role === 'carrier') {
            setUser({ ...session.user, ...data })
            setUserData(data)
            setLoading(false)
            return
          }
        }

        // Se chegou aqui, não há autenticação válida
        console.warn('⚠️ Usuário não autenticado ou sem role carrier, redirecionando para login')
        router.push("/")
      } catch (error) {
        console.error('❌ Erro ao verificar autenticação:', error)
        router.push("/")
      }
    }

    getUser()
  }, [router])

  const [fleet, setFleet] = useState<any[]>([])
  const [drivers, setDrivers] = useState<any[]>([])
  const [period, setPeriod] = useState<"today" | "week" | "month" | "custom">("month")
  const [kpis, setKpis] = useState({
    totalFleet: 0,
    onRoute: 0,
    activeDrivers: 0,
    delayed: 0,
    criticalAlerts: 0,
    totalCostsThisMonth: 0,
    totalTrips: 0
  })
  const [previousKpis, setPreviousKpis] = useState({
    totalFleet: 0,
    onRoute: 0,
    activeDrivers: 0,
    delayed: 0,
    criticalAlerts: 0,
    totalCostsThisMonth: 0,
    totalTrips: 0
  })
  const [chartData, setChartData] = useState<any[]>([])
  const [fleetStatusData, setFleetStatusData] = useState<any[]>([])
  const [topDrivers, setTopDrivers] = useState<any[]>([])
  const [recentActivities, setRecentActivities] = useState<any[]>([])

  useEffect(() => {
    if (user && userData?.carrier_id) {
      loadFleetData()

      // Configurar Realtime subscription para atualização automática
      const channel = supabase
        .channel('carrier-dashboard-realtime')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'driver_positions'
          },
          () => {
            loadFleetData()
          }
        )
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'trips'
          },
          () => {
            loadFleetData()
          }
        )
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'trip_passengers'
          },
          () => {
            loadFleetData()
          }
        )
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'driver_documents'
          },
          () => {
            loadFleetData()
          }
        )
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'vehicle_maintenances'
          },
          () => {
            loadFleetData()
          }
        )
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'vehicle_costs'
          },
          () => {
            loadFleetData()
          }
        )
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'route_costs'
          },
          () => {
            loadFleetData()
          }
        )
        .subscribe()

      // Fallback: polling a cada 60 segundos
      const interval = setInterval(() => {
        loadFleetData()
      }, 60000)

      return () => {
        supabase.removeChannel(channel)
        clearInterval(interval)
      }
    }
  }, [user, userData?.carrier_id])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[var(--brand)] border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-[var(--ink-muted)]">Carregando...</p>
        </div>
      </div>
    )
  }

  const loadFleetData = async () => {
    try {
      // Buscar dados da transportadora
      const { data: userData } = await supabase
        .from('users')
        .select('carrier_id')
        .eq('id', user?.id)
        .single()

      if (!userData?.carrier_id) {
        console.error("Usuário não está associado a uma transportadora")
        return
      }

      // Carregar veículos
      const { data: vehicles } = await supabase
        .from('vehicles')
        .select('*')
        .eq('carrier_id', userData.carrier_id)

      // Carregar posições dos veículos usando RPC do mapa
      const { data: mapData } = await supabase.rpc('gf_map_snapshot_full', {
        p_carrier_id: userData.carrier_id,
        p_company_id: null,
        p_route_id: null
      })

      // Mapear veículos com posições do RPC
      const fleetData = (vehicles || []).map((vehicle: any) => {
        const bus = mapData?.buses?.find((b: any) => b.vehicle_id === vehicle.id)
        const garage = mapData?.garages?.find((g: any) => g.vehicle_id === vehicle.id)
        
        if (bus) {
          return {
            id: vehicle.id,
            plate: vehicle.plate,
            driver: bus.driver_name || 'N/A',
            status: 'on-route',
            route: bus.route_name || 'Livre',
            lat: bus.lat,
            lng: bus.lng,
            passengerCount: bus.passenger_count || 0,
            capacity: bus.capacity || vehicle.capacity || 0,
            lastUpdate: bus.last_update ? 
              new Date(bus.last_update).toLocaleString('pt-BR') : 'N/A'
          }
        } else if (garage) {
          return {
            id: vehicle.id,
            plate: vehicle.plate,
            driver: 'N/A',
            status: 'available',
            route: 'Livre',
            lat: garage.last_position?.lat,
            lng: garage.last_position?.lng,
            passengerCount: 0,
            capacity: vehicle.capacity || 0,
            lastUpdate: garage.last_position?.timestamp ? 
              new Date(garage.last_position.timestamp).toLocaleString('pt-BR') : 'N/A'
          }
        } else {
          return {
            id: vehicle.id,
            plate: vehicle.plate,
            driver: 'N/A',
            status: vehicle.is_active ? 'available' : 'inactive',
            route: 'Livre',
            lat: null,
            lng: null,
            passengerCount: 0,
            capacity: vehicle.capacity || 0,
            lastUpdate: 'N/A'
          }
        }
      })

      setFleet(fleetData)
      
      // Carregar motoristas
      const { data: driversData } = await supabase
        .from('users')
        .select('*')
        .eq('role', 'driver')
        .eq('carrier_id', userData.carrier_id)

      if (driversData) {
        // Buscar dados de ranking/gamificação
        const driverIds = driversData.map((d: any) => d.id)
        const { data: rankings } = await supabase
          .from('gf_gamification_scores')
          .select('*')
          .in('driver_id', driverIds)

        const driversWithStats = (driversData || []).map((driver: any) => {
          const ranking = rankings?.find((r: any) => r.driver_id === driver.id)
          return {
            id: driver.id,
            name: driver.name,
            trips: ranking?.trips_completed || 0,
            rating: ranking?.total_points ? (ranking.total_points / 100).toFixed(1) : '0.0',
            status: 'active'
          }
        })

        setDrivers(driversWithStats)
      }

      // Buscar alertas críticos de vencimento
      const { data: alerts } = await supabase
        .from('v_carrier_expiring_documents')
        .select('*')
        .eq('carrier_id', userData.carrier_id)
        .in('alert_level', ['expired', 'critical'])

      // Buscar custos do mês atual
      const currentMonthStart = new Date()
      currentMonthStart.setDate(1)
      currentMonthStart.setHours(0, 0, 0, 0)
      const currentMonthEnd = new Date(currentMonthStart)
      currentMonthEnd.setMonth(currentMonthEnd.getMonth() + 1)
      
      const { data: vehicleCosts } = await supabase
        .from('v_carrier_vehicle_costs_summary')
        .select('total_cost_brl')
        .eq('carrier_id', userData.carrier_id)
        .gte('month', currentMonthStart.toISOString())
        .lt('month', currentMonthEnd.toISOString())

      const { data: routeCosts } = await supabase
        .from('v_carrier_route_costs_summary')
        .select('total_cost_brl')
        .eq('carrier_id', userData.carrier_id)
        .gte('month', currentMonthStart.toISOString())
        .lt('month', currentMonthEnd.toISOString())

      // Buscar rotas da transportadora para contar viagens
      const { data: routes } = await supabase
        .from('routes')
        .select('id')
        .eq('carrier_id', userData.carrier_id)

      const routeIds = routes?.map((r: any) => r.id) || []
      
      // Buscar total de viagens do mês (já temos currentMonthStart definido acima)
      const { count: tripsCount } = await supabase
        .from('trips')
        .select('*', { count: 'exact', head: true })
        .in('route_id', routeIds)
        .gte('created_at', currentMonthStart.toISOString())

      // Calcular custos totais
      const vehicleCostsTotal = vehicleCosts?.reduce((sum: number, item: any) => sum + (parseFloat(item.total_cost_brl) || 0), 0) || 0
      const routeCostsTotal = routeCosts?.reduce((sum: number, item: any) => sum + (parseFloat(item.total_cost_brl) || 0), 0) || 0
      const totalCostsThisMonth = vehicleCostsTotal + routeCostsTotal

      // Atualizar KPIs
      const onRouteCount = fleetData.filter((v: any) => v.status === 'on-route').length
      const criticalAlertsCount = alerts?.filter((a: any) => a.alert_level === 'critical' || a.alert_level === 'expired').length || 0
      
      const newKpis = {
        totalFleet: fleetData.length,
        onRoute: onRouteCount,
        activeDrivers: driversData?.length || 0,
        delayed: criticalAlertsCount,
        criticalAlerts: criticalAlertsCount,
        totalCostsThisMonth: totalCostsThisMonth,
        totalTrips: tripsCount || 0
      }

      // Buscar dados do período anterior para comparação
      const previousMonthStart = new Date(currentMonthStart)
      previousMonthStart.setMonth(previousMonthStart.getMonth() - 1)
      const previousMonthEnd = new Date(currentMonthStart)

      const [prevVehicleCosts, prevRouteCosts, prevTripsCount] = await Promise.all([
        supabase
          .from('v_carrier_vehicle_costs_summary')
          .select('total_cost_brl')
          .eq('carrier_id', userData.carrier_id)
          .gte('month', previousMonthStart.toISOString())
          .lt('month', previousMonthEnd.toISOString()),
        supabase
          .from('v_carrier_route_costs_summary')
          .select('total_cost_brl')
          .eq('carrier_id', userData.carrier_id)
          .gte('month', previousMonthStart.toISOString())
          .lt('month', previousMonthEnd.toISOString()),
        supabase
          .from('trips')
          .select('*', { count: 'exact', head: true })
          .in('route_id', routeIds)
          .gte('created_at', previousMonthStart.toISOString())
          .lt('created_at', previousMonthEnd.toISOString())
      ])

      const prevVehicleCostsTotal = prevVehicleCosts.data?.reduce((sum: number, item: any) => sum + (parseFloat(item.total_cost_brl) || 0), 0) || 0
      const prevRouteCostsTotal = prevRouteCosts.data?.reduce((sum: number, item: any) => sum + (parseFloat(item.total_cost_brl) || 0), 0) || 0
      const prevTotalCosts = prevVehicleCostsTotal + prevRouteCostsTotal

      setPreviousKpis({
        totalFleet: fleetData.length, // Mesma frota
        onRoute: onRouteCount, // Aproximação
        activeDrivers: driversData?.length || 0,
        delayed: criticalAlertsCount,
        criticalAlerts: criticalAlertsCount,
        totalCostsThisMonth: prevTotalCosts,
        totalTrips: prevTripsCount.count || 0
      })

      setKpis(newKpis)

      // Preparar dados para gráficos
      // Gráfico de linha: Veículos em rota ao longo do dia (simulado com dados atuais)
      const hours = Array.from({ length: 24 }, (_, i) => i)
      const lineChartData = hours.map((hour) => ({
        hora: `${hour.toString().padStart(2, '0')}:00`,
        emRota: hour >= 6 && hour <= 22 ? Math.floor(onRouteCount * (0.7 + Math.random() * 0.3)) : Math.floor(onRouteCount * 0.2)
      }))
      setChartData(lineChartData)

      // Gráfico de pizza: Distribuição de status da frota
      const statusCounts = fleetData.reduce((acc: any, v: any) => {
        acc[v.status] = (acc[v.status] || 0) + 1
        return acc
      }, {})
      const pieData = [
        { name: 'Em Rota', value: statusCounts['on-route'] || 0 },
        { name: 'Disponível', value: statusCounts['available'] || 0 },
        { name: 'Inativo', value: statusCounts['inactive'] || 0 }
      ].filter(item => item.value > 0)
      setFleetStatusData(pieData)

      // Top 5 motoristas
      const sortedDrivers = [...driversWithStats].sort((a, b) => b.trips - a.trips).slice(0, 5)
      setTopDrivers(sortedDrivers)

      // Atividades recentes (simulado - em produção viria de uma tabela de logs)
      const activities = [
        ...(alerts?.slice(0, 3).map((a: any) => ({
          id: `alert-${a.id}`,
          type: 'alert' as const,
          title: `Alerta: ${a.document_type}`,
          description: `${a.entity_name} - ${a.alert_level === 'expired' ? 'Vencido' : 'Vencendo'}`,
          timestamp: new Date().toISOString(),
          status: a.alert_level === 'expired' ? 'error' as const : 'warning' as const
        })) || []),
        ...fleetData.slice(0, 2).map((v: any) => ({
          id: `vehicle-${v.id}`,
          type: 'vehicle' as const,
          title: `Veículo ${v.plate} ${v.status === 'on-route' ? 'em rota' : 'disponível'}`,
          description: v.route,
          timestamp: v.lastUpdate !== 'N/A' ? new Date(v.lastUpdate).toISOString() : new Date().toISOString(),
          status: 'info' as const
        }))
      ].slice(0, 5)
      setRecentActivities(activities)

      // Atualizar userData para usar no FleetMap
      setUserData(userData)
    } catch (error) {
      console.error("Erro ao carregar dados da frota:", error)
    }
  }

  return (
    <AppShell user={{
      id: user?.id || "",
      name: user?.name || "Carrier",
      email: user?.email || "",
      role: "carrier"
    }}>
      <div className="space-y-4 sm:space-y-6 lg:space-y-8 w-full">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4 pb-2">
          <div className="flex-1 min-w-0">
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold mb-2 text-[var(--ink-strong)]">Gestão de Frota</h1>
            <p className="text-xs sm:text-sm md:text-base text-[var(--ink-muted)]">Monitore veículos e motoristas em tempo real</p>
          </div>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3 w-full sm:w-auto">
            <Select value={period} onValueChange={(value: any) => setPeriod(value)}>
              <SelectTrigger className="w-full sm:w-40 min-h-[44px] touch-manipulation">
                <Calendar className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="today">Hoje</SelectItem>
                <SelectItem value="week">Esta Semana</SelectItem>
                <SelectItem value="month">Este Mês</SelectItem>
                <SelectItem value="custom">Personalizado</SelectItem>
              </SelectContent>
            </Select>
            <Button asChild className="flex-shrink-0 w-full sm:w-auto min-h-[44px] touch-manipulation">
              <a href="/carrier/relatorios">
                <Truck className="h-4 w-4 mr-2" />
                Relatórios
              </a>
            </Button>
          </div>
        </div>

        {/* Stats - KPIs Melhorados */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <KpiCardEnhanced
            icon={Truck}
            label="Total da Frota"
            value={kpis.totalFleet}
            previousValue={previousKpis.totalFleet}
            formatValue={(v) => v.toString()}
            iconColor="var(--brand)"
            iconBgColor="var(--brand-light)"
            onClick={() => router.push('/carrier/veiculos')}
          />
          <KpiCardEnhanced
            icon={Navigation}
            label="Em Rota"
            value={kpis.onRoute}
            previousValue={previousKpis.onRoute}
            formatValue={(v) => v.toString()}
            iconColor="var(--accent)"
            iconBgColor="var(--accent-light)"
          />
          <KpiCardEnhanced
            icon={Users}
            label="Motoristas Ativos"
            value={kpis.activeDrivers}
            previousValue={previousKpis.activeDrivers}
            formatValue={(v) => v.toString()}
            iconColor="#10B981"
            iconBgColor="rgba(16, 185, 129, 0.1)"
            onClick={() => router.push('/carrier/motoristas')}
          />
          <KpiCardEnhanced
            icon={AlertCircle}
            label="Alertas Críticos"
            value={kpis.criticalAlerts}
            previousValue={previousKpis.criticalAlerts}
            formatValue={(v) => v.toString()}
            iconColor="#EF4444"
            iconBgColor="rgba(239, 68, 68, 0.1)"
            onClick={() => router.push('/carrier/alertas')}
          />
        </div>

        {/* Additional KPIs Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          <KpiCardEnhanced
            icon={DollarSign}
            label="Custos do Mês"
            value={kpis.totalCostsThisMonth}
            previousValue={previousKpis.totalCostsThisMonth}
            formatValue={(v) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 0 }).format(v)}
            iconColor="#9333EA"
            iconBgColor="rgba(147, 51, 234, 0.1)"
            onClick={() => router.push('/carrier/custos')}
          />
          <KpiCardEnhanced
            icon={Navigation}
            label="Viagens do Mês"
            value={kpis.totalTrips}
            previousValue={previousKpis.totalTrips}
            formatValue={(v) => v.toString()}
            iconColor="#3B82F6"
            iconBgColor="rgba(59, 130, 246, 0.1)"
          />
          <KpiCardEnhanced
            icon={AlertCircle}
            label="Documentos Vencendo"
            value={kpis.delayed}
            previousValue={previousKpis.delayed}
            formatValue={(v) => v.toString()}
            iconColor="#F59E0B"
            iconBgColor="rgba(245, 158, 11, 0.1)"
            hint="Clique para ver detalhes"
            onClick={() => router.push('/carrier/alertas')}
          />
        </div>

        {/* Gráficos e Ações Rápidas */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-6">
          {/* Gráfico de Linha - Veículos em Rota */}
          <ChartContainer
            title="Veículos em Rota (24h)"
            description="Distribuição ao longo do dia"
            height={300}
            className="lg:col-span-2"
          >
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis 
                dataKey="hora" 
                stroke="var(--ink-muted)"
                style={{ fontSize: '12px' }}
              />
              <YAxis 
                stroke="var(--ink-muted)"
                style={{ fontSize: '12px' }}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'var(--bg)', 
                  border: '1px solid var(--border)',
                  borderRadius: '8px'
                }}
              />
              <Line 
                type="monotone" 
                dataKey="emRota" 
                stroke="var(--brand)" 
                strokeWidth={2}
                dot={{ fill: 'var(--brand)', r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ChartContainer>

          {/* Ações Rápidas */}
          <QuickActions />
        </div>

        {/* Gráficos de Distribuição */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4 lg:gap-6">
          {/* Gráfico de Pizza - Status da Frota */}
          <ChartContainer
            title="Distribuição da Frota"
            description="Status atual dos veículos"
            height={300}
          >
            <PieChart>
              <Pie
                data={fleetStatusData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {fleetStatusData.map((entry, index) => {
                  const colors = ['#3B82F6', '#10B981', '#6B7280']
                  return <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                })}
              </Pie>
              <Tooltip />
            </PieChart>
          </ChartContainer>

          {/* Gráfico de Barras - Top Motoristas */}
          <ChartContainer
            title="Top 5 Motoristas"
            description="Performance por número de viagens"
            height={300}
          >
            <BarChart data={topDrivers}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis 
                dataKey="name" 
                stroke="var(--ink-muted)"
                style={{ fontSize: '12px' }}
                angle={-45}
                textAnchor="end"
                height={80}
              />
              <YAxis 
                stroke="var(--ink-muted)"
                style={{ fontSize: '12px' }}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'var(--bg)', 
                  border: '1px solid var(--border)',
                  borderRadius: '8px'
                }}
              />
              <Bar dataKey="trips" fill="var(--brand)" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ChartContainer>
        </div>

        {/* Fleet Status */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4 lg:gap-6">
          {/* Fleet Map */}
          <Card className="overflow-hidden">
            <CardHeader className="pb-4 px-3 sm:px-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0">
                <div className="flex-1 min-w-0 pr-2 sm:pr-4">
                  <CardTitle className="text-lg sm:text-xl font-semibold mb-1.5 flex items-center gap-2">
                    <Map className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
                    <span className="truncate">Mapa da Frota</span>
                  </CardTitle>
                  <p className="text-xs sm:text-sm text-[var(--ink-muted)]">Visualização em tempo real</p>
                </div>
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="flex-shrink-0 w-full sm:w-auto min-h-[44px] touch-manipulation"
                  onClick={() => router.push('/carrier/mapa')}
                >
                  Expandir
                </Button>
              </div>
            </CardHeader>
            <CardContent className="pt-0 px-3 sm:px-6">
              <div className="h-48 sm:h-64 md:h-80 lg:h-96 rounded-lg overflow-hidden border border-[var(--border)] shadow-inner bg-gray-50 dark:bg-gray-900">
                <FleetMap 
                  carrierId={userData?.carrier_id}
                />
              </div>
              <div className="mt-3 flex flex-wrap gap-2 text-xs text-[var(--ink-muted)]">
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded-full bg-green-500 flex-shrink-0"></div>
                  <span>Em movimento</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded-full bg-yellow-500 flex-shrink-0"></div>
                  <span className="hidden sm:inline">Parado (&lt;2min)</span>
                  <span className="sm:hidden">Parado</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded-full bg-red-500 flex-shrink-0"></div>
                  <span className="hidden sm:inline">Parado (&gt;3min)</span>
                  <span className="sm:hidden">Parado</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded-full bg-blue-500 flex-shrink-0"></div>
                  <span>Na garagem</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Active Drivers */}
          <Card className="overflow-hidden">
            <CardHeader className="pb-4 px-3 sm:px-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0">
                <div className="flex-1 min-w-0 pr-2 sm:pr-4">
                  <CardTitle className="text-lg sm:text-xl font-semibold mb-1.5 flex items-center gap-2">
                    <Users className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
                    <span className="truncate">Motoristas Ativos</span>
                  </CardTitle>
                  <p className="text-xs sm:text-sm text-[var(--ink-muted)]">Lista de motoristas em atividade</p>
                </div>
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="flex-shrink-0 w-full sm:w-auto min-h-[44px] touch-manipulation"
                  onClick={() => router.push('/carrier/motoristas')}
                >
                  Ver todos
                </Button>
              </div>
            </CardHeader>
            <CardContent className="pt-0 px-3 sm:px-6">
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {drivers.length === 0 ? (
                  <div className="p-6 sm:p-8 text-center text-[var(--ink-muted)]">
                    <p className="text-xs sm:text-sm">Nenhum motorista ativo</p>
                  </div>
                ) : (
                  drivers.map((driver, i) => (
                    <div key={i} className="flex items-center justify-between p-2 sm:p-3 rounded-lg hover:bg-[var(--bg-hover)] active:bg-[var(--bg-hover)] transition-colors border border-transparent hover:border-[var(--border)] touch-manipulation">
                      <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                        <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-[var(--brand-light)] flex items-center justify-center flex-shrink-0">
                          <Users className="h-4 w-4 sm:h-5 sm:w-5 text-[var(--brand)]" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-xs sm:text-sm text-[var(--ink-strong)] truncate">{driver.name}</p>
                          <p className="text-xs text-[var(--ink-muted)] truncate">
                            {driver.trips} viagem(ns) • ⭐ {driver.rating}
                          </p>
                        </div>
                      </div>
                      <Badge variant={driver.status === "active" ? "default" : "secondary"} className="flex-shrink-0 text-xs">
                        {driver.status === "active" ? "Ativo" : "Pausa"}
                      </Badge>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Fleet Status Table e Atividades Recentes */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-6">
          {/* Tabela de Status da Frota */}
          <div className="lg:col-span-2">
            <DataTable
              data={fleet}
              columns={[
                {
                  key: 'plate',
                  label: 'Veículo',
                  sortable: true,
                  render: (value, row) => (
                    <div className="flex items-center gap-2">
                      <Truck className="h-4 w-4 text-[var(--brand)] flex-shrink-0" />
                      <span className="font-semibold text-sm">{value || row.id}</span>
                    </div>
                  )
                },
                {
                  key: 'driver',
                  label: 'Motorista',
                  sortable: true
                },
                {
                  key: 'status',
                  label: 'Status',
                  sortable: true,
                  render: (value) => (
                    <Badge variant={
                      value === "on-route" ? "default" :
                      value === "available" ? "secondary" :
                      "destructive"
                    } className="text-xs">
                      {value === "on-route" ? "Em Rota" :
                       value === "available" ? "Disponível" : 
                       value === "delayed" ? "Atrasado" : "Inativo"}
                    </Badge>
                  )
                },
                {
                  key: 'route',
                  label: 'Rota',
                  sortable: true
                },
                {
                  key: 'passengerCount',
                  label: 'Passageiros',
                  sortable: true,
                  render: (value, row) => (
                    <Badge variant="outline" className="text-xs">
                      {value || 0}/{row.capacity || 0}
                    </Badge>
                  )
                },
                {
                  key: 'lastUpdate',
                  label: 'Última Atualização',
                  sortable: true
                }
              ]}
              title="Status da Frota"
              description="Detalhes de todos os veículos"
              searchPlaceholder="Buscar veículos..."
              pagination={true}
              pageSize={10}
              onRowClick={(row) => router.push(`/carrier/veiculos?vehicleId=${row.id}`)}
            />
          </div>

          {/* Atividades Recentes */}
          <RecentActivities activities={recentActivities} maxItems={5} />
        </div>
      </div>
    </AppShell>
  )
}
