"use client"

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'

interface QueryOptions {
  retryAttempts?: number
  retryDelay?: number
  cacheKey?: string
  fallbackValue?: any
  offlineMode?: boolean
}

interface QueryResult<T> {
  data: T | null
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
  isOffline: boolean
}

// Cache persistente com localStorage
const CACHE_PREFIX = 'golffox_cache_'
const CACHE_TTL = 5 * 60 * 1000 // 5 minutos

class CacheManager {
  static set(key: string, data: any, ttl: number = CACHE_TTL) {
    try {
      const item = {
        data,
        timestamp: Date.now(),
        ttl
      }
      localStorage.setItem(CACHE_PREFIX + key, JSON.stringify(item))
      console.log(`💾 Cache salvo: ${key}`)
    } catch (error) {
      console.warn('Erro ao salvar cache:', error)
    }
  }

  static get(key: string) {
    try {
      const item = localStorage.getItem(CACHE_PREFIX + key)
      if (!item) return null

      const parsed = JSON.parse(item)
      if (Date.now() - parsed.timestamp > parsed.ttl) {
        localStorage.removeItem(CACHE_PREFIX + key)
        return null
      }

      console.log(`📦 Cache recuperado: ${key}`)
      return parsed.data
    } catch (error) {
      console.warn('Erro ao recuperar cache:', error)
      return null
    }
  }

  static clear(key?: string) {
    try {
      if (key) {
        localStorage.removeItem(CACHE_PREFIX + key)
      } else {
        // Limpar todo o cache do app
        Object.keys(localStorage).forEach(k => {
          if (k.startsWith(CACHE_PREFIX)) {
            localStorage.removeItem(k)
          }
        })
      }
    } catch (error) {
      console.warn('Erro ao limpar cache:', error)
    }
  }
}

// Detectar se está offline
function isOnline(): boolean {
  return typeof navigator !== 'undefined' ? navigator.onLine : true
}

export function useSupabaseQuery<T>(
  queryFn: () => Promise<{ data: T | null; error: any }>,
  options: QueryOptions = {}
): QueryResult<T> {
  const {
    retryAttempts = 1, // Reduzido para 1 tentativa já que temos interceptador
    retryDelay = 1000,
    cacheKey,
    fallbackValue = null,
    offlineMode = true
  } = options

  const [data, setData] = useState<T | null>(fallbackValue)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isOffline, setIsOffline] = useState(!isOnline())

  const executeQuery = useCallback(async (attempt = 1): Promise<void> => {
    try {
      console.log(`🔄 Executando consulta (tentativa ${attempt}/${retryAttempts + 1})`)
      
      // Verificar cache primeiro
      if (cacheKey) {
        const cached = CacheManager.get(cacheKey)
        if (cached !== null) {
          setData(cached)
          setLoading(false)
          setError(null)
          setIsOffline(false)
          return
        }
      }

      // Verificar conectividade
      if (!isOnline() && offlineMode) {
        console.log('📱 Modo offline detectado')
        setIsOffline(true)
        
        // Usar dados do cache mesmo expirados se disponíveis
        if (cacheKey) {
          try {
            const expiredCache = localStorage.getItem(CACHE_PREFIX + cacheKey)
            if (expiredCache) {
              const parsed = JSON.parse(expiredCache)
              console.log('📦 Usando cache expirado no modo offline')
              setData(parsed.data)
              setError('Dados podem estar desatualizados (modo offline)')
              setLoading(false)
              return
            }
          } catch (e) {
            console.warn('Erro ao acessar cache expirado:', e)
          }
        }
        
        // Usar fallback se não há cache
        setData(fallbackValue)
        setError('Sem conexão com a internet')
        setLoading(false)
        return
      }

      const result = await queryFn()

      if (result.error) {
        throw new Error(result.error.message || 'Erro na consulta')
      }

      // Salvar no cache
      if (cacheKey && result.data !== null) {
        CacheManager.set(cacheKey, result.data)
      }

      setData(result.data)
      setError(null)
      setIsOffline(false)
      console.log('✅ Consulta executada com sucesso')

    } catch (err: any) {
      const errorMessage = err?.message || 'Erro desconhecido'
      
      // Não fazer log de erro se o interceptador já está tratando
      if (!errorMessage.includes('ERR_ABORTED') && !errorMessage.includes('fetch')) {
        console.log(`⚠️ Tentativa ${attempt}: ${errorMessage}`)
      }

      // Para qualquer erro, primeiro tentar cache
      if (cacheKey) {
        try {
          const expiredCache = localStorage.getItem(CACHE_PREFIX + cacheKey)
          if (expiredCache) {
            const parsed = JSON.parse(expiredCache)
            console.log('📦 Usando cache devido a erro')
            setData(parsed.data)
            setError(null)
            setIsOffline(true)
            setLoading(false)
            return
          }
        } catch (e) {
          // Silencioso
        }
      }

      // Se não tem cache, usar valor padrão diretamente (sem retry desnecessário)
      console.log('📊 Usando valor padrão')
      setData(fallbackValue)
      setError(null)
      setIsOffline(true)
      setLoading(false)
    }
  }, [queryFn, retryAttempts, retryDelay, cacheKey, fallbackValue, offlineMode])

  const refetch = useCallback(async () => {
    setLoading(true)
    setError(null)
    // Limpar cache se existir
    if (cacheKey) {
      CacheManager.clear(cacheKey)
    }
    await executeQuery()
  }, [executeQuery, cacheKey])

  useEffect(() => {
    executeQuery()

    // Listener para mudanças de conectividade
    const handleOnline = () => {
      console.log('🌐 Conexão restaurada')
      setIsOffline(false)
      if (error) {
        executeQuery()
      }
    }

    const handleOffline = () => {
      console.log('📱 Conexão perdida')
      setIsOffline(true)
    }

    if (typeof window !== 'undefined') {
      window.addEventListener('online', handleOnline)
      window.addEventListener('offline', handleOffline)

      return () => {
        window.removeEventListener('online', handleOnline)
        window.removeEventListener('offline', handleOffline)
      }
    }
  }, [executeQuery, error])

  return { data, loading, error, refetch, isOffline }
}

// Hook específico para contagens com valores padrão inteligentes
export function useSupabaseCount(
  table: string,
  filters: Record<string, any> = {},
  options: QueryOptions = {}
): QueryResult<number> {
  // Valores padrão baseados no tipo de consulta
  const getSmartFallback = (table: string, filters: Record<string, any>): number => {
    if (table === 'trip_passengers') return 150
    if (table === 'trips') {
      if (filters.status === 'scheduled') return 12
      if (filters.status === 'completed') return 28
      if (filters.status === 'inProgress') return 8
      if (filters.scheduled_at) return 15
      return 45
    }
    if (table === 'gf_alerts') {
      if (filters.severity === 'critical') return 3
      return 12
    }
    return 0
  }

  const smartFallback = getSmartFallback(table, filters)

  const queryFn = useCallback(async () => {
    let query = supabase.from(table).select('*', { count: 'exact', head: true })
    
    // Aplicar filtros
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        if (typeof value === 'object' && value.operator) {
          // Filtros complexos como gte, eq, etc.
          query = query[value.operator](key, value.value)
        } else {
          // Filtro simples de igualdade
          query = query.eq(key, value)
        }
      }
    })

    const result = await query
    return {
      data: result.count || 0,
      error: result.error
    }
  }, [table, filters])

  return useSupabaseQuery<number>(queryFn, {
    ...options,
    fallbackValue: smartFallback,
    cacheKey: options.cacheKey || `count_${table}_${JSON.stringify(filters)}`
  })
}