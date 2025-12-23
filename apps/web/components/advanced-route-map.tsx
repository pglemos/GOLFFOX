"use client"

import { useEffect, useState, useCallback, useRef, memo, useTransition } from "react"

import { setOptions, importLibrary } from "@googlemaps/js-api-loader"
import { motion, AnimatePresence } from "framer-motion"
import { Clock, Users, MapPin, Navigation, X, AlertCircle, Maximize2, Minimize2, RefreshCw, Timer, Route as RouteIcon, Layers, Play, Pause, RotateCcw, Phone, MessageSquare, User, Wifi, WifiOff, Activity, Accessibility, Keyboard } from "lucide-react"

import { usePlaybackReducer, useUIReducer, useNavigationReducer } from "@/hooks/reducers/playback-reducer"

import { useResponsive, useReducedMotion } from '@/hooks/use-responsive'
import { usePerformance } from '@/hooks/use-performance'
import { useAccessibility } from '@/hooks/use-accessibility'
import { useMapCache } from '@/hooks/use-map-cache'
import { createMarkerIcon } from '@/lib/map-utils/marker-icon-factory'
import { createRoutePolyline } from '@/lib/map-utils/polyline-renderer'
import { loadRouteData as loadRouteDataService, type RouteData, type RouteStop, type PassageiroInfo } from '@/lib/map-utils/route-data-loader'
import { RouteHeader } from './route-map/route-header'
import { ConnectivityIndicator } from './route-map/connectivity-indicator'
import { formatDuration, formatDistance } from '@/lib/kpi-utils'
import { supabase } from "@/lib/supabase"
import { AccessibilityControls, useAccessibilityControls } from './accessibility-controls'
import { AdvancedPlaybackControls } from './advanced-playback-controls'
import AdvancedTooltip from './advanced-tooltip'
import { InteractiveMarkerHotspot } from './interactive-marker-hotspot'
import { MapSkeletonLoader } from './map-skeleton-loader'
import TemporalProgressBar from './temporal-progress-bar'
import { Badge } from "./ui/badge"
import { Button } from "./ui/button"
import { Card } from "./ui/card"

// Tipos importados de route-data-loader
// RouteData, RouteStop já importados acima

// Tipo estendido para RouteStop com propriedades de estado
type RouteStopWithState = RouteStop & {
  isCurrent?: boolean
  isCompleted?: boolean
}

interface AdvancedRouteMapProps {
  routeId: string
  className?: string
  onClose?: () => void
  initialZoom?: number
  showControls?: boolean
}

