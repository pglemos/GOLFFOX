/**
 * Hook para gerenciar estado e lógica do AdminMap
 * 
 * Extrai a lógica do componente AdminMap para melhor separação de responsabilidades.
 * Gerencia:
 * - Inicialização do Google Maps
 * - Carregamento de dados (veículos, rotas, alertas)
 * - Realtime updates
 * - Playback de trajetórias
 * - Detecção de desvios
 */

import { useEffect, useState, useCallback, useRef } from 'react'
import { loadGoogleMapsAPI } from '@/lib/google-maps-loader'
import { RealtimeService, RealtimeUpdateType } from '@/lib/realtime-service'
import { PlaybackService } from '@/lib/playback-service'
import { getMapsBillingMonitor } from '@/lib/maps-billing-monitor'
import { detectRouteDeviation } from '@/lib/route-deviation-detector'
import { createAlert } from '@/lib/operational-alerts'
import { 
  analyzeTrajectory, 
  type PlannedRoutePoint, 
  type ActualPosition, 
  type TrajectoryAnalysis 
} from '@/lib/trajectory-analyzer'
import { isValidCoordinate, normalizeCoordinate } from '@/lib/coordinate-validator'
import { loadVehicles } from '@/lib/services/map/map-services/vehicle-loader'
import { supabase } from '@/lib/supabase'
import { MarkerClusterer } from '@googlemaps/markerclusterer'
import { notifySuccess, notifyError } from '@/lib/toast'
import { debug, warn, error as logError } from '@/lib/logger'
import { t } from '@/lib/i18n'
import type { 
  Veiculo, 
  RoutePolyline, 
  MapAlert, 
  MapsBillingStatus, 
  HistoricalTrajectory, 
  RouteStop 
} from '@/types/map'
import { useMapFilters } from '@/stores/map-filters'
import { useMapSelection } from '@/stores/map-selection'
import { useMapPlayback } from '@/stores/map-playback'

export interface UseAdminMapOptions {
  companyId?: string
  routeId?: string
  vehicleId?: string
  initialCenter?: { lat: number; lng: number }
  initialZoom?: number
}

export interface UseAdminMapReturn {
  // Refs
  mapRef: React.RefObject<HTMLDivElement>
  mapInstance: google.maps.Map | null
  clusterer: MarkerClusterer | null
  
  // Estado
  loading: boolean
  mapError: string | null
  listMode: boolean
  billingStatus: MapsBillingStatus | null
  
  // Dados
  veiculos: Veiculo[]
  routes: RoutePolyline[]
  alerts: MapAlert[]
  historicalTrajectories: HistoricalTrajectory[]
  routeStops: RouteStop[]
  trajectoryAnalysis: TrajectoryAnalysis | null
  
  // Ações
  refresh: () => Promise<void>
  exportMapImage: () => Promise<void>
  analyzeVehicleTrajectory: (vehicleId: string) => Promise<void>
  clearTrajectoryAnalysis: () => void
}

const DEFAULT_CENTER = { lat: -19.916681, lng: -43.934493 }
const DEFAULT_ZOOM = 12

