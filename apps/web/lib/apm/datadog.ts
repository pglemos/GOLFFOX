/**
 * Datadog APM Integration
 * 
 * Integração com Datadog para Application Performance Monitoring (APM)
 * 
 * Configuração:
 * - DATADOG_SERVICE_NAME: Nome do serviço (default: 'golffox-web')
 * - DATADOG_ENV: Ambiente (development, staging, production)
 * - DD_AGENT_HOST: Host do agente Datadog (opcional, para agent local)
 * - DD_TRACE_ENABLED: Habilitar tracing (default: true em produção)
 */

import { debug, warn, logError } from '@/lib/logger'

let datadogTracer: any = null
let isInitialized = false

/**
 * Inicializar Datadog APM
 */
export function initializeDatadog() {
  // Só inicializar uma vez
  if (isInitialized) {
    return datadogTracer
  }

  // Verificar se está habilitado
  const isEnabled = process.env.DD_TRACE_ENABLED !== 'false' && 
                    (process.env.NODE_ENV === 'production' || process.env.DD_TRACE_ENABLED === 'true')

  if (!isEnabled) {
    debug('Datadog APM desabilitado', { 
      NODE_ENV: process.env.NODE_ENV,
      DD_TRACE_ENABLED: process.env.DD_TRACE_ENABLED 
    }, 'DatadogAPM')
    isInitialized = true
    return null
  }

  try {
    // Importar dinamicamente para não quebrar se não estiver instalado
    // Verificar se o módulo existe antes de usar
    let tracer
    try {
      tracer = require('dd-trace')
    } catch (requireError) {
      // Se dd-trace não estiver instalado, retornar null silenciosamente
      debug('dd-trace não disponível (não instalado)', {}, 'DatadogAPM')
      isInitialized = true
      return null
    }
    
    if (!tracer || typeof tracer.init !== 'function') {
      warn('dd-trace não está disponível corretamente', {}, 'DatadogAPM')
      isInitialized = true
      return null
    }
    
    tracer.init({
      service: process.env.DATADOG_SERVICE_NAME || 'golffox-web',
      env: process.env.DATADOG_ENV || process.env.NODE_ENV || 'development',
      version: process.env.DATADOG_VERSION || process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0',
      
      // Configurações de host (opcional - para agent local)
      hostname: process.env.DD_AGENT_HOST,
      port: process.env.DD_TRACE_AGENT_PORT ? parseInt(process.env.DD_TRACE_AGENT_PORT) : undefined,
      
      // Logging
      logInjection: true,
      runtimeMetrics: true,
      
      // Instrumentação automática
      plugins: {
        http: {
          enabled: true,
          blacklist: ['/api/health', '/api/analytics/web-vitals'], // Não rastrear health checks
        },
        next: {
          enabled: true,
        },
        express: {
          enabled: true,
        },
        '@supabase/supabase-js': {
          enabled: true,
        },
      },
      
      // Sampling (reduzir overhead em produção)
      sampleRate: process.env.DD_TRACE_SAMPLE_RATE ? parseFloat(process.env.DD_TRACE_SAMPLE_RATE) : 1.0,
      
      // Tags globais
      tags: {
        environment: process.env.DATADOG_ENV || process.env.NODE_ENV || 'development',
        service: process.env.DATADOG_SERVICE_NAME || 'golffox-web',
      },
    })

    datadogTracer = tracer
    isInitialized = true
    
    debug('Datadog APM inicializado com sucesso', {
      service: process.env.DATADOG_SERVICE_NAME || 'golffox-web',
      env: process.env.DATADOG_ENV || process.env.NODE_ENV,
    }, 'DatadogAPM')

    return tracer
  } catch (error) {
    warn('Erro ao inicializar Datadog APM (continuando sem APM)', { error }, 'DatadogAPM')
    isInitialized = true
    return null
  }
}

/**
 * Obter tracer do Datadog
 */
export function getDatadogTracer() {
  if (!isInitialized) {
    return initializeDatadog()
  }
  return datadogTracer
}

/**
 * Criar span customizado
 */
export function createSpan(name: string, operation: string, callback: (span: any) => Promise<any>) {
  const tracer = getDatadogTracer()
  if (!tracer) {
    // Se Datadog não está disponível, executar callback diretamente
    return callback(null)
  }

  const span = tracer.startSpan(name, {
    service: process.env.DATADOG_SERVICE_NAME || 'golffox-web',
    resource: operation,
  })

  return new Promise((resolve, reject) => {
    callback(span)
      .then((result) => {
        span.finish()
        resolve(result)
      })
      .catch((error) => {
        span.setTag('error', true)
        span.setTag('error.message', error instanceof Error ? error.message : String(error))
        span.finish()
        reject(error)
      })
  })
}

/**
 * Adicionar tags ao span atual
 */
export function addSpanTags(tags: Record<string, string | number | boolean>) {
  const tracer = getDatadogTracer()
  if (!tracer) return

  const span = tracer.scope().active()
  if (span) {
    Object.entries(tags).forEach(([key, value]) => {
      span.setTag(key, value)
    })
  }
}

/**
 * Registrar métrica customizada no Datadog
 */
export function recordMetric(name: string, value: number, tags?: Record<string, string>) {
  const tracer = getDatadogTracer()
  if (!tracer) return

  try {
    // Usar DogStatsD se disponível, senão usar tags no span
    const span = tracer.scope().active()
    if (span) {
      span.setMetric(name, value)
      if (tags) {
        Object.entries(tags).forEach(([key, val]) => {
          span.setTag(key, val)
        })
      }
    }
  } catch (error) {
    debug('Erro ao registrar métrica no Datadog', { error, name, value }, 'DatadogAPM')
  }
}

/**
 * Registrar erro no Datadog
 */
export function recordError(error: Error, context?: Record<string, unknown>) {
  const tracer = getDatadogTracer()
  if (!tracer) return

  try {
    const span = tracer.scope().active()
    if (span) {
      span.setTag('error', true)
      span.setTag('error.message', error.message)
      span.setTag('error.type', error.name)
      if (error.stack) {
        span.setTag('error.stack', error.stack)
      }
      if (context) {
        Object.entries(context).forEach(([key, value]) => {
          span.setTag(`error.context.${key}`, String(value))
        })
      }
    }
  } catch (err) {
    debug('Erro ao registrar erro no Datadog', { error: err }, 'DatadogAPM')
  }
}

