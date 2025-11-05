/**
 * Web Vitals - Core Web Vitals monitoring
 * Loga métricas no console apenas em desenvolvimento
 */

if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  // Lazy load web-vitals apenas em dev
  import('web-vitals').then(({ onCLS, onFID, onFCP, onLCP, onTTFB }) => {
    onCLS((metric) => {
      console.log('[Web Vitals] CLS:', metric.value.toFixed(4), metric)
    })

    onFID((metric) => {
      console.log('[Web Vitals] FID:', metric.value.toFixed(2) + 'ms', metric)
    })

    onFCP((metric) => {
      console.log('[Web Vitals] FCP:', metric.value.toFixed(2) + 'ms', metric)
    })

    onLCP((metric) => {
      console.log('[Web Vitals] LCP:', metric.value.toFixed(2) + 'ms', metric)
    })

    onTTFB((metric) => {
      console.log('[Web Vitals] TTFB:', metric.value.toFixed(2) + 'ms', metric)
    })
  }).catch((error) => {
    console.warn('Erro ao carregar web-vitals:', error)
  })
}

