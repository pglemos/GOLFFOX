"use client"

import { useEffect, useState, useCallback } from "react"
import { AppShell } from "@/components/app-shell"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card"
import { supabase } from "@/lib/supabase"
import { useRouter } from "next/navigation"
import { OperatorKPICards } from "@/components/operator/operator-kpi-cards"
import { ControlTowerCards } from "@/components/operator/control-tower-cards"
import { useOperatorTenant } from "@/components/providers/operator-tenant-provider"
import { DashboardSkeleton } from "@/components/operator/dashboard-skeleton"
import { DashboardCharts } from "@/components/operator/dashboard-charts"
import { PeriodFilter, type PeriodFilter as PeriodFilterType } from "@/components/operator/period-filter"
import { useOperatorKPIs, useControlTower } from "@/hooks/use-operator-data"
import { useRealtimeKPIs, useRealtimeAlerts } from "@/hooks/use-realtime-updates"
import { t } from "@/lib/i18n"
import { KPICardEnhanced } from "@/components/operator/dashboard/kpi-card-enhanced"
import { ControlTowerVisual } from "@/components/operator/dashboard/control-tower-visual"
import { MapPin, Clock, AlertTriangle, TrendingUp, DollarSign, CheckCircle } from "lucide-react"

export default function OperatorDashboard() {
  const router = useRouter()

  // Limpar parâmetros indesejados da URL
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href)

      // Se tem parâmetro ?company=, redirecionar para URL limpa
      if (url.searchParams.has('company')) {
        console.log('⚠️ Removendo parâmetro ?company= da URL')
        router.replace('/operador')
        return
      }
    }
  }, [])
  const { tenantCompanyId, companyName, loading: tenantLoading, error: tenantError } = useOperatorTenant()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState<PeriodFilterType>("today")

  // Usar React Query para KPIs e Control Tower
  const { data: kpisData, isLoading: kpisLoading } = useOperatorKPIs(tenantCompanyId)
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

  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const getUser = async () => {
      try {
        // ✅ PRIMEIRO: Tentar obter do cookie de sessão customizado (mais rápido e confiável)
        if (typeof document !== 'undefined') {
          const cookieMatch = document.cookie.match(/golffox-session=([^;]+)/)
          if (cookieMatch) {
            try {
              const decoded = atob(cookieMatch[1])
              const userData = JSON.parse(decoded)
              if (userData?.id && userData?.email && userData?.role) {
                console.log('✅ Usuário obtido do cookie:', {
                  id: userData.id,
                  email: userData.email,
                  role: userData.role
                })
                setUser(userData)
                setLoading(false)
                return
              }
            } catch (cookieErr) {
              console.warn('⚠️ Erro ao decodificar cookie de sessão:', cookieErr)
            }
          }
        }

        // ✅ FALLBACK: Tentar obter sessão do Supabase Auth
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()
        if (sessionError) {
          console.error('Erro ao verificar sessão Supabase:', sessionError)
          // Não definir erro imediatamente - pode ser apenas falta de sessão Supabase
        }

        if (!session) {
          // Se não há sessão Supabase e não há cookie, redirecionar para login
          if (typeof document !== 'undefined' && !document.cookie.includes('golffox-session')) {
            console.log('⚠️ Sem sessão detectada, redirecionando para login')
            router.push("/")
            return
          }
          // Se há cookie mas não há sessão Supabase, continuar com cookie
          setLoading(false)
          return
        }

        // Buscar dados completos do usuário no banco
        const { data: userData, error: userError } = await supabase
          .from("users")
          .select("*")
          .eq("id", session.user.id)
          .maybeSingle()

        if (userError) {
          console.warn('⚠️ Erro ao buscar dados do usuário:', userError)
        }

        if (userData) {
          setUser({ ...session.user, ...userData })
        } else {
          setUser({ ...session.user })
        }
      } catch (err: any) {
        console.error('❌ Erro ao obter usuário:', err)
        // Não definir erro fatal - pode ser apenas problema temporário
        // A página pode funcionar mesmo sem dados completos do usuário
      } finally {
        setLoading(false)
      }
    }

    getUser()
  }, [router])

  // Removido - agora usando React Query hooks

  if (loading || tenantLoading || kpisLoading || controlTowerLoading) {
    return (
      <AppShell user={{ id: user?.id || "", name: user?.name || "Operador", email: user?.email || "", role: "operador", avatar_url: (user as any)?.avatar_url }}>
        <DashboardSkeleton />
      </AppShell>
    )
  }

  if (tenantError || error) {
    return (
      <AppShell user={{ id: user?.id || "", name: user?.name || "Operador", email: user?.email || "", role: "operador", avatar_url: (user as any)?.avatar_url }}>
        <div className="min-h-screen flex items-center justify-center p-4">
          <Card className="p-8 max-w-md w-full text-center">
            <h2 className="text-xl font-bold mb-2 text-red-600">Erro ao carregar</h2>
            <p className="text-gray-600 mb-4">{tenantError || error}</p>
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
      <AppShell user={{ id: user?.id || "", name: user?.name || "Operador", email: user?.email || "", role: "operador", avatar_url: (user as any)?.avatar_url }}>
        <div className="min-h-screen flex items-center justify-center p-4">
          <Card className="p-8 max-w-md w-full text-center">
            <h2 className="text-xl font-bold mb-2">Nenhuma empresa selecionada</h2>
            <p className="text-gray-600 mb-4">Aguarde enquanto carregamos suas empresas...</p>
            <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          </Card>
        </div>
      </AppShell>
    )
  }

  return (
    <AppShell user={{
      id: user?.id || "",
      name: user?.name || "Operador",
      email: user?.email || "",
      role: "operador",
      avatar_url: (user as any)?.avatar_url
    }}>
      <div className="space-y-4 sm:space-y-6 lg:space-y-8 w-full">
        {/* Filtros de Período */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
          <div className="flex-1 min-w-0">
            <h2 className="text-base sm:text-lg font-semibold text-[var(--ink-strong)]">{t('operator', 'kpi_title')}</h2>
            <p className="text-xs sm:text-sm text-[var(--ink-muted)] mt-1">{t('operator', 'kpi_subtitle')}</p>
          </div>
          <div className="w-full sm:w-auto">
            <PeriodFilter value={period} onChange={setPeriod} />
          </div>
        </div>

        {/* KPIs Premium */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          <KPICardEnhanced
            label={t('operator', 'kpi_trips_today')}
            value={kpis.trips_today}
            icon={MapPin}
            color="text-blue-600"
            bgColor="bg-blue-50"
            delay={0.1}
          />
          <KPICardEnhanced
            label={t('operator', 'kpi_in_progress')}
            value={kpis.trips_in_progress}
            icon={Clock}
            color="text-orange-600"
            bgColor="bg-orange-50"
            delay={0.2}
          />
          <KPICardEnhanced
            label={t('operator', 'kpi_done')}
            value={kpis.trips_completed}
            icon={CheckCircle}
            color="text-green-600"
            bgColor="bg-green-50"
            delay={0.3}
          />
          <KPICardEnhanced
            label={t('operator', 'kpi_delays')}
            value={kpis.delays_over_5min}
            icon={AlertTriangle}
            color="text-red-600"
            bgColor="bg-red-50"
            delay={0.4}
          />
          <KPICardEnhanced
            label={t('operator', 'kpi_occupancy')}
            value={`${(kpis.avg_occupancy * 100).toFixed(1)}%`}
            icon={TrendingUp}
            color="text-purple-600"
            bgColor="bg-purple-50"
            delay={0.5}
          />
          <KPICardEnhanced
            label={t('operator', 'kpi_sla_d0_company')}
            value={`${kpis.sla_d0.toFixed(1)}%`}
            icon={CheckCircle}
            color="text-indigo-600"
            bgColor="bg-indigo-50"
            subtitle="GOLF FOX → Operador"
            delay={0.6}
          />
          <KPICardEnhanced
            label={t('operator', 'kpi_daily_cost_company')}
            value={new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(kpis.daily_cost || 0)}
            icon={DollarSign}
            color="text-emerald-600"
            bgColor="bg-emerald-50"
            subtitle="Faturado GOLF FOX"
            delay={0.7}
          />
        </div>

        {/* Control Tower Visual */}
        <div>
          <div className="mb-4 sm:mb-6">
            <h2 className="text-lg sm:text-xl font-semibold text-[var(--ink-strong)] mb-1">{t('operator', 'control_tower_title')}</h2>
            <p className="text-xs sm:text-sm text-[var(--ink-muted)]">{t('operator', 'control_tower_subtitle')}</p>
          </div>
          <ControlTowerVisual
            delays={controlTower.delays}
            stoppedVehicles={controlTower.stoppedVehicles}
            routeDeviations={controlTower.routeDeviations}
            openAssistance={controlTower.openAssistance}
            labels={{
              delays: t('operator', 'control_tower_delays'),
              stopped: t('operator', 'control_tower_stopped'),
              deviations: t('operator', 'control_tower_deviations'),
              assistance: t('operator', 'control_tower_assistance')
            }}
          />
        </div>

        {/* Gráficos */}
        <div>
          <div className="mb-4 sm:mb-6">
            <h2 className="text-lg sm:text-xl font-semibold text-[var(--ink-strong)] mb-1">{t('operator', 'charts_title')}</h2>
            <p className="text-xs sm:text-sm text-[var(--ink-muted)]">{t('operator', 'charts_subtitle')}</p>
          </div>
          <DashboardCharts kpis={kpis} period={period as "today" | "week" | "month" | undefined} />
        </div>

        {/* Mapa Preview */}
        <div>
          <Card className="overflow-hidden">
            <CardHeader className="pb-4 px-3 sm:px-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0">
                <div className="flex-1 min-w-0 pr-2 sm:pr-4">
                  <CardTitle className="text-lg sm:text-xl font-semibold mb-1.5">{t('operator', 'map_title')}</CardTitle>
                  <p className="text-xs sm:text-sm text-[var(--ink-muted)]">{t('operator', 'map_subtitle')}</p>
                </div>
                <Button variant="outline" size="sm" className="w-full sm:w-auto min-h-[44px] touch-manipulation" onClick={() => router.push("/operador/rotas/mapa")}>
                  <MapPin className="h-4 w-4 mr-2" />
                  {t('operator', 'actions.view_map')}
                </Button>
              </div>
            </CardHeader>
            <CardContent className="pt-0 px-3 sm:px-6">
              <div className="h-40 sm:h-48 bg-gradient-to-br from-orange-500/10 to-orange-600/10 rounded-lg flex items-center justify-center border border-orange-200/50">
                <MapPin className="h-10 w-10 sm:h-12 sm:w-12 text-orange-500 opacity-40" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppShell>
  )
}
