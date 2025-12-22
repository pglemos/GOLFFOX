/**
 * Hook useAsyncData
 * 
 * Substitui o padrão useEffect + fetch por um hook reativo e tipado.
 * Features:
 * - Fetching automático ou manual
 * - Cache de sessão
 * - Refetch automático
 * - Estados de loading/error
 * - Suporte a dependências
 */

import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { debug, error as logError } from '@/lib/logger'
import type { ApiResponse } from '@/types/entities'

/**
 * Opções de configuração
 */
export interface AsyncDataOptions<TData, TParams = void> {
  /** Função que retorna a URL baseada nos parâmetros */
  url: string | ((params: TParams) => string)
  
  /** Parâmetros para a requisição */
  params?: TParams
  
  /** Se deve buscar automaticamente no mount (default: true) */
  immediate?: boolean
  
  /** Dependências que trigam refetch */
  deps?: unknown[]
  
  /** Headers adicionais */
  headers?: Record<string, string>
  
  /** Timeout em ms (default: 30000) */
  timeout?: number
  
  /** Intervalo de polling em ms (0 = desabilitado) */
  pollingInterval?: number
  
  /** Chave de cache para sessionStorage */
  cacheKey?: string
  
  /** TTL do cache em ms (default: 5 minutos) */
  cacheTtl?: number
  
  /** Callback de sucesso */
  onSuccess?: (data: TData) => void
  
  /** Callback de erro */
  onError?: (error: Error) => void
  
  /** Valor inicial dos dados */
  initialData?: TData
  
  /** Transformar dados antes de retornar */
  transform?: (data: unknown) => TData
  
  /** Se deve usar credentials (default: true) */
  credentials?: RequestCredentials
}

/**
 * Estado do hook
 */
export interface AsyncDataState<TData> {
  /** Dados carregados */
  data: TData | null
  
  /** Erro da última requisição */
  error: Error | null
  
  /** Se está carregando */
  loading: boolean
  
  /** Se já foi carregado pelo menos uma vez */
  isFetched: boolean
  
  /** Se está refetchando (loading após primeiro fetch) */
  isRefetching: boolean
  
  /** Timestamp do último fetch bem-sucedido */
  dataUpdatedAt: number | null
}

/**
 * Retorno do hook
 */
export interface UseAsyncDataReturn<TData> extends AsyncDataState<TData> {
  /** Refetch manual */
  refetch: () => Promise<void>
  
  /** Invalidar cache e refetch */
  invalidate: () => Promise<void>
  
  /** Atualizar dados manualmente (otimistic update) */
  setData: (data: TData | ((prev: TData | null) => TData)) => void
  
  /** Resetar estado */
  reset: () => void
}

/**
 * Cache em memória para dados
 */
const memoryCache = new Map<string, { data: unknown; timestamp: number }>()

/**
 * Hook para fetching de dados
 */
