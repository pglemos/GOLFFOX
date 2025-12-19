/**
 * Alert Manager
 * 
 * Gerenciador de alertas proativos baseados em métricas e thresholds
 */

import { debug, warn, logError } from '@/lib/logger'
import { createClient } from '@supabase/supabase-js'

export interface AlertRule {
  id: string
  name: string
  metric: string
  threshold: number
  operator: 'gt' | 'lt' | 'eq' | 'gte' | 'lte'
  severity: 'info' | 'warning' | 'error' | 'critical'
  enabled: boolean
  cooldown?: number // Segundos entre alertas
}

export interface Alert {
  id: string
  ruleId: string
  name: string
  message: string
  severity: AlertRule['severity']
  metric: string
  value: number
  threshold: number
  timestamp: Date
  resolved?: boolean
  resolvedAt?: Date
}

class AlertManager {
  private rules: AlertRule[] = []
  private lastAlertTime = new Map<string, number>()
  private supabase: ReturnType<typeof createClient> | null = null

  private getSupabase() {
    if (this.supabase) {
      return this.supabase
    }

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!url || !serviceKey) {
      return null
    }

    this.supabase = createClient(url, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    })

    return this.supabase
  }

  /**
   * Registrar regra de alerta
   */
  registerRule(rule: AlertRule): void {
    this.rules.push(rule)
    debug('Regra de alerta registrada', { ruleId: rule.id, name: rule.name }, 'AlertManager')
  }

  /**
   * Verificar métrica contra regras
   */
  async checkMetric(metricName: string, value: number): Promise<Alert[]> {
    const triggeredAlerts: Alert[] = []

    for (const rule of this.rules) {
      if (!rule.enabled || rule.metric !== metricName) {
        continue
      }

      // Verificar threshold
      const shouldAlert = this.evaluateThreshold(value, rule.threshold, rule.operator)

      if (shouldAlert) {
        // Verificar cooldown
        const lastAlert = this.lastAlertTime.get(rule.id) || 0
        const cooldownMs = (rule.cooldown || 0) * 1000

        if (Date.now() - lastAlert < cooldownMs) {
          continue // Ainda em cooldown
        }

        // Criar alerta
        const alert: Alert = {
          id: crypto.randomUUID(),
          ruleId: rule.id,
          name: rule.name,
          message: `${rule.name}: ${metricName} = ${value} ${this.getOperatorSymbol(rule.operator)} ${rule.threshold}`,
          severity: rule.severity,
          metric: metricName,
          value,
          threshold: rule.threshold,
          timestamp: new Date(),
        }

        triggeredAlerts.push(alert)
        this.lastAlertTime.set(rule.id, Date.now())

        // Persistir alerta
        await this.persistAlert(alert)
      }
    }

    return triggeredAlerts
  }

  /**
   * Avaliar threshold
   */
  private evaluateThreshold(value: number, threshold: number, operator: AlertRule['operator']): boolean {
    switch (operator) {
      case 'gt':
        return value > threshold
      case 'lt':
        return value < threshold
      case 'eq':
        return value === threshold
      case 'gte':
        return value >= threshold
      case 'lte':
        return value <= threshold
      default:
        return false
    }
  }

  /**
   * Obter símbolo do operador
   */
  private getOperatorSymbol(operator: AlertRule['operator']): string {
    switch (operator) {
      case 'gt': return '>'
      case 'lt': return '<'
      case 'eq': return '='
      case 'gte': return '>='
      case 'lte': return '<='
    }
  }

  /**
   * Persistir alerta no banco
   */
  private async persistAlert(alert: Alert): Promise<void> {
    try {
      const supabase = this.getSupabase()
      if (!supabase) {
        warn('Supabase não configurado, alerta não persistido', { alert }, 'AlertManager')
        return
      }

      // Usar 'as any' porque gf_operational_alerts pode não estar nos tipos
      const { error } = await (supabase.from('gf_operational_alerts') as any).insert({
        type: 'metric',
        severity: alert.severity,
        title: alert.name,
        message: alert.message,
        details: {
          ruleId: alert.ruleId,
          metric: alert.metric,
          value: alert.value,
          threshold: alert.threshold,
        },
        created_at: alert.timestamp.toISOString(),
      })

      if (error) {
        logError('Erro ao persistir alerta', { error, alert }, 'AlertManager')
      } else {
        debug('Alerta persistido', { alertId: alert.id, name: alert.name }, 'AlertManager')
      }
    } catch (error) {
      logError('Exceção ao persistir alerta', { error, alert }, 'AlertManager')
    }
  }

  /**
   * Resolver alerta
   */
  async resolveAlert(alertId: string): Promise<void> {
    // Implementar lógica de resolução se necessário
    debug('Alerta resolvido', { alertId }, 'AlertManager')
  }
}

// Singleton
export const alertManager = new AlertManager()

// Registrar regras padrão
alertManager.registerRule({
  id: 'high-error-rate',
  name: 'Taxa de Erro Alta',
  metric: 'api.error.rate',
  threshold: 0.1, // 10%
  operator: 'gt',
  severity: 'error',
  enabled: true,
  cooldown: 300, // 5 minutos
})

alertManager.registerRule({
  id: 'slow-response-time',
  name: 'Tempo de Resposta Lento',
  metric: 'api.response.duration',
  threshold: 3000, // 3 segundos
  operator: 'gt',
  severity: 'warning',
  enabled: true,
  cooldown: 600, // 10 minutos
})
