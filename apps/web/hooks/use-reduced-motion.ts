/**
 * Hook useReducedMotion
 * 
 * Verifica se o usuário prefere movimento reduzido.
 * Útil para acessibilidade e respeitar preferências do sistema.
 */

"use client"

import { useState, useEffect } from 'react'

/**
 * Hook para verificar preferência de movimento reduzido
 */
export function useReducedMotion(): boolean {
  const [shouldReduceMotion, setShouldReduceMotion] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return

    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    setShouldReduceMotion(mediaQuery.matches)

    const handleChange = (event: MediaQueryListEvent) => {
      setShouldReduceMotion(event.matches)
    }

    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [])

  return shouldReduceMotion
}

export default useReducedMotion