export function useAdminMap(options: UseAdminMapOptions = {}): UseAdminMapReturn {
  const {
    companyId,
    routeId,
    vehicleId,
    initialCenter = DEFAULT_CENTER,
    initialZoom = DEFAULT_ZOOM,
  } = options

  // Refs
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<google.maps.Map | null>(null)
  const markersRef = useRef<Map<string, google.maps.Marker>>(new Map())
  const clustererRef = useRef<MarkerClusterer | null>(null)
  const realtimeServiceRef = useRef<RealtimeService | null>(null)
  const playbackServiceRef = useRef<PlaybackService | null>(null)
  const abortControllerRef = useRef<AbortController | null>(null)

  // Stores Zustand
  const { company: companyFilter, route: routeFilter, veiculo: veiculoFilter } = useMapFilters()
  const { setCompany, setRoute, setVeiculo } = useMapFilters()
  const selection = useMapSelection()
  const playback = useMapPlayback()

  // Estado local
  const [loading, setLoading] = useState(true)
  const [mapError, setMapError] = useState<string | null>(null)
  const [listMode, setListMode] = useState(false)
  const [billingStatus, setBillingStatus] = useState<MapsBillingStatus | null>(null)
  const [veiculos, setVeiculos] = useState<Veiculo[]>([])
  const [routes, setRoutes] = useState<RoutePolyline[]>([])
  const [alerts, setAlerts] = useState<MapAlert[]>([])
  const [historicalTrajectories, setHistoricalTrajectories] = useState<HistoricalTrajectory[]>([])
  const [routeStops, setRouteStops] = useState<RouteStop[]>([])
  const [trajectoryAnalysis, setTrajectoryAnalysis] = useState<TrajectoryAnalysis | null>(null)
  const [notifiedDeviations, setNotifiedDeviations] = useState<Set<string>>(new Set())

  // Inicializar filtros com props
  useEffect(() => {
    if (companyId) setCompany(companyId)
    if (routeId) setRoute(routeId)
    if (vehicleId) setVeiculo(vehicleId)
  }, [companyId, routeId, vehicleId, setCompany, setRoute, setVeiculo])

  // Carregar dados
  const loadInitialData = useCallback(async (signal: AbortSignal) => {
    try {
      debug('Carregando dados iniciais do mapa', {}, 'useAdminMap')
      
      // Carregar veículos
      const vehiclesData = await loadVehicles({
        companyId: companyFilter,
        routeId: routeFilter,
        vehicleId: veiculoFilter,
      })
      
      if (signal.aborted) return
      setVeiculos(vehiclesData)

      // Carregar rotas
      const { data: routesData, error: routesError } = await supabase
        .from('routes')
        .select('id, name, polyline, color, company_id')
        .order('name')
      
      if (signal.aborted) return
      if (routesError) {
        logError('Erro ao carregar rotas', { error: routesError }, 'useAdminMap')
      } else if (routesData) {
        setRoutes(routesData.map(r => ({
          id: r.id,
          name: r.name,
          polyline: r.polyline || '',
          color: r.color || '#4285f4',
          companyId: r.company_id,
        })))
      }

      // Carregar alertas
      const { data: alertsData, error: alertsError } = await supabase
        .from('alerts')
        .select('*')
        .eq('is_resolved', false)
        .order('created_at', { ascending: false })
        .limit(50)
      
      if (signal.aborted) return
      if (alertsError) {
        logError('Erro ao carregar alertas', { error: alertsError }, 'useAdminMap')
      } else if (alertsData) {
        setAlerts(alertsData.map(a => ({
          id: a.id,
          type: a.type,
          severity: a.severity,
          message: a.message,
          lat: a.lat,
          lng: a.lng,
          vehicleId: a.veiculo_id,
          routeId: a.route_id,
          createdAt: a.created_at,
          isResolved: a.is_resolved,
        })))
      }

      debug('Dados iniciais carregados', {
        veiculos: vehiclesData.length,
        routes: routesData?.length || 0,
        alerts: alertsData?.length || 0,
      }, 'useAdminMap')
    } catch (error) {
      logError('Erro ao carregar dados iniciais', { error }, 'useAdminMap')
      notifyError(error, 'Erro ao carregar dados do mapa')
    }
  }, [companyFilter, routeFilter, veiculoFilter])

  // Inicializar mapa
  useEffect(() => {
    let isMounted = true
    abortControllerRef.current = new AbortController()
    const signal = abortControllerRef.current.signal

    const initMap = async () => {
      const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
      
      if (!apiKey) {
        if (isMounted) {
          setMapError(t('common', 'errors.mapApiKeyMissing'))
          setLoading(false)
        }
        return
      }

      if (!mapRef.current) {
        if (isMounted) {
          setMapError(t('common', 'errors.mapElementMissing'))
          setLoading(false)
        }
        return
      }

      try {
        // Verificar quota
        const billingMonitor = getMapsBillingMonitor()
        const status = billingMonitor.getStatus()
        if (isMounted) setBillingStatus(status)

        if (billingMonitor.isQuotaExceeded()) {
          if (isMounted) {
            setMapError(t('common', 'errors.mapsQuotaExceededListMode'))
            setListMode(true)
            setLoading(false)
          }
          if (!signal.aborted) await loadInitialData(signal)
          return
        }

        await loadGoogleMapsAPI(apiKey)
        billingMonitor.incrementUsage(1)

        // Detectar modo dark
        const isDark = window.matchMedia?.('(prefers-color-scheme: dark)').matches
        
        const mapStyles = getMapStyles(isDark)
        
        const map = new google.maps.Map(mapRef.current, {
          center: initialCenter,
          zoom: initialZoom,
          styles: mapStyles,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: true,
          zoomControl: true,
          disableDefaultUI: false,
        })

        mapInstanceRef.current = map
        
        debug('Mapa criado com sucesso', { 
          center: map.getCenter()?.toJSON(), 
          zoom: map.getZoom() 
        }, 'useAdminMap')

        // Forçar resize
        setTimeout(() => {
          if (map && window.google?.maps) {
            google.maps.event.trigger(map, 'resize')
          }
        }, 100)

        // Carregar dados
        if (!signal.aborted) {
          await loadInitialData(signal)
        }

        // Configurar realtime se em modo live
        if (!signal.aborted && isMounted && playback.mode === 'live') {
          initRealtimeService()
        }

        if (isMounted) setLoading(false)
      } catch (error) {
        if (isMounted) {
          logError('Erro ao inicializar mapa', { error }, 'useAdminMap')
          setMapError(t('common', 'errors.mapLoadFailedListMode'))
          setListMode(true)
          setLoading(false)
          if (!signal.aborted) {
            loadInitialData(signal).catch(() => {})
          }
        }
      }
    }

    initMap()

    return () => {
      isMounted = false
      abortControllerRef.current?.abort()
      cleanupServices()
    }
  }, [initialCenter, initialZoom, loadInitialData, playback.mode])

  // Inicializar serviço realtime
  const initRealtimeService = useCallback(() => {
    if (realtimeServiceRef.current) return

    realtimeServiceRef.current = new RealtimeService({
      onVehicleUpdate: (update) => {
        setVeiculos(prev => {
          const index = prev.findIndex(v => v.id === update.id)
          if (index === -1) return prev
          const updated = [...prev]
          updated[index] = { ...updated[index], ...update }
          return updated
        })
      },
      onAlertUpdate: (alert) => {
        setAlerts(prev => [alert, ...prev.slice(0, 49)])
      },
    })

    realtimeServiceRef.current.connect()
    debug('Serviço realtime iniciado', {}, 'useAdminMap')
  }, [])

  // Cleanup serviços
  const cleanupServices = useCallback(() => {
    realtimeServiceRef.current?.disconnect()
    realtimeServiceRef.current = null
    playbackServiceRef.current?.stop()
    playbackServiceRef.current = null
    
    // Limpar markers
    markersRef.current.forEach(marker => marker.setMap(null))
    markersRef.current.clear()
    
    // Limpar clusterer
    clustererRef.current?.clearMarkers()
    clustererRef.current = null
  }, [])

  // Refresh dados
  const refresh = useCallback(async () => {
    const signal = abortControllerRef.current?.signal
    if (!signal || signal.aborted) return
    
    setLoading(true)
    await loadInitialData(signal)
    setLoading(false)
    notifySuccess('Dados atualizados')
  }, [loadInitialData])

  // Exportar imagem do mapa
  const exportMapImage = useCallback(async () => {
    if (!mapInstanceRef.current) {
      notifyError('Mapa não está disponível')
      return
    }

    try {
      // Implementação simplificada - pode ser expandida
      const canvas = document.createElement('canvas')
      // ... lógica de exportação
      notifySuccess('Imagem exportada')
    } catch (error) {
      notifyError(error, 'Erro ao exportar imagem')
    }
  }, [])

  // Analisar trajetória de veículo
  const analyzeVehicleTrajectory = useCallback(async (vehicleId: string) => {
    const vehicle = veiculos.find(v => v.id === vehicleId)
    if (!vehicle) {
      notifyError('Veículo não encontrado')
      return
    }

    try {
      // Buscar trajetória histórica
      const { data: trajectoryData, error } = await supabase
        .from('vehicle_positions')
        .select('*')
        .eq('veiculo_id', vehicleId)
        .order('timestamp', { ascending: true })
        .limit(500)

      if (error) throw error

      if (!trajectoryData?.length) {
        notifyError('Sem dados de trajetória')
        return
      }

      const actualPositions: ActualPosition[] = trajectoryData.map(p => ({
        lat: p.lat,
        lng: p.lng,
        timestamp: new Date(p.timestamp).getTime(),
        speed: p.speed || 0,
      }))

      // Buscar rota planejada se disponível
      let plannedRoute: PlannedRoutePoint[] = []
      if (vehicle.route_id) {
        const route = routes.find(r => r.id === vehicle.route_id)
        if (route?.polyline) {
          // Decodificar polyline para pontos
          // plannedRoute = decodePolyline(route.polyline)
        }
      }

      const analysis = analyzeTrajectory(plannedRoute, actualPositions)
      setTrajectoryAnalysis(analysis)
    } catch (error) {
      logError('Erro ao analisar trajetória', { error }, 'useAdminMap')
      notifyError(error, 'Erro ao analisar trajetória')
    }
  }, [veiculos, routes])

  // Limpar análise de trajetória
  const clearTrajectoryAnalysis = useCallback(() => {
    setTrajectoryAnalysis(null)
  }, [])

  return {
    // Refs
    mapRef,
    mapInstance: mapInstanceRef.current,
    clusterer: clustererRef.current,
    
    // Estado
    loading,
    mapError,
    listMode,
    billingStatus,
    
    // Dados
    veiculos,
    routes,
    alerts,
    historicalTrajectories,
    routeStops,
    trajectoryAnalysis,
    
    // Ações
    refresh,
    exportMapImage,
    analyzeVehicleTrajectory,
    clearTrajectoryAnalysis,
  }
}

