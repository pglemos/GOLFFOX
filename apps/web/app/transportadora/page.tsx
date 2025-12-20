"use client"

import { useEffect, useState } from "react"
import { AppShell } from "@/components/app-shell"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { KpiCard } from "@/components/kpi-card"
import { DataTable } from "@/components/transportadora/data-table"
import { QuickActions } from "@/components/transportadora/quick-actions"
import { RecentActivities } from "@/components/transportadora/recent-activities"
import { FilterDrawer } from "@/components/shared/filter-drawer"
import { ResponsiveChart } from "@/components/shared/responsive-chart"
import { LazyWrapper } from "@/components/shared/lazy-wrapper"
import { useMobile } from "@/hooks/use-mobile"
import dynamic from "next/dynamic"

// Lazy load componentes pesados
const FleetMap = dynamic(
  () => import("@/components/fleet-map").then((mod) => ({ default: mod.FleetMap })),
  {
    loading: () => (
      <div className="flex items-center justify-center h-full min-h-[200px]">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    ),
    ssr: false
  }
)
import {
  Truck,
  Map,
  Users,
  Navigation,
  AlertCircle,
  Calendar,
  DollarSign,
  ArrowUpRight,
  ArrowDownRight,
  Minus
} from "lucide-react"
import { supabase } from "@/lib/supabase"
import { ensureSupabaseSession } from "@/lib/supabase-session"
import { useRouter } from "@/lib/next-navigation"
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts"
import { t } from "@/lib/i18n"
import { cn } from "@/lib/utils"