export function useAsyncData<TData = unknown, TParams = void>(
  options: AsyncDataOptions<TData, TParams>
): UseAsyncDataReturn<TData> {
  const {
    url,
    params,
    immediate = true,
    deps = [],
    headers: customHeaders = {},
    timeout = 30000,
    pollingInterval = 0,
    cacheKey,
    cacheTtl = 5 * 60 * 1000, // 5 minutos
    onSuccess,
    onError,
    initialData = null,
    transform,
    credentials = 'include',
  } = options

  const [state, setState] = useState<AsyncDataState<TData>>({
    data: initialData,
    error: null,
    loading: immediate,
    isFetched: false,
    isRefetching: false,
    dataUpdatedAt: null,
  })

  const abortControllerRef = useRef<AbortController | null>(null)
  const pollingRef = useRef<NodeJS.Timeout | null>(null)
  const mountedRef = useRef(true)

  /**
   * Verificar cache
   */
  const getCachedData = useCallback((): TData | null => {
    if (!cacheKey) return null

    // Tentar memória primeiro
    const memCached = memoryCache.get(cacheKey)
    if (memCached && Date.now() - memCached.timestamp < cacheTtl) {
      return memCached.data as TData
    }

    // Tentar sessionStorage
    if (typeof window !== 'undefined') {
      try {
        const cached = sessionStorage.getItem(cacheKey)
        if (cached) {
          const { data, timestamp } = JSON.parse(cached)
          if (Date.now() - timestamp < cacheTtl) {
            // Atualizar cache de memória
            memoryCache.set(cacheKey, { data, timestamp })
            return data as TData
          }
        }
      } catch {
        // Ignorar erros de parse
      }
    }

    return null
  }, [cacheKey, cacheTtl])

  /**
   * Salvar no cache
   */
  const setCachedData = useCallback((data: TData) => {
    if (!cacheKey) return

    const cacheEntry = { data, timestamp: Date.now() }
    
    // Salvar em memória
    memoryCache.set(cacheKey, cacheEntry)

    // Salvar em sessionStorage
    if (typeof window !== 'undefined') {
      try {
        sessionStorage.setItem(cacheKey, JSON.stringify(cacheEntry))
      } catch {
        // Ignorar erros de storage cheio
      }
    }
  }, [cacheKey])

  /**
   * Invalidar cache
   */
  const invalidateCache = useCallback(() => {
    if (!cacheKey) return

    memoryCache.delete(cacheKey)
    
    if (typeof window !== 'undefined') {
      try {
        sessionStorage.removeItem(cacheKey)
      } catch {
        // Ignorar
      }
    }
  }, [cacheKey])

  /**
   * Fetch de dados
   */
  const fetchData = useCallback(async (skipCache = false): Promise<void> => {
    // Verificar cache primeiro
    if (!skipCache) {
      const cached = getCachedData()
      if (cached !== null) {
        if (mountedRef.current) {
          setState(prev => ({
            ...prev,
            data: cached,
            loading: false,
            isFetched: true,
            dataUpdatedAt: Date.now(),
          }))
        }
        return
      }
    }

    // Cancelar requisição anterior
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }

    const abortController = new AbortController()
    abortControllerRef.current = abortController

    const timeoutId = setTimeout(() => abortController.abort(), timeout)

    if (mountedRef.current) {
      setState(prev => ({
        ...prev,
        loading: !prev.isFetched,
        isRefetching: prev.isFetched,
        error: null,
      }))
    }

    try {
      // Resolver URL
      const finalUrl = typeof url === 'function' ? url(params as TParams) : url

      debug(`Fetching ${finalUrl}`, { params }, 'useAsyncData')

      const response = await fetch(finalUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...customHeaders,
        },
        signal: abortController.signal,
        credentials,
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || errorData.message || `HTTP ${response.status}`)
      }

      const responseData = await response.json() as ApiResponse<TData>
      
      // Extrair dados
      let data: TData
      if (responseData.data !== undefined) {
        data = responseData.data
      } else if (responseData.success !== undefined) {
        // Resposta no formato { success: true, ... }
        data = responseData as unknown as TData
      } else {
        data = responseData as unknown as TData
      }

      // Transformar se necessário
      if (transform) {
        data = transform(data)
      }

      // Salvar no cache
      setCachedData(data)

      if (mountedRef.current) {
        setState({
          data,
          error: null,
          loading: false,
          isFetched: true,
          isRefetching: false,
          dataUpdatedAt: Date.now(),
        })

        if (onSuccess) {
          onSuccess(data)
        }
      }
    } catch (error) {
      clearTimeout(timeoutId)

      // Ignorar erros de abort
      if (error instanceof DOMException && error.name === 'AbortError') {
        return
      }

      const err = error instanceof Error ? error : new Error(String(error))

      logError('Fetch failed', { error: err.message, url }, 'useAsyncData')

      if (mountedRef.current) {
        setState(prev => ({
          ...prev,
          error: err,
          loading: false,
          isRefetching: false,
        }))

        if (onError) {
          onError(err)
        }
      }
    }
  }, [url, params, customHeaders, timeout, credentials, getCachedData, setCachedData, transform, onSuccess, onError])

  /**
   * Refetch manual
   */
  const refetch = useCallback(async () => {
    await fetchData(false)
  }, [fetchData])

  /**
   * Invalidar e refetch
   */
  const invalidate = useCallback(async () => {
    invalidateCache()
    await fetchData(true)
  }, [invalidateCache, fetchData])

  /**
   * Atualizar dados manualmente
   */
  const setData = useCallback((updater: TData | ((prev: TData | null) => TData)) => {
    setState(prev => {
      const newData = typeof updater === 'function' 
        ? (updater as (prev: TData | null) => TData)(prev.data)
        : updater
      
      // Atualizar cache também
      setCachedData(newData)
      
      return {
        ...prev,
        data: newData,
        dataUpdatedAt: Date.now(),
      }
    })
  }, [setCachedData])

  /**
   * Resetar estado
   */
  const reset = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
    if (pollingRef.current) {
      clearInterval(pollingRef.current)
    }
    invalidateCache()
    setState({
      data: initialData,
      error: null,
      loading: false,
      isFetched: false,
      isRefetching: false,
      dataUpdatedAt: null,
    })
  }, [initialData, invalidateCache])

  // Fetch inicial e quando deps mudam
  useEffect(() => {
    mountedRef.current = true

    if (immediate) {
      fetchData()
    }

    return () => {
      mountedRef.current = false
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, [immediate, ...deps])

  // Polling
  useEffect(() => {
    if (pollingInterval > 0) {
      pollingRef.current = setInterval(() => {
        fetchData(true)
      }, pollingInterval)

      return () => {
        if (pollingRef.current) {
          clearInterval(pollingRef.current)
        }
      }
    }
  }, [pollingInterval, fetchData])

  return {
    ...state,
    refetch,
    invalidate,
    setData,
    reset,
  }
}

/**
 * Hook simplificado para fetch de lista
 */
export function useListData<TItem>(
  url: string,
  options?: Omit<AsyncDataOptions<TItem[], void>, 'url'>
) {
  const result = useAsyncData<TItem[]>({
    url,
    initialData: [],
    ...options,
  })

  return {
    ...result,
    items: result.data || [],
    isEmpty: (result.data?.length || 0) === 0,
    count: result.data?.length || 0,
  }
}

/**
 * Hook para fetch com parâmetros
 */
export function useQueryData<TData, TParams extends Record<string, unknown>>(
  baseUrl: string,
  params: TParams,
  options?: Omit<AsyncDataOptions<TData, TParams>, 'url' | 'params'>
) {
  // Construir URL com query params
  const url = useMemo(() => {
    const searchParams = new URLSearchParams()
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        searchParams.append(key, String(value))
      }
    })
    const queryString = searchParams.toString()
    return queryString ? `${baseUrl}?${queryString}` : baseUrl
  }, [baseUrl, params])

  return useAsyncData<TData>({
    url,
    deps: [url],
    ...options,
  })
}

export default useAsyncData

