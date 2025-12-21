/**
 * Hooks customizados para gerenciamento de custos
 * Usa React Query para cache e estado
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  createManualCost,
  getCostCategories,
  getCosts,
  type CostFilters,
} from '@/lib/api/costs-api'
import { notifySuccess } from '@/lib/toast'
import type { ManualCostInsert, ManualCost, CostCategory } from '@/types/financial'

/**
 * Hook para criar um custo manual (mutation)
 */
export function useCreateCost() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (payload: ManualCostInsert) => {
      const result = await createManualCost(payload)
      if (!result.success) {
        throw new Error(result.error || 'Erro ao criar custo')
      }
      return result.data
    },
    onSuccess: () => {
      // Invalidar queries relacionadas para refetch automático
      queryClient.invalidateQueries({ queryKey: ['costs'] })
      queryClient.invalidateQueries({ queryKey: ['financial-data'] })
      notifySuccess('Custo cadastrado com sucesso!')
    },
  })
}

/**
 * Hook para buscar categorias de custo
 */
export function useCostCategories() {
  return useQuery<CostCategory[]>({
    queryKey: ['cost-categories'],
    queryFn: async () => {
      const result = await getCostCategories()
      if (!result.success) {
        throw new Error(result.error || 'Erro ao buscar categorias')
      }
      return result.data || []
    },
    staleTime: 5 * 60 * 1000, // 5 minutos - categorias mudam raramente
  })
}

/**
 * Hook para buscar custos com filtros
 */
export function useCosts(filters: CostFilters = {}) {
  return useQuery<ManualCost[]>({
    queryKey: ['costs', filters],
    queryFn: async () => {
      const result = await getCosts(filters)
      if (!result.success) {
        throw new Error(result.error || 'Erro ao buscar custos')
      }
      return result.data || []
    },
    staleTime: 30 * 1000, // 30 segundos
  })
}

