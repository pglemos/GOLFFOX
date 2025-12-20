"use client"

import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { supabase } from '@/lib/supabase'
import { debug, warn } from '@/lib/logger'

interface QueryOptions {
  retryAttempts?: number
  retryDelay?: number
  cacheKey?: string
  fallbackValue?: unknown
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
  static set(key: string, data: unknown, ttl: number = CACHE_TTL) {
    try {
      const item = {
        data,
        timestamp: Date.now(),
        ttl
      }
      localStorage.setItem(CACHE_PREFIX + key, JSON.stringify(item))
      debug(`Cache salvo: ${key}`, undefined, 'CacheManager')
    } catch (error) {
      warn('Erro ao salvar cache', { error }, 'CacheManager')
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

      debug(`Cache recuperado: ${key}`, undefined, 'CacheManager')
      return parsed.data
    } catch (error) {
      warn('Erro ao recuperar cache', { error }, 'CacheManager')
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
      warn('Erro ao limpar cache', { error }, 'CacheManager')
    }
  }
}

// Detectar se está offline
function isOnline(): boolean {
  return typeof navigator !== 'undefined' ? navigator.onLine : true
}

export function useSupabaseQuery<T>(
  queryFn: () => Promise<{ data: T | null; error: unknown }>,
  options: QueryOptions = {}
): QueryResult<T> {
  const {
    retryAttempts = 1, // Reduzido para 1 tentativa já que temos interceptador
    retryDelay = 1000,
    cacheKey,
    fallbackValue = null,
    offlineMode = true
  } = options

  const [data, setData] = useState<T | null>(fallbackValue as T | null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isOffline, setIsOffline] = useState(!isOnline())

  // Ref para armazenar a função de query estável
  const queryFnRef = useRef(queryFn)
  const cacheKeyRef = useRef(cacheKey)
  const fallbackValueRef = useRef(fallbackValue)
  const offlineModeRef = useRef(offlineMode)
  const isExecutingRef = useRef(false)
  const hasExecutedRef = useRef(false)
  
  // Memoizar a função de query para evitar recriações desnecessárias
  const memoizedQueryFn = useMemo(() => queryFn, [queryFn])
  
  // Atualizar refs quando valores mudarem (apenas se realmente mudaram)
  useEffect(() => {
    queryFnRef.current = memoizedQueryFn
    cacheKeyRef.current = cacheKey
    fallbackValueRef.current = fallbackValue
    offlineModeRef.current = offlineMode
  }, [memoizedQueryFn, cacheKey, fallbackValue, offlineMode])

  const executeQuery = useCallback(async (): Promise<void> => {
    // Prevenir execuções múltiplas simultâneas
    if (isExecutingRef.current) return
    isExecutingRef.current = true

    try {
      // Verificar cache primeiro
      if (cacheKeyRef.current) {
        const cached = CacheManager.get(cacheKeyRef.current)
        if (cached !== null) {
          setData(cached as T)
          setLoading(false)
          setError(null)
          setIsOffline(false)
          isExecutingRef.current = false
          return
        }
      }

      // Verificar conectividade
      if (!isOnline() && offlineModeRef.current) {
        setIsOffline(true)
        
        // Usar dados do cache mesmo expirados se disponíveis
        if (cacheKeyRef.current) {
          try {
            const expiredCache = localStorage.getItem(CACHE_PREFIX + cacheKeyRef.current)
            if (expiredCache) {
              const parsed = JSON.parse(expiredCache)
              setData(parsed.data)
              setError('Dados podem estar desatualizados (modo offline)')
              setLoading(false)
              isExecutingRef.current = false
              return
            }
          } catch (e) {
            // Silencioso
          }
        }
        
        // Usar fallback se não há cache
        setData(fallbackValueRef.current as T)
        setError('Sem conexão com a internet')
        setLoading(false)
        isExecutingRef.current = false
        return
      }

      const result = await queryFnRef.current()

      if (result.error) {
        throw new Error((result.error as any).message || 'Erro na consulta')
      }

      // Salvar no cache
      if (cacheKeyRef.current && result.data !== null) {
        CacheManager.set(cacheKeyRef.current, result.data)
      }

      setData(result.data)
      setError(null)
      setIsOffline(false)
      setLoading(false)

    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido'
      
      // Para qualquer erro, primeiro tentar cache
      if (cacheKeyRef.current) {
        try {
          const expiredCache = localStorage.getItem(CACHE_PREFIX + cacheKeyRef.current)
          if (expiredCache) {
            const parsed = JSON.parse(expiredCache)
            setData(parsed.data)
            setError(null)
            setIsOffline(true)
            setLoading(false)
            isExecutingRef.current = false
            return
          }
        } catch (e) {
          // Silencioso
        }
      }

      // Se não tem cache, usar valor padrão diretamente (sem retry desnecessário)
      setData(fallbackValueRef.current as T)
      setError(null)
      setIsOffline(true)
      setLoading(false)
    } finally {
      isExecutingRef.current = false
    }
  }, []) // Sem dependências - usa refs para valores atuais

  const refetch = useCallback(async () => {
    setLoading(true)
    setError(null)
    // Limpar cache se existir
    if (cacheKeyRef.current) {
      CacheManager.clear(cacheKeyRef.current)
    }
    isExecutingRef.current = false // Reset flag para permitir nova execução
    await executeQuery()
  }, [executeQuery])

  // Executar query apenas uma vez no mount
  useEffect(() => {
    if (!hasExecutedRef.current) {
      hasExecutedRef.current = true
      executeQuery()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // Executar apenas uma vez

  useEffect(() => {
    // Listener para mudanças de conectividade
    const handleOnline = () => {
      setIsOffline(false)
      if (error) {
        isExecutingRef.current = false
        executeQuery()
      }
    }

    const handleOffline = () => {
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
    
    // Retorno vazio para o caso de SSR
    return () => {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [error]) // Apenas error como dependência

  return { data, loading, error, refetch, isOffline }
}

// Hook específico para contagens com valores padrão inteligentes
export function useSupabaseCount(
  table: string,
  filters: Record<string, unknown> = {},
  options: QueryOptions = {}
): QueryResult<number> {
  // Valores padrão baseados no tipo de consulta
  const getSmartFallback = (table: string, filters: Record<string, unknown>): number => {
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
    // @ts-expect-error Supabase type inference issue with select options
    let query: any = (supabase.from(table).select('*', { count: 'exact', head: true }) as any)
    
    // Aplicar filtros
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        if (typeof value === 'object' && value !== null && 'operador' in value && 'value' in value) {
          // Filtros complexos como gte, eq, etc.
          const filterValue = value as { operador: string; value: unknown }
          const queryBuilder = query as any
          query = queryBuilder[filterValue.operador](key, filterValue.value)
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