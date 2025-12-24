'use client'

import { useEffect } from 'react'

import { initWebVitals } from '@/lib/web-vitals'
import { debug } from '@/lib/logger'

export function WebVitalsInit() {
  useEffect(() => {
    try {
      initWebVitals()
    } catch (err) {
      // Não bloquear renderização por erros não críticos de métricas
      debug('WebVitalsInit: init skipped', { error: err }, 'WebVitalsInit')
    }
  }, [])

  return null
}

