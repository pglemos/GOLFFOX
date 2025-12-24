"use client"

import { useEffect, useState } from "react"

import { MapPin, Clock, AlertTriangle, TrendingUp, DollarSign, CheckCircle, ArrowUpRight, ArrowDownRight, Minus } from "lucide-react"

import { AppShell } from "@/components/app-shell"
import { ControlTowerCards } from "@/components/empresa/control-tower-cards"
import { ControlTowerVisual } from "@/components/empresa/dashboard/control-tower-visual"
import { RecentAlertsCard } from "@/components/empresa/dashboard/recent-alerts-card"
import { DashboardCharts } from "@/components/empresa/dashboard-charts"
import { DashboardSkeleton } from "@/components/empresa/dashboard-skeleton"
import { PeriodFilter, type PeriodFilter as PeriodFilterType } from "@/components/empresa/period-filter"
import { KpiCard } from "@/components/kpi-card"
import { useAuth } from "@/components/providers/auth-provider"
import { useEmpresaTenant } from "@/components/providers/empresa-tenant-provider"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card"
import { useRouter } from "@/lib/next-navigation"

import { useEmpresaKPIs, useControlTower } from "@/hooks/use-empresa-data"
import { useRealtimeKPIs, useRealtimeAlerts } from "@/hooks/use-realtime-updates"
import { useMobile } from "@/hooks/use-mobile"
import { cn } from "@/lib/utils"
import { ResponsiveChart } from "@/components/shared/responsive-chart"
import { debug } from "@/lib/logger"

