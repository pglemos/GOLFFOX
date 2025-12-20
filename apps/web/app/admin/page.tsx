"use client"

import { useEffect, useState, useMemo } from "react"
import { AppShell } from "@/components/app-shell"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  ArrowUpRight,
  MapPin,
  Filter,
  Calendar,
  ChevronDown,
  ChevronUp,
  Save,
  X,
  Users,
  Truck,
  Navigation,
  AlertCircle,
  TrendingUp,
  Gauge,
} from "lucide-react"
import { useRouter } from "@/lib/next-navigation"
import { motion } from "framer-motion"
import { useAuthFast } from "@/hooks/use-auth-fast"
import { DashboardKPIs } from "@/components/admin/dashboard/dashboard-kpis"
import { DashboardAuditLog } from "@/components/admin/dashboard/dashboard-audit-log"
import { KpiCard } from "@/components/kpi-card"
import { QuickActionsGrid } from "@/components/admin/dashboard/quick-actions-grid"
import { ActivityTimeline } from "@/components/admin/dashboard/activity-timeline"
import { useMobile } from "@/hooks/use-mobile"
import { cn } from "@/lib/utils"
import { FilterDrawer } from "@/components/shared/filter-drawer"

interface KpiData {
  company_id: string
  company_name: string
  trips_today: number
  vehicles_active: number
  employees_in_transit: number
  critical_alerts: number
  routes_today: number
  trips_completed: number
  trips_in_progress: number
}

interface AuditLog {
  id: string
  actor_id: string | null
  action_type: string
  resource_type: string | null
  resource_id: string | null
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  details: any
  created_at: string
}

