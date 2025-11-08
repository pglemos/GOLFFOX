/**
 * Componente Principal do Mapa Admin
 */

'use client'

import { useEffect, useState, useCallback, useRef, useMemo } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { loadGoogleMapsAPI } from '@/lib/google-maps-loader'
import { RealtimeService, RealtimeUpdateType } from '@/lib/realtime-service'
import { PlaybackService } from '@/lib/playback-service'
import { fitBoundsWithMargin, createBoundsFromPositions } from '@/lib/map-utils'
import { getMapsBillingMonitor } from '@/lib/maps-billing-monitor'
import { detectRouteDeviation, type RoutePolylinePoint } from '@/lib/route-deviation-detector'
import { createAlert } from '@/lib/operational-alerts'
import { analyzeTrajectory, type PlannedRoutePoint, type ActualPosition, type TrajectoryAnalysis } from '@/lib/trajectory-analyzer'
import { 
  isValidCoordinate, 
  isValidPolyline, 
  filterValidCoordinates,
  normalizeCoordinate 
} from '@/lib/coordinate-validator'
import { TrajectoryPanel } from './trajectory-panel'
import { MapFilters } from './filters'
import { MapLayers } from './layers'
import { HeatmapLayer } from './heatmap-layer'
import { VehiclePanel, RoutePanel, AlertsPanel } from './panels'
import { PlaybackControls } from './playback-controls'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { useKeyboardShortcuts } from './keyboard-shortcuts'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  RefreshCw, 
  AlertCircle, 
  Layers, 
  Download,
  Map as MapIcon 
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { motion, AnimatePresence } from 'framer-motion'
import { modalContent } from '@/lib/animations'
import { MarkerClusterer } from '@googlemaps/markerclusterer'
import { notifySuccess, notifyError } from '@/lib/toast'
import { debug, warn, error as logError } from '@/lib/logger'
import { formatError, getErrorMeta } from '@/lib/error-utils'

declare global {
  interface Window {
    google: any
  }
}

export interface AdminMapProps {
  companyId?: string
  routeId?: string
  vehicleId?: string
  initialCenter?: { lat: number; lng: number }
  initialZoom?: number
}

// Interfaces exportadas
export interface Vehicle {
  vehicle_id: string
  trip_id: string
  route_id: string
  route_name: string
  driver_id: string
  driver_name: string
  company_id: string
  company_name: string
  plate: string
  model: string
  lat: number
  lng: number
  speed: number | null
  heading: number | null
  vehicle_status: 'moving' | 'stopped_short' | 'stopped_long' | 'garage'
  passenger_count: number
  last_position_time?: string
}

export interface RoutePolyline {
  route_id: string
  route_name: string
  company_id: string
  company_name?: string // Nome da empresa (opcional)
  polyline_points: Array<{ lat: number; lng: number; order: number }>
  stops_count: number
  origin_address?: string // Endereço de origem (opcional)
  destination_address?: string // Endereço de destino (opcional)
}

export interface Alert {
  alert_id: string
  alert_type: 'incident' | 'assistance'
  company_id: string
  route_id?: string
  vehicle_id?: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  lat?: number
  lng?: number
  description: string
  created_at: string
}

