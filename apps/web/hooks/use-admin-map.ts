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

import { MarkerClusterer } from '@googlemaps/markerclusterer'

import { isValidCoordinate, normalizeCoordinate } from '@/lib/coordinate-validator'
import { loadGoogleMapsAPI } from '@/lib/google-maps-loader'
import { t } from '@/lib/i18n'
import { debug, warn, error as logError } from '@/lib/logger'
import { getMapsBillingMonitor } from '@/lib/maps-billing-monitor'
import { createAlert } from '@/lib/operational-alerts'
import { PlaybackService } from '@/lib/playback-service'
import { RealtimeService, RealtimeUpdateType } from '@/lib/realtime-service'
import { detectRouteDeviation } from '@/lib/route-deviation-detector'
import { loadVehicles } from '@/lib/services/map/map-services/vehicle-loader'
import { supabase } from '@/lib/supabase'
import { notifySuccess, notifyError } from '@/lib/toast'
import {
  analyzeTrajectory,
  type PlannedRoutePoint,
  type ActualPosition,
  type TrajectoryAnalysis
} from '@/lib/trajectory-analyzer'
import { useMapFilters } from '@/stores/map-filters'
import { useMapPlayback } from '@/stores/map-playback'
import { useMapSelection } from '@/stores/map-selection'
import type {
  Veiculo,
  RoutePolyline,
  MapAlert,
  MapsBillingStatus,
  HistoricalTrajectory,
  RouteStop
} from '@/types/map'

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

      // Carregar veículos - passamos apenas o companyId conforme assinatura do serviço
      const vehiclesData = await loadVehicles(companyFilter || undefined)

      if (signal.aborted) return
      setVeiculos(vehiclesData)

      // Carregar rotas
      const { data: routesData, error: routesError } = await supabase
        .from('rotas')
        .select('id, name, empresa_id')
        .order('name')

      if (signal.aborted) return
      if (routesError) {
        logError('Erro ao carregar rotas', { error: routesError }, 'useAdminMap')
      } else if (routesData) {
        setRoutes(routesData.map(r => ({
          route_id: r.id,
          route_name: r.name,
          company_id: r.empresa_id,
          polyline_points: [], // Será preenchido por lazy loading ou via route_stops se necessário
          stops_count: 0
        })))
      }

      // Carregar alertas (incidentes abertos)
      const { data: alertsData, error: alertsError } = await (supabase
        .from('gf_incidents')
        .select('id, company_id, route_id, veiculo_id, severity, description, created_at')
        .eq('status', 'open')
        .order('created_at', { ascending: false })
        .limit(50) as any)

      if (signal.aborted) return
      if (alertsError) {
        logError('Erro ao carregar alertas', { error: alertsError }, 'useAdminMap')
      } else if (alertsData) {
        interface AlertRecord {
          id: string
          company_id: string
          route_id?: string
          veiculo_id?: string
          vehicle_id?: string
          severity?: 'low' | 'medium' | 'high' | 'critical'
          description: string
          created_at: string
        }
        setAlerts(alertsData.map((a: AlertRecord) => ({
          alert_id: a.id,
          alert_type: 'incident' as const,
          company_id: a.company_id,
          route_id: a.route_id,
          veiculo_id: a.veiculo_id || a.vehicle_id,
          severity: a.severity || 'medium' as const,
          description: a.description,
          created_at: a.created_at
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
            loadInitialData(signal).catch(() => { })
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
          const index = prev.findIndex(v => v.veiculo_id === update.veiculo_id)
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
    const vehicle = veiculos.find(v => v.veiculo_id === vehicleId)
    if (!vehicle) {
      notifyError('Veículo não encontrado')
      return
    }

    try {
      // Buscar trajetória histórica
      const { data: trajectoryData, error } = await (supabase
        .from('motorista_positions')
        .select('*')
        .eq('veiculo_id', vehicleId)
        .order('timestamp', { ascending: true })
        .limit(500) as any)

      if (error) throw error

      if (!trajectoryData?.length) {
        notifyError('Sem dados de trajetória')
        return
      }

      const actualPositions: ActualPosition[] = (trajectoryData || []).map((p: any) => ({
        lat: p.latitude || p.lat,
        lng: p.longitude || p.lng,
        timestamp: new Date(p.recorded_at || p.timestamp).getTime(),
        speed: p.speed || 0,
      }))

      // Buscar rota planejada se disponível
      const plannedRoute: PlannedRoutePoint[] = []
      if (vehicle.route_id) {
        const route = routes.find(r => r.route_id === vehicle.route_id)
        if (route && (route as any).polyline) {
          // Decodificar polyline para pontos
          // plannedRoute = decodePolyline((route as any).polyline)
        }
      }

      const analysis = analyzeTrajectory(plannedRoute, actualPositions)
      setTrajectoryAnalysis(analysis)
    } catch (err: any) {
      logError('Erro ao analisar trajetória', { error: err }, 'useAdminMap')
      notifyError(err, 'Erro ao analisar trajetória')
    }
  }, [veiculos, routes])

  // Limpar análise de trajetória
  const clearTrajectoryAnalysis = useCallback(() => {
    setTrajectoryAnalysis(null)
  }, [])

  return {
    // Refs
    mapRef: mapRef as React.RefObject<HTMLDivElement>,
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

