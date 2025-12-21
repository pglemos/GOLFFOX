import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

interface UrlFiltersOptions {
  /**
   * Filtros iniciais dos props (companyId, transportadoraId, routeId)
   */
  initialFilters?: {
    company?: string | null
    transportadora?: string | null
    route?: string | null
  }
  /**
   * Callback chamado quando os filtros mudam
   */
  onFiltersChange?: (filters: Record<string, string>) => void
  /**
   * Debounce delay em ms para atualizar URL (padrão: 300ms)
   */
  debounceMs?: number
}

interface UrlFiltersReturn {
  /**
   * Estado atual dos filtros
   */
  filters: {
    company: string
    transportadora: string
    route: string
    status: string
  }
  /**
   * Função para atualizar filtros
   */
  setFilters: (updates: Partial<Record<string, string>>) => void
  /**
   * Função para atualizar um filtro específico
   */
  setFilter: (key: string, value: string) => void
  /**
   * Função para resetar filtros
   */
  resetFilters: () => void
}

/**
 * Hook para sincronizar filtros com URL query params
 * 
 * @example
 * const { filters, setFilter } = useUrlFilters({
 *   initialFilters: { company: companyId, route: routeId },
 *   debounceMs: 300
 * })
 */
export function useUrlFilters(options: UrlFiltersOptions = {}): UrlFiltersReturn {
  const { initialFilters = {}, onFiltersChange, debounceMs = 300 } = options
  const router = useRouter()
  const searchParams = useSearchParams()
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null)
  
  // Inicializar filtros a partir de props ou URL
  const [filters, setFiltersState] = useState(() => {
    return {
      company: initialFilters.company || searchParams?.get('company') || '',
      transportadora: initialFilters.transportadora || searchParams?.get('transportadora') || '',
      route: initialFilters.route || searchParams?.get('route') || '',
      status: searchParams?.get('status') || '',
    }
  })

  // Atualizar filtros quando props iniciais mudarem
  useEffect(() => {
    setFiltersState(prev => ({
      ...prev,
      company: initialFilters.company ?? prev.company,
      transportadora: initialFilters.transportadora ?? prev.transportadora,
      route: initialFilters.route ?? prev.route,
    }))
  }, [initialFilters.company, initialFilters.transportadora, initialFilters.route])

  // Função para atualizar URL (com debounce)
  const updateUrl = useCallback((newFilters: typeof filters) => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current)
    }
    
    debounceTimerRef.current = setTimeout(() => {
      const params = new URLSearchParams()
      if (newFilters.company) params.set('company', newFilters.company)
      if (newFilters.route) params.set('route', newFilters.route)
      if (newFilters.status) params.set('status', newFilters.status)
      
      const queryString = params.toString()
      const newUrl = queryString 
        ? `${window.location.pathname}?${queryString}`
        : window.location.pathname
      
      router.replace(newUrl, { scroll: false })
    }, debounceMs)
  }, [router, debounceMs])

  // Atualizar múltiplos filtros
  const setFilters = useCallback((updates: Partial<Record<string, string>>) => {
    setFiltersState(prev => {
      const newFilters = { ...prev, ...updates }
      updateUrl(newFilters)
      onFiltersChange?.(newFilters)
      return newFilters
    })
  }, [updateUrl, onFiltersChange])

  // Atualizar um filtro específico
  const setFilter = useCallback((key: string, value: string) => {
    setFilters({ [key]: value })
  }, [setFilters])

  // Resetar filtros
  const resetFilters = useCallback(() => {
    const defaultFilters = {
      company: initialFilters.company || '',
      transportadora: initialFilters.transportadora || '',
      route: initialFilters.route || '',
      status: '',
    }
    setFiltersState(defaultFilters)
    updateUrl(defaultFilters)
    onFiltersChange?.(defaultFilters)
  }, [initialFilters, updateUrl, onFiltersChange])

  // Cleanup do debounce timer
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }
    }
  }, [])

  return {
    filters,
    setFilters,
    setFilter,
    resetFilters,
  }
}

