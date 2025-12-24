/**
 * Serviços de API para funcionalidades administrativas
 * Centraliza todas as chamadas relacionadas ao dashboard admin
 */

import { fetchWithAuth } from '../fetch-with-auth'
import { logError } from '../logger'

export interface KpiData {
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

export interface AuditLog {
  id: string
  actor_id: string | null
  action_type: string
  resource_type: string | null
  resource_id: string | null
  details: any
  created_at: string
}

export interface AdminFilters {
  empresa?: string
  data?: string
  turno?: string
}

export interface AdminKPIsResponse {
  success: boolean
  kpis?: KpiData[]
  error?: string
}

export interface AuditLogsResponse {
  success: boolean
  logs?: AuditLog[]
  error?: string
}

/**
 * Buscar KPIs do dashboard administrativo
 */
export async function getAdminKPIs(
  filters: AdminFilters = {}
): Promise<AdminKPIsResponse> {
  try {
    const params = new URLSearchParams()
    
    if (filters.empresa) params.append('empresa', filters.empresa)
    if (filters.data) params.append('data', filters.data)
    if (filters.turno) params.append('turno', filters.turno)

    const queryString = params.toString()
    const url = `/api/admin/kpis${queryString ? `?${queryString}` : ''}`

    const response = await fetchWithAuth(url, {
      method: 'GET',
      credentials: 'include',
    })

    const result = await response.json()

    if (!response.ok || !result.success) {
      return {
        success: false,
        error: result.error || 'Erro ao buscar KPIs',
      }
    }

    return {
      success: true,
      kpis: result.kpis || [],
    }
  } catch (error) {
    logError('Erro ao buscar KPIs do admin', { error }, 'AdminAPI')
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido ao buscar KPIs',
    }
  }
}

/**
 * Buscar logs de auditoria
 */
export async function getAuditLogs(
  filters: AdminFilters = {}
): Promise<AuditLogsResponse> {
  try {
    const params = new URLSearchParams()
    
    if (filters.empresa) params.append('empresa', filters.empresa)
    if (filters.data) params.append('data', filters.data)
    if (filters.turno) params.append('turno', filters.turno)

    const queryString = params.toString()
    const url = `/api/admin/audit-logs${queryString ? `?${queryString}` : ''}`

    const response = await fetchWithAuth(url, {
      method: 'GET',
      credentials: 'include',
    })

    const result = await response.json()

    if (!response.ok || !result.success) {
      return {
        success: false,
        error: result.error || 'Erro ao buscar logs de auditoria',
      }
    }

    return {
      success: true,
      logs: result.logs || result.data || [],
    }
  } catch (error) {
    logError('Erro ao buscar logs de auditoria', { error }, 'AdminAPI')
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido ao buscar logs',
    }
  }
}

