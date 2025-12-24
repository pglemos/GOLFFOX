/**
 * Serviços de API para gerenciamento de custos
 * Centraliza todas as chamadas relacionadas a custos
 */

import type { ManualCostInsert, ManualCost, CostCategory } from '@/types/financial'

import { fetchWithAuth } from '../fetch-with-auth'
import { logError } from '../logger'

export interface CostFilters {
  page?: number
  page_size?: number
  date_from?: string
  date_to?: string
  empresa_id?: string
  transportadora_id?: string
  category_id?: string
  veiculo_id?: string
  rota_id?: string
}

export interface CostsResponse {
  success: boolean
  data: ManualCost[]
  count?: number
  totalPages?: number
  error?: string
}

export interface CostCategoriesResponse {
  success: boolean
  data: CostCategory[]
  error?: string
}

export interface CreateCostResponse {
  success: boolean
  data?: ManualCost
  error?: string
}

/**
 * Criar um custo manual
 */
export async function createManualCost(
  payload: ManualCostInsert
): Promise<CreateCostResponse> {
  try {
    const response = await fetchWithAuth('/api/costs/manual-v2', {
      method: 'POST',
      body: JSON.stringify(payload),
    })

    const result = await response.json()

    if (!response.ok || !result.success) {
      return {
        success: false,
        error: result.error || 'Erro ao salvar custo',
      }
    }

    return {
      success: true,
      data: result.data,
    }
  } catch (error) {
    logError('Erro ao criar custo', { error }, 'CostsAPI')
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido ao criar custo',
    }
  }
}

/**
 * Buscar categorias de custo
 */
export async function getCostCategories(): Promise<CostCategoriesResponse> {
  try {
    const response = await fetchWithAuth('/api/costs/categories', {
      method: 'GET',
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({})) as any
      return {
        success: false,
        data: [],
        error: errorData.error || 'Erro ao buscar categorias',
      }
    }

    const data = await response.json()
    return {
      success: true,
      data: Array.isArray(data) ? data : data.data || [],
    }
  } catch (error) {
    logError('Erro ao buscar categorias', { error }, 'CostsAPI')
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido ao buscar categorias',
      data: [],
    }
  }
}

/**
 * Buscar custos com filtros
 */
export async function getCosts(filters: CostFilters = {}): Promise<CostsResponse> {
  try {
    const params = new URLSearchParams()

    if (filters.page) params.append('page', filters.page.toString())
    if (filters.page_size) params.append('page_size', filters.page_size.toString())
    if (filters.date_from) params.append('date_from', filters.date_from)
    if (filters.date_to) params.append('date_to', filters.date_to)
    if (filters.empresa_id) params.append('empresa_id', filters.empresa_id)
    if (filters.transportadora_id) params.append('transportadora_id', filters.transportadora_id)
    if (filters.category_id) params.append('category_id', filters.category_id)
    if (filters.veiculo_id) params.append('veiculo_id', filters.veiculo_id)
    if (filters.rota_id) params.append('rota_id', filters.rota_id)

    const queryString = params.toString()
    const url = `/api/costs/manual-v2${queryString ? `?${queryString}` : ''}`

    const response = await fetchWithAuth(url, {
      method: 'GET',
    })

    const result = await response.json()

    if (!response.ok || !result.success) {
      return {
        success: false,
        error: result.error || 'Erro ao buscar custos',
        data: [],
      }
    }

    return {
      success: true,
      data: result.data || [],
      count: result.count,
      totalPages: result.totalPages,
    }
  } catch (error) {
    logError('Erro ao buscar custos', { error }, 'CostsAPI')
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido ao buscar custos',
      data: [],
    }
  }
}

