/**
 * Sistema de Alertas Operacionais
 * Monitora erros de API, falhas de cron, e outros eventos críticos
 */

import { supabase } from './supabase'
import { error as logError } from './logger'

function formatSupabaseError(error: any): string {
  if (!error) return 'Erro desconhecido'
  const e = error.error || error
  if (typeof e === 'string') return e
  if (e.message) return e.message
  try {
    return JSON.stringify(e)
  } catch {
    return String(e)
  }
}

export type AlertSeverity = 'info' | 'warning' | 'error' | 'critical'
export type AlertType = 'api_error' | 'cron_failure' | 'performance' | 'sync_failure' | 'route_deviation' | 'other'

export interface OperationalAlert {
  type: AlertType
  severity: AlertSeverity
  title: string
  message: string
  details?: Record<string, any>
  source?: string
  metadata?: Record<string, any>
  company_id?: string
}

/**
 * Registra um alerta operacional
 */
export async function createAlert(alert: OperationalAlert): Promise<void> {
  try {
  await (supabase as any).from('gf_alerts').insert({
      type: alert.type,
      severity: alert.severity,
      title: alert.title,
      message: alert.message,
      details: alert.details || {},
      source: alert.source || 'web-app',
      metadata: alert.metadata || {},
      company_id: alert.company_id || null,
      created_at: new Date().toISOString(),
      is_resolved: false,
    })
  } catch (err) {
    logError('Erro ao criar alerta operacional', { error: formatSupabaseError(err) }, 'OperationalAlerts')
    // Não falhar silenciosamente - logar erro
  }
}

/**
 * Registra erro de API (5xx)
 */
export async function alertApiError(
  endpoint: string,
  status: number,
  error: string,
  details?: Record<string, any>
): Promise<void> {
  if (status >= 500) {
    await createAlert({
      type: 'api_error',
      severity: status >= 500 ? 'error' : 'warning',
      title: `Erro de API: ${endpoint}`,
      message: `Status ${status}: ${error}`,
      details: {
        endpoint,
        status,
        error,
        ...details,
      },
      source: 'api-client',
    })
  }
}

/**
 * Registra falha de cron job
 */
export async function alertCronFailure(
  cronName: string,
  error: string,
  details?: Record<string, any>
): Promise<void> {
  await createAlert({
    type: 'cron_failure',
    severity: 'critical',
    title: `Falha no Cron Job: ${cronName}`,
    message: error,
    details: {
      cron_name: cronName,
      error,
      ...details,
    },
    source: 'cron-job',
  })
}

/**
 * Registra falha de sincronização
 */
export async function alertSyncFailure(
  resourceType: string,
  resourceId: string,
  error: string,
  attempts: number
): Promise<void> {
  await createAlert({
    type: 'sync_failure',
    severity: attempts >= 5 ? 'critical' : 'warning',
    title: `Falha de Sincronização: ${resourceType}`,
    message: `Falha após ${attempts} tentativas: ${error}`,
    details: {
      resource_type: resourceType,
      resource_id: resourceId,
      error,
      attempts,
    },
    source: 'sync-service',
  })
}

/**
 * Obtém alertas não resolvidos
 */
export async function getUnresolvedAlerts(
  severity?: AlertSeverity,
  limit: number = 50
): Promise<any[]> {
  try {
    // Priorizar view segura por operador se existir, com fallback para tabela base
    let query = supabase
      .from('v_operador_alerts_secure')
      .select('*')
      .eq('is_resolved', false)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (severity) {
      query = query.eq('severity', severity)
    }

    let { data, error } = await query

    // Se view segura não estiver disponível ou der erro, usar tabela base
    if (error) {
      let fallbackQuery = supabase
        .from('gf_alerts')
        .select('*')
        .eq('is_resolved', false)
        .order('created_at', { ascending: false })
        .limit(limit)

      if (severity) {
        fallbackQuery = fallbackQuery.eq('severity', severity)
      }
      const res = await fallbackQuery
      data = res.data as typeof data
      error = res.error
    }

    if (error) throw error
    
    // Mapear dados do banco para formato esperado (alert_type -> type)
    interface AlertRecord {
      id: string
      type?: string
      alert_type?: string
      severity: AlertSeverity
      title: string
      message: string
      is_resolved: boolean
      created_at: string
      [key: string]: unknown
    }
    
    const mappedData = (data || []).map((alert: AlertRecord) => ({
      ...alert,
      type: alert.type || alert.alert_type || 'other'
    }))
    
    return mappedData
  } catch (error) {
    logError('Erro ao buscar alertas', { error: formatSupabaseError(error) }, 'OperationalAlerts')
    return []
  }
}

/**
 * Resolve um alerta
 */
export async function resolveAlert(alertId: string, notes?: string): Promise<void> {
  try {
  await (supabase as any)
    .from('gf_alerts')
    .update({
        is_resolved: true,
        resolved_at: new Date().toISOString(),
        resolution_notes: notes,
      })
      .eq('id', alertId)
  } catch (error) {
    logError('Erro ao resolver alerta', { error: formatSupabaseError(error) }, 'OperationalAlerts')
  }
}

/**
 * Verifica se há alertas críticos não resolvidos
 */
export async function hasCriticalAlerts(): Promise<boolean> {
  try {
    // Tentar pela view segura primeiro
    let { data, error } = await supabase
      .from('v_operador_alerts_secure')
      .select('id, severity, is_resolved')
      .eq('severity', 'critical')
      .eq('is_resolved', false)
      .limit(1)

    if (error) {
      const res = await supabase
        .from('gf_alerts')
        .select('id')
        .eq('is_resolved', false)
        .eq('severity', 'critical')
        .limit(1)
      data = res.data as typeof data
      error = res.error
    }

    if (error) throw error
    // Retornar true se houver pelo menos um alerta
    return Array.isArray(data) && data.length > 0
  } catch (error) {
    logError('Erro ao verificar alertas críticos', { error: formatSupabaseError(error) }, 'OperationalAlerts')
    return false
  }
}

