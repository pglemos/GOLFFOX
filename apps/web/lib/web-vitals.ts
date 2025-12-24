/**
 * Web Vitals - Monitoramento de Performance
 * Integração com Core Web Vitals (CLS, LCP, INP/FCP)
 */

import { onCLS, onFCP, onINP, onLCP, onTTFB } from 'web-vitals'

import { warn, debug } from './logger'

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
  INP: { good: 200, poor: 500 },
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
      warn(`CLS ${rating}: ${metric.value.toFixed(3)}`, { metric }, 'WebVitals')
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

  // INP - Interaction to Next Paint (substitui FID)
  onINP((metric) => {
    const rating = getRating('INP', metric.value)
    collectedMetrics.push({
      name: 'INP',
      value: metric.value,
      delta: metric.delta,
      id: metric.id,
      rating,
      navigationType: metric.navigationType || 'unknown',
    })

    if (rating === 'poor') {
      warn(`INP ${rating}: ${metric.value.toFixed(2)}ms`, { metric }, 'WebVitals')
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
      warn(`LCP ${rating}: ${metric.value.toFixed(2)}ms`, { metric }, 'WebVitals')
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
      warn(`TTFB ${rating}: ${metric.value.toFixed(2)}ms`, { metric }, 'WebVitals')
    }
  })
}

/**
 * Envia métricas para o servidor (opcional)
 */
export async function sendWebVitalsToServer(report: WebVitalsReport) {
  const url = '/api/analytics/web-vitals'
  const payload = JSON.stringify(report)

  try {
    // Preferir envio não-bloqueante com Beacon quando disponível
    if (typeof navigator !== 'undefined' && 'sendBeacon' in navigator) {
      const blob = new Blob([payload], { type: 'application/json' })
      const ok = (navigator as { sendBeacon?: (url: string, blob: Blob) => boolean }).sendBeacon?.(url, blob) ?? false
      if (ok) return
      // Fallback caso Beacon retorne false
    }

    await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: payload,
      keepalive: true,
      cache: 'no-store',
    })
  } catch (error) {
    // Evitar ruído de erro quando a página está sendo ocultada/fechada
    try {
      if (typeof document !== 'undefined' && document.visibilityState === 'hidden') {
        return
      }
    } catch {}
    debug('Web Vitals: envio não crítico, erro ignorado', { error }, 'WebVitals')
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

  // Enviar métricas quando o documento for ocultado (mais confiável que beforeunload)
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
      const report = getWebVitalsReport()
      if (report.metrics.length > 0 && navigator.onLine) {
        sendWebVitalsToServer(report)
      }
    }
  })
}