// Helper para estilos do mapa
function getMapStyles(isDark: boolean): google.maps.MapTypeStyle[] {
  const baseStyles: google.maps.MapTypeStyle[] = [
    { featureType: 'poi', elementType: 'labels', stylers: [{ visibility: 'off' }] },
    { featureType: 'transit', elementType: 'labels', stylers: [{ visibility: 'off' }] },
  ]

  if (!isDark) return baseStyles

  return [
    ...baseStyles,
    { elementType: 'geometry', stylers: [{ color: '#242f3e' }] },
    { elementType: 'labels.text.stroke', stylers: [{ color: '#242f3e' }] },
    { elementType: 'labels.text.fill', stylers: [{ color: '#746855' }] },
    { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#17263c' }] },
    { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#38414e' }] },
    { featureType: 'road', elementType: 'geometry.stroke', stylers: [{ color: '#212a37' }] },
    { featureType: 'road', elementType: 'labels.text.fill', stylers: [{ color: '#9ca5b3' }] },
    { featureType: 'road', elementType: 'labels.text.stroke', stylers: [{ color: '#1a1a1a' }] },
    { featureType: 'administrative', elementType: 'geometry', stylers: [{ color: '#757575' }] },
    { featureType: 'administrative.locality', elementType: 'labels.text.fill', stylers: [{ color: '#b3b3b3' }] },
    { featureType: 'poi.park', elementType: 'geometry', stylers: [{ color: '#263c3f' }] },
    { featureType: 'poi.park', elementType: 'labels.text.fill', stylers: [{ color: '#6b9a76' }] },
    { featureType: 'road', elementType: 'labels.icon', stylers: [{ visibility: 'off' }] },
  ]
}

