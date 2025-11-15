"use client"

import { useEffect, useState, useCallback, useRef, memo } from "react"
import { setOptions, importLibrary } from "@googlemaps/js-api-loader"
import { Card } from "./ui/card"
import { Button } from "./ui/button"
import { Badge } from "./ui/badge"
import { motion, AnimatePresence } from "framer-motion"
import { Clock, Users, MapPin, Navigation, X, AlertCircle, Maximize2, Minimize2, RefreshCw, Timer, Route as RouteIcon, Layers, Play, Pause, RotateCcw, Phone, MessageSquare, User, Wifi, WifiOff, Activity, Accessibility, Keyboard } from "lucide-react"
import { supabase } from "@/lib/supabase"
import AdvancedTooltip from './advanced-tooltip'
import TemporalProgressBar from './temporal-progress-bar'
import { MapSkeletonLoader } from './map-skeleton-loader'
import { InteractiveMarkerHotspot } from './interactive-marker-hotspot'
import { AdvancedPlaybackControls } from './advanced-playback-controls'
// PerformanceMonitor removido
import { AccessibilityControls, useAccessibilityControls } from './accessibility-controls'
import { useResponsive, useReducedMotion } from '@/hooks/use-responsive'
import { usePerformance } from '@/hooks/use-performance'
import { useAccessibility } from '@/hooks/use-accessibility'

interface PassengerInfo {
  id: string
  name: string
  phone?: string
  email?: string
  photo?: string
  type: 'student' | 'employee' | 'visitor'
  observations?: string
}

interface RouteStop {
  id: string
  route_id: string
  stop_order: number
  lat: number
  lng: number
  address: string
  stop_name: string
  passenger_id?: string
  passenger_name?: string
  estimated_arrival?: string
  stop_type: 'pickup' | 'dropoff'
  passenger_photo?: string
  observations?: string
  passenger?: PassengerInfo
}

