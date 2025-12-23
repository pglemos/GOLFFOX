/**
 * Hooks customizados para dashboard administrativo
 * Usa React Query para cache e estado
 */

import { useMemo } from 'react'

import { useQuery } from '@tanstack/react-query'

import { getAdminKPIs, getAuditLogs, type AdminFilters } from '@/lib/api/admin-api'
import type { AuditLog } from '@/lib/api/admin-api'
import {
  calculateAggregatedKPIs,
  type KpiData,
  type AggregatedKPIs,
} from '@/lib/business/kpi-calculations'

/**
 * Hook para buscar KPIs do admin
 */
export function useAdminKPIs(filters: AdminFilters = {}) {
  return useQuery<KpiData[]>({
    queryKey: ['admin-kpis', filters],
    queryFn: async () => {
      const result = await getAdminKPIs(filters)
      if (!result.success) {
        throw new Error(result.error || 'Erro ao buscar KPIs')
      }
      return result.kpis || []
    },
    staleTime: 30 * 1000, // 30 segundos
  })
}

/**
 * Hook para buscar logs de auditoria
 */
export function useAuditLogs(filters: AdminFilters = {}) {
  return useQuery<AuditLog[]>({
    queryKey: ['audit-logs', filters],
    queryFn: async () => {
      const result = await getAuditLogs(filters)
      if (!result.success) {
        throw new Error(result.error || 'Erro ao buscar logs de auditoria')
      }
      return result.logs || []
    },
    staleTime: 30 * 1000, // 30 segundos
  })
}

/**
 * Hook para calcular KPIs agregados
 * Usa useMemo para recalcular apenas quando necessário
 */
export function useAggregatedKPIs(
  kpisData: KpiData[] | undefined,
  filters: AdminFilters = {}
): AggregatedKPIs | null {
  return useMemo(() => {
    if (!kpisData || kpisData.length === 0) {
      return null
    }

    return calculateAggregatedKPIs(kpisData, filters)
  }, [kpisData, filters.empresa])
}

