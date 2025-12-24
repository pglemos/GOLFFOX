"use client"

import { useCallback, useState } from "react"

import { warn } from "@/lib/logger"

const CACHE_PREFIX = "route_cache_"
const CACHE_DURATION = 5 * 60 * 1000 // 5 minutos

interface CacheEntry<T> {
  data: T
  expiry: number
}

/**
 * Hook para gerenciar cache de dados de rotas
 */
export function useMapCache() {
  const [cacheExpiry, setCacheExpiry] = useState<number | null>(null)

  const getCachedData = useCallback(<T,>(key: string): T | null => {
    try {
      const cached = localStorage.getItem(`${CACHE_PREFIX}${key}`)
      if (cached) {
        const entry: CacheEntry<T> = JSON.parse(cached)
        if (Date.now() < entry.expiry) {
          return entry.data
        } else {
          localStorage.removeItem(`${CACHE_PREFIX}${key}`)
        }
      }
    } catch (error) {
      warn('Erro ao acessar cache', { error }, 'UseMapCache')
    }
    return null
  }, [])

  const setCachedData = useCallback(<T,>(key: string, data: T): void => {
    try {
      const expiry = Date.now() + CACHE_DURATION
      const entry: CacheEntry<T> = { data, expiry }
      localStorage.setItem(`${CACHE_PREFIX}${key}`, JSON.stringify(entry))
      setCacheExpiry(expiry)
    } catch (error) {
      warn('Erro ao salvar cache', { error }, 'UseMapCache')
    }
  }, [])

  const clearCache = useCallback((key?: string): void => {
    if (key) {
      localStorage.removeItem(`${CACHE_PREFIX}${key}`)
    } else {
      // Limpar todo o cache com o prefixo
      Object.keys(localStorage)
        .filter(k => k.startsWith(CACHE_PREFIX))
        .forEach(k => localStorage.removeItem(k))
    }
    setCacheExpiry(null)
  }, [])

  return {
    getCachedData,
    setCachedData,
    clearCache,
    cacheExpiry,
  }
}
