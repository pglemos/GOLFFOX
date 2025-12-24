/**
 * Serviços de API para dados financeiros
 * Centraliza todas as chamadas relacionadas a custos, receitas e orçamentos
 */

import type { ManualCost, ManualRevenue, Budget } from '@/types/financial'

import { fetchWithAuth } from '../fetch-with-auth'

export interface FinancialFilters {
  page?: number
  page_size?: number
  date_from?: string
  date_to?: string
  year?: number
  month?: number
  company_id?: string
  transportadora_id?: string
}

export interface CostsResponse {
  success: boolean
  data: ManualCost[]
  error?: string
}

export interface RevenuesResponse {
  success: boolean
  data: ManualRevenue[]
  error?: string
}

export interface BudgetsResponse {
  success: boolean
  data: Budget[]
  error?: string
}

export interface FinancialDataResponse {
  success: boolean
  costs: ManualCost[]
  revenues: ManualRevenue[]
  budgets: Budget[]
  error?: string
}

/**
 * Buscar dados financeiros completos para um período
 */
export async function getFinancialData(
  period: string
): Promise<FinancialDataResponse> {
  try {
    const [year, month] = period.split('-')

    // Carregar em paralelo
    const [costsRes, revenuesRes, budgetsRes] = await Promise.all([
      fetchWithAuth(
        `/api/costs/manual-v2?page=1&page_size=100&date_from=${year}-${month}-01&date_to=${year}-${month}-31`
      ),
      fetchWithAuth(
        `/api/revenues?page=1&page_size=100&date_from=${year}-${month}-01&date_to=${year}-${month}-31`
      ),
      fetchWithAuth(`/api/budgets?year=${year}&month=${month}`),
    ])

    const [costsData, revenuesData, budgetsData] = await Promise.all([
      costsRes.json(),
      revenuesRes.json(),
      budgetsRes.json(),
    ])

    return {
      success: true,
      costs: costsData.success ? costsData.data || [] : [],
      revenues: revenuesData.success ? revenuesData.data || [] : [],
      budgets: budgetsData.success ? budgetsData.data || [] : [],
    }
  } catch (error) {
    console.error('Erro ao buscar dados financeiros:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido ao buscar dados financeiros',
      costs: [],
      revenues: [],
      budgets: [],
    }
  }
}

/**
 * Buscar custos com filtros
 */
export async function getCosts(filters: FinancialFilters = {}): Promise<CostsResponse> {
  try {
    const params = new URLSearchParams()

    if (filters.page) params.append('page', filters.page.toString())
    if (filters.page_size) params.append('page_size', filters.page_size.toString())
    if (filters.date_from) params.append('date_from', filters.date_from)
    if (filters.date_to) params.append('date_to', filters.date_to)
    if (filters.company_id) params.append('company_id', filters.company_id)
    if (filters.transportadora_id) params.append('transportadora_id', filters.transportadora_id)

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
    }
  } catch (error) {
    console.error('Erro ao buscar custos:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido ao buscar custos',
      data: [],
    }
  }
}

/**
 * Buscar receitas com filtros
 */
export async function getRevenues(filters: FinancialFilters = {}): Promise<RevenuesResponse> {
  try {
    const params = new URLSearchParams()

    if (filters.page) params.append('page', filters.page.toString())
    if (filters.page_size) params.append('page_size', filters.page_size.toString())
    if (filters.date_from) params.append('date_from', filters.date_from)
    if (filters.date_to) params.append('date_to', filters.date_to)
    if (filters.company_id) params.append('company_id', filters.company_id)
    if (filters.transportadora_id) params.append('transportadora_id', filters.transportadora_id)

    const queryString = params.toString()
    const url = `/api/revenues${queryString ? `?${queryString}` : ''}`

    const response = await fetchWithAuth(url, {
      method: 'GET',
    })

    const result = await response.json()

    if (!response.ok || !result.success) {
      return {
        success: false,
        error: result.error || 'Erro ao buscar receitas',
        data: [],
      }
    }

    return {
      success: true,
      data: result.data || [],
    }
  } catch (error) {
    console.error('Erro ao buscar receitas:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido ao buscar receitas',
      data: [],
    }
  }
}

/**
 * Buscar orçamentos com filtros
 */
export async function getBudgets(filters: FinancialFilters = {}): Promise<BudgetsResponse> {
  try {
    const params = new URLSearchParams()

    if (filters.year) params.append('year', filters.year.toString())
    if (filters.month) params.append('month', filters.month.toString())
    if (filters.company_id) params.append('company_id', filters.company_id)
    if (filters.transportadora_id) params.append('transportadora_id', filters.transportadora_id)

    const queryString = params.toString()
    const url = `/api/budgets${queryString ? `?${queryString}` : ''}`

    const response = await fetchWithAuth(url, {
      method: 'GET',
    })

    const result = await response.json()

    if (!response.ok || !result.success) {
      return {
        success: false,
        error: result.error || 'Erro ao buscar orçamentos',
        data: [],
      }
    }

    return {
      success: true,
      data: result.data || [],
    }
  } catch (error) {
    console.error('Erro ao buscar orçamentos:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido ao buscar orçamentos',
      data: [],
    }
  }
}