export default function AdminDashboard() {
  // const router = useRouter() // Não usado por enquanto
  const isMobile = useMobile() // Hook mobile-first
  const { user, loading } = useAuthFast()
  const [kpisData, setKpisData] = useState<KpiData[]>([])
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([])
  const [kpisLoading, setKpisLoading] = useState(true)
  const [activitiesLoading, setActivitiesLoading] = useState(true)
  const [filtersExpanded, setFiltersExpanded] = useState(false)
  const [tempFilters, setTempFilters] = useState({
    empresa: '',
    data: new Date().toISOString().split('T')[0],
    turno: ''
  })
  const [filters, setFilters] = useState({
    empresa: '',
    data: new Date().toISOString().split('T')[0],
    turno: ''
  })

  const handleSaveFilters = () => {
    setFilters(tempFilters)
    setFiltersExpanded(false)
  }

  const handleResetFilters = () => {
    const resetFilters = {
      empresa: '',
      data: new Date().toISOString().split('T')[0],
      turno: ''
    }
    setTempFilters(resetFilters)
    setFilters(resetFilters)
    setFiltersExpanded(false)
  }

  // Memoizar cálculo de KPIs agregados e métricas adicionais
  const aggregatedKpis = useMemo(() => {
    const base = kpisData.reduce((acc, kpi) => {
      if (filters.empresa && kpi.company_id !== filters.empresa) return acc
      return {
        trips_today: acc.trips_today + (kpi.trips_today || 0),
        vehicles_active: acc.vehicles_active + (kpi.vehicles_active || 0),
        employees_in_transit: acc.employees_in_transit + (kpi.employees_in_transit || 0),
        critical_alerts: acc.critical_alerts + (kpi.critical_alerts || 0),
        routes_today: acc.routes_today + (kpi.routes_today || 0),
        trips_completed: acc.trips_completed + (kpi.trips_completed || 0),
        trips_in_progress: acc.trips_in_progress + (kpi.trips_in_progress || 0),
      }
    }, {
      trips_today: 0,
      vehicles_active: 0,
      employees_in_transit: 0,
      critical_alerts: 0,
      routes_today: 0,
      trips_completed: 0,
      trips_in_progress: 0,
    })

    // Calcular métricas derivadas
    const routeEfficiency = base.routes_today > 0
      ? Math.round((base.trips_completed / base.routes_today) * 100)
      : 0

    const systemHealth = base.critical_alerts === 0
      ? 100
      : Math.max(0, 100 - (base.critical_alerts * 10))

    return {
      ...base,
      routeEfficiency,
      systemHealth,
    }
  }, [kpisData, filters.empresa])

  // Buscar KPIs da view (ou materialized view se disponível)
  useEffect(() => {
    const loadKpis = async () => {
      try {
        setKpisLoading(true)
        // Usar API route para bypass RLS
        const response = await fetch('/api/admin/kpis', {
          credentials: 'include'
        })
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }
        const result = await response.json()
        if (result.success) {
          // Se não houver dados, tentar mapear de views alternativas
          if (result.kpis && result.kpis.length > 0) {
            setKpisData(result.kpis)
          } else {
            // Fallback: dados vazios
            setKpisData([])
          }
        } else {
          setKpisData([])
        }
      } catch (err: unknown) {
        console.error('Erro ao carregar KPIs:', err)
        setKpisData([])
      } finally {
        setKpisLoading(false)
      }
    }

    if (!loading) {
      loadKpis()
    }
  }, [loading, filters.empresa])

  // Buscar atividades recentes (gf_audit_log)
  useEffect(() => {
    const loadActivities = async () => {
      try {
        setActivitiesLoading(true)
        // Usar API route para bypass RLS
        const response = await fetch('/api/admin/audit-log?limit=50', {
          credentials: 'include'
        })
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }
        const result = await response.json()
        if (result.success) {
          setAuditLogs(result.logs || [])
        } else {
          setAuditLogs([])
        }
      } catch (error) {
        console.error('Erro ao carregar atividades:', error)
        setAuditLogs([])
      } finally {
        setActivitiesLoading(false)
      }
    }

    if (!loading) {
      loadActivities()
    }
  }, [loading])

  // useAuthFast já cuida da autenticação

  if (loading || kpisLoading) {
    return (
      <AppShell user={{
        id: user?.id || "",
        name: user?.name || "Admin",
        email: user?.email || "",
        role: user?.role || "admin",
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        avatar_url: (user as any)?.avatar_url
      }}>
        <div className="space-y-6 lg:space-y-8">
          <div className="grid-responsive-cards">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="stat-card p-6 space-y-3">
                <div className="h-12 w-12 rounded-lg bg-bg-hover animate-pulse" />
                <div className="space-y-2">
                  <div className="h-4 w-24 bg-bg-hover rounded animate-pulse" />
                  <div className="h-8 w-16 bg-bg-hover rounded animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </AppShell>
    )
  }

  if (!user) {
    // router.replace('/?next=/admin') // useAuthFast já cuida do redirect
    return null
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if ((user as any).role && (user as any).role !== 'admin') {
    // router.replace('/unauthorized') // useAuthFast já cuida do redirect
    return null
  }

  return (
    <AppShell user={{
      id: user.id || "",
      name: user.name || "Admin",
      email: user.email || "",
      role: user.role || "admin",
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      avatar_url: (user as any).avatar_url
    }}>
      <div className="space-y-4 sm:space-y-6 lg:space-y-8 animate-fade-in w-full">
        {/* Filtros - Mobile: Drawer, Desktop: Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          {isMobile ? (
            <FilterDrawer
              filters={[
                {
                  key: "empresa",
                  label: "Empresa",
                  type: "text",
                  placeholder: "Todas as empresas"
                },
                {
                  key: "data",
                  label: "Data",
                  type: "date"
                },
                {
                  key: "turno",
                  label: "Turno",
                  type: "select",
                  options: [
                    { label: "Manhã", value: "manha" },
                    { label: "Tarde", value: "tarde" },
                    { label: "Noite", value: "noite" }
                  ]
                }
              ]}
              values={{
                empresa: tempFilters.empresa,
                data: tempFilters.data,
                turno: tempFilters.turno
              }}
              onFilterChange={(key, value) => {
                setTempFilters({ ...tempFilters, [key]: value })
              }}
              onReset={handleResetFilters}
              title="Filtros"
              description="Filtre os dados do dashboard"
            />
          ) : (
            <Card className="bg-card/50 backdrop-blur-sm border-border hover:shadow-xl transition-all duration-300">
              <CardHeader className="pb-4 px-3 sm:px-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0">
                  <div className="flex items-center gap-2">
                    <Filter className="h-5 w-5 text-brand flex-shrink-0" />
                    <CardTitle className="text-base sm:text-lg font-semibold">Filtros</CardTitle>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setFiltersExpanded(!filtersExpanded)}
                    className="gap-2 w-full sm:w-auto min-h-[44px] touch-manipulation"
                  >
                    {filtersExpanded ? (
                      <>
                        <ChevronUp className="h-4 w-4" />
                        <span className="hidden sm:inline">Minimizar</span>
                        <span className="sm:hidden">Fechar</span>
                      </>
                    ) : (
                      <>
                        <ChevronDown className="h-4 w-4" />
                        <span className="hidden sm:inline">Expandir</span>
                        <span className="sm:hidden">Abrir</span>
                      </>
                    )}
                  </Button>
                </div>
              </CardHeader>
              {filtersExpanded && (
                <CardContent className="pt-0 px-3 sm:px-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4 mb-4">
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-text-ink-strong">Empresa</label>
                      <Input
                        placeholder="Todas as empresas"
                        value={tempFilters.empresa}
                        onChange={(e) => setTempFilters({ ...tempFilters, empresa: e.target.value })}
                        className="w-full min-h-[44px]"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-text-ink-strong">Data</label>
                      <div className="relative">
                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-muted pointer-events-none z-10" />
                        <Input
                          type="date"
                          value={tempFilters.data}
                          onChange={(e) => setTempFilters({ ...tempFilters, data: e.target.value })}
                          className="pl-10 w-full min-h-[44px]"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-text-ink-strong">Turno</label>
                      <select
                        className="w-full min-h-[44px] px-3 py-2 rounded-lg border border-border bg-bg-soft text-sm focus:outline-none focus:ring-2 focus:ring-text-brand focus:ring-opacity-20 transition-all touch-manipulation"
                        value={tempFilters.turno}
                        onChange={(e) => setTempFilters({ ...tempFilters, turno: e.target.value })}
                      >
                        <option value="">Todos os turnos</option>
                        <option value="manha">Manhã</option>
                        <option value="tarde">Tarde</option>
                        <option value="noite">Noite</option>
                      </select>
                    </div>
                  </div>
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-2 sm:gap-2 pt-4 border-t border-border">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleResetFilters}
                      className="gap-2 w-full sm:w-auto min-h-[44px] touch-manipulation"
                    >
                      <X className="h-4 w-4" />
                      Limpar
                    </Button>
                    <Button
                      size="sm"
                      onClick={handleSaveFilters}
                      className="gap-2 w-full sm:w-auto min-h-[44px] touch-manipulation"
                    >
                      <Save className="h-4 w-4" />
                      Salvar Filtros
                    </Button>
                  </div>
                </CardContent>
              )}
            </Card>
          )}
        </motion.div>

        {/* KPIs Premium - Mobile: 1 coluna, Tablet: 2 colunas, Desktop: 3 colunas */}
        <div className={cn(
          "grid gap-4",
          isMobile ? "grid-cols-1" : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 sm:gap-5 lg:gap-6"
        )}>
          <KpiCard
            icon={Users}
            label="Funcionários em Trânsito"
            value={aggregatedKpis.employees_in_transit.toString()}
            hint="Ativos agora"
          />
          <KpiCard
            icon={Truck}
            label="Veículos Ativos"
            value={aggregatedKpis.vehicles_active.toString()}
            hint="Em rota"
          />
          <KpiCard
            icon={Navigation}
            label="Rotas Hoje"
            value={aggregatedKpis.routes_today.toString()}
            hint="Hoje"
          />
          <KpiCard
            icon={AlertCircle}
            label="Alertas Críticos"
            value={aggregatedKpis.critical_alerts.toString()}
            hint="Atenção necessária"
          />
          <KpiCard
            icon={TrendingUp}
            label="Eficiência de Rotas"
            value={`${aggregatedKpis.routeEfficiency}%`}
            hint="Taxa de conclusão"
          />
          <KpiCard
            icon={Gauge}
            label="Saúde do Sistema"
            value={`${aggregatedKpis.systemHealth}%`}
            hint={aggregatedKpis.systemHealth >= 80 ? "Excelente" : aggregatedKpis.systemHealth >= 60 ? "Bom" : "Atenção"}
          />
        </div>

        {/* Cards de Ação Rápida */}
        <QuickActionsGrid
          actions={[
            {
              title: "Mapa da Frota",
              description: "Visualize veículos em tempo real",
              icon: MapPin,
              href: "/admin/mapa",
              gradient: "from-text-brand to-brand-hover",
              bgGradient: "from-text-brand/10 to-brand-hover/5",
            },
            {
              title: "Alertas e Notificações",
              description: "Últimas atualizações do sistema",
              icon: AlertCircle,
              href: "/admin/alertas",
              gradient: "from-red-500 to-orange-500",
              bgGradient: "from-red-500/10 to-orange-500/5",
            },
          ]}
        />

        {/* Atividades Recentes */}
        <ActivityTimeline
          activities={auditLogs}
          loading={activitiesLoading}
          onViewAll={() => window.location.href = '/admin/alertas'}
        />
      </div>
    </AppShell>
  )
}
