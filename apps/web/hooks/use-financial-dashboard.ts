/**
 * Hooks customizados para dashboard financeiro
 * Usa React Query para cache e estado
 */

import { useQuery, useMemo } from '@tanstack/react-query'
import {
  getFinancialData,
  getCosts,
  getRevenues,
  getBudgets,
  type FinancialFilters,
} from '@/lib/api/financial-api'
import {
  calculateFinancialKPIs,
  calculateCategoryBreakdown,
  calculateBudgetVariance,
  type CategoryBreakdown,
  type BudgetVariance,
} from '@/lib/business/financial-calculations'
import type { ManualCost, ManualRevenue, Budget, AdminFinancialKPIs } from '@/types/financial'

/**
 * Hook para buscar dados financeiros completos para um período
 */
export function useFinancialData(period: string) {
  return useQuery({
    queryKey: ['financial-data', period],
    queryFn: async () => {
      const result = await getFinancialData(period)
      if (!result.success) {
        throw new Error(result.error || 'Erro ao buscar dados financeiros')
      }
      return {
        costs: result.costs,
        revenues: result.revenues,
        budgets: result.budgets,
      }
    },
    enabled: !!period,
    staleTime: 30 * 1000, // 30 segundos
  })
}

/**
 * Hook para buscar custos com filtros
 */
export function useFinancialCosts(filters: FinancialFilters = {}) {
  return useQuery<ManualCost[]>({
    queryKey: ['financial-costs', filters],
    queryFn: async () => {
      const result = await getCosts(filters)
      if (!result.success) {
        throw new Error(result.error || 'Erro ao buscar custos')
      }
      return result.data || []
    },
    staleTime: 30 * 1000,
  })
}

/**
 * Hook para buscar receitas com filtros
 */
export function useFinancialRevenues(filters: FinancialFilters = {}) {
  return useQuery<ManualRevenue[]>({
    queryKey: ['financial-revenues', filters],
    queryFn: async () => {
      const result = await getRevenues(filters)
      if (!result.success) {
        throw new Error(result.error || 'Erro ao buscar receitas')
      }
      return result.data || []
    },
    staleTime: 30 * 1000,
  })
}

/**
 * Hook para buscar orçamentos com filtros
 */
export function useFinancialBudgets(filters: FinancialFilters = {}) {
  return useQuery<Budget[]>({
    queryKey: ['financial-budgets', filters],
    queryFn: async () => {
      const result = await getBudgets(filters)
      if (!result.success) {
        throw new Error(result.error || 'Erro ao buscar orçamentos')
      }
      return result.data || []
    },
    staleTime: 5 * 60 * 1000, // 5 minutos - orçamentos mudam raramente
  })
}

/**
 * Hook para calcular KPIs financeiros
 */
export function useFinancialKPIs(
  costs: ManualCost[] | undefined,
  revenues: ManualRevenue[] | undefined
): AdminFinancialKPIs | null {
  return useMemo(() => {
    if (!costs || !revenues) {
      return null
    }

    return calculateFinancialKPIs(costs, revenues)
  }, [costs, revenues])
}

/**
 * Hook para calcular breakdown por categoria
 */
export function useCategoryBreakdown(
  costs: ManualCost[] | undefined,
  colors: string[] = []
): CategoryBreakdown[] {
  return useMemo(() => {
    if (!costs || costs.length === 0) {
      return []
    }

    return calculateCategoryBreakdown(costs, colors)
  }, [costs, colors])
}

/**
 * Hook para calcular variação entre orçado e real
 */
export function useBudgetVariance(
  budgets: Budget[] | undefined,
  costs: ManualCost[] | undefined
): BudgetVariance[] {
  return useMemo(() => {
    if (!budgets || !costs || budgets.length === 0) {
      return []
    }

    return calculateBudgetVariance(budgets, costs)
  }, [budgets, costs])
}