export const AdvancedRouteMap = memo(function AdvancedRouteMap({ 
  routeId, 
  className = '', 
  onClose,
  initialZoom = 13,
  showControls = true
}: AdvancedRouteMapProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const googleMapRef = useRef<google.maps.Map | null>(null)
  const markersRef = useRef<google.maps.Marker[]>([])
  const polylineRef = useRef<google.maps.Polyline | null>(null)
  
  // Hooks de performance, responsividade e acessibilidade
  const { isMobile, isTablet, currentBreakpoint } = useResponsive()
  const prefersReducedMotion = useReducedMotion()
  const { metrics, isPerformanceGood, measureOperation } = usePerformance()
  const { state: accessibilityState, announce, focusElement } = useAccessibility()
  const accessibilityControls = useAccessibilityControls()
  const [isPending, startTransition] = useTransition()
  
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [routeData, setRouteData] = useState<RouteData | null>(null)
  const [selectedStop, setSelectedStop] = useState<RouteStop | null>(null)
  const [currentTime, setCurrentTime] = useState(new Date())
  const [mapLoaded, setMapLoaded] = useState(false)
  const [isOnline, setIsOnline] = useState(navigator.onLine)
  
  // Estados gerenciados por reducers
  const [playbackState, playbackDispatch] = usePlaybackReducer()
  const [uiState, uiDispatch] = useUIReducer()
  const [navigationState, navigationDispatch] = useNavigationReducer()
  const mapContainerRef = useRef<HTMLDivElement>(null)

  // Hook de cache
  const { getCachedData, setCachedData, cacheExpiry } = useMapCache()

  // Funções de navegação por teclado
  const focusMarker = useCallback((index: number) => {
    if (!routeData || !markersRef.current[index]) return
    
    const marker = markersRef.current[index]
    const stop = routeData.stops[index]
    
    // Centralizar mapa no marcador
    if (googleMapRef.current) {
      googleMapRef.current.panTo(marker.getPosition()!)
      googleMapRef.current.setZoom(16)
    }
    
    // Selecionar parada e mostrar informações
    setSelectedStop(stop || null)
    navigationDispatch({ type: 'SET_FOCUSED_MARKER', payload: index })
    
    // Anunciar para leitores de tela
    if (stop) {
      announce(`Marcador ${index + 1} selecionado: ${stop.passenger_name} em ${stop.address}`)
    }
  }, [routeData, announce])

  const handleKeyboardNavigation = useCallback((event: KeyboardEvent) => {
    if (!navigationState.keyboardNavigationActive || !routeData) return
    
    switch (event.key) {
      case 'ArrowRight':
      case 'ArrowDown':
        event.preventDefault()
        const nextIndex = Math.min(navigationState.focusedMarkerIndex + 1, routeData.stops.length - 1)
        focusMarker(nextIndex)
        break
        
      case 'ArrowLeft':
      case 'ArrowUp':
        event.preventDefault()
        const prevIndex = Math.max(navigationState.focusedMarkerIndex - 1, 0)
        focusMarker(prevIndex)
        break
        
      case 'Home':
        event.preventDefault()
        focusMarker(0)
        break
        
      case 'End':
        event.preventDefault()
        focusMarker(routeData.stops.length - 1)
        break
        
      case 'Enter':
      case ' ':
        event.preventDefault()
        if (navigationState.focusedMarkerIndex >= 0) {
          const stop = routeData.stops[navigationState.focusedMarkerIndex]
          setSelectedStop(stop || null)
          if (stop) {
            announce(`Detalhes da parada: ${stop.passenger_name}`)
          }
        }
        break
        
      case 'Escape':
        event.preventDefault()
        navigationDispatch({ type: 'SET_KEYBOARD_NAV_ACTIVE', payload: false })
        navigationDispatch({ type: 'SET_FOCUSED_MARKER', payload: -1 })
        setSelectedStop(null)
        announce('Navegação por teclado desativada')
        break
    }
  }, [navigationState.keyboardNavigationActive, routeData, navigationState.focusedMarkerIndex, focusMarker, announce])

  const activateKeyboardNavigation = useCallback(() => {
    navigationDispatch({ type: 'SET_KEYBOARD_NAV_ACTIVE', payload: true })
    if (routeData && routeData.stops.length > 0) {
      focusMarker(0)
    }
    announce('Navegação por teclado ativada. Use as setas para navegar entre marcadores')
  }, [routeData, focusMarker, announce])

  // Monitorar conectividade
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true)
      announce('Conexão restaurada')
    }
    const handleOffline = () => {
      setIsOnline(false)
      announce('Conexão perdida - usando dados em cache')
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  // Event listener para navegação por teclado
  useEffect(() => {
    if (navigationState.keyboardNavigationActive) {
      document.addEventListener('keydown', handleKeyboardNavigation)
      return () => {
        document.removeEventListener('keydown', handleKeyboardNavigation)
      }
    }
    return undefined
  }, [navigationState.keyboardNavigationActive, handleKeyboardNavigation])

  // Carregar dados da rota
  const loadRouteData = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)
      announce('Carregando dados da rota')

      // Verificar cache primeiro
      const cacheKey = `route_${routeId}`
      const cachedData = getCachedData<RouteData>(cacheKey)
      
      if (cachedData && isOnline) {
        setRouteData(cachedData)
        setIsLoading(false)
        await measureOperation('load_cached', async () => cachedData)
        announce('Dados da rota carregados do cache')
        return
      }

      if (!isOnline) {
        throw new Error('Sem conexão com a internet. Dados em cache não disponíveis.')
      }
      
      // Buscar dados da rota usando measureOperation
      const routeDataFormatted = await measureOperation('load_supabase', async () => {
        return await loadRouteDataService(routeId)
      })

      startTransition(() => {
        setRouteData(routeDataFormatted)
      })

      // Salvar no cache
      setCachedData(cacheKey, routeDataFormatted)
      announce(`Rota ${routeDataFormatted.name} carregada com ${routeDataFormatted.stops.length} paradas`)

    } catch (err) {
      console.error('Erro ao carregar dados da rota:', err)
      setError('Erro ao carregar dados da rota')
      announce('Erro ao carregar dados da rota')
    } finally {
      setIsLoading(false)
    }
  }, [routeId, getCachedData, setCachedData, measureOperation, isOnline, announce])

  // Inicializar mapa
  const initializeMap = useCallback(async () => {
    if (!mapRef.current || !routeData?.stops.length) return

    try {
      announce('Inicializando mapa')
      
      await measureOperation('initialize_map', async () => {
        // Configurar Google Maps
        setOptions({
          libraries: ["places", "geometry", "drawing"]
        })

        const { Map } = await importLibrary("maps") as google.maps.MapsLibrary
        const { AdvancedMarkerElement } = await importLibrary("marker") as google.maps.MarkerLibrary

        // Calcular bounds para incluir todas as paradas
        const bounds = new google.maps.LatLngBounds()
        routeData.stops.forEach(stop => {
          bounds.extend({ lat: stop.lat, lng: stop.lng })
        })

        // Criar mapa com configurações otimizadas para performance
        const mapOptions: google.maps.MapOptions = {
          center: bounds.getCenter(),
          zoom: initialZoom,
          mapTypeId: google.maps.MapTypeId.ROADMAP,
          styles: [
            {
              featureType: "poi",
              elementType: "labels",
              stylers: [{ visibility: "off" }]
            },
            {
              featureType: "transit",
              elementType: "labels",
              stylers: [{ visibility: "off" }]
            }
          ],
          disableDefaultUI: !showControls,
          gestureHandling: "cooperative",
          zoomControl: showControls,
          mapTypeControl: false,
          scaleControl: true,
          streetViewControl: false,
          rotateControl: false,
          fullscreenControl: false,
          // Otimizações de performance
          clickableIcons: false,
          keyboardShortcuts: accessibilityState.isKeyboardUser,
          restriction: {
            latLngBounds: bounds,
            strictBounds: false
          }
        }

        // Aplicar configurações de movimento reduzido se necessário
        if (prefersReducedMotion) {
          mapOptions.gestureHandling = "none"
        }

        if (!mapRef.current) {
          throw new Error('Map container not found')
        }

        const map = new Map(mapRef.current, mapOptions)
        googleMapRef.current = map

        // Ajustar zoom com margem de 20%
        map.fitBounds(bounds, { top: 50, right: 50, bottom: 50, left: 50 })

        // Criar polyline do trajeto usando utilitário
        if (routeData.stops.length > 1) {
          const stops = routeData.stops.map(stop => ({ lat: stop.lat, lng: stop.lng }))
          const polyline = createRoutePolyline(map, stops, prefersReducedMotion)
          polylineRef.current = polyline
        }

        // Criar marcadores para as paradas
        routeData.stops.forEach((stop, index) => {
          const marker = new google.maps.Marker({
            position: { lat: stop.lat, lng: stop.lng },
            map: map,
            title: stop.stop_name,
            icon: {
              url: stop.stop_type === 'pickup' ? 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="12" cy="12" r="10" fill="#10B981" stroke="#ffffff" stroke-width="2"/>
                  <text x="12" y="16" text-anchor="middle" fill="white" font-size="12" font-weight="bold">${index + 1}</text>
                </svg>
              `) : 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="12" cy="12" r="10" fill="#EF4444" stroke="#ffffff" stroke-width="2"/>
                  <text x="12" y="16" text-anchor="middle" fill="white" font-size="12" font-weight="bold">${index + 1}</text>
                </svg>
              `),
              scaledSize: new google.maps.Size(32, 32),
              anchor: new google.maps.Point(16, 16)
            }
          })
          
          markersRef.current.push(marker)
        })

        return map
      })

      setMapLoaded(true)
      announce(`Mapa inicializado com ${routeData.stops.length} paradas`)

    } catch (err) {
      console.error('Erro ao inicializar mapa:', err)
      setError('Erro ao carregar o mapa')
      announce('Erro ao carregar o mapa')
    }
  }, [routeData, initialZoom, showControls, measureOperation, announce, accessibilityState.isKeyboardUser, prefersReducedMotion])

  // Função helper para criar ícone usando o factory
  const createCustomMarkerIcon = useCallback((type: 'pickup' | 'dropoff', number: number, isFocused: boolean = false): google.maps.Icon => {
    return createMarkerIcon(type, number, isFocused, isMobile)
  }, [isMobile])

  // Criar marcadores customizados com lazy loading e otimizações
  const createStopMarkers = useCallback(async (google: typeof window.google, map: google.maps.Map) => {
    if (!routeData?.stops.length) return

    // Limpar marcadores anteriores
    markersRef.current.forEach(marker => marker.setMap(null))
    markersRef.current = []

    // Função para criar marcador individual
    const createSingleMarker = (stop: RouteStop, index: number) => {
      const markerIcon = createCustomMarkerIcon(stop.stop_type, index + 1, navigationState.focusedMarkerIndex === index)
      
      const marker = new google.maps.Marker({
        position: { lat: stop.lat, lng: stop.lng },
        map,
        icon: markerIcon,
        title: `Parada ${index + 1}: ${stop.passenger_name} - ${stop.address}`,
        zIndex: navigationState.focusedMarkerIndex === index ? 20 : 10,
        optimized: !prefersReducedMotion // Usar otimização quando motion reduzido está desabilitado
      })

      // Adicionar eventos de hover e clique
      marker.addListener('mouseover', (event: google.maps.MapMouseEvent) => {
        if (event.domEvent && 'pageX' in event.domEvent && 'pageY' in event.domEvent) {
          uiDispatch({ type: 'SET_TOOLTIP_POSITION', payload: {
            x: event.domEvent.pageX,
            y: event.domEvent.pageY
          }})
          setSelectedStop(stop)
          uiDispatch({ type: 'SET_SHOW_TOOLTIP', payload: true })
        }
      })

      marker.addListener('mouseout', () => {
        if (!navigationState.keyboardNavigationActive) {
          uiDispatch({ type: 'SET_SHOW_TOOLTIP', payload: false })
          setSelectedStop(null)
        }
      })

      marker.addListener('click', () => {
        setSelectedStop(stop)
        setFocusedMarkerIndex(index)
        // Centralizar mapa na parada selecionada
        map.panTo({ lat: stop.lat, lng: stop.lng })
        map.setZoom(16)
        announce(`Parada selecionada: ${stop.passenger_name}`)
      })

      return marker
    }

    // Implementar lazy loading para muitos marcadores
    if (routeData.stops.length > 20) {
      // Carregar marcadores em batches para melhor performance
      const batchSize = 5
      const batches = []
      
      for (let i = 0; i < routeData.stops.length; i += batchSize) {
        batches.push(routeData.stops.slice(i, i + batchSize))
      }

      // Processar batches com delay para não bloquear a UI
      for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
        const batch = batches[batchIndex]
        
        // Usar requestAnimationFrame para não bloquear a UI
        await new Promise(resolve => {
          requestAnimationFrame(() => {
            if (batch) {
              batch.forEach((stop, localIndex) => {
                const globalIndex = batchIndex * batchSize + localIndex
                const marker = createSingleMarker(stop, globalIndex)
                markersRef.current.push(marker)
              })
            }
            resolve(void 0)
          })
        })
        
        // Pequeno delay entre batches para manter responsividade
        if (batchIndex < batches.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 10))
        }
      }
    } else {
      // Para poucos marcadores, criar todos de uma vez
      routeData.stops.forEach((stop, index) => {
        const marker = createSingleMarker(stop, index)
        markersRef.current.push(marker)
      })
    }
  }, [routeData, navigationState.focusedMarkerIndex, navigationState.keyboardNavigationActive, announce, prefersReducedMotion, createCustomMarkerIcon])

  // Effects
  useEffect(() => {
    loadRouteData()
  }, [loadRouteData])

  useEffect(() => {
    if (routeData && !mapLoaded) {
      initializeMap()
    }
  }, [routeData, mapLoaded, initializeMap])

      // Atualizar ícones dos marcadores quando o foco muda
  useEffect(() => {
    if (routeData && markersRef.current.length > 0) {
      markersRef.current.forEach((marker, index) => {
        const stop = routeData.stops[index]
        if (stop) {
          const isFocused = navigationState.focusedMarkerIndex === index
          const newIcon = createCustomMarkerIcon(stop.stop_type, index + 1, isFocused)
          marker.setIcon(newIcon)
          marker.setZIndex(isFocused ? 20 : 10)
        }
      })
    }
  }, [navigationState.focusedMarkerIndex, routeData, createCustomMarkerIcon])

  // Simulação de tempo real (para demonstração)
  useEffect(() => {
    if (!playbackState.isPlaying) return

    const interval = setInterval(() => {
      setCurrentTime(prev => new Date(prev.getTime() + 60000)) // Avançar 1 minuto
    }, 1000) // A cada segundo

    return () => clearInterval(interval)
  }, [playbackState.isPlaying])

  // Handlers para controles avançados
  const handleSpeedChange = useCallback((speed: number) => {
    playbackDispatch({ type: 'SET_SPEED', payload: speed })
  }, [playbackDispatch])

  const handleToggleLoop = useCallback(() => {
    playbackDispatch({ type: 'TOGGLE_LOOPING' })
  }, [playbackDispatch])

  const handleToggleMute = useCallback(() => {
    playbackDispatch({ type: 'TOGGLE_MUTED' })
  }, [playbackDispatch])

  const handleVolumeChange = useCallback((newVolume: number) => {
    playbackDispatch({ type: 'SET_VOLUME', payload: newVolume })
    if (newVolume > 0 && playbackState.isMuted) {
      playbackDispatch({ type: 'SET_MUTED', payload: false })
    }
  }, [playbackDispatch, playbackState.isMuted])

  const handlePreviousStop = useCallback(() => {
    if (!routeData?.stops || routeData.stops.length === 0) return
    
    const currentIndex = routeData.stops.findIndex((stop: RouteStopWithState) => stop.isCurrent)
    if (currentIndex > 0) {
      const newStops = routeData.stops.map((stop: RouteStop, index: number) => ({
        ...stop,
        isCurrent: index === currentIndex - 1,
        isCompleted: index < currentIndex - 1
      }))
      // Atualizar routeData com as novas paradas
      setRouteData(prev => prev ? { ...prev, stops: newStops } : null)
      
      // Centralizar no mapa
      const previousStop = newStops[currentIndex - 1]
      if (googleMapRef.current && previousStop) {
        googleMapRef.current.panTo({ lat: previousStop.lat, lng: previousStop.lng })
        googleMapRef.current.setZoom(16)
      }
    }
  }, [routeData])

  const handleNextStop = useCallback(() => {
    if (!routeData?.stops || routeData.stops.length === 0) return
    
    const currentIndex = routeData.stops.findIndex((stop: RouteStop) => (stop as RouteStop & { isCurrent?: boolean }).isCurrent)
    if (currentIndex < routeData.stops.length - 1) {
      const newStops = routeData.stops.map((stop: RouteStop, index: number) => ({
        ...stop,
        isCurrent: index === currentIndex + 1,
        isCompleted: index <= currentIndex
      }))
      setRouteData(prev => prev ? { ...prev, stops: newStops } : null)
      
      // Centralizar no mapa
      const nextStop = newStops[currentIndex + 1]
      if (googleMapRef.current && nextStop) {
        googleMapRef.current.panTo({ lat: nextStop.lat, lng: nextStop.lng })
        googleMapRef.current.setZoom(16)
      }
    }
  }, [routeData])

  const handleMarkerClick = useCallback((stop: RouteStop, event: google.maps.MapMouseEvent) => {
    // Calcular posição do hotspot
    const rect = mapContainerRef.current?.getBoundingClientRect()
    if (rect && event.domEvent && 'pageX' in event.domEvent && 'pageY' in event.domEvent) {
      const x = event.domEvent.pageX
      const y = event.domEvent.pageY
      
      setSelectedStop(stop)
      setHotspotPosition({ x, y })
      setShowHotspot(true)
      setShowTooltip(false)
    }
  }, [])

  const handleMarkerHover = useCallback((stop: RouteStop, event: google.maps.MapMouseEvent) => {
    // Calcular posição do tooltip
    const rect = mapContainerRef.current?.getBoundingClientRect()
    if (rect && event.domEvent && 'pageX' in event.domEvent && 'pageY' in event.domEvent) {
      const x = event.domEvent.pageX
      const y = event.domEvent.pageY
      
      setSelectedStop(stop)
      uiDispatch({ type: 'SET_TOOLTIP_POSITION', payload: { x, y } })
      uiDispatch({ type: 'SET_SHOW_TOOLTIP', payload: true })
      uiDispatch({ type: 'SET_SHOW_HOTSPOT', payload: false })
    }
  }, [])

  const handleMarkerLeave = useCallback(() => {
    uiDispatch({ type: 'SET_SHOW_TOOLTIP', payload: false })
    uiDispatch({ type: 'SET_TOOLTIP_POSITION', payload: { x: 0, y: 0 } })
  }, [])

  const handleCloseHotspot = useCallback(() => {
    uiDispatch({ type: 'SET_SHOW_HOTSPOT', payload: false })
    uiDispatch({ type: 'SET_HOTSPOT_POSITION', payload: null })
    setSelectedStop(null)
  }, [])

  const handleCenterMap = useCallback((coordinates: { lat: number; lng: number }) => {
    if (googleMapRef.current) {
      googleMapRef.current.panTo(coordinates)
      googleMapRef.current.setZoom(16)
    }
  }, [])
  const handlePlayPause = (playing: boolean) => {
    playbackDispatch({ type: 'SET_PLAYING', payload: playing })
  }

  const handleReset = () => {
    playbackDispatch({ type: 'SET_PLAYING', payload: false })
    setCurrentTime(new Date())
  }

  const handleProgressChange = (progress: number) => {
    // Atualizar visualização baseada no progresso
    if (googleMapRef.current && routeData?.stops.length) {
      const currentStopIndex = Math.floor((progress / 100) * (routeData.stops.length - 1))
      const currentStop = routeData.stops[currentStopIndex]
      
      if (currentStop) {
        googleMapRef.current.panTo({
          lat: currentStop.lat,
          lng: currentStop.lng
        })
      }
    }
  }

  const toggleFullscreen = () => {
    uiDispatch({ type: 'TOGGLE_FULLSCREEN' })
  }

  // Funções de formatação usando utilitários do kpi-utils
  const formatDurationHelper = useCallback((minutes: number) => {
    return formatDuration(minutes, 'minutes')
  }, [])

  const formatDistanceHelper = useCallback((meters: number) => {
    if (meters >= 1000) {
      return `${(meters / 1000).toFixed(1)} km`
    }
    return `${meters} m`
  }, [])

  // Render principal
  if (isLoading) {
    return <MapSkeletonLoader className={className} />
  }

  if (error) {
    return (
      <Card className={`${className}`}>
        <div className="p-8 text-center">
          <div className="flex flex-col items-center gap-4">
            <div className="p-4 bg-error-light rounded-full">
              {isOnline ? (
                <AlertCircle className="w-8 h-8 text-error" />
              ) : (
                <WifiOff className="w-8 h-8 text-error" />
              )}
            </div>
            <div>
              <h3 className="text-lg font-semibold text-ink-strong mb-2">
                {isOnline ? 'Erro ao Carregar Mapa' : 'Sem Conexão'}
              </h3>
              <p className="text-ink-muted mb-4">{error}</p>
              <Button onClick={loadRouteData} variant="outline">
                <RotateCcw className="w-4 h-4 mr-2" />
                Tentar Novamente
              </Button>
            </div>
          </div>
        </div>
      </Card>
    )
  }

  if (!routeData) {
    return (
      <Card className={`${className}`}>
        <div className="p-8 text-center">
          <p className="text-ink-muted">Nenhuma rota encontrada</p>
        </div>
      </Card>
    )
  }

  return (
    <div className={`relative ${uiState.isFullscreen ? 'fixed inset-0 z-50 bg-white' : className}`}>
      {/* Indicador de conectividade e performance */}
      <div className={`flex items-center justify-between mb-4 ${
        isMobile ? 'flex-col gap-2' : 'flex-row'
      }`}>
        <ConnectivityIndicator 
          isOnline={isOnline}
          cacheExpiry={cacheExpiry || null}
          isMobile={isMobile}
        />

        <div className={`flex items-center gap-2 text-xs text-ink-muted ${
          isMobile ? 'justify-center' : ''
        }`} role="status" aria-label="Métricas de performance" aria-live="polite">
          <span aria-label={`Taxa de quadros por segundo: ${metrics.fps}`}>FPS: {metrics.fps}</span>
          <span aria-label={`Tempo de carregamento: ${metrics.loadTime.toFixed(0)} milissegundos`}>Load: {metrics.loadTime.toFixed(0)}ms</span>
        </div>
      </div>

      {/* Cabeçalho com informações da rota */}
      {routeData && (
        <RouteHeader
          routeData={routeData}
          isMobile={isMobile}
          formatDuration={formatDurationHelper}
          formatDistance={formatDistanceHelper}
          onReset={handleReset}
          onToggleFullscreen={toggleFullscreen}
          isFullscreen={uiState.isFullscreen}
          onClose={onClose}
          showControls={showControls}
        />
      )}

      {/* Mapa */}
      <Card className="overflow-hidden shadow-lg">
        <div 
          ref={mapContainerRef}
          className={uiState.isFullscreen ? "h-[calc(100vh-200px)] w-full" : "h-96 w-full"}
          role="application"
          aria-label={`Mapa interativo da rota ${routeData?.name || routeId} com ${routeData?.stops.length || 0} paradas`}
          aria-describedby="map-instructions"
          tabIndex={navigationState.keyboardNavigationActive ? 0 : -1}
        />
        
        {/* Instruções para navegação por teclado (ocultas visualmente) */}
        <div id="map-instructions" className="sr-only">
          Use as setas do teclado para navegar entre as paradas. Pressione Enter ou Espaço para selecionar uma parada. 
          Pressione Home para ir à primeira parada, End para a última, e Escape para sair da navegação por teclado.
        </div>
        
        {/* Overlay de carregamento do mapa */}
        {!mapLoaded && (
          <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-90">
            <div className="text-center">
              <motion.div
                className="w-8 h-8 border-4 border-info-light border-t-info rounded-full mx-auto mb-4"
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              />
              <p className="text-sm text-ink-muted font-medium">
                Inicializando mapa...
              </p>
            </div>
          </div>
        )}
      </Card>

      {/* Barra de progresso temporal */}
      {routeData && (
        <TemporalProgressBar
          stops={routeData.stops.map(stop => ({
            id: stop.id,
            scheduledTime: stop.estimated_arrival || new Date().toISOString(),
            address: stop.address,
            type: stop.stop_type
          }))}
          currentTime={currentTime}
          isPlaying={playbackState.isPlaying}
          onPlayPause={handlePlayPause}
          onProgressChange={handleProgressChange}
        />
      )}

      {/* Tooltip avançado */}
      {selectedStop && uiState.showTooltip && (
        <AdvancedTooltip
          stop={{
            id: selectedStop.id,
            address: selectedStop.address,
            scheduledTime: selectedStop.estimated_arrival || new Date().toISOString(),
            type: selectedStop.stop_type as 'pickup' | 'dropoff',
            passageiro: selectedStop.passageiro || {
              id: selectedStop.passageiro_id || '',
              name: selectedStop.passenger_name || 'Passageiro não identificado',
              type: 'visitor' as const
            },
            coordinates: { lat: selectedStop.lat, lng: selectedStop.lng }
          }}
          isVisible={uiState.showTooltip}
          position={uiState.tooltipPosition}
          onClose={() => uiDispatch({ type: 'SET_SHOW_TOOLTIP', payload: false })}
        />
      )}

      {/* Hotspot interativo */}
      <AnimatePresence>
        {selectedStop && uiState.showHotspot && uiState.hotspotPosition && (
          <InteractiveMarkerHotspot
            stop={{
              id: selectedStop.id,
              type: selectedStop.stop_type as 'pickup' | 'dropoff',
              address: selectedStop.address,
              scheduledTime: selectedStop.estimated_arrival || new Date().toISOString(),
              passageiro: selectedStop.passageiro ? {
                id: selectedStop.passageiro.id,
                name: selectedStop.passageiro.name,
                ...(selectedStop.passageiro.photo && { photo: selectedStop.passageiro.photo }),
                type: selectedStop.passageiro.type === 'student' ? 'student' as const : 'regular' as const,
                ...(selectedStop.passageiro.phone && { phone: selectedStop.passageiro.phone }),
                ...(selectedStop.passageiro.observations && { observations: selectedStop.passageiro.observations })
              } : {
                id: selectedStop.passageiro_id || '',
                name: selectedStop.passenger_name || 'Passageiro não identificado',
                type: 'regular' as const
              },
              coordinates: { lat: selectedStop.lat, lng: selectedStop.lng },
              stopNumber: selectedStop.stop_order,
              isCompleted: false,
              isCurrent: true
            }}
            position={uiState.hotspotPosition}
            onClose={handleCloseHotspot}
            onCenterMap={handleCenterMap}
          />
        )}
      </AnimatePresence>

      {/* Modal de detalhes da parada */}
      <AnimatePresence>
        {selectedStop && !uiState.showTooltip && !uiState.showHotspot && (
          <motion.div
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedStop(null)}
          >
            <motion.div
              className="bg-white rounded-lg shadow-xl max-w-md w-full p-6"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e: React.MouseEvent) => e.stopPropagation()}
            >
              <div className="flex items-start justify-between mb-4">
                <h3 className="text-lg font-bold text-ink-strong">
                  Detalhes da Parada
                </h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedStop(null)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  {selectedStop.passenger_photo ? (
                    <img
                      src={selectedStop.passenger_photo}
                      alt={selectedStop.passenger_name}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                      <span className="text-sm font-medium text-ink-muted">
                        {selectedStop.passenger_name?.charAt(0) || '?'}
                      </span>
                    </div>
                  )}
                  <div>
                    <h4 className="font-semibold text-ink-strong">
                      {selectedStop.passenger_name || 'Passageiro'}
                    </h4>
                    <p className="text-sm text-ink-muted">
                      Parada #{selectedStop.stop_order}
                    </p>
                  </div>
                </div>

                <div>
                  <h5 className="font-medium text-ink-strong mb-1">Endereço</h5>
                  <p className="text-sm text-ink-muted">{selectedStop.address}</p>
                </div>

                {selectedStop.estimated_arrival && (
                  <div>
                    <h5 className="font-medium text-ink-strong mb-1">Horário Previsto</h5>
                    <p className="text-sm text-info font-medium">
                      {new Date(selectedStop.estimated_arrival).toLocaleTimeString('pt-BR', {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                )}

                {selectedStop.observations && (
                  <div>
                    <h5 className="font-medium text-ink-strong mb-1">Observações</h5>
                    <p className="text-sm text-ink-muted">{selectedStop.observations}</p>
                  </div>
                )}

                <div className="flex items-center gap-2 pt-2">
                  <Badge variant={selectedStop.stop_type === 'pickup' ? 'default' : 'secondary'}>
                    {selectedStop.stop_type === 'pickup' ? 'Embarque' : 'Desembarque'}
                  </Badge>
                </div>

                <div className="flex gap-2 pt-4 border-t">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      if (googleMapRef.current) {
                        googleMapRef.current.panTo({
                          lat: selectedStop.lat,
                          lng: selectedStop.lng
                        })
                        googleMapRef.current.setZoom(16)
                      }
                      setSelectedStop(null)
                    }}
                    className="flex-1"
                  >
                    <Navigation className="w-4 h-4 mr-2" />
                    Centralizar no Mapa
                  </Button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Monitor de Performance removido */}

      {/* Controles de Acessibilidade */}
      <AccessibilityControls />

      {/* Botões de controle de performance e acessibilidade */}
      <div 
        className={`absolute z-50 ${
          isMobile 
            ? 'bottom-4 left-1/2 transform -translate-x-1/2 flex flex-row gap-2' 
            : 'top-4 right-4 flex flex-col gap-2'
        }`}
        role="toolbar"
        aria-label="Controles de performance e acessibilidade"
      >
        {/* Botão de Performance removido */}
        <Button
          variant="outline"
          size={isMobile ? "default" : "sm"}
          onClick={accessibilityControls.toggle}
          className="bg-white/90 backdrop-blur-sm shadow-lg"
          title="Alternar controles de acessibilidade"
          aria-label="Alternar controles de acessibilidade"
        >
          <Accessibility className="w-4 h-4" />
          {isMobile && <span className="ml-2">Acessibilidade</span>}
        </Button>
        <Button
          variant={navigationState.keyboardNavigationActive ? "default" : "outline"}
          size={isMobile ? "default" : "sm"}
          onClick={activateKeyboardNavigation}
          className="bg-white/90 backdrop-blur-sm shadow-lg"
          title="Ativar navegação por teclado (setas para navegar, Enter para selecionar, Esc para sair)"
          aria-label="Ativar navegação por teclado"
        >
          <Keyboard className="w-4 h-4" />
          {isMobile && <span className="ml-2">Teclado</span>}
        </Button>
      </div>
    </div>
  )
})
