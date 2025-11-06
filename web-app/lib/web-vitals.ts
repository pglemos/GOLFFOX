/**
 * Web Vitals - Monitoramento de Performance
 * Integração com Core Web Vitals (CLS, LCP, FID/FCP)
 */

import { onCLS, onFCP, onFID, onLCP, onTTFB } from 'web-vitals'

export interface WebVitalMetric {
  name: string
  value: number
  delta: number
  id: string
  rating: 'good' | 'needs-improvement' | 'poor'
  navigationType: string
}

export interface WebVitalsReport {
  url: string
  userAgent: string
  timestamp: number
  metrics: WebVitalMetric[]
}

// Thresholds para ratings (Web Vitals)
const THRESHOLDS = {
  CLS: { good: 0.1, poor: 0.25 },
  FCP: { good: 1800, poor: 3000 },
  FID: { good: 100, poor: 300 },
  LCP: { good: 2500, poor: 4000 },
  TTFB: { good: 800, poor: 1800 },
}

function getRating(name: string, value: number): 'good' | 'needs-improvement' | 'poor' {
  const threshold = THRESHOLDS[name as keyof typeof THRESHOLDS]
  if (!threshold) return 'good'
  
  if (value <= threshold.good) return 'good'
  if (value <= threshold.poor) return 'needs-improvement'
  return 'poor'
}

const collectedMetrics: WebVitalMetric[] = []

/**
 * Coleta métricas de Web Vitals
 */
export function collectWebVitals() {
  if (typeof window === 'undefined') return

  // CLS - Cumulative Layout Shift
  onCLS((metric) => {
    const rating = getRating('CLS', metric.value)
    collectedMetrics.push({
      name: 'CLS',
      value: metric.value,
      delta: metric.delta,
      id: metric.id,
      rating,
      navigationType: metric.navigationType || 'unknown',
    })
    
    if (rating === 'poor') {
      console.warn(`[Web Vitals] CLS ${rating}: ${metric.value.toFixed(3)}`)
    }
  })

  // FCP - First Contentful Paint
  onFCP((metric) => {
    const rating = getRating('FCP', metric.value)
    collectedMetrics.push({
      name: 'FCP',
      value: metric.value,
      delta: metric.delta,
      id: metric.id,
      rating,
      navigationType: metric.navigationType || 'unknown',
    })
  })

  // FID - First Input Delay (deprecated, mas mantido para compatibilidade)
  onFID((metric) => {
    const rating = getRating('FID', metric.value)
    collectedMetrics.push({
      name: 'FID',
      value: metric.value,
      delta: metric.delta,
      id: metric.id,
      rating,
      navigationType: metric.navigationType || 'unknown',
    })
    
    if (rating === 'poor') {
      console.warn(`[Web Vitals] FID ${rating}: ${metric.value.toFixed(2)}ms`)
    }
  })

  // LCP - Largest Contentful Paint
  onLCP((metric) => {
    const rating = getRating('LCP', metric.value)
    collectedMetrics.push({
      name: 'LCP',
      value: metric.value,
      delta: metric.delta,
      id: metric.id,
      rating,
      navigationType: metric.navigationType || 'unknown',
    })
    
    if (rating === 'poor') {
      console.warn(`[Web Vitals] LCP ${rating}: ${metric.value.toFixed(2)}ms`)
    }
  })

  // TTFB - Time to First Byte
  onTTFB((metric) => {
    const rating = getRating('TTFB', metric.value)
    collectedMetrics.push({
      name: 'TTFB',
      value: metric.value,
      delta: metric.delta,
      id: metric.id,
      rating,
      navigationType: metric.navigationType || 'unknown',
    })
    
    if (rating === 'poor') {
      console.warn(`[Web Vitals] TTFB ${rating}: ${metric.value.toFixed(2)}ms`)
    }
  })
}

/**
 * Envia métricas para o servidor (opcional)
 */
export async function sendWebVitalsToServer(report: WebVitalsReport) {
  try {
    await fetch('/api/analytics/web-vitals', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(report),
      keepalive: true, // Manter requisição mesmo após navegação
    })
  } catch (error) {
    console.error('Erro ao enviar Web Vitals:', error)
  }
}

/**
 * Gera relatório completo de Web Vitals
 */
export function getWebVitalsReport(): WebVitalsReport {
  return {
    url: window.location.href,
    userAgent: navigator.userAgent,
    timestamp: Date.now(),
    metrics: [...collectedMetrics],
  }
}

/**
 * Obtém métricas específicas por nome
 */
export function getMetric(name: string): WebVitalMetric | undefined {
  return collectedMetrics.find((m) => m.name === name)
}

/**
 * Obtém todas as métricas com rating 'poor'
 */
export function getPoorMetrics(): WebVitalMetric[] {
  return collectedMetrics.filter((m) => m.rating === 'poor')
}

/**
 * Reseta métricas coletadas (útil para testes)
 */
export function resetMetrics() {
  collectedMetrics.length = 0
}

/**
 * Inicializa coleta automática de Web Vitals
 */
export function initWebVitals() {
  if (typeof window === 'undefined') return

  collectWebVitals()

  // Enviar métricas ao descarregar a página
  window.addEventListener('beforeunload', () => {
    const report = getWebVitalsReport()
    if (report.metrics.length > 0) {
      sendWebVitalsToServer(report)
    }
  })
}
