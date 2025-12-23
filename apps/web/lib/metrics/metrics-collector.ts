/**
 * Metrics Collector
 * 
 * Coletor de métricas para monitoramento
 * Integrado com APM (Datadog)
 */

import { redisCacheService } from '@/lib/cache/redis-cache.service'
import { debug, warn } from '@/lib/logger'

export interface Metric {
  name: string
  value: number
  unit?: string
  tags?: Record<string, string>
  timestamp: Date
}

export interface CounterMetric extends Metric {
  type: 'counter'
}

export interface GaugeMetric extends Metric {
  type: 'gauge'
}

export interface HistogramMetric extends Metric {
  type: 'histogram'
  buckets?: number[]
}

class MetricsCollector {
  private metrics: Metric[] = []
  private maxMetrics = 1000

  /**
   * Registrar contador
   */
  increment(name: string, value: number = 1, tags?: Record<string, string>): void {
    this.recordMetric({
      name,
      value,
      type: 'counter',
      tags,
      timestamp: new Date()
    })
  }

  /**
   * Registrar gauge (valor atual)
   */
  gauge(name: string, value: number, tags?: Record<string, string>): void {
    this.recordMetric({
      name,
      value,
      type: 'gauge',
      tags,
      timestamp: new Date()
    })
  }

  /**
   * Registrar histograma (distribuição de valores)
   */
  histogram(name: string, value: number, tags?: Record<string, string>): void {
    this.recordMetric({
      name,
      value,
      type: 'histogram',
      tags,
      timestamp: new Date()
    })
  }

  /**
   * Registrar métrica genérica
   */
  private recordMetric(metric: CounterMetric | GaugeMetric | HistogramMetric): void {
    this.metrics.push(metric)

    // Limitar tamanho
    if (this.metrics.length > this.maxMetrics) {
      this.metrics = this.metrics.slice(-this.maxMetrics)
    }

    // Em produção, enviar para serviço de métricas
    if (process.env.NODE_ENV === 'production') {
      this.sendToAPM(metric)
    } else {
      debug('Métrica registrada', { name: metric.name, value: metric.value }, 'MetricsCollector')
    }
  }

  /**
   * Enviar métrica para APM (Datadog)
   */
  private sendToAPM(metric: CounterMetric | GaugeMetric | HistogramMetric): void {
    try {
      // Importar dinamicamente para não quebrar se não estiver instalado
      // Verificar se o módulo existe antes de usar
      let apmModule
      try {
        apmModule = require('../apm/datadog')
      } catch (requireError) {
        // Se o módulo não existir, apenas retornar silenciosamente
        return
      }
      
      if (apmModule && typeof apmModule.recordMetric === 'function') {
        apmModule.recordMetric(metric.name, metric.value, metric.tags)
      }
    } catch (error) {
      // Se Datadog não estiver configurado, apenas logar em debug
      // Não propagar erro para não quebrar o fluxo principal
      if (process.env.NODE_ENV === 'development') {
        debug('APM não disponível (métrica não enviada)', { 
          name: metric.name, 
          value: metric.value,
          error: error instanceof Error ? error.message : String(error)
        }, 'MetricsCollector')
      }
    }
  }

  /**
   * Obter métricas recentes
   */
  getMetrics(name?: string, limit: number = 100): Metric[] {
    let filtered = this.metrics

    if (name) {
      filtered = filtered.filter(m => m.name === name)
    }

    return filtered
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit)
  }

  /**
   * Limpar métricas
   */
  clear(): void {
    this.metrics = []
  }
}

// Singleton
export const metricsCollector = new MetricsCollector()

/**
 * Decorator para medir tempo de execução de métodos
 */
export function measureTime(name: string) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value

    descriptor.value = async function (...args: any[]) {
      const startTime = Date.now()
      try {
        const result = await originalMethod.apply(this, args)
        const duration = Date.now() - startTime
        metricsCollector.histogram(`${name}.${propertyKey}.duration`, duration)
        return result
      } catch (error) {
        const duration = Date.now() - startTime
        metricsCollector.increment(`${name}.${propertyKey}.error`)
        metricsCollector.histogram(`${name}.${propertyKey}.duration`, duration)
        throw error
      }
    }

    return descriptor
  }
}

/**
 * Helper para medir tempo de função
 */
export async function measureExecutionTime<T>(
  name: string,
  fn: () => Promise<T>
): Promise<T> {
  const startTime = Date.now()
  try {
    const result = await fn()
    const duration = Date.now() - startTime
    metricsCollector.histogram(`${name}.duration`, duration)
    return result
  } catch (error) {
    const duration = Date.now() - startTime
    metricsCollector.increment(`${name}.error`)
    metricsCollector.histogram(`${name}.duration`, duration)
    throw error
  }
}
