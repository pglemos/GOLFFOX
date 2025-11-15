"use client"

import { useEffect, useState } from "react"
import { AppShell } from "@/components/app-shell"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CarrierMap } from "@/components/carrier-map"
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
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const getUser = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.push("/")
        return
      }

      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", session.user.id)
        .single()

      setUser({ ...session.user, ...data })
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
    delayed: 0
  })

  useEffect(() => {
    if (user) {
      loadFleetData()
    }
  }, [user])

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

      // Carregar veículos
      let vehiclesQuery = supabase
        .from('vehicles')
        .select('*')

      if (userData?.carrier_id) {
        vehiclesQuery = vehiclesQuery.eq('carrier_id', userData.carrier_id)
      }

      const { data: vehicles } = await vehiclesQuery

      // Carregar posições dos veículos
      if (vehicles && vehicles.length > 0) {
        const vehicleIds = vehicles.map((v: any) => v.id)
        const { data: positions } = await supabase
          .from('driver_positions')
          .select('*')
          .in('vehicle_id', vehicleIds)
          .order('updated_at', { ascending: false })

        // Mapear veículos com posições
        const fleetData = (vehicles || []).map((vehicle: any) => {
          const position = positions?.find((p: any) => p.vehicle_id === vehicle.id)
          return {
            id: vehicle.id,
            plate: vehicle.plate,
            driver: position?.driver_name || 'N/A',
            status: position ? 'on-route' : vehicle.is_active ? 'available' : 'inactive',
            route: position?.route_name || 'Livre',
            lastUpdate: position?.updated_at ? 
              new Date(position.updated_at).toLocaleString('pt-BR') : 'N/A'
          }
        })

        setFleet(fleetData)
        setKpis(prev => ({
          ...prev,
          totalFleet: fleetData.length,
          onRoute: fleetData.filter((v: any) => v.status === 'on-route').length,
          delayed: fleetData.filter((v: any) => v.status === 'delayed').length
        }))
      }

      // Carregar motoristas
      let driversQuery = supabase
        .from('users')
        .select('*')
        .eq('role', 'driver')

      if (userData?.carrier_id) {
        driversQuery = driversQuery.eq('carrier_id', userData.carrier_id)
      }

      const { data: driversData } = await driversQuery

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
            name: driver.name,
            trips: ranking?.trips_completed || 0,
            rating: ranking?.total_points ? (ranking.total_points / 100).toFixed(1) : '0.0',
            status: 'active'
          }
        })

        setDrivers(driversWithStats)
        setKpis(prev => ({
          ...prev,
          activeDrivers: driversWithStats.filter((d: any) => d.status === 'active').length
        }))
      }
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
                  <p className="text-sm font-medium text-[var(--ink-muted)] mb-1">Atrasados</p>
                  <p className="text-2xl font-bold text-[var(--ink-strong)] truncate">{kpis.delayed}</p>
                </div>
                <div className="p-2 rounded-lg bg-red-100 dark:bg-red-900/20 flex-shrink-0">
                  <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
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
                <Button size="sm" variant="outline" className="flex-shrink-0">
                  Expandir
                </Button>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="h-64 rounded-lg overflow-hidden bg-gradient-to-br from-[var(--brand)]/10 to-[var(--accent)]/10 border border-[var(--border)]">
                <CarrierMap 
                  vehicles={fleet.map(vehicle => ({
                    id: vehicle.id,
                    plate: vehicle.id,
                    lat: (vehicle as any).lat || -14.235,
                    lng: (vehicle as any).lng || -51.9253,
                    status: vehicle.status as 'on_route' | 'available' | 'delayed'
                  }))}
                />
              </div>
              {/* Legend */}
              <div className="mt-4 flex flex-wrap gap-4">
                <div className="flex items-center gap-2 text-xs">
                  <div className="w-3 h-3 rounded-full bg-[var(--brand)]" />
                  <span className="text-[var(--ink-muted)]">Em Rota</span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <div className="w-3 h-3 rounded-full bg-green-500" />
                  <span className="text-[var(--ink-muted)]">Disponível</span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <div className="w-3 h-3 rounded-full bg-red-500" />
                  <span className="text-[var(--ink-muted)]">Atrasado</span>
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
                <Button size="sm" variant="outline" className="flex-shrink-0">
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
              <Button size="sm" variant="outline" className="flex-shrink-0">
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
                    <th className="text-left py-3 px-4 font-semibold text-sm text-[var(--ink-strong)]">Última atualização</th>
                  </tr>
                </thead>
                <tbody>
                  {fleet.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-[var(--ink-muted)]">
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
