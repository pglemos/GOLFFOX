'use client'

import { useEffect } from 'react'

import { initWebVitals } from '@/lib/web-vitals'

export function WebVitalsInit() {
  useEffect(() => {
    try {
      initWebVitals()
    } catch (err) {
      // Não bloquear renderização por erros não críticos de métricas
      console.debug('WebVitalsInit: init skipped', err)
    }
  }, [])

  return null
}

