"use client"

import { useEffect, useState } from "react"
import { AppShell } from "@/components/app-shell"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { FleetMap } from "@/components/fleet-map"
import { 
  Truck, 
  Map, 
  Users, 
  Navigation,
  AlertCircle
} from "lucide-react"
import { supabase } from "@/lib/supabase"
import { useRouter } from "next/navigation"

export default function CarrierDashboard() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [userData, setUserData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const getUser = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.push("/")
        return
      }

      const { data } = await supabase
        .from("users")
        .select("*")
        .eq("id", session.user.id)
        .single()

      setUser({ ...session.user, ...data })
      setUserData(data)
      setLoading(false)
    }

    getUser()
  }, [router])

  const [fleet, setFleet] = useState<any[]>([])
  const [drivers, setDrivers] = useState<any[]>([])
  const [kpis, setKpis] = useState({
    totalFleet: 0,
    onRoute: 0,
    activeDrivers: 0,
    delayed: 0,
    criticalAlerts: 0,
    totalCostsThisMonth: 0,
    totalTrips: 0
  })

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
      
      setKpis({
        totalFleet: fleetData.length,
        onRoute: onRouteCount,
        activeDrivers: driversData?.length || 0,
        delayed: criticalAlertsCount,
        criticalAlerts: criticalAlertsCount,
        totalCostsThisMonth: totalCostsThisMonth,
        totalTrips: tripsCount || 0
      })

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
      <div className="space-y-6 lg:space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-2">
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl sm:text-3xl font-bold mb-2 text-[var(--ink-strong)]">Gestão de Frota</h1>
            <p className="text-sm sm:text-base text-[var(--ink-muted)]">Monitore veículos e motoristas em tempo real</p>
          </div>
          <Button asChild className="flex-shrink-0">
            <a href="/carrier/relatorios">
              <Truck className="h-4 w-4 mr-2" />
              Relatórios
            </a>
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="overflow-hidden">
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0 pr-4">
                  <p className="text-sm font-medium text-[var(--ink-muted)] mb-1">Total da Frota</p>
                  <p className="text-2xl font-bold text-[var(--ink-strong)] truncate">{kpis.totalFleet}</p>
                </div>
                <div className="p-2 rounded-lg bg-[var(--brand-light)] flex-shrink-0">
                  <Truck className="h-5 w-5 text-[var(--brand)]" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="overflow-hidden">
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0 pr-4">
                  <p className="text-sm font-medium text-[var(--ink-muted)] mb-1">Em Rota</p>
                  <p className="text-2xl font-bold text-[var(--ink-strong)] truncate">{kpis.onRoute}</p>
                </div>
                <div className="p-2 rounded-lg bg-[var(--accent-light)] flex-shrink-0">
                  <Navigation className="h-5 w-5 text-[var(--accent)]" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="overflow-hidden">
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0 pr-4">
                  <p className="text-sm font-medium text-[var(--ink-muted)] mb-1">Motoristas Ativos</p>
                  <p className="text-2xl font-bold text-[var(--ink-strong)] truncate">{kpis.activeDrivers}</p>
                </div>
                <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/20 flex-shrink-0">
                  <Users className="h-5 w-5 text-green-600 dark:text-green-400" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="overflow-hidden">
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0 pr-4">
                  <p className="text-sm font-medium text-[var(--ink-muted)] mb-1">Alertas Críticos</p>
                  <p className="text-2xl font-bold text-[var(--ink-strong)] truncate">{kpis.criticalAlerts}</p>
                </div>
                <div className="p-2 rounded-lg bg-red-100 dark:bg-red-900/20 flex-shrink-0">
                  <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Additional KPIs Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <Card className="overflow-hidden">
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0 pr-4">
                  <p className="text-sm font-medium text-[var(--ink-muted)] mb-1">Custos do Mês</p>
                  <p className="text-2xl font-bold text-[var(--ink-strong)] truncate">
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 0 }).format(kpis.totalCostsThisMonth)}
                  </p>
                </div>
                <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/20 flex-shrink-0">
                  <Truck className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="overflow-hidden">
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0 pr-4">
                  <p className="text-sm font-medium text-[var(--ink-muted)] mb-1">Viagens do Mês</p>
                  <p className="text-2xl font-bold text-[var(--ink-strong)] truncate">{kpis.totalTrips}</p>
                </div>
                <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/20 flex-shrink-0">
                  <Navigation className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="overflow-hidden cursor-pointer hover:shadow-lg transition-shadow" onClick={() => router.push('/carrier/alertas')}>
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0 pr-4">
                  <p className="text-sm font-medium text-[var(--ink-muted)] mb-1">Documentos Vencendo</p>
                  <p className="text-2xl font-bold text-[var(--ink-strong)] truncate">{kpis.delayed}</p>
                  <p className="text-xs text-[var(--ink-muted)] mt-1">Clique para ver detalhes</p>
                </div>
                <div className="p-2 rounded-lg bg-orange-100 dark:bg-orange-900/20 flex-shrink-0">
                  <AlertCircle className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Fleet Status */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
          {/* Fleet Map */}
          <Card className="overflow-hidden">
            <CardHeader className="pb-4">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0 pr-4">
                  <CardTitle className="text-xl font-semibold mb-1.5 flex items-center gap-2">
                    <Map className="h-5 w-5" />
                    Mapa da Frota
                  </CardTitle>
                  <p className="text-sm text-[var(--ink-muted)]">Visualização em tempo real</p>
                </div>
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="flex-shrink-0"
                  onClick={() => router.push('/carrier/mapa')}
                >
                  Expandir
                </Button>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="h-64 md:h-80 lg:h-96 rounded-lg overflow-hidden border border-[var(--border)] shadow-inner bg-gray-50 dark:bg-gray-900">
                <FleetMap 
                  carrierId={userData?.carrier_id}
                />
              </div>
              <div className="mt-3 flex flex-wrap gap-2 text-xs text-[var(--ink-muted)]">
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                  <span>Em movimento</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                  <span>Parado (&lt;2min)</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded-full bg-red-500"></div>
                  <span>Parado (&gt;3min)</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                  <span>Na garagem</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Active Drivers */}
          <Card className="overflow-hidden">
            <CardHeader className="pb-4">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0 pr-4">
                  <CardTitle className="text-xl font-semibold mb-1.5 flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Motoristas Ativos
                  </CardTitle>
                  <p className="text-sm text-[var(--ink-muted)]">Lista de motoristas em atividade</p>
                </div>
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="flex-shrink-0"
                  onClick={() => router.push('/carrier/motoristas')}
                >
                  Ver todos
                </Button>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {drivers.length === 0 ? (
                  <div className="p-8 text-center text-[var(--ink-muted)]">
                    <p className="text-sm">Nenhum motorista ativo</p>
                  </div>
                ) : (
                  drivers.map((driver, i) => (
                    <div key={i} className="flex items-center justify-between p-3 rounded-lg hover:bg-[var(--bg-hover)] transition-colors border border-transparent hover:border-[var(--border)]">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="w-10 h-10 rounded-lg bg-[var(--brand-light)] flex items-center justify-center flex-shrink-0">
                          <Users className="h-5 w-5 text-[var(--brand)]" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm text-[var(--ink-strong)] truncate">{driver.name}</p>
                          <p className="text-xs text-[var(--ink-muted)] truncate">
                            {driver.trips} viagem(ns) • ⭐ {driver.rating}
                          </p>
                        </div>
                      </div>
                      <Badge variant={driver.status === "active" ? "default" : "secondary"} className="flex-shrink-0">
                        {driver.status === "active" ? "Ativo" : "Pausa"}
                      </Badge>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Fleet Status Table */}
        <Card className="overflow-hidden">
          <CardHeader className="pb-4">
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0 pr-4">
                <CardTitle className="text-xl font-semibold mb-1.5 flex items-center gap-2">
                  <Truck className="h-5 w-5" />
                  Status da Frota
                </CardTitle>
                <p className="text-sm text-[var(--ink-muted)]">Detalhes de todos os veículos</p>
              </div>
              <Button 
                size="sm" 
                variant="outline" 
                className="flex-shrink-0"
                onClick={loadFleetData}
              >
                Atualizar
              </Button>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[var(--border)]">
                    <th className="text-left py-3 px-4 font-semibold text-sm text-[var(--ink-strong)]">Veículo</th>
                    <th className="text-left py-3 px-4 font-semibold text-sm text-[var(--ink-strong)]">Motorista</th>
                    <th className="text-left py-3 px-4 font-semibold text-sm text-[var(--ink-strong)]">Status</th>
                    <th className="text-left py-3 px-4 font-semibold text-sm text-[var(--ink-strong)]">Rota</th>
                    <th className="text-left py-3 px-4 font-semibold text-sm text-[var(--ink-strong)]">Passageiros</th>
                    <th className="text-left py-3 px-4 font-semibold text-sm text-[var(--ink-strong)]">Última atualização</th>
                  </tr>
                </thead>
                <tbody>
                  {fleet.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-[var(--ink-muted)]">
                        <p className="text-sm">Nenhum veículo encontrado</p>
                      </td>
                    </tr>
                  ) : (
                    fleet.map((vehicle, i) => (
                      <tr key={i} className="border-b border-[var(--border)] hover:bg-[var(--bg-hover)] transition-colors">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <Truck className="h-4 w-4 text-[var(--brand)] flex-shrink-0" />
                            <span className="font-semibold text-sm text-[var(--ink-strong)] truncate">{vehicle.plate || vehicle.id}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <span className="text-sm text-[var(--ink)] truncate block">{vehicle.driver}</span>
                        </td>
                        <td className="py-3 px-4">
                          <Badge variant={
                            vehicle.status === "on-route" ? "default" :
                            vehicle.status === "available" ? "secondary" :
                            "destructive"
                          } className="text-xs">
                            {vehicle.status === "on-route" ? "Em Rota" :
                             vehicle.status === "available" ? "Disponível" : 
                             vehicle.status === "delayed" ? "Atrasado" : "Inativo"}
                          </Badge>
                        </td>
                        <td className="py-3 px-4">
                          <span className="text-sm text-[var(--ink)] truncate block">{vehicle.route}</span>
                        </td>
                        <td className="py-3 px-4">
                          <Badge variant="outline" className="text-xs">
                            {vehicle.passengerCount || 0}/{vehicle.capacity || 0}
                          </Badge>
                        </td>
                        <td className="py-3 px-4">
                          <span className="text-xs text-[var(--ink-muted)] truncate block">{vehicle.lastUpdate}</span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  )
}
