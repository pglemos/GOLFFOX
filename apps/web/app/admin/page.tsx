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
} from "lucide-react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { useAuthFast } from "@/hooks/use-auth-fast"
import { DashboardKPIs } from "@/components/admin/dashboard/dashboard-kpis"
import { DashboardAuditLog } from "@/components/admin/dashboard/dashboard-audit-log"

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
                <div className="h-12 w-12 rounded-lg bg-[var(--bg-hover)] animate-pulse" />
                <div className="space-y-2">
                  <div className="h-4 w-24 bg-[var(--bg-hover)] rounded animate-pulse" />
                  <div className="h-8 w-16 bg-[var(--bg-hover)] rounded animate-pulse" />
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
        {/* Filtros */}
        <Card className="overflow-hidden">
          <CardHeader className="pb-4 px-3 sm:px-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0">
              <div className="flex items-center gap-2">
                <Filter className="h-5 w-5 text-[var(--brand)] flex-shrink-0" />
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
                  <label className="block text-sm font-medium text-[var(--ink-strong)]">Empresa</label>
                  <Input
                    placeholder="Todas as empresas"
                    value={tempFilters.empresa}
                    onChange={(e) => setTempFilters({ ...tempFilters, empresa: e.target.value })}
                    className="w-full min-h-[44px]"
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-[var(--ink-strong)]">Data</label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--ink-muted)] pointer-events-none z-10" />
                    <Input
                      type="date"
                      value={tempFilters.data}
                      onChange={(e) => setTempFilters({ ...tempFilters, data: e.target.value })}
                      className="pl-10 w-full min-h-[44px]"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-[var(--ink-strong)]">Turno</label>
                  <select
                    className="w-full min-h-[44px] px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--bg-soft)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--brand)] focus:ring-opacity-20 transition-all touch-manipulation"
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
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-2 sm:gap-2 pt-4 border-t border-[var(--border)]">
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

        {/* KPIs */}
        <DashboardKPIs kpis={aggregatedKpis} />

        {/* Cards de Ação Rápida */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 lg:gap-6">
          {/* Mapa da Frota Preview */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5 }}
          >
            <a href="/admin/mapa" className="block h-full">
              <Card glass hover className="cursor-pointer h-full overflow-hidden">
                <CardHeader className="pb-4 px-3 sm:px-6">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0 pr-2 sm:pr-4">
                      <CardTitle className="text-lg sm:text-xl font-semibold mb-1.5 truncate">Mapa da Frota</CardTitle>
                      <p className="text-xs sm:text-sm text-[var(--ink-muted)] line-clamp-2">Visualize veículos em tempo real</p>
                    </div>
                    <motion.div 
                      className="p-2.5 sm:p-3 rounded-xl bg-gradient-to-br from-[var(--brand-light)] to-[var(--brand-soft)] group-hover:from-[var(--brand)] group-hover:to-[var(--brand-hover)] transition-all duration-300 flex-shrink-0 shadow-md group-hover:shadow-[var(--shadow-brand-lg)] relative overflow-hidden"
                      whileHover={{ scale: 1.1, rotate: [0, -5, 5, 0] }}
                      transition={{ type: "spring", stiffness: 400, damping: 17 }}
                    >
                      <motion.div
                        className="absolute inset-0 bg-gradient-to-br from-white/30 via-white/10 to-transparent opacity-0 group-hover:opacity-100"
                        transition={{ duration: 0.3 }}
                      />
                      <MapPin className="h-4 w-4 sm:h-5 sm:w-5 text-[var(--brand)] group-hover:text-white transition-all duration-300 relative z-10 drop-shadow-sm" />
                    </motion.div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0 px-3 sm:px-6">
                  <motion.div 
                    className="h-40 bg-gradient-to-br from-[var(--brand)]/10 via-[var(--brand)]/5 to-[var(--accent)]/10 rounded-xl flex items-center justify-center group-hover:from-[var(--brand)]/25 group-hover:via-[var(--brand)]/15 group-hover:to-[var(--accent)]/25 transition-all duration-500 overflow-hidden relative"
                    whileHover={{ scale: 1.02 }}
                  >
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-br from-[var(--brand)]/20 to-transparent opacity-0 group-hover:opacity-100"
                      transition={{ duration: 0.5 }}
                    />
                    <MapPin className="h-16 w-16 text-[var(--brand)] opacity-30 group-hover:opacity-70 transition-all duration-500 relative z-10 drop-shadow-lg" />
                  </motion.div>
                </CardContent>
              </Card>
            </a>
          </motion.div>

          {/* Notificações Recentes */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.6 }}
          >
            <Card className="h-full overflow-hidden">
              <CardHeader className="pb-4 px-3 sm:px-6">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0 pr-2 sm:pr-4">
                    <CardTitle className="text-lg sm:text-xl font-semibold mb-1.5 truncate">Notificações Recentes</CardTitle>
                    <p className="text-xs sm:text-sm text-[var(--ink-muted)] line-clamp-2">Últimas atualizações do sistema</p>
                  </div>
                  <Button variant="ghost" size="sm" className="flex-shrink-0 min-h-[44px] min-w-[44px] touch-manipulation" asChild>
                    <a href="/admin/alertas">
                      <ArrowUpRight className="h-4 w-4" />
                    </a>
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="pt-0 px-3 sm:px-6">
                <div className="space-y-2">
                  {[1, 2, 3].map((i) => (
                    <motion.div 
                      key={i} 
                      className="flex items-center gap-3 p-3.5 rounded-xl hover:bg-gradient-to-r hover:from-[var(--bg-hover)] hover:to-[var(--bg-soft)] transition-all duration-300 border border-transparent hover:border-[var(--border)] hover:shadow-sm group/alert"
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.6 + i * 0.1 }}
                      whileHover={{ x: 4, scale: 1.02 }}
                    >
                      <motion.div 
                        className="w-2.5 h-2.5 rounded-full bg-gradient-to-br from-[var(--brand)] to-[var(--brand-hover)] shadow-[var(--shadow-brand)] flex-shrink-0"
                        animate={{ 
                          scale: [1, 1.3, 1],
                          opacity: [1, 0.7, 1]
                        }}
                        transition={{ 
                          duration: 2,
                          repeat: Infinity,
                          ease: "easeInOut"
                        }}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-[var(--ink-strong)] truncate group-hover:text-[var(--brand)] transition-colors">Alerta #{i}</p>
                        <p className="text-xs text-[var(--ink-muted)] truncate">Há {i} minutos</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Atividades Recentes */}
        <DashboardAuditLog logs={auditLogs} loading={activitiesLoading} />
      </div>
    </AppShell>
  )
}
