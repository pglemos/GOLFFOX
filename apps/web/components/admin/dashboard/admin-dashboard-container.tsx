/**
 * Componente Container para dashboard administrativo
 * Gerencia lógica de negócio e estado
 */

"use client"

import { useState, useEffect } from "react"

import { useAdminKPIs, useAuditLogs, useAggregatedKPIs } from "@/hooks/use-admin-dashboard"
import type { AdminFilters } from "@/lib/api/admin-api"

import { AdminDashboardPresentational } from "./admin-dashboard-presentational"

export interface AdminDashboardContainerProps {
  initialKpis?: any[]
  initialAuditLogs?: any[]
}

export function AdminDashboardContainer({
  initialKpis = [],
  initialAuditLogs = [],
}: AdminDashboardContainerProps) {
  const [filters, setFilters] = useState<AdminFilters>({
    empresa: '',
    data: new Date().toISOString().split('T')[0],
    turno: ''
  })

  // Usar hooks para buscar dados
  const { data: kpisData = initialKpis, isLoading: kpisLoading } = useAdminKPIs(filters)
  const { data: auditLogs = initialAuditLogs, isLoading: activitiesLoading } = useAuditLogs(filters)

  // Calcular KPIs agregados
  const aggregatedKpis = useAggregatedKPIs(kpisData, filters)

  const handleFiltersChange = (newFilters: AdminFilters) => {
    setFilters(newFilters)
  }

  return (
    <AdminDashboardPresentational
      aggregatedKpis={aggregatedKpis}
      auditLogs={auditLogs}
      filters={filters}
      kpisLoading={kpisLoading}
      activitiesLoading={activitiesLoading}
      onFiltersChange={handleFiltersChange}
    />
  )
}