export function AdminMap({
  companyId,
  routeId,
  vehicleId,
  initialCenter,
  initialZoom,
}: AdminMapProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  // Refs
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<google.maps.Map | null>(null)
  const markersRef = useRef<Map<string, google.maps.Marker>>(new Map())
  const polylinesRef = useRef<Map<string, google.maps.Polyline>>(new Map())
  const clustererRef = useRef<MarkerClusterer | null>(null)
  const realtimeServiceRef = useRef<RealtimeService | null>(null)
  const playbackServiceRef = useRef<PlaybackService | null>(null)
  
  // State
  const [loading, setLoading] = useState(true)
  const [mapError, setMapError] = useState<string | null>(null)
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [routes, setRoutes] = useState<RoutePolyline[]>([])
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null)
  const [selectedRoute, setSelectedRoute] = useState<RoutePolyline | null>(null)
  const [selectedAlert, setSelectedAlert] = useState<Alert | null>(null)
  const [mode, setMode] = useState<'live' | 'history'>('live')
  const [historicalTrajectories, setHistoricalTrajectories] = useState<Array<{
    vehicle_id: string
    trip_id: string
    positions: Array<{ lat: number; lng: number; timestamp: Date }>
    color?: string
  }>>([])
  const [routeStops, setRouteStops] = useState<Array<{
    id: string
    route_id: string
    route_name: string
    seq: number
    name: string
    lat: number
    lng: number
    radius_m: number
  }>>([])
  const [showTrajectories, setShowTrajectories] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [billingStatus, setBillingStatus] = useState<any>(null)
  const [listMode, setListMode] = useState(false) // Fallback modo lista
  const [playbackProgress, setPlaybackProgress] = useState(0)
  const [playbackFrom, setPlaybackFrom] = useState<Date>(new Date(Date.now() - 2 * 60 * 60 * 1000)) // Últimas 2h
  const [playbackTo, setPlaybackTo] = useState<Date>(new Date())
  const [playbackSpeed, setPlaybackSpeed] = useState<1 | 2 | 4>(1)
  // Removido estado não utilizado historicalPositions
  const [showHeatmap, setShowHeatmap] = useState(false)
  const [showTrajectoryAnalysis, setShowTrajectoryAnalysis] = useState(false)
  const [trajectoryAnalysis, setTrajectoryAnalysis] = useState<TrajectoryAnalysis | null>(null)
  const [notifiedDeviations, setNotifiedDeviations] = useState<Set<string>>(new Set())
  
  // Filtros
  const [filters, setFilters] = useState({
    company: companyId || '',
    route: routeId || '',
    vehicle: vehicleId || '',
    driver: '',
    status: '',
    shift: '',
    search: '',
  })

  // Inicializar mapa
  useEffect(() => {
    const initMap = async () => {
      const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
      if (!apiKey) {
        setMapError('API Key do Google Maps não configurada')
        setLoading(false)
        return
      }

      if (!mapRef.current) {
        setMapError('Elemento do mapa não encontrado')
        setLoading(false)
        return
      }

      try {
        // Verificar quota antes de carregar
        const billingMonitor = getMapsBillingMonitor()
        const billingStatus = billingMonitor.getStatus()
        setBillingStatus(billingStatus)

        if (billingMonitor.isQuotaExceeded()) {
          setMapError('Quota do Google Maps excedida. Usando modo lista.')
          setListMode(true)
          setLoading(false)
          await loadInitialData()
          return
        }

        await loadGoogleMapsAPI(apiKey)
        
        // Incrementar uso
        billingMonitor.incrementUsage(1)
        
        const defaultCenter = { lat: -19.916681, lng: -43.934493 }
        
        // Detectar modo dark
        const isDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
        
        // Estilos do mapa (dark mode ready)
        const mapStyles: google.maps.MapTypeStyle[] = [
          {
            featureType: 'poi',
            elementType: 'labels',
            stylers: [{ visibility: 'off' }],
          },
          {
            featureType: 'transit',
            elementType: 'labels',
            stylers: [{ visibility: 'off' }],
          },
        ]
        
        // Aplicar tema escuro se necessário
        if (isDark) {
          mapStyles.push(
            { elementType: 'geometry', stylers: [{ color: '#242f3e' }] },
            { elementType: 'labels.text.stroke', stylers: [{ color: '#242f3e' }] },
            { elementType: 'labels.text.fill', stylers: [{ color: '#746855' }] },
            {
              featureType: 'water',
              elementType: 'geometry',
              stylers: [{ color: '#17263c' }],
            },
            {
              featureType: 'road',
              elementType: 'geometry',
              stylers: [{ color: '#38414e' }],
            },
            {
              featureType: 'road',
              elementType: 'geometry.stroke',
              stylers: [{ color: '#212a37' }],
            },
            {
              featureType: 'road',
              elementType: 'labels.text.fill',
              stylers: [{ color: '#9ca5b3' }],
            },
            {
              featureType: 'road',
              elementType: 'labels.text.stroke',
              stylers: [{ color: '#1a1a1a' }],
            },
            {
              featureType: 'administrative',
              elementType: 'geometry',
              stylers: [{ color: '#757575' }],
            },
            {
              featureType: 'administrative.locality',
              elementType: 'labels.text.fill',
              stylers: [{ color: '#b3b3b3' }],
            },
            {
              featureType: 'poi.park',
              elementType: 'geometry',
              stylers: [{ color: '#263c3f' }],
            },
            {
              featureType: 'poi.park',
              elementType: 'labels.text.fill',
              stylers: [{ color: '#6b9a76' }],
            },
            {
              featureType: 'road',
              elementType: 'labels.icon',
              stylers: [{ visibility: 'off' }],
            }
          )
        }
        
        const map = new google.maps.Map(mapRef.current, {
          center: initialCenter || defaultCenter,
          zoom: initialZoom || 12,
          styles: mapStyles,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: true,
          zoomControl: true,
        })

        mapInstanceRef.current = map
        
        // Listener para lazy loading de rotas quando viewport muda (será configurado após loadInitialData)
        
        // Carregar dados iniciais
        await loadInitialData()
        
        // Configurar listener para lazy loading após dados iniciais
        let boundsListenerTimeout: NodeJS.Timeout | null = null
        const boundsListener = map.addListener('bounds_changed', () => {
          if (boundsListenerTimeout) {
            clearTimeout(boundsListenerTimeout)
          }
          boundsListenerTimeout = setTimeout(() => {
            loadVisibleRoutes()
          }, 500)
        })
        
        // Inicializar realtime ou playback baseado no modo
        if (mode === 'live') {
          initRealtime()
        } else {
          initPlayback()
        }
        
        setLoading(false)
        
        // Cleanup
        return () => {
          google.maps.event.removeListener(boundsListener)
          if (boundsListenerTimeout) {
            clearTimeout(boundsListenerTimeout)
          }
        }
      } catch (error: any) {
        logError('Erro ao inicializar mapa', { error }, 'AdminMap')
        setMapError('Erro ao carregar o mapa. Usando modo lista.')
        setListMode(true)
        setLoading(false)
        // Carregar dados em modo lista
        loadInitialData().catch((err) => logError('Erro ao carregar dados iniciais', { error: err }, 'AdminMap'))
      }
    }

    initMap()

    return () => {
      // Cleanup
      if (realtimeServiceRef.current) {
        realtimeServiceRef.current.disconnect()
      }
      if (playbackServiceRef.current) {
        playbackServiceRef.current.stop()
      }
    }
  }, [])

  // Cache de rotas para lazy loading (otimizado)
  const routesCacheRef = useRef<Map<string, RoutePolyline>>(new Map())
  const loadedRouteIdsRef = useRef<Set<string>>(new Set())
  const lastZoomRef = useRef<number | null>(null)
  const lastCompanyRef = useRef<string | null>(null)
  const routesLoadTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Carregar rotas visíveis no viewport (lazy loading otimizado)
  const loadVisibleRoutes = useCallback(async () => {
    if (!mapInstanceRef.current) return

    const bounds = mapInstanceRef.current.getBounds()
    if (!bounds) return

    // Limitar a 50 rotas por vez
    const LIMIT = 50
    const currentZoom = mapInstanceRef.current.getZoom() || 0
    const currentCompany = filters.company || null
    
    // Limpar cache se empresa mudou
    if (lastCompanyRef.current !== currentCompany) {
      routesCacheRef.current.clear()
      loadedRouteIdsRef.current.clear()
      lastCompanyRef.current = currentCompany
    }
    
    // Limpar cache se zoom mudou significativamente (>2 níveis)
    if (lastZoomRef.current !== null && Math.abs(currentZoom - lastZoomRef.current) > 2) {
      routesCacheRef.current.clear()
      loadedRouteIdsRef.current.clear()
    }
    lastZoomRef.current = currentZoom

    // Debounce para evitar muitas chamadas
    if (routesLoadTimeoutRef.current) {
      clearTimeout(routesLoadTimeoutRef.current)
    }

    routesLoadTimeoutRef.current = setTimeout(async () => {
      try {
        // Buscar rotas diretamente da tabela routes e montar polyline_points a partir de route_stops
        // Carregar todas as rotas filtradas (otimização futura: usar geolocalização)
        let routesQuery = supabase
          .from('routes')
          .select(`
            id,
            name,
            company_id
          `)
          .eq('is_active', true)
          .limit(LIMIT)
        
        // Aplicar filtro de empresa apenas se não for null ou vazio
        if (currentCompany && currentCompany !== 'null' && currentCompany !== '') {
          routesQuery = routesQuery.eq('company_id', currentCompany)
        }
        
        const { data: routesData, error: routesError } = await routesQuery

        if (!routesError && routesData && routesData.length > 0) {
          // Buscar route_stops para cada rota
          const routeIds = routesData.map((r: any) => r.id)
          
          const { data: stopsData, error: stopsError } = await supabase
            .from('route_stops')
            .select('route_id, lat, lng, seq, name')
            .in('route_id', routeIds)
            .order('route_id')
            .order('seq')
          
          // Agrupar stops por route_id
          const stopsByRoute = new Map()
          if (stopsData) {
            stopsData.forEach((stop: any) => {
              if (!stopsByRoute.has(stop.route_id)) {
                stopsByRoute.set(stop.route_id, [])
              }
              stopsByRoute.get(stop.route_id).push({
                lat: stop.lat,
                lng: stop.lng,
                order: stop.seq
              })
            })
          }
          
          // Converter dados da tabela para o formato esperado
          const formattedRoutes = routesData.map((r: any) => ({
            route_id: r.id,
            route_name: r.name,
            company_id: r.company_id,
            polyline_points: stopsByRoute.get(r.id) || [],
            stops_count: stopsByRoute.get(r.id)?.length || 0
          }))
          
          // Filtrar apenas rotas não carregadas
          const newRoutes = formattedRoutes.filter((r: any) => !loadedRouteIdsRef.current.has(r.route_id))
          
          if (newRoutes.length > 0) {
            // Adicionar ao cache
            newRoutes.forEach((route: any) => {
              routesCacheRef.current.set(route.route_id, route)
              loadedRouteIdsRef.current.add(route.route_id)
            })

            // Atualizar estado com todas as rotas do cache
            setRoutes(Array.from(routesCacheRef.current.values()))
          }
        } else if (routesError) {
          warn('Erro ao carregar rotas (view v_route_polylines não existe, usando tabela routes)', { error: routesError }, 'AdminMap')
        }
      } catch (error) {
        logError('Erro ao carregar rotas visíveis', { error }, 'AdminMap')
      }
    }, 300) // Debounce de 300ms
  }, [filters.company])

  // Carregar dados iniciais
  const loadInitialData = useCallback(async () => {
    try {
      debug('Carregando dados iniciais com filtros', { filters }, 'AdminMap')
      
      // Carregar veículos ativos com todas as informações
      // Usar LEFT JOIN para não excluir veículos sem company_id
      let vehiclesQuery = supabase
        .from('vehicles')
        .select(`
          id,
          plate,
          model,
          year,
          prefix,
          capacity,
          is_active,
          photo_url,
          company_id,
          carrier_id,
          companies(name)
        `)
        .eq('is_active', true)
      
      // Aplicar filtro de empresa se selecionado
      if (filters.company) {
        vehiclesQuery = vehiclesQuery.eq('company_id', filters.company)
      }
      
      debug(
        'Carregando veículos ativos com filtros',
        {
          filters,
          query: {
            table: 'vehicles',
            filter_is_active: true,
            filter_company: filters.company || 'nenhum',
          },
        },
        'AdminMap'
      )
      
      const { data: vehiclesData, error: vehiclesError } = await vehiclesQuery
      
      let finalVehiclesData: any[] = []
      
      // Log detalhado para debug
      if (vehiclesError) {
        logError('Erro na query de veículos', getErrorMeta(vehiclesError))
        
        // Se erro for sobre coluna inexistente, tentar query sem colunas problemáticas
        if (vehiclesError.message?.includes('column') || vehiclesError.message?.includes('does not exist')) {
          warn('Tentando query alternativa sem colunas problemáticas', {}, 'AdminMap')
          try {
            const { data: fallbackData, error: fallbackError } = await supabase
              .from('vehicles')
              .select('id, plate, model, is_active, company_id')
              .eq('is_active', true)
            
            if (!fallbackError && fallbackData) {
              debug(`Query alternativa retornou ${fallbackData.length} veículos`, { count: fallbackData.length }, 'AdminMap')
              finalVehiclesData = fallbackData as any
            }
          } catch (fallbackErr) {
            logError('Query alternativa também falhou', { error: fallbackErr }, 'AdminMap')
          }
        }
      } else {
        finalVehiclesData = vehiclesData || []
        debug(`Query retornou ${finalVehiclesData.length} veículos`, { count: finalVehiclesData.length }, 'AdminMap')
        if (finalVehiclesData.length > 0) {
          debug('Primeiros veículos', {
            vehicles: finalVehiclesData.slice(0, 3).map((v: any) => ({
              id: v.id,
              plate: v.plate,
              is_active: v.is_active,
              company_id: v.company_id,
              carrier_id: v.carrier_id
            }))
          }, 'AdminMap')
        } else {
          // Se não retornou veículos, verificar se há veículos ativos no banco
          warn('Nenhum veículo retornado - verificando se há veículos ativos no banco', {}, 'AdminMap')
          const { data: checkData, error: checkError } = await supabase
            .from('vehicles')
            .select('id, plate, is_active')
            .eq('is_active', true)
            .limit(5)
          
          if (checkError) {
            logError('Erro ao verificar veículos', { error: checkError }, 'AdminMap')
          } else if (checkData && checkData.length > 0) {
            warn(`Encontrados ${checkData.length} veículos ativos, mas não foram retornados pela query principal`, { count: checkData.length, vehicles: checkData }, 'AdminMap')
            warn('Possível problema: RLS policies podem estar bloqueando o acesso', {}, 'AdminMap')
          } else {
            debug('Não há veículos ativos no banco de dados', {}, 'AdminMap')
          }
        }
      }
      
      if (finalVehiclesData && finalVehiclesData.length > 0) {
        debug(`Processando ${finalVehiclesData.length} veículos ativos`, { count: finalVehiclesData.length }, 'AdminMap')
        
        // Buscar trips ativas para esses veículos
        const vehicleIds = finalVehiclesData.map((v: any) => v.id)
        
        // Buscar trips ativas (inProgress) para obter informações de rota e motorista
        const { data: activeTrips } = await supabase
          .from('trips')
          .select(`
            id,
            vehicle_id,
            driver_id,
            route_id,
            status,
            routes(name),
            users!trips_driver_id_fkey(id, name)
          `)
          .in('vehicle_id', vehicleIds)
          .eq('status', 'inProgress')
        
        // Mapear trips por vehicle_id
        const tripsByVehicle = new Map()
        if (activeTrips) {
          activeTrips.forEach((trip: any) => {
            if (!tripsByVehicle.has(trip.vehicle_id)) {
              tripsByVehicle.set(trip.vehicle_id, trip)
            }
          })
        }
        
        // Buscar últimas posições conhecidas
        const tripIds = activeTrips?.map((t: any) => t.id) || []
        let lastPositions: any[] = []
        
        if (tripIds.length > 0) {
          // Buscar posições recentes (últimas 5 minutos) primeiro
          const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString()
          const { data: recentPositions } = await supabase
            .from('driver_positions')
            .select('trip_id, lat, lng, speed, timestamp')
            .in('trip_id', tripIds)
            .gte('timestamp', fiveMinutesAgo)
            .order('timestamp', { ascending: false })
          
          if (recentPositions && recentPositions.length > 0) {
            // Mapear posições para vehicle_id via trips
            const tripToVehicle = new Map(activeTrips?.map((t: any) => [t.id, t.vehicle_id]) || [])
            lastPositions = recentPositions.map((pos: any) => ({
              ...pos,
              vehicle_id: tripToVehicle.get(pos.trip_id)
            }))
          } else {
            // Se não há posições recentes, buscar últimas posições conhecidas
            const { data: allPositions } = await supabase
              .from('driver_positions')
              .select('trip_id, lat, lng, speed, timestamp')
              .in('trip_id', tripIds)
              .order('timestamp', { ascending: false })
              .limit(tripIds.length * 10)
            
            if (allPositions) {
              const tripToVehicle = new Map(activeTrips?.map((t: any) => [t.id, t.vehicle_id]) || [])
              lastPositions = allPositions.map((pos: any) => ({
                ...pos,
                vehicle_id: tripToVehicle.get(pos.trip_id)
              }))
            }
          }
        }
        
        // Agrupar posições por vehicle_id e pegar a mais recente
        const positionsByVehicle = new Map()
        lastPositions.forEach((pos: any) => {
          if (pos.vehicle_id && !positionsByVehicle.has(pos.vehicle_id)) {
            positionsByVehicle.set(pos.vehicle_id, pos)
          }
        })
        
        // Montar dados finais dos veículos - MOSTRAR TODOS OS VEÍCULOS ATIVOS
        const processedVehicles = finalVehiclesData.map((v: any) => {
          const trip = tripsByVehicle.get(v.id)
          const lastPos = positionsByVehicle.get(v.id)
          
          // Calcular heading se houver posição
          let heading = null
          if (lastPos) {
            // Tentar calcular heading (simplificado - seria melhor ter histórico)
            heading = 0 // Por enquanto, sem heading
          }
          
          // Determinar status
          let vehicleStatus: 'moving' | 'stopped_short' | 'stopped_long' | 'garage' = 'garage'
          if (lastPos) {
            const posTime = new Date(lastPos.timestamp)
            const minutesAgo = (Date.now() - posTime.getTime()) / (1000 * 60)
            
            if (lastPos.speed && lastPos.speed > 0.83) { // > 3 km/h
              vehicleStatus = 'moving'
            } else if (minutesAgo > 3) {
              vehicleStatus = 'stopped_long'
            } else {
              vehicleStatus = 'stopped_short'
            }
          } else {
            // Sem posição = na garagem ou sem GPS
            vehicleStatus = 'garage'
          }
          
          // Se não há posição GPS, usar coordenadas padrão (centro do Brasil) ou null
          // O mapa vai mostrar o veículo como "sem posição" mas ainda vai aparecer na lista
          const lat = lastPos?.lat || null
          const lng = lastPos?.lng || null
          
          // Se não há coordenadas válidas, ainda assim incluir o veículo
          // Ele aparecerá na lista de veículos mesmo sem posição no mapa
          
          return {
            vehicle_id: v.id,
            plate: v.plate,
            model: v.model || '',
            company_id: v.company_id,
            company_name: v.companies?.name || '',
            trip_id: trip?.id || null,
            route_id: trip?.route_id || null,
            route_name: trip?.routes?.name || 'Sem rota ativa',
            driver_id: trip?.driver_id || null,
            driver_name: trip?.users?.name || 'Sem motorista',
            lat: lat,
            lng: lng,
            speed: lastPos?.speed || null,
            heading: heading,
            vehicle_status: vehicleStatus,
            passenger_count: 0, // Seria necessário buscar de trip_passengers
            last_position_time: lastPos?.timestamp || null,
          }
        })
        
        finalVehiclesData = processedVehicles
        debug(`Montados ${finalVehiclesData.length} veículos com dados completos`, { count: finalVehiclesData.length }, 'AdminMap')
      } else if (vehiclesError) {
        logError('Erro ao carregar veículos', { error: vehiclesError }, 'AdminMap')
        finalVehiclesData = []
      } else {
        debug('Nenhum veículo ativo encontrado', {}, 'AdminMap')
        finalVehiclesData = []
      }
      
      debug('Resultado final da query de veículos', {
        filtroCompany: filters.company || '(nenhum)',
        totalRetornado: finalVehiclesData?.length || 0,
        erro: vehiclesError?.message || null,
        primeirosVeiculos: finalVehiclesData?.slice(0, 2).map((v: any) => ({
          vehicle_id: v.vehicle_id,
          plate: v.plate,
          lat: v.lat,
          lng: v.lng,
          company_id: v.company_id
        })) || []
      })

      if (finalVehiclesData && finalVehiclesData.length > 0) {
        // Processar TODOS os veículos - não filtrar por coordenadas
        // Veículos sem coordenadas ainda aparecerão na lista e podem ser visualizados
        const processedVehicles = finalVehiclesData
          .map((v: any) => {
            // Normalizar coordenadas se existirem
            if (v.lat !== null && v.lng !== null && isValidCoordinate(v.lat, v.lng)) {
              const normalized = normalizeCoordinate(v.lat, v.lng)
              if (normalized) {
                v.lat = normalized.lat
                v.lng = normalized.lng
              }
            } else {
              // Veículo sem coordenadas - ainda assim incluir
              debug(`Veículo ${v.plate} (${v.vehicle_id}) sem coordenadas GPS - será exibido como "na garagem"`, { vehicleId: v.vehicle_id, plate: v.plate }, 'AdminMap')
              v.lat = null
              v.lng = null
              v.vehicle_status = 'garage'
            }
            
            return {
              ...v,
              // Garantir valores padrão
              speed: v.speed !== null && !isNaN(v.speed) ? v.speed : null,
              heading: v.heading !== null && !isNaN(v.heading) ? v.heading : null,
            }
          })
        
        setVehicles(processedVehicles as any)
        
        // Contar veículos com e sem coordenadas
        const withCoords = processedVehicles.filter((v: any) => v.lat !== null && v.lng !== null).length
        const withoutCoords = processedVehicles.length - withCoords
        
        debug(`Carregados ${processedVehicles.length} veículos ativos`, { 
          total: processedVehicles.length,
          withCoords,
          withoutCoords
        }, 'AdminMap')
        
        if (withCoords === 0 && processedVehicles.length > 0) {
          notifySuccess(`${processedVehicles.length} veículo(s) ativo(s) encontrado(s), mas nenhum tem posição GPS recente.`, {
            duration: 5000
          })
        }
      } else if (vehiclesError) {
        logError('Erro ao carregar veículos', { error: vehiclesError }, 'AdminMap')
        notifyError(vehiclesError, 'Erro ao carregar veículos')
      } else {
        // Nenhum dado retornado e nenhum erro - verificar se há veículos ativos sem filtros
        debug('Nenhum veículo retornado da query (sem erro) - verificando se há veículos ativos sem filtros', {}, 'AdminMap')
        
        // Tentar buscar sem filtros para debug
        const { data: allVehicles, error: allError } = await supabase
          .from('vehicles')
          .select('id, plate, is_active, company_id')
          .eq('is_active', true)
          .limit(5)
        
        if (allError) {
          logError('Erro ao verificar veículos', { error: allError }, 'AdminMap')
        } else if (allVehicles && allVehicles.length > 0) {
          warn(`Encontrados ${allVehicles.length} veículos ativos, mas não foram retornados com os filtros aplicados`, { 
            count: allVehicles.length,
            vehicles: allVehicles.map((v: any) => ({ plate: v.plate, company_id: v.company_id }))
          }, 'AdminMap')
        } else {
          debug('Não há veículos ativos no banco de dados', {}, 'AdminMap')
        }
      }

      // Carregar rotas (lazy loading será aplicado via loadVisibleRoutes)
      await loadVisibleRoutes()

      // Carregar alertas - DESABILITADO (serão carregados via realtime polling)
      debug('Carregamento de alertas inicial desabilitado - serão carregados via polling do realtime-service', {}, 'AdminMap')
      setAlerts([]) // Inicializar vazio
      
      /*
      // CÓDIGO DESABILITADO - Carregamento de alertas comentado devido a problemas de schema cache
      let combinedAlerts: any[] = []
      let alertsErrorMsg: string | null = null
      try {
        // Helper: detectar erro de tabela ausente no cache do PostgREST
        const isMissingTableError = (err: any, table: string) => {
          const msg = (err as any)?.message || ''
          return typeof msg === 'string' && msg.includes(`Could not find the table 'public.${table}'`)
        }

        // Incidentes abertos (sem lat/lng pois a tabela não tem essas colunas)
        let incidentsData: any[] = []
        let incidentsError: any = null
        
        try {
          let incidentsQuery = supabase
            .from('gf_incidents')
            .select('id, company_id, route_id, vehicle_id, severity, description, created_at, status')
            .eq('status', 'open')

          if (filters.company) {
            incidentsQuery = incidentsQuery.eq('company_id', filters.company)
          }

          const result = await incidentsQuery
          incidentsData = result.data || []
          incidentsError = result.error
        } catch (error: any) {
          // Se erro for sobre coluna inexistente, ignorar silenciosamente
          if (error?.message?.includes('does not exist') || error?.message?.includes('column')) {
            warn('Erro ao carregar incidentes (coluna inexistente), continuando sem incidentes', { message: error.message }, 'AdminMap')
            incidentsError = null
            incidentsData = []
          } else {
            incidentsError = error
          }
        }

        // Se a tabela gf_incidents não estiver no cache, seguir sem incidentes
        if (incidentsError && isMissingTableError(incidentsError, 'gf_incidents')) {
          warn('Tabela gf_incidents ausente no schema cache — seguindo sem incidentes (aplicar migration v43_admin_core).', undefined, 'AdminMap')
          incidentsError = null
          incidentsData = []
        }

        // Solicitações de socorro abertas (painel operador)
        let assistanceData: any[] = []
        let assistanceError: any = null
        
        try {
          let assistanceQuery = supabase
            .from('gf_service_requests')
            .select('id, empresa_id, route_id, tipo, status, payload, created_at')
            .eq('tipo', 'socorro')
            .eq('status', 'open')

          if (filters.company) {
            // Nota: coluna é empresa_id em gf_service_requests
            assistanceQuery = assistanceQuery.eq('empresa_id', filters.company)
          }

          const result = await assistanceQuery
          assistanceData = result.data || []
          assistanceError = result.error
        } catch (error: any) {
          // Se erro for sobre coluna inexistente, ignorar silenciosamente
          if (error?.message?.includes('does not exist') || error?.message?.includes('column')) {
            warn('Erro ao carregar assistência (coluna inexistente), continuando sem assistência', { message: error.message }, 'AdminMap')
            assistanceError = null
            assistanceData = []
          } else {
            assistanceError = error
          }
        }

        // Se a tabela gf_service_requests estiver ausente, seguir sem assistência
        if (assistanceError && isMissingTableError(assistanceError, 'gf_service_requests')) {
          warn('Tabela gf_service_requests ausente no schema cache — seguindo sem assistência (aplicar migrations operador).', undefined, 'AdminMap')
          assistanceError = null
          assistanceData = []
        }

        if (incidentsError && assistanceError) {
          const msg = (incidentsError as any)?.message ?? (assistanceError as any)?.message ?? (() => { try { return JSON.stringify(incidentsError || assistanceError) } catch { return String(incidentsError || assistanceError) } })()
          alertsErrorMsg = msg
        } else {
          const mappedIncidents = (incidentsData || []).map((i: any) => ({
            alert_id: i.id,
            alert_type: 'incident',
            company_id: i.company_id,
            route_id: i.route_id,
            vehicle_id: i.vehicle_id,
            severity: i.severity,
            lat: null, // gf_incidents não tem coluna lat
            lng: null, // gf_incidents não tem coluna lng
            description: i.description,
            created_at: i.created_at,
          }))

          // Extrair lat/lng se presente no payload
          const mappedAssistance = (assistanceData || []).map((a: any) => {
            const payload = a.payload || {}
            const lat = payload.lat ?? payload.latitude ?? null
            const lng = payload.lng ?? payload.longitude ?? null
            return {
              alert_id: a.id,
              alert_type: 'assistance',
              company_id: a.empresa_id,
              route_id: a.route_id,
              vehicle_id: payload.vehicle_id ?? null,
              severity: payload.severity ?? 'high',
              lat,
              lng,
              description: payload.description ?? 'Solicitação de socorro',
              created_at: a.created_at,
            }
          })

          combinedAlerts = [...mappedIncidents, ...mappedAssistance]

          // Validar alertas com coordenadas quando presentes
          const validAlerts = combinedAlerts.filter((a: any) => {
            if (a.lat !== undefined && a.lng !== undefined && a.lat !== null && a.lng !== null) {
              if (!isValidCoordinate(a.lat, a.lng)) {
                warn(`Alerta ${a.alert_id} tem coordenadas inválidas`, { lat: a.lat, lng: a.lng }, 'AdminMap')
                return false
              }

              const normalized = normalizeCoordinate(a.lat, a.lng)
              if (normalized) {
                a.lat = normalized.lat
                a.lng = normalized.lng
              }
            }
            return true
          })

          setAlerts(validAlerts as any)
        }
      } catch (alertsError: any) {
        alertsErrorMsg = alertsError?.message ?? (() => { try { return JSON.stringify(alertsError) } catch { return String(alertsError) } })()
      }

      if (alertsErrorMsg) {
        logError('Erro ao carregar alertas', { message: alertsErrorMsg }, 'AdminMap')
      }
      */

      // Carregar paradas das rotas
      const routeIds = routes?.map((r: any) => r.route_id) || []
      if (routeIds.length > 0) {
        const { data: stopsData, error: stopsError } = await supabase
          .from('route_stops')
          .select(`
            id,
            route_id,
            seq,
            name,
            lat,
            lng,
            radius_m,
            routes!inner(name)
          `)
          .in('route_id', routeIds)
          .order('route_id', { ascending: true })
          .order('seq', { ascending: true })

        if (!stopsError && stopsData) {
          setRouteStops(stopsData.map((stop: any) => ({
            id: stop.id,
            route_id: stop.route_id,
            route_name: stop.routes?.name || '',
            seq: stop.seq,
            name: stop.name,
            lat: stop.lat,
            lng: stop.lng,
            radius_m: stop.radius_m || 50,
          })))
        }
      }
    } catch (error) {
      logError('Erro ao carregar dados iniciais', { error }, 'AdminMap')
    }
  }, [filters.company])

  // Processar atualizações do realtime
  const handleRealtimeUpdate = useCallback(async (update: RealtimeUpdateType) => {
    if (update.type === 'position') {
      setVehicles((prev) => {
        const index = prev.findIndex(
          (v) => v.vehicle_id === update.data.vehicle_id
        )
        if (index >= 0) {
          const updated = [...prev]
          const vehicle = updated[index]
          
          // Validar coordenadas antes de atualizar
          if (!isValidCoordinate(update.data.lat, update.data.lng)) {
            warn(`Coordenadas inválidas recebidas para veículo ${update.data.vehicle_id}`, { lat: update.data.lat, lng: update.data.lng }, 'AdminMap')
            return prev // Não atualizar se coordenadas inválidas
          }
          
          // Normalizar coordenadas
          const normalized = normalizeCoordinate(update.data.lat, update.data.lng)
          if (!normalized) {
            return prev
          }
          
          // Atualizar campos do veículo existente
          updated[index] = {
            ...vehicle,
            lat: normalized.lat,
            lng: normalized.lng,
            speed: update.data.speed !== null && !isNaN(update.data.speed) ? update.data.speed : vehicle.speed,
            heading: update.data.heading,
            vehicle_status: update.data.vehicle_status,
            passenger_count: update.data.passenger_count,
            last_position_time: update.data.timestamp,
          }
          
          // Verificar desvio de rota (apenas se veículo está em movimento e tem rota)
          // Usar setTimeout para não bloquear a atualização do estado
          if (vehicle.route_id && update.data.speed && update.data.speed > 1.4) {
            const route = routes.find((r) => r.route_id === vehicle.route_id)
            if (route && route.polyline_points && route.polyline_points.length >= 2) {
              // Executar detecção de desvio de forma assíncrona para não bloquear UI
              setTimeout(() => {
                try {
                  const deviation = detectRouteDeviation(
                    update.data.lat,
                    update.data.lng,
                    update.data.speed,
                    route.polyline_points,
                    200 // 200m de threshold
                  )
                  
                  // Criar alerta se desviou
                  if (deviation.isDeviated) {
                    const isCritical = deviation.distance > 500
                    const deviationKey = `${vehicle.vehicle_id}-${route.route_id}-${Math.floor(deviation.distance / 100)}`
                    
                    createAlert({
                      type: 'route_deviation',
                      severity: isCritical ? 'critical' : 'error',
                      title: `Veículo fora de rota: ${vehicle.plate}`,
                      message: `Veículo ${vehicle.plate} está ${Math.round(deviation.distance)}m fora da rota planejada.`,
                      metadata: {
                        vehicle_id: vehicle.vehicle_id,
                        route_id: vehicle.route_id,
                        distance: deviation.distance,
                        lat: update.data.lat,
                        lng: update.data.lng,
                      },
                      company_id: vehicle.company_id,
                    }).catch((error) => {
                      logError('Erro ao criar alerta de desvio', { error }, 'AdminMap')
                    })
                    
                    // Notificação em tempo real para desvios críticos (apenas uma vez por desvio)
                    if (isCritical && !notifiedDeviations.has(deviationKey)) {
                      setNotifiedDeviations((prev) => {
                        const newSet = new Set(prev)
                        newSet.add(deviationKey)
                        return newSet
                      })
                      
                      notifyError(
                        `🚨 DESVIO CRÍTICO: ${vehicle.plate} está ${Math.round(deviation.distance)}m fora da rota!`,
                        undefined,
                        {
                          duration: 8000,
                          icon: '⚠️',
                          position: 'top-right',
                        }
                      )
                      
                      // Limpar após 5 minutos
                      setTimeout(() => {
                        setNotifiedDeviations((prev) => {
                          const newSet = new Set(prev)
                          newSet.delete(deviationKey)
                          return newSet
                        })
                      }, 5 * 60 * 1000)
                    } else if (!isCritical && deviation.distance > 200) {
                      // Notificação para desvios médios (uma vez por desvio)
                      if (!notifiedDeviations.has(deviationKey)) {
                        setNotifiedDeviations((prev) => {
                          const newSet = new Set(prev)
                          newSet.add(deviationKey)
                          return newSet
                        })
                        
                        notifyError(
                          `⚠️ Desvio: ${vehicle.plate} está ${Math.round(deviation.distance)}m fora da rota`,
                          undefined,
                          {
                            duration: 5000,
                            position: 'top-right',
                          }
                        )
                        
                        // Limpar após 3 minutos
                        setTimeout(() => {
                          setNotifiedDeviations((prev) => {
                            const newSet = new Set(prev)
                            newSet.delete(deviationKey)
                            return newSet
                          })
                        }, 3 * 60 * 1000)
                      }
                    }
                  }
                } catch (error) {
                  logError('Erro ao detectar desvio de rota', { error }, 'AdminMap')
                }
              }, 0)
            }
          }
          
          return updated
        } else {
          // Buscar dados completos do veículo se não existir
          // Por enquanto, criar veículo básico (será atualizado quando buscar dados completos)
          return prev
        }
      })
    } else if (update.type === 'alert') {
      setAlerts((prev) => {
        const index = prev.findIndex(
          (a) => a.alert_id === update.data.alert_id
        )
        if (index >= 0) {
          return prev
        } else {
          return [...prev, update.data]
        }
      })
    }
  }, [routes])

  // Inicializar realtime
  const initRealtime = useCallback(() => {
    // Desconectar playback se estiver ativo
    if (playbackServiceRef.current) {
      playbackServiceRef.current.stop()
      playbackServiceRef.current = null
    }

    const service = new RealtimeService({
      onUpdate: (update: RealtimeUpdateType) => {
        handleRealtimeUpdate(update)
      },
      onError: (error) => {
        logError('Erro no realtime', { error }, 'AdminMap')
      },
    })

    service.connect()
    realtimeServiceRef.current = service
  }, [handleRealtimeUpdate])

  // Inicializar playback histórico
  const initPlayback = useCallback(async () => {
    // Desconectar realtime se estiver ativo
    if (realtimeServiceRef.current) {
      await realtimeServiceRef.current.disconnect()
      realtimeServiceRef.current = null
    }

    // Criar instância do PlaybackService
    if (!playbackServiceRef.current) {
      playbackServiceRef.current = new PlaybackService()
    }

    // Carregar posições históricas
    const positions = await playbackServiceRef.current.loadPositions(
      filters.company || null,
      filters.route || null,
      filters.vehicle || null,
      playbackFrom,
      playbackTo,
      1 // 1 minuto de intervalo
    )

    if (positions.length === 0) {
      notifyError('Nenhuma posição histórica encontrada para o período selecionado')
      setHistoricalTrajectories([])
      return
    }

    // Agrupar posições por veículo e trip para criar trajetos
    const trajectoriesMap = new Map<string, {
      vehicle_id: string
      trip_id: string
      positions: Array<{ lat: number; lng: number; timestamp: Date }>
    }>()

    positions.forEach((pos) => {
      const key = `${pos.vehicle_id}-${pos.trip_id}`
      if (!trajectoriesMap.has(key)) {
        trajectoriesMap.set(key, {
          vehicle_id: pos.vehicle_id,
          trip_id: pos.trip_id,
          positions: [],
        })
      }
      const trajectory = trajectoriesMap.get(key)!
      trajectory.positions.push({
        lat: pos.lat,
        lng: pos.lng,
        timestamp: pos.timestamp,
      })
    })

    // Converter para array e ordenar por timestamp dentro de cada trajeto
    const trajectories = Array.from(trajectoriesMap.values()).map((t) => ({
      ...t,
      positions: t.positions.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime()),
      color: '#F59E0B', // Amarelo/laranja para trajetos reais
    }))

    setHistoricalTrajectories(trajectories)
    setShowTrajectories(true)
    notifySuccess(`${positions.length} posições carregadas para playback (${trajectories.length} trajetos)`)
  }, [filters.company, filters.route, filters.vehicle, playbackFrom, playbackTo])

  // Visualizar histórico e análise de trajeto
  const handleViewVehicleHistory = useCallback(async (vehicle: Vehicle) => {
    if (!vehicle.trip_id || !vehicle.route_id) {
      notifyError('Veículo não possui viagem ou rota associada')
      return
    }

    try {
      // Buscar rota planejada
      const route = routes.find((r) => r.route_id === vehicle.route_id)
      if (!route || !route.polyline_points || route.polyline_points.length < 2) {
        notifyError('Rota não encontrada ou incompleta')
        return
      }

      // Buscar dados da viagem
      const { data: tripData, error: tripError } = await supabase
        .from('trips')
        .select('id, started_at, completed_at, route_id')
        .eq('id', vehicle.trip_id)
        .single()

      if (tripError || !tripData) {
        notifyError('Dados da viagem não encontrados')
        return
      }

      const from = tripData.started_at ? new Date(tripData.started_at) : new Date(Date.now() - 2 * 60 * 60 * 1000)
      const to = tripData.completed_at ? new Date(tripData.completed_at) : new Date()

      // Carregar posições históricas
      if (!playbackServiceRef.current) {
        playbackServiceRef.current = new PlaybackService()
      }

      const positions = await playbackServiceRef.current.loadPositions(
        null,
        vehicle.route_id,
        vehicle.vehicle_id,
        from,
        to,
        1
      )

      if (positions.length === 0) {
        notifyError('Nenhuma posição histórica encontrada')
        return
      }

      // Converter para formato de análise
      const plannedRoute: PlannedRoutePoint[] = route.polyline_points.map((p, idx) => ({
        lat: p.lat,
        lng: p.lng,
        order: p.order || idx,
      }))

      const actualPositions: ActualPosition[] = positions.map((p) => ({
        lat: p.lat,
        lng: p.lng,
        timestamp: p.timestamp,
        speed: p.speed,
      }))

      // Analisar trajeto
      const analysis = analyzeTrajectory(plannedRoute, actualPositions, 200)
      setTrajectoryAnalysis(analysis)
      setShowTrajectoryAnalysis(true)
      
      // Mostrar trajeto no mapa
      const trajectory = {
        vehicle_id: vehicle.vehicle_id,
        trip_id: vehicle.trip_id,
        positions: positions.map((p) => ({
          lat: p.lat,
          lng: p.lng,
          timestamp: p.timestamp,
        })),
        color: '#F59E0B',
      }
      setHistoricalTrajectories([trajectory])
      setShowTrajectories(true)

      notifySuccess('Análise de trajeto carregada')
    } catch (error: any) {
      logError('Erro ao carregar histórico', { error }, 'AdminMap')
      notifyError(formatError(error, 'Erro ao carregar histórico'))
    }
  }, [routes])

  // Carregar trajetos quando veículo selecionado
  const loadVehicleTrajectory = useCallback(async (vehicle: Vehicle) => {
    if (!vehicle.trip_id) {
      setHistoricalTrajectories([])
      return
    }

    try {
      // Carregar última viagem completa do veículo
      const { data: tripData, error: tripError } = await supabase
        .from('trips')
        .select('id, started_at, completed_at')
        .eq('id', vehicle.trip_id)
        .single()

      if (tripError || !tripData) {
        warn('Trip não encontrada', { error: tripError }, 'AdminMap')
        return
      }

      const from = tripData.started_at ? new Date(tripData.started_at) : new Date(Date.now() - 2 * 60 * 60 * 1000)
      const to = tripData.completed_at ? new Date(tripData.completed_at) : new Date()

      if (!playbackServiceRef.current) {
        playbackServiceRef.current = new PlaybackService()
      }

      const positions = await playbackServiceRef.current.loadPositions(
        null,
        vehicle.route_id || null,
        vehicle.vehicle_id,
        from,
        to,
        1
      )

      if (positions.length > 0) {
        const trajectory = {
          vehicle_id: vehicle.vehicle_id,
          trip_id: vehicle.trip_id,
          positions: positions.map((p) => ({
            lat: p.lat,
            lng: p.lng,
            timestamp: p.timestamp,
          })),
          color: '#F59E0B',
        }
        setHistoricalTrajectories([trajectory])
        setShowTrajectories(true)
      } else {
        setHistoricalTrajectories([])
      }
    } catch (error) {
      logError('Erro ao carregar trajeto do veículo', { error }, 'AdminMap')
      setHistoricalTrajectories([])
    }
  }, [])

  // Reagir a mudanças de modo
  useEffect(() => {
    if (!mapInstanceRef.current) return
    
    if (mode === 'live') {
      initRealtime()
      setHistoricalTrajectories([])
      setShowTrajectories(false)
    } else {
      initPlayback()
    }
  }, [mode, initRealtime, initPlayback])

  // Carregar trajeto quando veículo selecionado
  useEffect(() => {
    if (selectedVehicle && mode === 'live') {
      loadVehicleTrajectory(selectedVehicle)
    } else if (!selectedVehicle && mode === 'live') {
      setHistoricalTrajectories([])
      setShowTrajectories(false)
    }
  }, [selectedVehicle, mode, loadVehicleTrajectory])

  // Atalhos de teclado
  useKeyboardShortcuts({
    onPlayPause: () => {
      if (mode === 'history') {
        if (isPlaying) {
          playbackServiceRef.current?.pause()
          setIsPlaying(false)
        } else {
          // Reativar playback se necessário
          if (playbackServiceRef.current) {
            playbackServiceRef.current.play({
              speed: playbackSpeed,
              from: playbackFrom,
              to: playbackTo,
              onPositionUpdate: () => {},
              onComplete: () => setIsPlaying(false),
              onPause: () => setIsPlaying(false),
              onPlay: () => setIsPlaying(true),
            })
            setIsPlaying(true)
          }
        }
      }
    },
    onStop: () => {
      if (mode === 'history') {
        playbackServiceRef.current?.stop()
        setIsPlaying(false)
        setPlaybackProgress(0)
      }
    },
    onZoomIn: () => {
      if (mapInstanceRef.current) {
        const currentZoom = mapInstanceRef.current.getZoom() || 13
        mapInstanceRef.current.setZoom(currentZoom + 1)
      }
    },
    onZoomOut: () => {
      if (mapInstanceRef.current) {
        const currentZoom = mapInstanceRef.current.getZoom() || 13
        mapInstanceRef.current.setZoom(currentZoom - 1)
      }
    },
    onSpeedUp: () => {
      if (mode === 'history') {
        const speeds: (1 | 2 | 4)[] = [1, 2, 4]
        const currentIndex = speeds.indexOf(playbackSpeed)
        if (currentIndex < speeds.length - 1) {
          const newSpeed = speeds[currentIndex + 1]
          setPlaybackSpeed(newSpeed)
          playbackServiceRef.current?.setSpeed(newSpeed)
        }
      }
    },
    onSpeedDown: () => {
      if (mode === 'history') {
        const speeds: (1 | 2 | 4)[] = [1, 2, 4]
        const currentIndex = speeds.indexOf(playbackSpeed)
        if (currentIndex > 0) {
          const newSpeed = speeds[currentIndex - 1]
          setPlaybackSpeed(newSpeed)
          playbackServiceRef.current?.setSpeed(newSpeed)
        }
      }
    },
    onToggleHeatmap: () => {
      setShowHeatmap(!showHeatmap)
    },
    enabled: !loading && !mapError,
  })

  // Despachar socorro
  const handleDispatchAssistance = useCallback(async (vehicle: Vehicle) => {
    try {
      // Criar requisição de socorro
      const { data, error } = await supabase
        .from('gf_service_requests')
        .insert({
          empresa_id: vehicle.company_id,
          tipo: 'socorro',
          payload: {
            vehicle_id: vehicle.vehicle_id,
            driver_id: vehicle.driver_id,
            route_id: vehicle.route_id,
            latitude: vehicle.lat,
            longitude: vehicle.lng,
          },
          status: 'enviado',
          priority: 'urgente',
        })
        .select()
        .single()

      if (error) throw error

    notifySuccess('Socorro despachado com sucesso!')
      
      // Recarregar alertas chamando loadInitialData novamente
      // Isso vai recarregar todos os alertas incluindo o novo socorro
      loadInitialData()
    } catch (error: any) {
      logError('Erro ao despachar socorro', { error }, 'AdminMap')
    notifyError(formatError(error, 'Erro ao despachar socorro'))
    }
  }, [])

  // Exportar visão (PNG + CSV)
  const handleExport = useCallback(async () => {
    try {
      // Exportar PNG do mapa
      if (mapRef.current && !listMode) {
        try {
          const { exportMapPNG } = await import('@/lib/export-map-png')
          await exportMapPNG('map-container')
    notifySuccess('Mapa exportado como PNG!')
        } catch (error: any) {
          logError('Erro ao exportar PNG', { error }, 'AdminMap')
    notifyError(formatError(error, 'Erro ao exportar PNG do mapa'))
        }
      }
      
      // Exportar CSV dos veículos visíveis
      if (vehicles.length > 0) {
        const csvContent = [
          'Placa,Modelo,Rota,Motorista,Latitude,Longitude,Velocidade,Status,Passageiros',
          ...vehicles.map(v => [
            v.plate,
            v.model,
            v.route_name || 'N/A',
            v.driver_name || 'N/A',
            v.lat?.toFixed(6) || '0',
            v.lng?.toFixed(6) || '0',
            v.speed?.toString() || '0',
            v.vehicle_status || 'N/A',
            v.passenger_count?.toString() || '0'
          ].join(','))
        ].join('\n')

        const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `mapa-veiculos-${new Date().toISOString().split('T')[0]}.csv`
        a.click()
        URL.revokeObjectURL(url)
    notifySuccess('CSV exportado!')
      }
    } catch (error: any) {
      logError('Erro ao exportar', { error }, 'AdminMap')
    notifyError(formatError(error, 'Erro ao exportar'))
    }
  }, [vehicles, listMode])

  // Sincronizar URL com filtros (deep-link)
  useEffect(() => {
    const params = new URLSearchParams()
    if (filters.company) params.set('company_id', filters.company)
    if (filters.route) params.set('route_id', filters.route)
    if (filters.vehicle) params.set('vehicle_id', filters.vehicle)
    if (filters.driver) params.set('driver_id', filters.driver)
    if (filters.status) params.set('status', filters.status)
    if (filters.shift) params.set('shift', filters.shift)
    
    // Sincronizar centro e zoom do mapa
    if (mapInstanceRef.current) {
      const center = mapInstanceRef.current.getCenter()
      const zoom = mapInstanceRef.current.getZoom()
      if (center) {
        params.set('lat', center.lat().toString())
        params.set('lng', center.lng().toString())
      }
      if (zoom) {
        params.set('zoom', zoom.toString())
      }
    }

    // Modo (ao vivo/histórico)
    if (mode === 'history') {
      params.set('mode', 'history')
      // Adicionar from/to quando implementado
    }

    const queryString = params.toString()
    const newUrl = queryString
      ? `${window.location.pathname}?${queryString}`
      : window.location.pathname
    // Atualiza a URL sem disparar navegação do Next.js para evitar fetch de payload RSC
    const current = `${window.location.pathname}${window.location.search}`
    if (newUrl !== current) {
      window.history.replaceState(null, '', newUrl)
    }
  }, [filters, mode, router])

  return (
    <div className="relative w-full h-[calc(100vh-200px)]">
      {/* Filtros na topbar */}
      <div className="absolute top-4 left-4 right-4 z-20">
        <MapFilters
          filters={filters}
          onFiltersChange={setFilters}
          vehiclesCount={vehicles.length}
          routesCount={routes.length}
          alertsCount={alerts.length}
          mode={mode}
          onModeChange={setMode}
          playbackFrom={playbackFrom}
          playbackTo={playbackTo}
          onPlaybackPeriodChange={(from, to) => {
            setPlaybackFrom(from)
            setPlaybackTo(to)
            // Recarregar posições se estiver em modo histórico
            if (mode === 'history' && playbackServiceRef.current) {
              initPlayback()
            }
          }}
        />
      </div>

      {/* Mapa */}
      <div id="map-container" ref={mapRef} className="w-full h-full" />

      {/* Controles de Playback (quando em modo histórico) */}
      {mode === 'history' && (
        <div className="absolute bottom-4 left-4 right-4 z-20">
        <PlaybackControls
          isPlaying={isPlaying}
          onPlay={async () => {
            if (!playbackServiceRef.current) {
              await initPlayback()
            }
            
            if (playbackServiceRef.current) {
              playbackServiceRef.current.play({
                speed: playbackSpeed,
                from: playbackFrom,
                to: playbackTo,
                onPositionUpdate: (position, timestamp) => {
                  // Atualizar marcador do veículo no mapa
                  const marker = markersRef.current.get(position.vehicle_id)
                  if (marker && mapInstanceRef.current) {
                    marker.setPosition({ lat: position.lat, lng: position.lng })
                    if (position.heading !== null) {
                      const icon = marker.getIcon() as google.maps.Icon
                      if (icon) {
                        marker.setIcon({
                          ...icon,
                          rotation: position.heading,
                        })
                      }
                    }
                  } else {
                    // Criar novo marcador se não existir
                    if (mapInstanceRef.current) {
                      const color = '#10B981' // verde
                      const icon = {
                        path: google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
                        scale: 6,
                        fillColor: color,
                        fillOpacity: 1,
                        strokeColor: '#FFFFFF',
                        strokeWeight: 2,
                        rotation: position.heading || 0,
                      }

                      const newMarker = new google.maps.Marker({
                        position: { lat: position.lat, lng: position.lng },
                        map: mapInstanceRef.current,
                        icon,
                        title: `Veículo ${position.vehicle_id}`,
                      })

                      markersRef.current.set(position.vehicle_id, newMarker)
                    }
                  }

                  // Atualizar veículo no estado (ou criar se não existir)
                  setVehicles((prev) => {
                    const index = prev.findIndex(v => v.vehicle_id === position.vehicle_id)
                    if (index >= 0) {
                      const updated = [...prev]
                      updated[index] = {
                        ...updated[index],
                        lat: position.lat,
                        lng: position.lng,
                        speed: position.speed,
                        heading: position.heading,
                        last_position_time: timestamp.toISOString(),
                      }
                      return updated
                    } else {
                      // Criar veículo básico se não existir
                      return [...prev, {
                        vehicle_id: position.vehicle_id,
                        trip_id: position.trip_id,
                        route_id: position.route_id,
                        route_name: 'Rota',
                        driver_id: position.driver_id,
                        driver_name: 'Motorista',
                        company_id: filters.company || '',
                        company_name: '',
                        plate: 'VEÍCULO',
                        model: '',
                        lat: position.lat,
                        lng: position.lng,
                        speed: position.speed,
                        heading: position.heading,
                        vehicle_status: 'moving' as const,
                        passenger_count: position.passenger_count,
                        last_position_time: timestamp.toISOString(),
                      }]
                    }
                  })

                  // Atualizar progresso
                  const totalDuration = playbackTo.getTime() - playbackFrom.getTime()
                  const elapsed = timestamp.getTime() - playbackFrom.getTime()
                  setPlaybackProgress(Math.max(0, Math.min(100, (elapsed / totalDuration) * 100)))
                },
                onComplete: () => {
                  setIsPlaying(false)
  notifySuccess('Playback concluído')
                },
                onPause: () => {
                  setIsPlaying(false)
                },
                onPlay: () => {
                  setIsPlaying(true)
                },
              })
              setIsPlaying(true)
            }
          }}
          onPause={() => {
            setIsPlaying(false)
            playbackServiceRef.current?.pause()
          }}
          onStop={() => {
            setIsPlaying(false)
            playbackServiceRef.current?.stop()
            setPlaybackProgress(0)
          }}
          onSpeedChange={(speed) => {
            setPlaybackSpeed(speed)
            playbackServiceRef.current?.setSpeed(speed)
          }}
          progress={playbackProgress}
          currentTime={playbackFrom}
          duration={playbackTo}
        />
        </div>
      )}

      {/* Painéis Laterais */}
      <AnimatePresence>
        {selectedVehicle && (
          <VehiclePanel
            vehicle={selectedVehicle}
            onClose={() => setSelectedVehicle(null)}
            onFollow={() => {
              // Seguir veículo (auto-center)
              if (selectedVehicle && mapInstanceRef.current) {
                mapInstanceRef.current.setCenter({
                  lat: selectedVehicle.lat,
                  lng: selectedVehicle.lng,
                })
                mapInstanceRef.current.setZoom(15)
              }
            }}
            onDispatch={async () => {
              if (selectedVehicle) {
                // Confirmar despacho
                const confirmed = window.confirm(
                  `Despachar socorro para o veículo ${selectedVehicle.plate}?\n\n` +
                  `Motorista: ${selectedVehicle.driver_name}\n` +
                  `Rota: ${selectedVehicle.route_name}\n` +
                  `Posição: ${selectedVehicle.lat.toFixed(6)}, ${selectedVehicle.lng.toFixed(6)}`
                )
                
                if (confirmed) {
                  await handleDispatchAssistance(selectedVehicle)
                }
              }
            }}
            onViewHistory={async () => {
              if (selectedVehicle) {
                await handleViewVehicleHistory(selectedVehicle)
              }
            }}
          />
        )}
        {selectedRoute && (
          <RoutePanel
            route={selectedRoute}
            onClose={() => setSelectedRoute(null)}
          />
        )}
        {selectedAlert && (
          <AlertsPanel
            alerts={[selectedAlert]}
            onClose={() => setSelectedAlert(null)}
          />
        )}
        {showTrajectoryAnalysis && trajectoryAnalysis && selectedVehicle && (
          <TrajectoryPanel
            analysis={trajectoryAnalysis}
            vehiclePlate={selectedVehicle.plate}
            routeName={selectedVehicle.route_name}
            onClose={() => {
              setShowTrajectoryAnalysis(false)
              setTrajectoryAnalysis(null)
            }}
          />
        )}
      </AnimatePresence>

      {/* Camadas do Mapa */}
      {mapInstanceRef.current && (
        <>
          <MapLayers
            map={mapInstanceRef.current}
            vehicles={vehicles}
            routes={routes}
            alerts={alerts}
            selectedVehicle={selectedVehicle}
            onVehicleClick={setSelectedVehicle}
            onRouteClick={setSelectedRoute}
            onAlertClick={(alert) => {
              setSelectedAlert(alert)
              // Navegar para localização do alerta no mapa
              if (alert.lat && alert.lng && mapInstanceRef.current) {
                mapInstanceRef.current.setCenter({ lat: alert.lat, lng: alert.lng })
                mapInstanceRef.current.setZoom(15)
              }
            }}
            clustererRef={clustererRef}
            historicalTrajectories={historicalTrajectories}
            routeStops={routeStops}
            selectedRouteId={selectedRoute?.route_id || null}
            showTrajectories={showTrajectories}
            mode={mode}
          />
          {/* Heatmap Layer */}
          <HeatmapLayer
            map={mapInstanceRef.current}
            vehicles={vehicles}
            enabled={showHeatmap}
            mode={mode}
          />
        </>
      )}

      

      {/* Overlay de Loading */}
      {loading && (
        <div className="absolute inset-0 z-40 flex items-center justify-center bg-white/70 backdrop-blur-sm">
          <div className="text-center">
            <div className="loader-spinner mx-auto"></div>
            <p className="mt-4 text-[var(--ink-muted)]">Carregando mapa...</p>
          </div>
        </div>
      )}

      {/* Overlay de Erro ou Modo Lista */}
      {mapError && listMode ? (
        <div className="absolute inset-0 z-40 bg-white overflow-y-auto">
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-xl font-semibold mb-2">Modo Lista</h3>
                <p className="text-[var(--ink-muted)]">{mapError}</p>
              </div>
              <Button onClick={() => window.location.reload()}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Tentar Mapa Novamente
              </Button>
            </div>
            
            {/* Lista de Veículos */}
            {vehicles.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {vehicles.map((vehicle) => (
                  <Card key={vehicle.vehicle_id} className="p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h4 className="font-semibold">{vehicle.plate}</h4>
                        <p className="text-sm text-[var(--ink-muted)]">{vehicle.model}</p>
                      </div>
                      <Badge variant={vehicle.vehicle_status === 'moving' ? 'default' : 'secondary'}>
                        {vehicle.vehicle_status === 'moving'
                          ? 'Em Movimento'
                          : vehicle.vehicle_status === 'stopped_long'
                          ? 'Parado (>3min)'
                          : vehicle.vehicle_status === 'stopped_short'
                          ? 'Parado (<2min)'
                          : 'Na Garagem'}
                      </Badge>
                    </div>
                    <div className="text-sm text-[var(--ink-muted)] space-y-1">
                      <p>Rota: {vehicle.route_name || 'N/D'}</p>
                      <p>Motorista: {vehicle.driver_name || 'N/D'}</p>
                      <p>Posição: {vehicle.lat?.toFixed(4)}, {vehicle.lng?.toFixed(4)}</p>
                      <p>Velocidade: {vehicle.speed ? `${(vehicle.speed * 3.6).toFixed(0)} km/h` : 'N/D'}</p>
                      <p>Passageiros: {vehicle.passenger_count || 0}</p>
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <MapIcon className="h-16 w-16 text-[var(--ink-muted)] mx-auto mb-4" />
                <p className="text-[var(--ink-muted)]">Nenhum veículo encontrado.</p>
              </div>
            )}
          </div>
        </div>
      ) : mapError && !listMode ? (
        <div className="absolute inset-0 z-40 flex items-center justify-center bg-white/80 backdrop-blur-sm">
          <div className="text-center max-w-md">
            <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">Erro no Mapa</h3>
            <p className="text-[var(--ink-muted)] mb-6">{mapError}</p>
            <Button onClick={() => window.location.reload()}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Tentar Novamente
            </Button>
          </div>
        </div>
      ) : null}

      {/* Estados Vazios */}
      {!loading && !mapError && vehicles.length === 0 && (
        <div className="absolute inset-0 z-30 flex items-center justify-center bg-white/50 backdrop-blur-sm">
          <div className="text-center max-w-md p-6 bg-white rounded-lg shadow-lg">
            <MapIcon className="h-16 w-16 text-[var(--ink-muted)] mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">Sem veículos ativos</h3>
            <p className="text-sm text-[var(--ink-muted)] mb-4">
              Nenhum veículo encontrado com os filtros selecionados.
            </p>
            <details className="text-left text-sm text-[var(--ink-muted)] bg-gray-50 p-4 rounded mb-4">
              <summary className="cursor-pointer font-medium mb-2">Possíveis causas:</summary>
              <ul className="list-disc list-inside space-y-1 mt-2">
                <li>Não há veículos marcados como ativos no banco de dados</li>
                <li>Políticas RLS podem estar bloqueando o acesso</li>
                <li>Filtro de empresa pode estar excluindo todos os veículos</li>
                <li>Veículos não têm trips ativas com status &quot;inProgress&quot;</li>
                <li>Veículos sem posição GPS ainda aparecerão na lista</li>
                <li>Verifique o console do navegador (F12) para mais detalhes</li>
              </ul>
            </details>
            <Button 
              onClick={() => {
                debug('Recarregando dados', {}, 'AdminMap')
                loadInitialData()
              }}
              variant="outline"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Recarregar Dados
            </Button>
            <p className="text-xs text-[var(--ink-light)] mt-4">
              Abra o console (F12) para ver logs detalhados
            </p>
          </div>
        </div>
      )}

      {/* Botão de Exportar */}
      <TooltipProvider>
        <div className="absolute bottom-6 right-6 z-20">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="icon"
                variant="outline"
                onClick={handleExport}
                className="bg-white shadow-lg hover:bg-[var(--bg-hover)]"
                aria-label="Exportar mapa e dados"
              >
                <Download className="h-4 w-4" aria-hidden="true" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Exportar mapa (PNG) e dados (CSV)</p>
            </TooltipContent>
          </Tooltip>
        </div>
      </TooltipProvider>
    </div>
  )
}
