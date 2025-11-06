/**
 * Sistema de Alertas Operacionais
 * Monitora erros de API, falhas de cron, e outros eventos críticos
 */

import { supabase } from './supabase'

export type AlertSeverity = 'info' | 'warning' | 'error' | 'critical'
export type AlertType = 'api_error' | 'cron_failure' | 'performance' | 'sync_failure' | 'other'

export interface OperationalAlert {
  type: AlertType
  severity: AlertSeverity
  title: string
  message: string
  details?: Record<string, any>
  source?: string
  metadata?: Record<string, any>
}

/**
 * Registra um alerta operacional
 */
export async function createAlert(alert: OperationalAlert): Promise<void> {
  try {
    await supabase.from('gf_operational_alerts').insert({
      type: alert.type,
      severity: alert.severity,
      title: alert.title,
      message: alert.message,
      details: alert.details || {},
      source: alert.source || 'web-app',
      metadata: alert.metadata || {},
      created_at: new Date().toISOString(),
      is_resolved: false,
    })
  } catch (error) {
    console.error('Erro ao criar alerta operacional:', error)
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
    let query = supabase
      .from('gf_operational_alerts')
      .select('*')
      .eq('is_resolved', false)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (severity) {
      query = query.eq('severity', severity)
    }

    const { data, error } = await query

    if (error) throw error
    return data || []
  } catch (error) {
    console.error('Erro ao buscar alertas:', error)
    return []
  }
}

/**
 * Resolve um alerta
 */
export async function resolveAlert(alertId: string, notes?: string): Promise<void> {
  try {
    await supabase
      .from('gf_operational_alerts')
      .update({
        is_resolved: true,
        resolved_at: new Date().toISOString(),
        resolution_notes: notes,
      })
      .eq('id', alertId)
  } catch (error) {
    console.error('Erro ao resolver alerta:', error)
  }
}

/**
 * Verifica se há alertas críticos não resolvidos
 */
export async function hasCriticalAlerts(): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('gf_operational_alerts')
      .select('id')
      .eq('is_resolved', false)
      .eq('severity', 'critical')
      .limit(1)

    if (error) throw error
    return (data?.length || 0) > 0
  } catch (error) {
    console.error('Erro ao verificar alertas críticos:', error)
    return false
  }
}

