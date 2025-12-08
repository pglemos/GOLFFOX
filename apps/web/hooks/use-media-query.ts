"use client"

import { useState, useEffect } from "react"

/**
 * Hook para detectar breakpoints usando media queries
 * @param query - Media query string (ex: "(min-width: 768px)")
 * @returns boolean - true se a query corresponde
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false)

  useEffect(() => {
    // Verificar se estamos no cliente
    if (typeof window === 'undefined') {
      return
    }

    const mediaQuery = window.matchMedia(query)
    
    // Definir valor inicial
    setMatches(mediaQuery.matches)

    // Handler para mudanças
    const handler = (event: MediaQueryListEvent) => {
      setMatches(event.matches)
    }

    // Adicionar listener (usar addEventListener se disponível, senão addListener)
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handler)
    } else {
      // Fallback para navegadores antigos
      mediaQuery.addListener(handler)
    }

    // Cleanup
    return () => {
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener('change', handler)
      } else {
        mediaQuery.removeListener(handler)
      }
    }
  }, [query])

  return matches
}