export default function TransportadoraDashboard() {
  const router = useRouter()
  const isMobile = useMobile()
  const [user, setUser] = useState<any>(null)
  const [userData, setUserData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const getUser = async () => {
      console.log('🔍 [Transportadora] Iniciando verificação de autenticação...')
      try {
        // ✅ PRIMEIRO: Tentar obter do cookie de sessão customizado (mais rápido e confiável)
        // Nota: Se o cookie for httpOnly, isso não funcionará, mas tentaremos mesmo assim
        if (typeof document !== 'undefined') {
          try {
            console.log('🔍 [Transportadora] Chamando API /api/auth/me...')
            const meResponse = await fetch('/api/auth/me', {
              credentials: 'include'
            })
            console.log('🔍 [Transportadora] Resposta da API /api/auth/me:', { status: meResponse.status, ok: meResponse.ok })

            if (meResponse.ok) {
              const meData = await meResponse.json()
              console.log('✅ [Transportadora] Resposta da API /api/auth/me:', { success: meData.success, hasUser: !!meData.user, role: meData.user?.role })

              if (
                meData.success &&
                meData.user &&
                ['transportadora', 'operador', 'transportadora', 'admin'].includes(meData.user.role)
              ) {
                console.log('✅ [Transportadora] Usuário transportadora autenticado via API /api/auth/me, definindo usuário...')
                setUser(meData.user)
                setUserData(meData.user)
                await ensureSupabaseSession()
                setLoading(false)
                console.log('✅ [Transportadora] Autenticação concluída com sucesso')
                return
              } else {
                console.warn('⚠️ [Transportadora] API /api/auth/me retornou OK mas sem usuário transportadora:', meData)
              }
            } else {
              const errorText = await meResponse.text()
              console.warn('⚠️ [Transportadora] API /api/auth/me retornou erro:', meResponse.status, errorText)
            }
          } catch (apiError) {
            console.warn('⚠️ [Transportadora] Erro ao chamar API /api/auth/me:', apiError)
          }
        }

        // ✅ FALLBACK: Tentar obter sessão do Supabase Auth
        try {
          const { data: { session }, error: sessionError } = await supabase.auth.getSession()
          if (sessionError) {
            console.error('Erro ao verificar sessão Supabase:', sessionError)
          }

          if (session) {
            console.log('✅ Sessão Supabase encontrada, buscando dados do usuário')
            const { data, error: dbError } = await supabase
              .from("users")
              .select("*")
              .eq("id", session.user.id)
              .single()

            if (dbError) {
              console.warn('⚠️ Erro ao buscar dados do usuário:', dbError)
            }

            if (data && ['transportadora', 'operador', 'transportadora', 'admin'].includes(data.role)) {
              console.log('✅ Usuário transportadora autenticado via Supabase Auth')
              setUser({ ...session.user, ...data })
              setUserData(data)
              setLoading(false)
              return
            } else {
              console.warn('⚠️ Usuário não tem role transportadora/operador:', data?.role)
            }
          } else {
            console.warn('⚠️ Nenhuma sessão Supabase encontrada')
          }
        } catch (supabaseError) {
          console.warn('⚠️ Erro ao verificar sessão Supabase:', supabaseError)
        }

        // Se chegou aqui, não há autenticação válida
        console.warn('⚠️ Usuário não autenticado ou sem role transportadora, redirecionando para login')
        router.push("/")
      } catch (error) {
        console.error('❌ Erro ao verificar autenticação:', error)
        router.push("/")
      }
    }

    getUser()
  }, [router])

  const [fleet, setFleet] = useState<any[]>([])
  const [motoristas, setMotoristas] = useState<any[]>([])
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
    if (user && userData?.transportadora_id) {
      loadFleetData()

      // Configurar Realtime subscription para atualização automática
      const channel = supabase
        .channel('transportadora-dashboard-realtime')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'motorista_positions'
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
            table: 'trip_passageiros'
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
        supabase.removeChannel(channel as any)
        clearInterval(interval)
      }
    }
  }, [user, userData?.transportadora_id])

  const loadFleetData = async () => {
    try {
      // Buscar dados da transportadora (preferir cookie para evitar RLS no client)
      const transportadoraData = { transportadora_id: (userData as any)?.transportadora_id || (user as any)?.transportadora_id || null }

      if (!transportadoraData?.transportadora_id) {
        console.error("Usuário não está associado a uma transportadora")
        return
      }

      const transportadoraId = transportadoraData.transportadora_id

      // Carregar veículos
      const { data: veiculos } = await supabase
        .from('veiculos')
        .select('*')
        .eq('transportadora_id', transportadoraId)

      // Carregar posições dos veículos usando RPC do mapa
      const { data: mapData } = await supabase.rpc('gf_map_snapshot_full', {
        p_transportadora_id: transportadoraId,
        p_company_id: undefined,
        p_route_id: undefined
      })

      // Mapear veículos com posições do RPC
      const fleetData = (veiculos || []).map((veiculo: any) => {
        const bus = (mapData as any)?.buses?.find((b: any) => b.veiculo_id === veiculo.id)
        const garage = (mapData as any)?.garages?.find((g: any) => g.veiculo_id === veiculo.id)

        if (bus) {
          return {
            id: veiculo.id,
            plate: veiculo.plate,
            motorista: bus.motorista_name || 'N/A',
            status: 'on-route',
            route: bus.route_name || 'Livre',
            lat: bus.lat,
            lng: bus.lng,
            passengerCount: bus.passenger_count || 0,
            capacity: bus.capacity || veiculo.capacity || 0,
            lastUpdate: bus.last_update ?
              new Date(bus.last_update).toLocaleString('pt-BR') : 'N/A'
          }
        } else if (garage) {
          return {
            id: veiculo.id,
            plate: veiculo.plate,
            motorista: 'N/A',
            status: 'available',
            route: 'Livre',
            lat: garage.last_position?.lat,
            lng: garage.last_position?.lng,
            passengerCount: 0,
            capacity: veiculo.capacity || 0,
            lastUpdate: garage.last_position?.timestamp ?
              new Date(garage.last_position.timestamp).toLocaleString('pt-BR') : 'N/A'
          }
        } else {
          return {
            id: veiculo.id,
            plate: veiculo.plate,
            motorista: 'N/A',
            status: veiculo.is_active ? 'available' : 'inactive',
            route: 'Livre',
            lat: null,
            lng: null,
            passengerCount: 0,
            capacity: veiculo.capacity || 0,
            lastUpdate: 'N/A'
          }
        }
      })

      setFleet(fleetData)

      // Carregar motoristas
      const { data: driversData } = await supabase
        .from('users')
        .select('*')
        .eq('role', 'motorista')
        .eq('transportadora_id', transportadoraId)

      let driversWithStats: any[] = []

      if (driversData?.length) {
        // Buscar dados de ranking/gamificação
        const driverIds = driversData.map((d: any) => d.id)
        // @ts-ignore - Supabase type inference issue
        const { data: rankings } = await ((supabase
          .from('gf_gamification_scores' as any)
          .select('*')
          .in('motorista_id', driverIds)) as any)

        driversWithStats = (driversData || []).map((motorista: any) => {
          const ranking = rankings?.find((r: any) => r.motorista_id === motorista.id)
          return {
            id: motorista.id,
            name: motorista.name,
            trips: (ranking as any)?.trips_completed || 0,
            rating: (ranking as any)?.total_points ? ((ranking as any).total_points / 100).toFixed(1) : '0.0',
            status: 'active'
          }
        })
      }

      setMotoristas(driversWithStats)

      // Buscar alertas críticos de vencimento
      const { data: alerts } = await supabase
        .from('v_carrier_expiring_documents')
        .select('*')
        .eq('transportadora_id', transportadoraId)
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
        .eq('transportadora_id', transportadoraId)
        .gte('month', currentMonthStart.toISOString())
        .lt('month', currentMonthEnd.toISOString())

      const { data: routeCosts } = await supabase
        .from('v_carrier_route_costs_summary')
        .select('total_cost_brl')
        .eq('transportadora_id', transportadoraId)
        .gte('month', currentMonthStart.toISOString())
        .lt('month', currentMonthEnd.toISOString())

      // Buscar rotas da transportadora para contar viagens
      const { data: routes } = await supabase
        .from('routes')
        .select('id')
        .eq('transportadora_id', transportadoraId)

      const routeIds = routes?.map((r: any) => r.id) || []

      // Buscar total de viagens do mês (já temos currentMonthStart definido acima)
      let tripsCount = 0
      if (routeIds.length > 0) {
        const { count } = await supabase
          .from('trips')
          .select('*', { count: 'exact', head: true })
          .in('route_id', routeIds)
          .gte('created_at', currentMonthStart.toISOString())

        tripsCount = count || 0
      }

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
          .eq('transportadora_id', transportadoraId)
          .gte('month', previousMonthStart.toISOString())
          .lt('month', previousMonthEnd.toISOString()),
        supabase
          .from('v_carrier_route_costs_summary')
          .select('total_cost_brl')
          .eq('transportadora_id', transportadoraId)
          .gte('month', previousMonthStart.toISOString())
          .lt('month', previousMonthEnd.toISOString()),
        routeIds.length > 0
          ? supabase
            .from('trips')
            .select('*', { count: 'exact', head: true })
            .in('route_id', routeIds)
            .gte('created_at', previousMonthStart.toISOString())
            .lt('created_at', previousMonthEnd.toISOString())
          : Promise.resolve({ count: 0 })
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
          title: `${t('transportadora', 'activity_alert')}: ${a.document_type}`,
          description: `${a.entity_name} - ${a.alert_level === 'expired' ? t('transportadora', 'activity_expired') : t('transportadora', 'activity_expiring')}`,
          timestamp: new Date().toISOString(),
          status: a.alert_level === 'expired' ? 'error' as const : 'warning' as const
        })) || []),
        ...fleetData.slice(0, 2).map((v: any) => ({
          id: `veiculo-${v.id}`,
          type: 'veiculo' as const,
          title: `${t('transportadora', 'activity_vehicle')} ${v.plate} ${v.status === 'on-route' ? t('transportadora', 'activity_on_route') : t('transportadora', 'activity_available')}`,
          description: v.route,
          timestamp: v.lastUpdate !== 'N/A' ? new Date(v.lastUpdate).toISOString() : new Date().toISOString(),
          status: 'info' as const
        }))
      ].slice(0, 5)
      setRecentActivities(activities)

      // Atualizar userData para usar no FleetMap
      setUserData((prev: any) => ({
        ...prev,
        ...transportadoraData,
      }))
    } catch (error) {
      console.error("Erro ao carregar dados da frota:", error)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-text-brand border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-ink-muted">{t('transportadora', 'loading')}</p>
        </div>
      </div>
    )
  }

  return (
    <AppShell user={{
      id: user?.id || "",
      name: user?.name || "Transportadora",
      email: user?.email || "",
      role: "transportadora",
      avatar_url: (user as any)?.avatar_url
    }}>
      <div className="space-y-4 sm:space-y-6 lg:space-y-8 w-full">
        {/* Header */}
        <div className="flex flex-col gap-3 sm:gap-4 pb-2">
          <div className="flex-1 min-w-0">
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold mb-2 text-text-ink-strong">{t('transportadora', 'header_title')}</h1>
            <p className="text-xs sm:text-sm md:text-base text-ink-muted">{t('transportadora', 'header_subtitle')}</p>
          </div>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3 w-full sm:w-auto">
            <Select
              value={period}
              onValueChange={(value: "today" | "week" | "month" | "custom") => setPeriod(value)}
            >
              <SelectTrigger className="w-full sm:w-40 min-h-[44px] touch-manipulation text-base">
                <Calendar className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="today">{t('transportadora', 'period_today')}</SelectItem>
                <SelectItem value="week">{t('transportadora', 'period_week')}</SelectItem>
                <SelectItem value="month">{t('transportadora', 'period_month')}</SelectItem>
                <SelectItem value="custom">{t('transportadora', 'period_custom')}</SelectItem>
              </SelectContent>
            </Select>
            <Button
              className="flex-shrink-0 w-full sm:w-auto min-h-[44px] touch-manipulation"
              onClick={() => router.push("/transportadora/relatorios")}
            >
              <Truck className="h-4 w-4 mr-2" />
              {t('transportadora', 'button_reports')}
            </Button>
          </div>
        </div>

        {/* Stats - KPIs Melhorados - Mobile: 1 col, Tablet: 2 cols, Desktop: 4 cols */}
        <div className={cn(
          "grid gap-3 sm:gap-4",
          isMobile ? "grid-cols-1" : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4"
        )}>
          <KpiCard
            icon={Truck}
            label={t('transportadora', 'kpi_total_fleet')}
            value={kpis.totalFleet.toString()}
            trend={previousKpis.totalFleet > 0 ? Math.round(((kpis.totalFleet - previousKpis.totalFleet) / previousKpis.totalFleet) * 100) : 0}
            onClick={() => router.push('/transportadora/veiculos')}
          />
          <KpiCard
            icon={Navigation}
            label={t('transportadora', 'kpi_on_route')}
            value={kpis.onRoute.toString()}
            trend={previousKpis.onRoute > 0 ? Math.round(((kpis.onRoute - previousKpis.onRoute) / previousKpis.onRoute) * 100) : 0}
          />
          <KpiCard
            icon={Users}
            label={t('transportadora', 'kpi_active_drivers')}
            value={kpis.activeDrivers.toString()}
            trend={previousKpis.activeDrivers > 0 ? Math.round(((kpis.activeDrivers - previousKpis.activeDrivers) / previousKpis.activeDrivers) * 100) : 0}
            onClick={() => {
              try {
                router.push('/transportadora/motoristas')
              } catch (err) {
                console.error('❌ Router.push failed, using window.location:', err)
                window.location.href = '/transportadora/motoristas'
              }
            }}
          />
          <KpiCard
            icon={AlertCircle}
            label={t('transportadora', 'kpi_critical_alerts')}
            value={kpis.criticalAlerts.toString()}
            trend={previousKpis.criticalAlerts > 0 ? Math.round(((kpis.criticalAlerts - previousKpis.criticalAlerts) / previousKpis.criticalAlerts) * 100) : 0}
            onClick={() => {
              try {
                router.push('/transportadora/alertas')
              } catch (err) {
                console.error('❌ Router.push failed, using window.location:', err)
                window.location.href = '/transportadora/alertas'
              }
            }}
          />
        </div>

        {/* Additional KPIs Row - Mobile: 1 col, Tablet: 2 cols, Desktop: 3 cols */}
        <div className={cn(
          "grid gap-3 sm:gap-4",
          isMobile ? "grid-cols-1" : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
        )}>
          <KpiCard
            icon={DollarSign}
            label={t('transportadora', 'kpi_monthly_costs')}
            value={new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 0 }).format(kpis.totalCostsThisMonth)}
            trend={previousKpis.totalCostsThisMonth > 0 ? Math.round(((kpis.totalCostsThisMonth - previousKpis.totalCostsThisMonth) / previousKpis.totalCostsThisMonth) * 100) : 0}
            onClick={() => {
              try {
                router.push('/transportadora/custos')
              } catch (err) {
                console.error('❌ Router.push failed, using window.location:', err)
                window.location.href = '/transportadora/custos'
              }
            }}
          />
          <KpiCard
            icon={Navigation}
            label={t('transportadora', 'kpi_monthly_trips')}
            value={kpis.totalTrips.toString()}
            trend={previousKpis.totalTrips > 0 ? Math.round(((kpis.totalTrips - previousKpis.totalTrips) / previousKpis.totalTrips) * 100) : 0}
          />
          <KpiCard
            icon={AlertCircle}
            label={t('transportadora', 'kpi_expiring_documents')}
            value={kpis.delayed.toString()}
            trend={previousKpis.delayed > 0 ? Math.round(((kpis.delayed - previousKpis.delayed) / previousKpis.delayed) * 100) : 0}
            hint={t('transportadora', 'hint_click_details')}
            onClick={() => {
              try {
                router.push('/transportadora/alertas')
              } catch (err) {
                console.error('❌ Router.push failed, using window.location:', err)
                window.location.href = '/transportadora/alertas'
              }
            }}
          />
        </div>

        {/* Gráficos e Ações Rápidas */}
        <div className={cn(
          "grid gap-3 sm:gap-4 lg:gap-6",
          isMobile ? "grid-cols-1" : "grid-cols-1 lg:grid-cols-3"
        )}>
          {/* Gráfico de Linha - Veículos em Rota */}
          <ResponsiveChart
            title={t('transportadora', 'charts_vehicles_24h')}
            description={t('transportadora', 'charts_vehicles_24h_desc')}
            height={300}
            mobileHeight={250}
            className={cn(isMobile ? "w-full" : "lg:col-span-2")}
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
          </ResponsiveChart>

          {/* Ações Rápidas */}
          <QuickActions />
        </div>

        {/* Gráficos de Distribuição */}
        <div className={cn(
          "grid gap-3 sm:gap-4 lg:gap-6",
          isMobile ? "grid-cols-1" : "grid-cols-1 lg:grid-cols-2"
        )}>
          {/* Gráfico de Pizza - Status da Frota */}
          <ResponsiveChart
            title={t('transportadora', 'charts_fleet_distribution')}
            description={t('transportadora', 'charts_fleet_distribution_desc')}
            height={300}
            mobileHeight={250}
          >
            <PieChart>
              <Pie
                data={fleetStatusData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${percent ? (percent * 100).toFixed(0) : 0}%`}
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
          </ResponsiveChart>

          {/* Gráfico de Barras - Top Motoristas */}
          <ResponsiveChart
            title={t('transportadora', 'charts_top_drivers')}
            description={t('transportadora', 'charts_top_drivers_desc')}
            height={300}
            mobileHeight={250}
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
          </ResponsiveChart>
        </div>

        {/* Fleet Status - Mobile: 1 col, Desktop: 2 cols */}
        <div className={cn(
          "grid gap-3 sm:gap-4 lg:gap-6",
          isMobile ? "grid-cols-1" : "grid-cols-1 lg:grid-cols-2"
        )}>
          {/* Fleet Map */}
          <Card className="overflow-hidden">
            <CardHeader className="pb-4 px-3 sm:px-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0">
                <div className="flex-1 min-w-0 pr-2 sm:pr-4">
                  <CardTitle className="text-lg sm:text-xl font-semibold mb-1.5 flex items-center gap-2">
                    <Map className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
                    <span className="truncate">{t('transportadora', 'fleet_map_title')}</span>
                  </CardTitle>
                  <p className="text-xs sm:text-sm text-ink-muted">{t('transportadora', 'fleet_map_subtitle')}</p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-shrink-0 w-full sm:w-auto min-h-[44px] touch-manipulation"
                  onClick={() => router.push('/transportadora/mapa')}
                >
                  {t('transportadora', 'fleet_map_expand')}
                </Button>
              </div>
            </CardHeader>
            <CardContent className="pt-0 px-3 sm:px-6">
              <div className={cn(
                "rounded-lg overflow-hidden border border-border shadow-inner bg-bg-soft dark:bg-ink-strong",
                isMobile ? "h-64" : "h-48 sm:h-64 md:h-80 lg:h-96"
              )}>
                <LazyWrapper>
                  <FleetMap
                    transportadoraId={userData?.transportadora_id}
                  />
                </LazyWrapper>
              </div>
              <div className="mt-3 flex flex-wrap gap-2 text-xs text-ink-muted">
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded-full bg-success-light0 flex-shrink-0"></div>
                  <span>{t('transportadora', 'fleet_map_legend_moving')}</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded-full bg-warning-light0 flex-shrink-0"></div>
                  <span className="hidden sm:inline">{t('transportadora', 'fleet_map_legend_stopped_short')}</span>
                  <span className="sm:hidden">{t('transportadora', 'fleet_map_legend_stopped_short').split('(')[0].trim()}</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded-full bg-error-light0 flex-shrink-0"></div>
                  <span className="hidden sm:inline">{t('transportadora', 'fleet_map_legend_stopped_long')}</span>
                  <span className="sm:hidden">{t('transportadora', 'fleet_map_legend_stopped_long').split('(')[0].trim()}</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded-full bg-info-light0 flex-shrink-0"></div>
                  <span>{t('transportadora', 'fleet_map_legend_garage')}</span>
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
                    <span className="truncate">{t('transportadora', 'active_drivers_title')}</span>
                  </CardTitle>
                  <p className="text-xs sm:text-sm text-ink-muted">{t('transportadora', 'active_drivers_subtitle')}</p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-shrink-0 w-full sm:w-auto min-h-[44px] touch-manipulation"
                  onClick={(e) => {
                    console.log('🔵 [DEBUG] Button Ver todos motoristas clicked', e)
                    e.preventDefault()
                    e.stopPropagation()
                    try {
                      router.push('/transportadora/motoristas')
                    } catch (err) {
                      console.error('❌ Router.push failed, using window.location:', err)
                      window.location.href = '/transportadora/motoristas'
                    }
                  }}
                >
                  {t('transportadora', 'active_drivers_view_all')}
                </Button>
              </div>
            </CardHeader>
            <CardContent className="pt-0 px-3 sm:px-6">
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {motoristas.length === 0 ? (
                  <div className="p-6 sm:p-8 text-center text-ink-muted">
                    <p className="text-xs sm:text-sm">{t('transportadora', 'active_drivers_empty')}</p>
                  </div>
                ) : (
                  motoristas.map((motorista, i) => (
                    <div key={i} className="flex items-center justify-between p-2 sm:p-3 rounded-lg hover:bg-bg-hover active:bg-bg-hover transition-colors border border-transparent hover:border-border touch-manipulation">
                      <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                        <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-brand-light flex items-center justify-center flex-shrink-0">
                          <Users className="h-4 w-4 sm:h-5 sm:w-5 text-brand" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-xs sm:text-sm text-text-ink-strong truncate">{motorista.name}</p>
                          <p className="text-xs text-ink-muted truncate">
                            {motorista.trips} viagem(ns) • ⭐ {motorista.rating}
                          </p>
                        </div>
                      </div>
                      <Badge variant={motorista.status === "active" ? "default" : "secondary"} className="flex-shrink-0 text-xs">
                        {motorista.status === "active" ? t('transportadora', 'status_active') : t('transportadora', 'status_pause')}
                      </Badge>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Fleet Status Table e Atividades Recentes - Mobile: stack, Desktop: side by side */}
        <div className={cn(
          "grid gap-3 sm:gap-4 lg:gap-6",
          isMobile ? "grid-cols-1" : "grid-cols-1 lg:grid-cols-3"
        )}>
          {/* Tabela de Status da Frota */}
          <div className={cn(isMobile ? "w-full" : "lg:col-span-2")}>
            <DataTable
              data={fleet}
              columns={[
                {
                  key: 'plate',
                  label: t('transportadora', 'table_vehicle'),
                  sortable: true,
                  render: (value, row) => (
                    <div className="flex items-center gap-2">
                      <Truck className="h-4 w-4 text-brand flex-shrink-0" />
                      <span className="font-semibold text-sm">{value || row.id}</span>
                    </div>
                  )
                },
                {
                  key: 'motorista',
                  label: t('transportadora', 'table_driver'),
                  sortable: true
                },
                {
                  key: 'status',
                  label: t('transportadora', 'table_status'),
                  sortable: true,
                  render: (value) => (
                    <Badge variant={
                      value === "on-route" ? "default" :
                        value === "available" ? "secondary" :
                          "destructive"
                    } className="text-xs">
                      {value === "on-route" ? t('transportadora', 'status_on_route') :
                        value === "available" ? t('transportadora', 'status_available') :
                          value === "delayed" ? t('transportadora', 'status_delayed') : t('transportadora', 'status_inactive')}
                    </Badge>
                  )
                },
                {
                  key: 'route',
                  label: t('transportadora', 'table_route'),
                  sortable: true
                },
                {
                  key: 'passengerCount',
                  label: t('transportadora', 'table_passengers'),
                  sortable: true,
                  render: (value, row) => (
                    <Badge variant="outline" className="text-xs">
                      {value || 0}/{row.capacity || 0}
                    </Badge>
                  )
                },
                {
                  key: 'lastUpdate',
                  label: t('transportadora', 'table_last_update'),
                  sortable: true
                }
              ]}
              title={t('transportadora', 'fleet_status_title')}
              description={t('transportadora', 'fleet_status_desc')}
              searchPlaceholder={t('transportadora', 'fleet_status_search')}
              emptyMessage={t('transportadora', 'fleet_status_empty')}
              pagination={true}
              pageSize={10}
              onRowClick={(row) => {
                console.log('🔵 [DEBUG] Table row clicked', row)
                try {
                  router.push(`/transportadora/veiculos?vehicleId=${row.id}`)
                } catch (err) {
                  console.error('❌ Router.push failed, using window.location:', err)
                  window.location.href = `/transportadora/veiculos?vehicleId=${row.id}`
                }
              }}
            />
          </div>

          {/* Atividades Recentes */}
          <RecentActivities activities={recentActivities} maxItems={5} />
        </div>
      </div>
    </AppShell>
  )
}
