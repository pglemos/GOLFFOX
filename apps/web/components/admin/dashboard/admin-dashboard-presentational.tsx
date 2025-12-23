/**
 * Componente Presentational para dashboard administrativo
 * Apenas renderiza UI, sem lógica de negócio
 */

import { motion } from "framer-motion"
import { Users, Truck, Navigation, AlertCircle, TrendingUp, Gauge, MapPin } from "lucide-react"

import { ActivityTimeline } from "@/components/admin/dashboard/activity-timeline"
import { QuickActionsGrid } from "@/components/admin/dashboard/quick-actions-grid"
import { KpiCard } from "@/components/kpi-card"
import { useMobile } from "@/hooks/use-mobile"
import type { AuditLog } from "@/lib/api/admin-api"
import type { AggregatedKPIs } from "@/lib/business/kpi-calculations"
import { cn } from "@/lib/utils"

import { AdminFilters } from "./admin-filters"



export interface AdminFilters {
  empresa?: string
  data?: string
  turno?: string
}

export interface AdminDashboardPresentationalProps {
  aggregatedKpis: AggregatedKPIs | null
  auditLogs: AuditLog[]
  filters: AdminFilters
  kpisLoading: boolean
  activitiesLoading: boolean
  onFiltersChange: (filters: AdminFilters) => void
}

export function AdminDashboardPresentational({
  aggregatedKpis,
  auditLogs,
  filters,
  kpisLoading,
  activitiesLoading,
  onFiltersChange,
}: AdminDashboardPresentationalProps) {
  const isMobile = useMobile()

  if (!aggregatedKpis) {
    return (
      <div className="space-y-4 sm:space-y-6 lg:space-y-8 animate-fade-in w-full">
        <div className="text-center py-12">
          <p className="text-muted-foreground">Carregando dados...</p>
        </div>
      </div>
    )
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
          onFiltersChange={onFiltersChange}
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