export default function EmpresaDashboard() {
  const router = useRouter()
  const isMobile = useMobile()

  // Limpar parâmetros indesejados da URL
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href)

      // Se tem parâmetro ?company=, redirecionar para URL limpa
      if (url.searchParams.has('company')) {
        debug('Removendo parâmetro ?company= da URL', {}, 'EmpresaDashboard')
        router.replace('/empresa')
        return
      }
    }
  }, [router])
  const { tenantCompanyId, companyName, loading: tenantLoading, error: tenantError } = useEmpresaTenant()
  const { user, loading } = useAuth()
  const [period, setPeriod] = useState<PeriodFilterType>("today")

  // Usar React Query para KPIs e Control Tower
  const { data: kpisData, isLoading: kpisLoading } = useEmpresaKPIs(tenantCompanyId)
  const { data: controlTowerData, isLoading: controlTowerLoading } = useControlTower(tenantCompanyId)

  // Atualização em tempo real
  useRealtimeKPIs(tenantCompanyId)
  useRealtimeAlerts(tenantCompanyId)

  const kpis = kpisData || {
    trips_today: 0,
    trips_in_progress: 0,
    trips_completed: 0,
    delays_over_5min: 0,
    avg_occupancy: 0,
    daily_cost: 0,
    sla_d0: 0
  }

  const controlTower = controlTowerData || {
    delays: 0,
    stoppedVehicles: 0,
    routeDeviations: 0,
    openAssistance: 0
  }

  // Redirecionar para login se não autenticado
  useEffect(() => {
    if (!loading && !user) {
      router.push("/")
    }
  }, [loading, user, router])

  // Removido - agora usando React Query hooks

  if (loading || tenantLoading || kpisLoading || controlTowerLoading) {
    return (
      <AppShell user={{ id: user?.id || "", name: user?.name || "Gestor da Empresa", email: user?.email || "", role: user?.role || "gestor_empresa", avatar_url: user?.avatar_url }}>
        <DashboardSkeleton />
      </AppShell>
    )
  }

  if (tenantError) {
    return (
      <AppShell user={{ id: user?.id || "", name: user?.name || "Gestor da Empresa", email: user?.email || "", role: user?.role || "gestor_empresa", avatar_url: user?.avatar_url }}>
        <div className="min-h-screen flex items-center justify-center p-4">
          <Card className="p-8 max-w-md w-full text-center">
            <h2 className="text-xl font-bold mb-2 text-error">Erro ao carregar</h2>
            <p className="text-ink-muted mb-4">{tenantError || 'Erro desconhecido'}</p>
            <Button onClick={() => window.location.reload()} variant="default">
              Tentar Novamente
            </Button>
          </Card>
        </div>
      </AppShell>
    )
  }

  if (!tenantCompanyId) {
    return (
      <AppShell user={{ id: user?.id || "", name: user?.name || "Gestor da Empresa", email: user?.email || "", role: user?.role || "gestor_empresa", avatar_url: user?.avatar_url }}>
        <div className="min-h-screen flex items-center justify-center p-4">
          <Card className="p-8 max-w-md w-full text-center">
            <h2 className="text-xl font-bold mb-2">Nenhuma empresa selecionada</h2>
            <p className="text-ink-muted mb-4">Aguarde enquanto carregamos suas empresas...</p>
            <div className="w-8 h-8 border-2 border-brand border-t-transparent rounded-full animate-spin mx-auto"></div>
          </Card>
        </div>
      </AppShell>
    )
  }

  return (
    <AppShell user={{
      id: user?.id || "",
      name: user?.name || "Empresa",
      email: user?.email || "",
      role: user?.role || "empresa",
      avatar_url: user?.avatar_url
    }}>
      <div className="space-y-4 sm:space-y-6 lg:space-y-8 w-full">
        {/* Filtros de Período */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
          <div className="flex-1 min-w-0">
            <h2 className="text-base sm:text-lg font-semibold text-text-ink-strong">Indicadores de Performance</h2>
            <p className="text-xs sm:text-sm text-ink-muted mt-1">Métricas principais da sua operação</p>
          </div>
          <div className="w-full sm:w-auto">
            <PeriodFilter value={period} onChange={setPeriod} />
          </div>
        </div>

        {/* KPIs Premium - Mobile: 1 col, Tablet: 2 cols, Desktop: 3-4 cols */}
        <div className={cn(
          "grid gap-4",
          isMobile ? "grid-cols-1" : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
        )}>
          <KpiCard
            label="Viagens Hoje"
            value={kpis.trips_today.toString()}
            icon={MapPin}
          />
          <KpiCard
            label="Em Andamento"
            value={kpis.trips_in_progress.toString()}
            icon={Clock}
          />
          <KpiCard
            label="Concluídas"
            value={kpis.trips_completed.toString()}
            icon={CheckCircle}
          />
          <KpiCard
            label="Atrasos > 5min"
            value={kpis.delays_over_5min.toString()}
            icon={AlertTriangle}
          />
          <KpiCard
            label="Ocupação Média"
            value={`${(kpis.avg_occupancy * 100).toFixed(1)}%`}
            icon={TrendingUp}
          />
          <KpiCard
            label="SLA D+0"
            value={`${kpis.sla_d0.toFixed(1)}%`}
            icon={CheckCircle}
            hint="GOLF FOX → Empresa"
          />
          <KpiCard
            label="Custo Diário"
            value={new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(kpis.daily_cost || 0)}
            icon={DollarSign}
            hint="Faturado GOLF FOX"
          />
        </div>

        {/* Control Tower Visual */}
        <div>
          <div className="mb-4 sm:mb-6">
            <h2 className="text-lg sm:text-xl font-semibold text-text-ink-strong mb-1">Torre de Controle</h2>
            <p className="text-xs sm:text-sm text-ink-muted">Monitoramento em tempo real de incidentes</p>
          </div>
          <ControlTowerVisual
            delays={controlTower.delays}
            stoppedVehicles={controlTower.stoppedVehicles}
            routeDeviations={controlTower.routeDeviations}
            openAssistance={controlTower.openAssistance}
            labels={{
              delays: "Atrasos",
              stopped: "Veículos Parados",
              deviations: "Desvios de Rota",
              assistance: "Socorros Abertos"
            }}
          />
        </div>

        {/* Gráficos */}
        <div>
          <div className="mb-4 sm:mb-6">
            <h2 className="text-lg sm:text-xl font-semibold text-text-ink-strong mb-1">Análises e Gráficos</h2>
            <p className="text-xs sm:text-sm text-ink-muted">Visualizações detalhadas do desempenho</p>
          </div>
          <DashboardCharts kpis={kpis} period={period as "today" | "week" | "month" | undefined} />
        </div>

        {/* Alertas e Mapa */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          <RecentAlertsCard companyId={tenantCompanyId} />

          <Card className="overflow-hidden bg-white/50 backdrop-blur-sm border-brand-light/50">
            <CardHeader className="pb-4 px-3 sm:px-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0">
                <div className="flex-1 min-w-0 pr-2 sm:pr-4">
                  <CardTitle className="text-lg sm:text-xl font-semibold mb-1.5">Mapa em Tempo Real</CardTitle>
                  <p className="text-xs sm:text-sm text-ink-muted">Visualize todas as rotas ativas no mapa</p>
                </div>
                <Button variant="outline" size="sm" className="w-full sm:w-auto min-h-[44px] touch-manipulation" onClick={() => router.push("/empresa/rotas/mapa")}>
                  <MapPin className="h-4 w-4 mr-2" />
                  Ver no Mapa
                </Button>
              </div>
            </CardHeader>
            <CardContent className="pt-0 px-3 sm:px-6">
              <div className={cn(
                "bg-gradient-to-br from-brand/10 to-brand-hover/10 rounded-lg flex items-center justify-center border border-brand-soft/50",
                isMobile ? "h-48" : "h-64" // Aumentado para alinhar com lista de alertas
              )}>
                <MapPin className="h-10 w-10 sm:h-12 sm:w-12 text-brand opacity-40" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppShell>
  )
}
