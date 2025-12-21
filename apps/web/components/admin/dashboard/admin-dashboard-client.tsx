"use client"

import { useState, useMemo, useEffect } from "react"
import { motion } from "framer-motion"
import { useMobile } from "@/hooks/use-mobile"
import { cn } from "@/lib/utils"
import { KpiCard } from "@/components/kpi-card"
import { QuickActionsGrid } from "@/components/admin/dashboard/quick-actions-grid"
import { ActivityTimeline } from "@/components/admin/dashboard/activity-timeline"
import { AdminFilters } from "./admin-filters"
import { Users, Truck, Navigation, AlertCircle, TrendingUp, Gauge, MapPin } from "lucide-react"

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
  details: any
  created_at: string
}

interface AdminDashboardClientProps {
  initialKpis: KpiData[]
  initialAuditLogs: AuditLog[]
}

export function AdminDashboardClient({ initialKpis, initialAuditLogs }: AdminDashboardClientProps) {
  const isMobile = useMobile()
  const [kpisData, setKpisData] = useState<KpiData[]>(initialKpis)
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(initialAuditLogs)
  const [kpisLoading, setKpisLoading] = useState(initialKpis.length === 0)
  const [activitiesLoading, setActivitiesLoading] = useState(false)
  const [filters, setFilters] = useState({
    empresa: '',
    data: new Date().toISOString().split('T')[0],
    turno: ''
  })

  // ✅ CORREÇÃO: Carregar KPIs via API se initialKpis vier vazio (fallback)
  useEffect(() => {
    if (initialKpis.length === 0) {
      console.log('[AdminDashboard] initialKpis vazio, carregando via API...')
      loadKpisFromApi()
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const loadKpisFromApi = async () => {
    setKpisLoading(true)
    try {
      const response = await fetch('/api/admin/kpis', {
        credentials: 'include'
      })
      if (response.ok) {
        const result = await response.json()
        if (result.success && result.kpis) {
          setKpisData(result.kpis)
          console.log('[AdminDashboard] KPIs carregados via API:', result.kpis)
        }
      }
    } catch (err) {
      console.error('[AdminDashboard] Erro ao carregar KPIs via API:', err)
    } finally {
      setKpisLoading(false)
    }
  }

  // Memoizar cálculo de KPIs agregados
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

  const handleFiltersChange = async (newFilters: typeof filters) => {
    setFilters(newFilters)
    // Recarregar dados quando filtros mudarem
    setKpisLoading(true)
    try {
      const response = await fetch('/api/admin/kpis', {
        credentials: 'include'
      })
      if (response.ok) {
        const result = await response.json()
        if (result.success) {
          setKpisData(result.kpis || [])
        }
      }
    } catch (err) {
      console.error('Erro ao recarregar KPIs:', err)
    } finally {
      setKpisLoading(false)
    }
  }

  return (
    <div className="space-y-4 sm:space-y-6 lg:space-y-8 animate-fade-in w-full">
      {/* Filtros */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <AdminFilters
          initialFilters={filters}
          onFiltersChange={handleFiltersChange}
        />
      </motion.div>

      {/* KPIs Premium */}
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
            gradient: "from-brand to-brand-hover",
            bgGradient: "from-brand/10 to-brand-hover/5",
          },
          {
            title: "Alertas e Notificações",
            description: "Últimas atualizações do sistema",
            icon: AlertCircle,
            href: "/admin/alertas",
            gradient: "from-error to-brand",
            bgGradient: "from-error/10 to-brand/5",
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
  )
}

