"use client"

import { useState, useCallback, useRef, useEffect } from 'react'

import { motion } from 'framer-motion'

import { useRouter, useSearchParams } from '@/lib/next-navigation'

interface RouteState {
  selectedRoute?: string
  filters?: Record<string, any>
  sorting?: { field: string; direction: 'asc' | 'desc' }
  searchQuery?: string
}

interface NavigationOptions {
  preloadAssets?: boolean
  transitionDuration?: number
  maintainState?: boolean
  calculateZoom?: boolean
}

interface MapBounds {
  north: number
  south: number
  east: number
  west: number
}

export function useAdvancedNavigation() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [routeState, setRouteState] = useState<RouteState>({})
  const [preloadedAssets, setPreloadedAssets] = useState<Set<string>>(new Set())
  const transitionTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Transição animada com easing bezier personalizado
  const transitionConfig = {
    duration: 0.3,
    ease: [0.4, 0, 0.2, 1] as [number, number, number, number]
  }

  // Pré-carregamento de assets
  const preloadAssets = useCallback(async (targetTab: string): Promise<void> => {
    if (preloadedAssets.has(targetTab)) return

    const assetsToPreload: string[] = []
    
    switch (targetTab) {
      case 'mapa':
        assetsToPreload.push(
          '/icons/marker-pickup.svg',
          '/icons/marker-dropoff.svg',
          '/icons/bus-marker.svg'
        )
        break
      case 'rotas':
        assetsToPreload.push(
          '/icons/route.svg',
          '/icons/navigation.svg'
        )
        break
    }

    try {
      await Promise.all(
        assetsToPreload.map(async (asset) => {
          if (asset.startsWith('http')) {
            // Para scripts externos
            return new Promise((resolve, reject) => {
              const script = document.createElement('script')
              script.src = asset
              script.onload = resolve
              script.onerror = reject
              document.head.appendChild(script)
            })
          } else {
            // Para imagens e outros assets
            return new Promise((resolve, reject) => {
              const img = new Image()
              img.onload = resolve
              img.onerror = reject
              img.src = asset
            })
          }
        })
      )
      
      setPreloadedAssets(prev => new Set([...prev, targetTab]))
    } catch (error) {
      console.warn(`Erro ao pré-carregar assets para ${targetTab}:`, error)
    }
  }, [preloadedAssets])

  // Cálculo de zoom para englobar todos os pontos
  const calculateOptimalZoom = useCallback((points: Array<{ lat: number; lng: number }>): { center: { lat: number; lng: number }; zoom: number; bounds: MapBounds } => {
    if (points.length === 0) {
      return {
        center: { lat: -23.5505, lng: -46.6333 }, // São Paulo como fallback
        zoom: 10,
        bounds: { north: 0, south: 0, east: 0, west: 0 }
      }
    }

    if (points.length === 1) {
      const firstPoint = points[0]
      if (!firstPoint) {
        return {
          center: { lat: 0, lng: 0 },
          zoom: 10,
          bounds: { north: 0, south: 0, east: 0, west: 0 }
        }
      }
      
      return {
        center: firstPoint,
        zoom: 15,
        bounds: {
          north: firstPoint.lat + 0.01,
          south: firstPoint.lat - 0.01,
          east: firstPoint.lng + 0.01,
          west: firstPoint.lng - 0.01
        }
      }
    }

    // Calcular bounds
    const lats = points.map(p => p.lat)
    const lngs = points.map(p => p.lng)
    
    const bounds = {
      north: Math.max(...lats),
      south: Math.min(...lats),
      east: Math.max(...lngs),
      west: Math.min(...lngs)
    }

    // Adicionar margem de 20%
    const latMargin = (bounds.north - bounds.south) * 0.2
    const lngMargin = (bounds.east - bounds.west) * 0.2

    const adjustedBounds = {
      north: bounds.north + latMargin,
      south: bounds.south - latMargin,
      east: bounds.east + lngMargin,
      west: bounds.west - lngMargin
    }

    // Calcular centro
    const center = {
      lat: (adjustedBounds.north + adjustedBounds.south) / 2,
      lng: (adjustedBounds.east + adjustedBounds.west) / 2
    }

    // Calcular zoom baseado na distância
    const latDiff = adjustedBounds.north - adjustedBounds.south
    const lngDiff = adjustedBounds.east - adjustedBounds.west
    const maxDiff = Math.max(latDiff, lngDiff)
    
    let zoom = 15
    if (maxDiff > 0.1) zoom = 10
    else if (maxDiff > 0.05) zoom = 12
    else if (maxDiff > 0.01) zoom = 14
    else if (maxDiff > 0.005) zoom = 15
    else zoom = 16

    return { center, zoom, bounds: adjustedBounds }
  }, [])

  // Navegação avançada com todas as funcionalidades
  const navigateToTab = useCallback(async (
    targetTab: string,
    routePoints?: Array<{ lat: number; lng: number }>,
    options: NavigationOptions = {}
  ) => {
    const {
      preloadAssets: shouldPreload = true,
      transitionDuration = 300,
      maintainState = true,
      calculateZoom = true
    } = options

    setIsTransitioning(true)

    try {
      // 1. Pré-carregar assets se necessário
      if (shouldPreload) {
        await preloadAssets(targetTab)
      }

      // 2. Manter estado da rota se especificado
      if (maintainState) {
        const currentState: RouteState = {
          filters: Object.fromEntries(searchParams.entries())
        }
        
        const selectedRoute = searchParams.get('route')
        if (selectedRoute) {
          currentState.selectedRoute = selectedRoute
        }
        
        const searchQuery = searchParams.get('search')
        if (searchQuery) {
          currentState.searchQuery = searchQuery
        }
        
        setRouteState(currentState)
      }

      // 3. Calcular zoom e posicionamento se for mapa
      let mapParams = ''
      if (targetTab === 'mapa' && calculateZoom && routePoints && routePoints.length > 0) {
        const { center, zoom, bounds } = calculateOptimalZoom(routePoints)
        mapParams = `&lat=${center.lat}&lng=${center.lng}&zoom=${zoom}&bounds=${JSON.stringify(bounds)}`
      }

      // 4. Construir URL com parâmetros preservados
      const currentParams = new URLSearchParams(searchParams.toString())
      if (maintainState) {
        // Preservar parâmetros importantes
        const preservedParams = ['route', 'company', 'motorista', 'veiculo']
        preservedParams.forEach(param => {
          const value = currentParams.get(param)
          if (value) mapParams += `&${param}=${value}`
        })
      }

      // 5. Executar transição animada
      const targetUrl = `/admin/${targetTab}${mapParams ? `?${mapParams.substring(1)}` : ''}`
      
      // Usar timeout para garantir que a animação seja visível
      transitionTimeoutRef.current = setTimeout(() => {
        router.push(targetUrl)
        
        // Finalizar transição após duração especificada
        setTimeout(() => {
          setIsTransitioning(false)
        }, transitionDuration)
      }, 50)

    } catch (error) {
      console.error('Erro na navegação avançada:', error)
      setIsTransitioning(false)
    }
  }, [router, searchParams, preloadAssets, calculateOptimalZoom])

  // Limpar timeouts ao desmontar
  useEffect(() => {
    return () => {
      if (transitionTimeoutRef.current) {
        clearTimeout(transitionTimeoutRef.current)
      }
    }
  }, [])

  // Componente de transição
  const TransitionOverlay = useCallback(({ children }: { children: React.ReactNode }) => {
    if (!isTransitioning) return children

    return (
      <motion.div
        initial={{ opacity: 1 }}
        animate={{ opacity: 0 }}
        transition={transitionConfig}
        className="relative"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={transitionConfig}
          className="absolute inset-0 bg-white/80 backdrop-blur-sm z-50 flex items-center justify-center"
        >
          <div className="flex flex-col items-center gap-4">
            <div className="w-8 h-8 border-4 border-info border-t-transparent rounded-full animate-spin" />
            <p className="text-sm font-medium text-ink-muted">Carregando...</p>
          </div>
        </motion.div>
        {children}
      </motion.div>
    )
  }, [isTransitioning, transitionConfig])

  return {
    navigateToTab,
    isTransitioning,
    routeState,
    setRouteState,
    calculateOptimalZoom,
    TransitionOverlay,
    transitionConfig
  }
}