interface RouteData {
  id: string
  name: string
  description?: string
  totalDistance?: number
  estimatedDuration?: number
  stops: RouteStop[]
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
  // PerformanceMonitor removido
  const accessibilityControls = useAccessibilityControls()
  
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [routeData, setRouteData] = useState<RouteData | null>(null)
  const [selectedStop, setSelectedStop] = useState<RouteStop | null>(null)
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 })
  const [showTooltip, setShowTooltip] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [currentTime, setCurrentTime] = useState(new Date())
  const [isPlaying, setIsPlaying] = useState(false)
  const [mapLoaded, setMapLoaded] = useState(false)
  
  // Estados interativos avançados
  const [hotspotPosition, setHotspotPosition] = useState<{ x: number; y: number } | null>(null)
  const [showHotspot, setShowHotspot] = useState(false)
  const [playbackSpeed, setPlaybackSpeed] = useState(1)
  const [isLooping, setIsLooping] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [volume, setVolume] = useState(80)
  const [isOnline, setIsOnline] = useState(navigator.onLine)
  const [cacheExpiry, setCacheExpiry] = useState<number | null>(null)
  
  // Estados para navegação por teclado
  const [focusedMarkerIndex, setFocusedMarkerIndex] = useState<number>(-1)
  const [keyboardNavigationActive, setKeyboardNavigationActive] = useState(false)
  const mapContainerRef = useRef<HTMLDivElement>(null)

  // Funções de cache e performance
  const getCachedData = useCallback((key: string) => {
    try {
      const cached = localStorage.getItem(`route_cache_${key}`)
      if (cached) {
        const { data, expiry } = JSON.parse(cached)
        if (Date.now() < expiry) {
          return data
        } else {
          localStorage.removeItem(`route_cache_${key}`)
        }
      }
    } catch (error) {
      console.warn('Erro ao acessar cache:', error)
    }
    return null
  }, [])

  const setCachedData = useCallback((key: string, data: any) => {
    try {
      const expiry = Date.now() + (5 * 60 * 1000) // 5 minutos
      localStorage.setItem(`route_cache_${key}`, JSON.stringify({ data, expiry }))
      setCacheExpiry(expiry)
    } catch (error) {
      console.warn('Erro ao salvar cache:', error)
    }
  }, [])

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
    setFocusedMarkerIndex(index)
    
    // Anunciar para leitores de tela
    if (stop) {
      announce(`Marcador ${index + 1} selecionado: ${stop.passenger_name} em ${stop.address}`)
    }
  }, [routeData, announce])

  const handleKeyboardNavigation = useCallback((event: KeyboardEvent) => {
    if (!keyboardNavigationActive || !routeData) return
    
    switch (event.key) {
      case 'ArrowRight':
      case 'ArrowDown':
        event.preventDefault()
        const nextIndex = Math.min(focusedMarkerIndex + 1, routeData.stops.length - 1)
        focusMarker(nextIndex)
        break
        
      case 'ArrowLeft':
      case 'ArrowUp':
        event.preventDefault()
        const prevIndex = Math.max(focusedMarkerIndex - 1, 0)
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
        if (focusedMarkerIndex >= 0) {
          const stop = routeData.stops[focusedMarkerIndex]
          setSelectedStop(stop || null)
          if (stop) {
            announce(`Detalhes da parada: ${stop.passenger_name}`)
          }
        }
        break
        
      case 'Escape':
        event.preventDefault()
        setKeyboardNavigationActive(false)
        setFocusedMarkerIndex(-1)
        setSelectedStop(null)
        announce('Navegação por teclado desativada')
        break
    }
  }, [keyboardNavigationActive, routeData, focusedMarkerIndex, focusMarker, announce])

  const activateKeyboardNavigation = useCallback(() => {
    setKeyboardNavigationActive(true)
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
    if (keyboardNavigationActive) {
      document.addEventListener('keydown', handleKeyboardNavigation)
      return () => {
        document.removeEventListener('keydown', handleKeyboardNavigation)
      }
    }
    return undefined
  }, [keyboardNavigationActive, handleKeyboardNavigation])

  // Carregar dados da rota
  const loadRouteData = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)
      announce('Carregando dados da rota')

      // Verificar cache primeiro
      const cacheKey = `route_${routeId}`
      const cachedData = getCachedData(cacheKey)
      
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
        // Buscar dados da rota
        const { data: route, error: routeError } = await supabase
          .from('routes')
          .select('*')
          .eq('id', routeId)
          .single()

        if (routeError) throw routeError

        // Buscar pontos de parada com informações dos passageiros
        const { data: stops, error: stopsError } = await supabase
          .from('gf_route_plan')
          .select(`
            *,
            gf_employee_company!inner(name, photo_url, phone, email, type, observations)
          `)
          .eq('route_id', routeId)
          .order('stop_order')

        if (stopsError) throw stopsError

        const processedStops: RouteStop[] = stops?.map((stop: any, index: number) => ({
          id: stop.id,
          route_id: stop.route_id,
          stop_order: stop.stop_order,
          lat: stop.latitude,
          lng: stop.longitude,
          address: stop.address || '',
          stop_name: stop.stop_name || `Parada ${index + 1}`,
          passenger_id: stop.passenger_id,
          passenger_name: stop.gf_employee_company?.name || '',
          estimated_arrival: stop.estimated_arrival_time,
          stop_type: index === 0 ? 'pickup' : 'dropoff',
          passenger_photo: stop.gf_employee_company?.photo_url,
          observations: stop.observations,
          passenger: {
            id: stop.passenger_id || '',
            name: stop.gf_employee_company?.name || 'Passageiro não identificado',
            phone: stop.gf_employee_company?.phone,
            email: stop.gf_employee_company?.email,
            photo: stop.gf_employee_company?.photo_url,
            type: stop.gf_employee_company?.type || 'visitor',
            observations: stop.gf_employee_company?.observations
          }
        })) || []

        return {
          id: route.id,
          name: route.name,
          description: route.description,
          totalDistance: route.distance || 0,
          estimatedDuration: route.estimated_duration || 0,
          stops: processedStops
        }
      })

      setRouteData(routeDataFormatted)

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

        // Criar polyline do trajeto
        if (routeData.stops.length > 1) {
          const path = routeData.stops.map(stop => ({ lat: stop.lat, lng: stop.lng }))
          
          const polyline = new google.maps.Polyline({
            path,
            geodesic: true,
            strokeColor: '#2E7D32', // Cor primária especificada
            strokeOpacity: 1.0,
            strokeWeight: 4, // 4px conforme especificação
            icons: prefersReducedMotion ? [] : [{
              icon: {
                path: google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
                scale: 3,
                strokeColor: '#2E7D32'
              },
              offset: '100%',
              repeat: '50px'
            }]
          })

          polyline.setMap(map)
          polylineRef.current = polyline

          // Adicionar sombra sutil ao polyline apenas se não for movimento reduzido
          if (!prefersReducedMotion) {
            const shadowPolyline = new google.maps.Polyline({
              path,
              geodesic: true,
              strokeColor: '#000000',
              strokeOpacity: 0.2,
              strokeWeight: 6,
              zIndex: 1
            })
            shadowPolyline.setMap(map)
          }
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

  // Criar polyline do trajeto
  const createRoutePolyline = useCallback(async (google: typeof window.google, map: google.maps.Map) => {
    if (!routeData?.stops.length || routeData.stops.length < 2) return

    // Limpar polyline anterior
    if (polylineRef.current) {
      polylineRef.current.setMap(null)
    }

    // Criar caminho com todas as paradas
    const path = routeData.stops.map(stop => ({
      lat: stop.lat,
      lng: stop.lng
    }))

    // Criar polyline com estilo customizado
    const polyline = new google.maps.Polyline({
      path,
      geodesic: true,
      strokeColor: '#2E7D32',
      strokeOpacity: 1.0,
      strokeWeight: 4,
      icons: [
        {
          icon: {
            path: google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
            scale: 3,
            strokeColor: '#2E7D32',
            fillColor: '#2E7D32',
            fillOpacity: 1
          },
          offset: '100%',
          repeat: '200px'
        }
      ]
    })

    polyline.setMap(map)
    polylineRef.current = polyline

    // Adicionar sombra à polyline
    const shadowPolyline = new google.maps.Polyline({
      path,
      geodesic: true,
      strokeColor: '#000000',
      strokeOpacity: 0.2,
      strokeWeight: 6,
      zIndex: 1
    })

    shadowPolyline.setMap(map)
  }, [routeData])

  // Criar marcadores customizados com lazy loading e otimizações
  const createStopMarkers = useCallback(async (google: typeof window.google, map: google.maps.Map) => {
    if (!routeData?.stops.length) return

    // Limpar marcadores anteriores
    markersRef.current.forEach(marker => marker.setMap(null))
    markersRef.current = []

    // Função para criar marcador individual
    const createSingleMarker = (stop: RouteStop, index: number) => {
      const markerIcon = createCustomMarkerIcon(stop.stop_type, index + 1, focusedMarkerIndex === index)
      
      const marker = new google.maps.Marker({
        position: { lat: stop.lat, lng: stop.lng },
        map,
        icon: markerIcon,
        title: `Parada ${index + 1}: ${stop.passenger_name} - ${stop.address}`,
        zIndex: focusedMarkerIndex === index ? 20 : 10,
        optimized: !prefersReducedMotion // Usar otimização quando motion reduzido está desabilitado
      })

      // Adicionar eventos de hover e clique
      marker.addListener('mouseover', (event: google.maps.MapMouseEvent) => {
        if (event.domEvent && 'pageX' in event.domEvent && 'pageY' in event.domEvent) {
          setTooltipPosition({
            x: event.domEvent.pageX,
            y: event.domEvent.pageY
          })
          setSelectedStop(stop)
          setShowTooltip(true)
        }
      })

      marker.addListener('mouseout', () => {
        if (!keyboardNavigationActive) {
          setShowTooltip(false)
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
  }, [routeData, focusedMarkerIndex, keyboardNavigationActive, announce, prefersReducedMotion])

  // Cache para ícones de marcadores para melhorar performance
  const iconCache = useRef<Map<string, google.maps.Icon>>(new Map())
  
  // Criar ícone SVG customizado para marcadores com cache e otimizações
  const createCustomMarkerIcon = useCallback((type: 'pickup' | 'dropoff', number: number, isFocused: boolean = false): google.maps.Icon => {
    const size = isMobile ? 24 : 32
    const cacheKey = `${type}-${number}-${size}-${isFocused}`
    
    // Verificar cache primeiro
    if (iconCache.current.has(cacheKey)) {
      return iconCache.current.get(cacheKey)!
    }
    
    const color = type === 'pickup' ? '#2E7D32' : '#1976D2'
    const shape = type === 'pickup' ? 'circle' : 'square'
    const focusRing = isFocused ? `<circle cx="16" cy="16" r="14" fill="none" stroke="#FFD700" stroke-width="2" opacity="0.8"/>` : ''
    
    // Otimizar SVG removendo elementos desnecessários em dispositivos móveis
    const shadowFilter = !isMobile ? `
      <defs>
        <filter id="shadow-${cacheKey}" x="-50%" y="-50%" width="200%" height="200%">
          <feDropShadow dx="0" dy="2" stdDeviation="2" flood-opacity="0.3"/>
        </filter>
      </defs>` : ''
    
    const filterAttr = !isMobile ? `filter="url(#shadow-${cacheKey})"` : ''
    
    const svg = `
      <svg width="${size}" height="${size}" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
        ${shadowFilter}
        <g ${filterAttr}>
          ${focusRing}
          ${shape === 'circle' 
            ? `<circle cx="16" cy="16" r="12" fill="${color}" stroke="#FFFFFF" stroke-width="3"/>`
            : `<rect x="4" y="4" width="24" height="24" rx="2" fill="${color}" stroke="#FFFFFF" stroke-width="3"/>`
          }
          <circle cx="16" cy="16" r="8" fill="#FFFFFF" opacity="0.9"/>
          <text x="16" y="20" text-anchor="middle" font-family="Arial, sans-serif" font-size="10" font-weight="bold" fill="${color}">
            ${number}
          </text>
        </g>
      </svg>
    `

    const icon = {
      url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`,
      size: new google.maps.Size(size, size),
      scaledSize: new google.maps.Size(size, size),
      anchor: new google.maps.Point(size / 2, size / 2)
    }
    
    // Armazenar no cache com limite de tamanho
    if (iconCache.current.size > 50) {
      // Limpar cache quando muito grande
      const firstKey = iconCache.current.keys().next().value
      if (firstKey) {
        iconCache.current.delete(firstKey)
      }
    }
    iconCache.current.set(cacheKey, icon)
    
    return icon
  }, [isMobile])

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
          const isFocused = focusedMarkerIndex === index
          const newIcon = createCustomMarkerIcon(stop.stop_type, index + 1, isFocused)
          marker.setIcon(newIcon)
          marker.setZIndex(isFocused ? 20 : 10)
        }
      })
    }
  }, [focusedMarkerIndex, routeData])

  // Simulação de tempo real (para demonstração)
  useEffect(() => {
    if (!isPlaying) return

    const interval = setInterval(() => {
      setCurrentTime(prev => new Date(prev.getTime() + 60000)) // Avançar 1 minuto
    }, 1000) // A cada segundo

    return () => clearInterval(interval)
  }, [isPlaying])

  // Handlers para controles avançados
  const handleSpeedChange = useCallback((speed: number) => {
    setPlaybackSpeed(speed)
  }, [])

  const handleToggleLoop = useCallback(() => {
    setIsLooping(prev => !prev)
  }, [])

  const handleToggleMute = useCallback(() => {
    setIsMuted(prev => !prev)
  }, [])

  const handleVolumeChange = useCallback((newVolume: number) => {
    setVolume(newVolume)
    if (newVolume > 0 && isMuted) {
      setIsMuted(false)
    }
  }, [isMuted])

  const handlePreviousStop = useCallback(() => {
    if (!routeData?.stops || routeData.stops.length === 0) return
    
    const currentIndex = routeData.stops.findIndex((stop: any) => stop.isCurrent)
    if (currentIndex > 0) {
      const newStops = routeData.stops.map((stop: any, index: number) => ({
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
    
    const currentIndex = routeData.stops.findIndex((stop: any) => stop.isCurrent)
    if (currentIndex < routeData.stops.length - 1) {
      const newStops = routeData.stops.map((stop: any, index: number) => ({
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

  const handleMarkerClick = useCallback((stop: RouteStop, event: any) => {
    // Calcular posição do hotspot
    const rect = mapContainerRef.current?.getBoundingClientRect()
    if (rect) {
      const x = event.pixel.x + rect.left
      const y = event.pixel.y + rect.top
      
      setSelectedStop(stop)
      setHotspotPosition({ x, y })
      setShowHotspot(true)
      setShowTooltip(false)
    }
  }, [])

  const handleMarkerHover = useCallback((stop: RouteStop, event: any) => {
    // Calcular posição do tooltip
    const rect = mapContainerRef.current?.getBoundingClientRect()
    if (rect) {
      const x = event.pixel.x + rect.left
      const y = event.pixel.y + rect.top
      
      setSelectedStop(stop)
      setTooltipPosition({ x, y })
      setShowTooltip(true)
      setShowHotspot(false)
    }
  }, [])

  const handleMarkerLeave = useCallback(() => {
    setShowTooltip(false)
    setTooltipPosition({ x: 0, y: 0 })
  }, [])

  const handleCloseHotspot = useCallback(() => {
    setShowHotspot(false)
    setHotspotPosition(null)
    setSelectedStop(null)
  }, [])

  const handleCenterMap = useCallback((coordinates: { lat: number; lng: number }) => {
    if (googleMapRef.current) {
      googleMapRef.current.panTo(coordinates)
      googleMapRef.current.setZoom(16)
    }
  }, [])
  const handlePlayPause = (playing: boolean) => {
    setIsPlaying(playing)
  }

  const handleReset = () => {
    setIsPlaying(false)
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
    setIsFullscreen(!isFullscreen)
  }

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return hours > 0 ? `${hours}h ${mins}min` : `${mins}min`
  }

  const formatDistance = (meters: number) => {
    if (meters >= 1000) {
      return `${(meters / 1000).toFixed(1)} km`
    }
    return `${meters} m`
  }

  // Render principal
  if (isLoading) {
    return <MapSkeletonLoader className={className} />
  }

  if (error) {
    return (
      <Card className={`${className}`}>
        <div className="p-8 text-center">
          <div className="flex flex-col items-center gap-4">
            <div className="p-4 bg-red-50 rounded-full">
              {isOnline ? (
                <AlertCircle className="w-8 h-8 text-red-600" />
              ) : (
                <WifiOff className="w-8 h-8 text-red-600" />
              )}
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {isOnline ? 'Erro ao Carregar Mapa' : 'Sem Conexão'}
              </h3>
              <p className="text-gray-600 mb-4">{error}</p>
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
          <p className="text-gray-600">Nenhuma rota encontrada</p>
        </div>
      </Card>
    )
  }

  return (
    <div className={`relative ${isFullscreen ? 'fixed inset-0 z-50 bg-white' : className}`}>
      {/* Indicador de conectividade e performance */}
      <div className={`flex items-center justify-between mb-4 ${
        isMobile ? 'flex-col gap-2' : 'flex-row'
      }`}>
        <div className={`flex items-center gap-2 ${
          isMobile ? 'flex-wrap justify-center' : ''
        }`} role="status" aria-label="Status da conexão">
          <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs ${
            isOnline ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
          }`} aria-live="polite">
            {isOnline ? (
              <Wifi className="w-3 h-3" aria-hidden="true" />
            ) : (
              <WifiOff className="w-3 h-3" aria-hidden="true" />
            )}
            {isOnline ? 'Online' : 'Offline'}
          </div>
          
          {cacheExpiry && (
            <div className={`text-xs text-gray-500 ${
              isMobile ? 'text-center' : ''
            }`} aria-label={`Cache válido até ${new Date(cacheExpiry).toLocaleTimeString()}`}>
              Cache válido até {new Date(cacheExpiry).toLocaleTimeString()}
            </div>
          )}
        </div>

        <div className={`flex items-center gap-2 text-xs text-gray-500 ${
          isMobile ? 'justify-center' : ''
        }`} role="status" aria-label="Métricas de performance" aria-live="polite">
          <span aria-label={`Taxa de quadros por segundo: ${metrics.fps}`}>FPS: {metrics.fps}</span>
          <span aria-label={`Tempo de carregamento: ${metrics.loadTime.toFixed(0)} milissegundos`}>Load: {metrics.loadTime.toFixed(0)}ms</span>
        </div>
      </div>

      {/* Cabeçalho com informações da rota */}
      <Card className="mb-4 p-4 bg-white shadow-sm" role="banner" aria-labelledby="route-title">
        <div className={`flex items-center justify-between ${
          isMobile ? 'flex-col gap-4' : 'flex-row'
        }`}>
          <div className={`flex items-center gap-4 ${
            isMobile ? 'flex-col text-center' : 'flex-row'
          }`}>
            <div className="flex items-center gap-2">
              <RouteIcon className="h-5 w-5 text-blue-600" aria-hidden="true" />
              <span id="route-title" className="text-lg font-semibold">
                {routeData?.name || 'Rota'}
              </span>
            </div>
            <div className={`flex items-center gap-4 ${
              isMobile ? 'flex-wrap justify-center' : ''
            }`} role="list" aria-label="Informações da rota">
              <div className="flex items-center gap-2" role="listitem">
                <Clock className="h-4 w-4 text-gray-500" aria-hidden="true" />
                <span className="text-sm text-gray-600" aria-label={`Duração estimada: ${formatDuration(routeData?.estimatedDuration || 0)}`}>
                  {formatDuration(routeData?.estimatedDuration || 0)}
                </span>
              </div>
              <div className="flex items-center gap-2" role="listitem">
                <Navigation className="h-4 w-4 text-gray-500" aria-hidden="true" />
                <span className="text-sm text-gray-600" aria-label={`Distância total: ${formatDistance(routeData?.totalDistance || 0)}`}>
                  {formatDistance(routeData?.totalDistance || 0)}
                </span>
              </div>
              <div className="flex items-center gap-2" role="listitem">
                <Users className="h-4 w-4 text-gray-500" aria-hidden="true" />
                <span className="text-sm text-gray-600" aria-label={`Número de paradas: ${routeData?.stops.length || 0}`}>
                  {routeData?.stops.length || 0} paradas
                </span>
              </div>
            </div>
          </div>
          
          <div className={`flex items-center gap-2 ${
            isMobile ? 'w-full justify-center' : ''
          }`} role="toolbar" aria-label="Controles do mapa">
            {showControls && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleReset}
                  aria-label="Reiniciar visualização do mapa"
                  title="Reiniciar mapa"
                >
                  <RefreshCw className="h-4 w-4" />
                  {isMobile && <span className="ml-2">Reiniciar</span>}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={toggleFullscreen}
                  aria-label={isFullscreen ? "Sair do modo tela cheia" : "Entrar no modo tela cheia"}
                  title={isFullscreen ? "Sair da tela cheia" : "Tela cheia"}
                >
                  {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
                  {isMobile && <span className="ml-2">{isFullscreen ? "Sair" : "Tela Cheia"}</span>}
                </Button>
              </>
            )}
            {onClose && (
              <Button
                variant="outline"
                size="sm"
                onClick={onClose}
                aria-label="Fechar mapa"
                title="Fechar"
              >
                <X className="h-4 w-4" />
                {isMobile && <span className="ml-2">Fechar</span>}
              </Button>
            )}
          </div>
        </div>
      </Card>

      {/* Mapa */}
      <Card className="overflow-hidden shadow-lg">
        <div 
          ref={mapContainerRef}
          className={isFullscreen ? "h-[calc(100vh-200px)] w-full" : "h-96 w-full"}
          role="application"
          aria-label={`Mapa interativo da rota ${routeData?.name || routeId} com ${routeData?.stops.length || 0} paradas`}
          aria-describedby="map-instructions"
          tabIndex={keyboardNavigationActive ? 0 : -1}
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
                className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full mx-auto mb-4"
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              />
              <p className="text-sm text-gray-600 font-medium">
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
          isPlaying={isPlaying}
          onPlayPause={handlePlayPause}
          onProgressChange={handleProgressChange}
        />
      )}

      {/* Tooltip avançado */}
      {selectedStop && showTooltip && (
        <AdvancedTooltip
          stop={{
            id: selectedStop.id,
            address: selectedStop.address,
            scheduledTime: selectedStop.estimated_arrival || new Date().toISOString(),
            type: selectedStop.stop_type as 'pickup' | 'dropoff',
            passenger: selectedStop.passenger || {
              id: selectedStop.passenger_id || '',
              name: selectedStop.passenger_name || 'Passageiro não identificado',
              type: 'visitor' as const
            },
            coordinates: { lat: selectedStop.lat, lng: selectedStop.lng }
          }}
          isVisible={showTooltip}
          position={tooltipPosition}
          onClose={() => setShowTooltip(false)}
        />
      )}

      {/* Hotspot interativo */}
      <AnimatePresence>
        {selectedStop && showHotspot && hotspotPosition && (
          <InteractiveMarkerHotspot
            stop={{
              id: selectedStop.id,
              type: selectedStop.stop_type as 'pickup' | 'dropoff',
              address: selectedStop.address,
              scheduledTime: selectedStop.estimated_arrival || new Date().toISOString(),
              passenger: selectedStop.passenger ? {
                id: selectedStop.passenger.id,
                name: selectedStop.passenger.name,
                ...(selectedStop.passenger.photo && { photo: selectedStop.passenger.photo }),
                type: selectedStop.passenger.type === 'student' ? 'student' as const : 'regular' as const,
                ...(selectedStop.passenger.phone && { phone: selectedStop.passenger.phone }),
                ...(selectedStop.passenger.observations && { observations: selectedStop.passenger.observations })
              } : {
                id: selectedStop.passenger_id || '',
                name: selectedStop.passenger_name || 'Passageiro não identificado',
                type: 'regular' as const
              },
              coordinates: { lat: selectedStop.lat, lng: selectedStop.lng },
              stopNumber: selectedStop.stop_order,
              isCompleted: false,
              isCurrent: true
            }}
            position={hotspotPosition}
            onClose={handleCloseHotspot}
            onCenterMap={handleCenterMap}
          />
        )}
      </AnimatePresence>

      {/* Modal de detalhes da parada */}
      <AnimatePresence>
        {selectedStop && !showTooltip && !showHotspot && (
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
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-start justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-900">
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
                    <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                      <span className="text-sm font-medium text-gray-600">
                        {selectedStop.passenger_name?.charAt(0) || '?'}
                      </span>
                    </div>
                  )}
                  <div>
                    <h4 className="font-semibold text-gray-900">
                      {selectedStop.passenger_name || 'Passageiro'}
                    </h4>
                    <p className="text-sm text-gray-600">
                      Parada #{selectedStop.stop_order}
                    </p>
                  </div>
                </div>

                <div>
                  <h5 className="font-medium text-gray-900 mb-1">Endereço</h5>
                  <p className="text-sm text-gray-600">{selectedStop.address}</p>
                </div>

                {selectedStop.estimated_arrival && (
                  <div>
                    <h5 className="font-medium text-gray-900 mb-1">Horário Previsto</h5>
                    <p className="text-sm text-blue-600 font-medium">
                      {new Date(selectedStop.estimated_arrival).toLocaleTimeString('pt-BR', {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                )}

                {selectedStop.observations && (
                  <div>
                    <h5 className="font-medium text-gray-900 mb-1">Observações</h5>
                    <p className="text-sm text-gray-600">{selectedStop.observations}</p>
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
          variant={keyboardNavigationActive ? "default" : "outline"}
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
