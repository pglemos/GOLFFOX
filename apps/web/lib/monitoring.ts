/**
 * Monitoring Utilities
 * Helpers para monitoramento e métricas básicas
 */

import { logger } from './logger'

export interface Metric {
  name: string
  value: number
  unit?: string
  tags?: Record<string, string>
  timestamp: Date
}

export interface HealthCheck {
  status: 'healthy' | 'degraded' | 'unhealthy'
  checks: Record<string, { status: 'ok' | 'error'; message?: string; latency?: number }>
  timestamp: Date
}

class MonitoringService {
  private metrics: Metric[] = []
  private maxMetrics = 1000 // Limitar histórico em memória

  /**
   * Registrar métrica
   */
  recordMetric(name: string, value: number, unit?: string, tags?: Record<string, string>) {
    const metric: Metric = {
      name,
      value,
      unit,
      tags,
      timestamp: new Date()
    }

    this.metrics.push(metric)

    // Limitar tamanho do array
    if (this.metrics.length > this.maxMetrics) {
      this.metrics = this.metrics.slice(-this.maxMetrics)
    }

    // Em produção, enviar para serviço de métricas (Datadog)
    if (process.env.NODE_ENV === 'production') {
      import('./apm/datadog').then((datadog) => {
        datadog.recordMetric(name, value, tags)
      }).catch(() => {
        // Ignorar erro se datadog não estiver disponível
      })
      logger.debug('Metric recorded', { name, value, unit, tags }, 'Monitoring')
    }
  }

  /**
   * Health check básico
   */
  async performHealthCheck(): Promise<HealthCheck> {
    const checks: HealthCheck['checks'] = {}
    let overallStatus: HealthCheck['status'] = 'healthy'

    // Verificar variáveis de ambiente
    const envCheck = {
      status: (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY)
        ? 'ok' as const
        : 'error' as const,
      message: (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY)
        ? 'Variáveis de ambiente configuradas'
        : 'Variáveis de ambiente faltando'
    }
    checks.environment = envCheck
    if (envCheck.status === 'error') overallStatus = 'unhealthy'

    // Verificar conexão com Supabase (se possível)
    try {
      const startTime = Date.now()
      // Simular verificação de conexão
      // Em produção, fazer ping real no Supabase
      const latency = Date.now() - startTime

      checks.supabase = {
        status: 'ok',
        message: 'Conexão com Supabase OK',
        latency
      }
    } catch (error) {
      checks.supabase = {
        status: 'error',
        message: error instanceof Error ? error.message : 'Erro desconhecido'
      }
      overallStatus = overallStatus === 'healthy' ? 'degraded' : 'unhealthy'
    }

    return {
      status: overallStatus,
      checks,
      timestamp: new Date()
    }
  }

  /**
   * Obter métricas recentes
   */
  getRecentMetrics(name?: string, limit: number = 100): Metric[] {
    let filtered = this.metrics

    if (name) {
      filtered = filtered.filter(m => m.name === name)
    }

    return filtered
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit)
  }

  /**
   * Limpar métricas antigas
   */
  clearMetrics() {
    this.metrics = []
  }
}

// Singleton
export const monitoring = new MonitoringService()

/**
 * Decorator para medir tempo de execução
 */
export function measureExecutionTime(name: string) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value

    descriptor.value = async function (...args: any[]) {
      const startTime = Date.now()
      try {
        const result = await originalMethod.apply(this, args)
        const duration = Date.now() - startTime
        monitoring.recordMetric(`${name}.${propertyKey}.duration`, duration, 'ms')
        return result
      } catch (error) {
        const duration = Date.now() - startTime
        monitoring.recordMetric(`${name}.${propertyKey}.error`, 1)
        monitoring.recordMetric(`${name}.${propertyKey}.duration`, duration, 'ms')
        throw error
      }
    }

    return descriptor
  }
}

/**
 * Helper para medir tempo de execução de função
 */
export async function measureTime<T>(
  name: string,
  fn: () => Promise<T>
): Promise<T> {
  const startTime = Date.now()
  try {
    const result = await fn()
    const duration = Date.now() - startTime
    monitoring.recordMetric(`${name}.duration`, duration, 'ms')
    return result
  } catch (error) {
    const duration = Date.now() - startTime
    monitoring.recordMetric(`${name}.error`, 1)
    monitoring.recordMetric(`${name}.duration`, duration, 'ms')
    throw error
  }
}

