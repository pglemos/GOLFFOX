/**
 * Componente Principal do Mapa Admin
 */

'use client'

import { useEffect, useState, useCallback, useRef, useTransition } from 'react'

import { MarkerClusterer } from '@googlemaps/markerclusterer'
import { AnimatePresence } from 'framer-motion'
import { 
  RefreshCw, 
  AlertCircle, 
  Layers, 
  Download,
  Map as MapIcon 
} from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { 
  isValidCoordinate, 
  normalizeCoordinate 
} from '@/lib/coordinate-validator'
import { formatError, getErrorMeta } from '@/lib/error-utils'
import { loadGoogleMapsAPI } from '@/lib/google-maps-loader'
import { useRouter, useSearchParams } from '@/lib/next-navigation'
import { RealtimeService, RealtimeUpdateType } from '@/lib/realtime-service'
import { PlaybackService } from '@/lib/playback-service'
import { getMapsBillingMonitor } from '@/lib/maps-billing-monitor'
import { detectRouteDeviation } from '@/lib/route-deviation-detector'
import { createAlert } from '@/lib/operational-alerts'
import { loadVehicles } from '@/lib/services/map/map-services/vehicle-loader'
import { analyzeTrajectory, type PlannedRoutePoint, type ActualPosition, type TrajectoryAnalysis } from '@/lib/trajectory-analyzer'
import { TrajectoryPanel } from './trajectory-panel'
import { MapFilters } from './filters'
import { MapLayers } from './layers'
import { HeatmapLayer } from './heatmap-layer'
import { VehiclePanel, RoutePanel, AlertsPanel } from './panels'
import { PlaybackControls } from './playback-controls'



import { useKeyboardShortcuts } from './keyboard-shortcuts'



import { supabase } from '@/lib/supabase'
import { notifySuccess, notifyError } from '@/lib/toast'
import { debug, warn, error as logError } from '@/lib/logger'
import { t } from '@/lib/i18n'
import type { Veiculo, RoutePolyline, MapAlert, MapsBillingStatus, HistoricalTrajectory, RouteStop } from '@/types/map'
import { useMapFilters } from '@/stores/map-filters'
import { useMapSelection } from '@/stores/map-selection'
import { useMapPlayback } from '@/stores/map-playback'
import type { SupabaseRoute, SupabaseStopWithRoute, SupabaseTripWithDates, SupabaseVeiculo } from '@/types/supabase-data'
import { Database } from '@/types/supabase'
import { toError } from '@/lib/types/errors'

export interface AdminMapProps {
  companyId?: string
  routeId?: string
  vehicleId?: string
  initialCenter?: { lat: number; lng: number }
  initialZoom?: number
}

// Re-exportar tipos para compatibilidade
export type veiculo = Veiculo
export type Alert = MapAlert
export { RoutePolyline } from '@/types/map'

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
    const clustererRef = useRef<MarkerClusterer | null>(null)
  const realtimeServiceRef = useRef<RealtimeService | null>(null)
  const playbackServiceRef = useRef<PlaybackService | null>(null)
  
  // State
  const [isPending, startTransition] = useTransition()
  const [loading, setLoading] = useState(true)
  const [mapError, setMapError] = useState<string | null>(null)
  // Stores Zustand para estado do mapa
  const companyFilter = useMapFilters(state => state.company)
  const routeFilter = useMapFilters(state => state.route)
  const veiculoFilter = useMapFilters(state => state.veiculo)
  const motoristaFilter = useMapFilters(state => state.motorista)
  const statusFilter = useMapFilters(state => state.status)
  const shiftFilter = useMapFilters(state => state.shift)
  const searchFilter = useMapFilters(state => state.search)
  const setCompanyFilter = useMapFilters(state => state.setCompany)
  const setRouteFilter = useMapFilters(state => state.setRoute)
  const setVeiculoFilter = useMapFilters(state => state.setVeiculo)
  const setFilters = useMapFilters(state => state.setFilters)
  
  const selection = useMapSelection()
  const playback = useMapPlayback()

  // Estados locais (não compartilhados)
  const [veiculos, setVeiculos] = useState<Veiculo[]>([])
  const [routes, setRoutes] = useState<RoutePolyline[]>([])
  const [alerts, setAlerts] = useState<MapAlert[]>([])
  const [historicalTrajectories, setHistoricalTrajectories] = useState<HistoricalTrajectory[]>([])
  const [routeStops, setRouteStops] = useState<RouteStop[]>([])
  const [billingStatus, setBillingStatus] = useState<MapsBillingStatus | null>(null)
  const [listMode, setListMode] = useState(false) // Fallback modo lista
  const [trajectoryAnalysis, setTrajectoryAnalysis] = useState<TrajectoryAnalysis | null>(null)
  const [notifiedDeviations, setNotifiedDeviations] = useState<Set<string>>(new Set())
  const [dataLoaded, setDataLoaded] = useState(false) // Flag para indicar que os dados foram carregados pelo menos uma vez

  // Inicializar filtros com props iniciais
  useEffect(() => {
    if (companyId) setCompanyFilter(companyId)
    if (routeId) setRouteFilter(routeId)
    if (vehicleId) setVeiculoFilter(vehicleId)
  }, [companyId, routeId, vehicleId, setCompanyFilter, setRouteFilter, setVeiculoFilter])

  // Inicializar mapa
  useEffect(() => {
    let isMounted = true
    const abortController = new AbortController()

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
        // Verificar quota antes de carregar
        const billingMonitor = getMapsBillingMonitor()
        const billingStatus = billingMonitor.getStatus()
        if (isMounted) {
          setBillingStatus(billingStatus)
        }

        if (billingMonitor.isQuotaExceeded()) {
          if (isMounted) {
            setMapError(t('common', 'errors.mapsQuotaExceededListMode'))
            setListMode(true)
            setLoading(false)
          }
          if (!abortController.signal.aborted) {
            await loadInitialData(abortController.signal)
          }
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
          disableDefaultUI: false,
        })

        mapInstanceRef.current = map
        
        // Garantir que o mapa seja renderizado
        debug('Mapa do Google Maps criado com sucesso', {
          center: map.getCenter()?.toJSON(),
          zoom: map.getZoom()
        }, 'AdminMap')
        
        // Forçar resize do mapa após um pequeno delay para garantir renderização
        setTimeout(() => {
          if (map && window.google?.maps) {
            window.google.maps.event.trigger(map, 'resize')
            debug('Resize do mapa disparado', {}, 'AdminMap')
          }
        }, 100)
        
        // Listener para lazy loading de rotas quando viewport muda (será configurado após loadInitialData)
        
        // Carregar dados iniciais
        debug('Iniciando carregamento de dados iniciais', {}, 'AdminMap')
        if (!abortController.signal.aborted) {
          try {
            await loadInitialData(abortController.signal)
            if (isMounted) {
              debug('Dados iniciais carregados com sucesso', {
                veiculos: veiculos.length,
                routes: routes.length,
                alerts: alerts.length
              }, 'AdminMap')
            }
          } catch (error: unknown) {
            if (isMounted) {
              logError('Erro ao carregar dados iniciais', { error }, 'AdminMap')
              notifyError(error, 'Erro ao carregar dados do mapa')
            }
          }
        }
        
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
        if (!abortController.signal.aborted && isMounted) {
          if (playback.mode === 'live') {
            debug('Inicializando modo realtime', {}, 'AdminMap')
            initRealtime()
          } else {
            debug('Inicializando modo playback', {}, 'AdminMap')
            initPlayback()
          }
        }
        
        if (isMounted) {
          setLoading(false)
          debug('Mapa inicializado com sucesso', {
            veiculos: veiculos.length,
            routes: routes.length,
            alerts: alerts.length,
            mode: playback.mode
          }, 'AdminMap')
        }
        
        // Cleanup
        return () => {
          google.maps.event.removeListener(boundsListener)
          if (boundsListenerTimeout) {
            clearTimeout(boundsListenerTimeout)
          }
        }
      } catch (error: unknown) {
        if (isMounted) {
          logError('Erro ao inicializar mapa', { error }, 'AdminMap')
          setMapError(t('common', 'errors.mapLoadFailedListMode'))
          setListMode(true)
          setLoading(false)
          // Carregar dados em modo lista
          if (!abortController.signal.aborted) {
            loadInitialData(abortController.signal).catch((err) => {
              if (isMounted) {
                logError('Erro ao carregar dados iniciais', { error: err }, 'AdminMap')
              }
            })
          }
        }
      }
    }

    initMap()

    return () => {
      isMounted = false
      abortController.abort()
      
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
    const currentCompany = companyFilter || null
    
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
          const routeIds = routesData.map((r: SupabaseRoute) => r.id)
          
          const { data: stopsData, error: stopsError } = await supabase
            .from('route_stops')
            .select('route_id, lat, lng, seq, name')
            .in('route_id', routeIds)
            .order('route_id')
            .order('seq')
          
          // Agrupar stops por route_id
          const stopsByRoute = new Map()
          if (stopsData) {
            (stopsData || []).forEach((stop: SupabaseStop) => {
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
          const formattedRoutes = (routesData || []).map((r: SupabaseRoute) => ({
            route_id: r.id,
            route_name: r.name,
            company_id: r.company_id,
            polyline_points: stopsByRoute.get(r.id) || [],
            stops_count: stopsByRoute.get(r.id)?.length || 0
          }))
          
          // Filtrar apenas rotas não carregadas
          const newRoutes = formattedRoutes.filter((r: RoutePolyline) => !loadedRouteIdsRef.current.has(r.route_id))
          
          if (newRoutes.length > 0) {
            // Adicionar ao cache
            newRoutes.forEach((route: RoutePolyline) => {
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
  }, [companyFilter])

  // Carregar dados iniciais
  const loadInitialData = useCallback(async (signal?: AbortSignal) => {
    try {
      // Normalizar companyFilter - remover strings vazias, null, undefined
      const normalizedCompanyId = companyFilter && 
        companyFilter.trim() !== '' && 
        companyFilter !== 'null' && 
        companyFilter !== 'undefined' 
        ? companyFilter 
        : undefined
      
      debug('Carregando dados iniciais com filtros', { 
        company: normalizedCompanyId,
        originalCompanyFilter: companyFilter 
      }, 'AdminMap')
      
      // Carregar veículos usando o serviço extraído
      const vehicles = await loadVehicles(normalizedCompanyId)
      
      // Verificar se foi abortado antes de atualizar estado
      if (signal?.aborted) return
      
      // Normalizar coordenadas dos veículos
      const normalizedVehicles = vehicles.map((v: Veiculo) => {
        if (v.lat !== null && v.lng !== null && isValidCoordinate(v.lat, v.lng)) {
          const normalized = normalizeCoordinate(v.lat, v.lng)
          if (normalized) {
            return { ...v, lat: normalized.lat, lng: normalized.lng }
          }
        }
        
        return {
          ...v,
          speed: v.speed !== null && !isNaN(v.speed) ? v.speed : null,
          heading: v.heading !== null && !isNaN(v.heading) ? v.heading : null,
        }
      })
      
      setVeiculos(normalizedVehicles)
      setDataLoaded(true) // Marcar que os dados foram carregados
      
      const withCoords = normalizedVehicles.filter((v: Veiculo) => v.lat !== null && v.lng !== null).length
      const withoutCoords = normalizedVehicles.length - withCoords
      
      debug(`Carregados ${normalizedVehicles.length} veículos ativos`, { 
        total: normalizedVehicles.length,
        withCoords,
        withoutCoords,
        companyFilter: normalizedCompanyId,
        sample: normalizedVehicles.slice(0, 3).map(v => ({ plate: v.plate, hasCoords: !!(v.lat && v.lng) }))
      }, 'AdminMap')
      
      if (normalizedVehicles.length === 0) {
        warn('Nenhum veículo carregado após loadVehicles', {
          companyFilter: normalizedCompanyId,
          originalCompanyFilter: companyFilter
        }, 'AdminMap')
      }
      
      // Notificar apenas se houver veículos mas sem coordenadas GPS
      // Mas NÃO mostrar mensagem de "Sem veículos" se houver veículos carregados
      if (withCoords === 0 && normalizedVehicles.length > 0) {
        debug(`Notificando: ${normalizedVehicles.length} veículos sem GPS`, {
          total: normalizedVehicles.length,
          withCoords: 0
        }, 'AdminMap')
        notifySuccess(t('common','success.noRecentGpsPositions', { count: normalizedVehicles.length }), {
          duration: 5000
        })
      } else if (normalizedVehicles.length > 0) {
        debug(`Veículos carregados com sucesso`, {
          total: normalizedVehicles.length,
          withCoords,
          withoutCoords
        }, 'AdminMap')
      }

      // Carregar rotas (lazy loading será aplicado via loadVisibleRoutes)
      await loadVisibleRoutes()

      // Carregar alertas - DESABILITADO (serão carregados via realtime polling)
      debug('Carregamento de alertas inicial desabilitado - serão carregados via polling do realtime-service', {}, 'AdminMap')
      setAlerts([]) // Inicializar vazio
      
      // CÓDIGO REMOVIDO - lógica de carregamento de veículos movida para loadVehicles service
      /*
      // Carregar veículos usando o serviço extraído
      const vehicles = await loadVehicles(companyFilter || undefined)
      
      // Normalizar coordenadas dos veículos
      const normalizedVehicles = vehicles.map((v: Veiculo) => {
            if (v.lat !== null && v.lng !== null && isValidCoordinate(v.lat, v.lng)) {
              const normalized = normalizeCoordinate(v.lat, v.lng)
              if (normalized) {
                return { ...v, lat: normalized.lat, lng: normalized.lng }
              }
            }
            
            return {
              ...v,
              speed: v.speed !== null && !isNaN(v.speed) ? v.speed : null,
              heading: v.heading !== null && !isNaN(v.heading) ? v.heading : null,
            }
          })
        
        setVeiculos(normalizedVehicles)
        
        const withCoords = normalizedVehicles.filter((v: Veiculo) => v.lat !== null && v.lng !== null).length
        const withoutCoords = normalizedVehicles.length - withCoords
        
      debug(`Carregados ${normalizedVehicles.length} veículos ativos`, { 
        total: normalizedVehicles.length,
          withCoords,
          withoutCoords
        }, 'AdminMap')
        
      if (withCoords === 0 && normalizedVehicles.length > 0) {
        notifySuccess(t('common','success.noRecentGpsPositions', { count: normalizedVehicles.length }), {
            duration: 5000
          })
      }

      // Carregar rotas (lazy loading será aplicado via loadVisibleRoutes)
      await loadVisibleRoutes()

      // Carregar alertas - DESABILITADO (serão carregados via realtime polling)
      debug('Carregamento de alertas inicial desabilitado - serão carregados via polling do realtime-service', {}, 'AdminMap')
      setAlerts([]) // Inicializar vazio
      
      /*
      // CÓDIGO DESABILITADO - Carregamento de alertas comentado devido a problemas de schema cache
      let combinedAlerts: MapAlert[] = []
      let alertsErrorMsg: string | null = null
      try {
        // Helper: detectar erro de tabela ausente no cache do PostgREST
        const isMissingTableError = (err: unknown, table: string) => {
          const error = toError(err)
          const msg = error.message || ''
          return typeof msg === 'string' && msg.includes(`Could not find the table 'public.${table}'`)
        }

        // Incidentes abertos (sem lat/lng pois a tabela não tem essas colunas)
        let incidentsData: SupabaseIncident[] = []
        let incidentsError: unknown = null
        
        try {
          let incidentsQuery = supabase
            .from('gf_incidents')
            .select('id, company_id, route_id, veiculo_id, severity, description, created_at, status')
            .eq('status', 'open')

          if (companyFilter) {
            incidentsQuery = incidentsQuery.eq('company_id', companyFilter)
          }

          const result = await incidentsQuery
          incidentsData = result.data || []
          incidentsError = result.error
        } catch (error: unknown) {
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
        let assistanceData: SupabaseAssistance[] = []
        let assistanceError: unknown = null
        
        try {
          let assistanceQuery = supabase
            .from('gf_service_requests')
            .select('id, empresa_id, route_id, tipo, status, payload, created_at')
            .eq('tipo', 'socorro')
            .eq('status', 'open')

          if (companyFilter) {
            // Nota: coluna é empresa_id em gf_service_requests
            assistanceQuery = assistanceQuery.eq('empresa_id', companyFilter)
          }

          const result = await assistanceQuery
          assistanceData = result.data || []
          assistanceError = result.error
        } catch (error: unknown) {
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
          const incidentsErr = incidentsError ? toError(incidentsError) : null
          const assistanceErr = assistanceError ? toError(assistanceError) : null
          const msg = incidentsErr?.message ?? assistanceErr?.message ?? (() => { try { return JSON.stringify(incidentsError || assistanceError) } catch { return String(incidentsError || assistanceError) } })()
          alertsErrorMsg = msg
        } else {
          const mappedIncidents = (incidentsData || []).map((i: SupabaseIncident) => ({
            alert_id: i.id,
            alert_type: 'incident',
            company_id: i.company_id,
            route_id: i.route_id,
            veiculo_id: i.veiculo_id,
            severity: i.severity,
            lat: null, // gf_incidents não tem coluna lat
            lng: null, // gf_incidents não tem coluna lng
            description: i.description,
            created_at: i.created_at,
          }))

          // Extrair lat/lng se presente no payload
          const mappedAssistance = (assistanceData || []).map((a: SupabaseAssistance) => {
            const payload = a.payload || {}
            const lat = payload.lat ?? payload.latitude ?? null
            const lng = payload.lng ?? payload.longitude ?? null
            return {
              alert_id: a.id,
              alert_type: 'assistance',
              company_id: a.empresa_id,
              route_id: a.route_id,
              veiculo_id: payload.veiculo_id ?? null,
              severity: payload.severity ?? 'high',
              lat,
              lng,
              description: payload.description ?? 'Solicitação de socorro',
              created_at: a.created_at,
            }
          })

          combinedAlerts = [...mappedIncidents, ...mappedAssistance]

          // Validar alertas com coordenadas quando presentes
          const validAlerts = combinedAlerts.filter((a: MapAlert) => {
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

          setAlerts(validAlerts)
        }
      } catch (alertsError: unknown) {
        alertsErrorMsg = alertsError?.message ?? (() => { try { return JSON.stringify(alertsError) } catch { return String(alertsError) } })()
      }

      if (alertsErrorMsg) {
        logError('Erro ao carregar alertas', { message: alertsErrorMsg }, 'AdminMap')
      }
      */

      // Carregar paradas das rotas
      const routeIds = routes?.map((r: RoutePolyline) => r.route_id) || []
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
          setRouteStops(stopsData.map((stop: SupabaseStopWithRoute) => ({
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
  }, [companyFilter])

  // Processar atualizações do realtime
  const handleRealtimeUpdate = useCallback(async (update: RealtimeUpdateType) => {
    if (update.type === 'position') {
      setVeiculos((prev) => {
        const index = prev.findIndex(
          (v) => v.veiculo_id === update.data.veiculo_id
        )
        if (index >= 0) {
          const updated = [...prev]
          const veiculo = updated[index]
          
          // Validar coordenadas antes de atualizar
          if (!isValidCoordinate(update.data.lat, update.data.lng)) {
            warn(`Coordenadas inválidas recebidas para veículo ${update.data.veiculo_id}`, { lat: update.data.lat, lng: update.data.lng }, 'AdminMap')
            return prev // Não atualizar se coordenadas inválidas
          }
          
          // Normalizar coordenadas
          const normalized = normalizeCoordinate(update.data.lat, update.data.lng)
          if (!normalized) {
            return prev
          }
          
          // Atualizar campos do veículo existente
          updated[index] = {
            ...veiculo,
            lat: normalized.lat,
            lng: normalized.lng,
            speed: update.data.speed !== null && !isNaN(update.data.speed) ? update.data.speed : veiculo.speed,
            heading: update.data.heading,
            vehicle_status: update.data.vehicle_status,
            passenger_count: update.data.passenger_count,
            last_position_time: update.data.timestamp,
          }
          
          // Verificar desvio de rota (apenas se veículo está em movimento e tem rota)
          // Usar setTimeout para não bloquear a atualização do estado
          if (veiculo.route_id && update.data.speed && update.data.speed > 1.4) {
            const route = routes.find((r) => r.route_id === veiculo.route_id)
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
                    const deviationKey = `${veiculo.veiculo_id}-${route.route_id}-${Math.floor(deviation.distance / 100)}`
                    
                    createAlert({
                      type: 'route_deviation',
                      severity: isCritical ? 'critical' : 'error',
                      title: `Veículo fora de rota: ${veiculo.plate}`,
                      message: `Veículo ${veiculo.plate} está ${Math.round(deviation.distance)}m fora da rota planejada.`,
                      metadata: {
                        veiculo_id: veiculo.veiculo_id,
                        route_id: veiculo.route_id,
                        distance: deviation.distance,
                        lat: update.data.lat,
                        lng: update.data.lng,
                      },
                      company_id: veiculo.company_id,
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
                        `🚨 DESVIO CRÍTICO: ${veiculo.plate} está ${Math.round(deviation.distance)}m fora da rota!`,
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
                          `⚠️ Desvio: ${veiculo.plate} está ${Math.round(deviation.distance)}m fora da rota`,
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
      companyFilter || null,
      routeFilter || null,
      veiculoFilter || null,
      playback.playbackFrom,
      playback.playbackTo,
      1 // 1 minuto de intervalo
    )

    if (positions.length === 0) {
      notifyError(t('common','errors.noHistoricalPositionsPeriod'))
      setHistoricalTrajectories([])
      return
    }

    // Agrupar posições por veículo e trip para criar trajetos
    const trajectoriesMap = new Map<string, {
      veiculo_id: string
      trip_id: string
      positions: Array<{ lat: number; lng: number; timestamp: Date }>
    }>()

    positions.forEach((pos) => {
      const key = `${pos.veiculo_id}-${pos.trip_id}`
      if (!trajectoriesMap.has(key)) {
        trajectoriesMap.set(key, {
          veiculo_id: pos.veiculo_id,
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
    playback.setShowTrajectories(true)
    notifySuccess(t('common','success.positionsLoaded', { count: positions.length, trajectories: trajectories.length }))
  }, [companyFilter, routeFilter, veiculoFilter, playback.playbackFrom, playback.playbackTo, playback.setShowTrajectories])

  // Visualizar histórico e análise de trajeto
  const handleViewVehicleHistory = useCallback(async (veiculo: veiculo) => {
    if (!veiculo.trip_id || !veiculo.route_id) {
      notifyError(t('common','errors.noTripOrRoute'))
      return
    }

    try {
      // Buscar rota planejada
      const route = routes.find((r) => r.route_id === veiculo.route_id)
      if (!route || !route.polyline_points || route.polyline_points.length < 2) {
        notifyError(t('common','errors.routeIncomplete'))
        return
      }

      // Buscar dados da viagem
      const { data: tripData, error: tripError } = await supabase
        .from('trips')
        .select('id, started_at, completed_at, route_id')
        .eq('id', veiculo.trip_id)
        .single()

      if (tripError || !tripData) {
        notifyError(t('common','errors.tripDataNotFound'))
        return
      }

      const tripDataTyped = tripData as SupabaseTripWithDates
      const from = tripDataTyped.started_at ? new Date(tripDataTyped.started_at) : new Date(Date.now() - 2 * 60 * 60 * 1000)
      const to = tripDataTyped.completed_at ? new Date(tripDataTyped.completed_at) : new Date()

      // Carregar posições históricas
      if (!playbackServiceRef.current) {
        playbackServiceRef.current = new PlaybackService()
      }

      const positions = await playbackServiceRef.current.loadPositions(
        null,
        veiculo.route_id,
        veiculo.veiculo_id,
        from,
        to,
        1
      )

      if (positions.length === 0) {
        notifyError(t('common','errors.noHistoricalPositions'))
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
      playback.setShowTrajectoryAnalysis(true)
      
      // Mostrar trajeto no mapa
      const trajectory = {
        veiculo_id: veiculo.veiculo_id,
        trip_id: veiculo.trip_id,
        positions: positions.map((p) => ({
          lat: p.lat,
          lng: p.lng,
          timestamp: p.timestamp,
        })),
        color: '#F59E0B',
      }
      setHistoricalTrajectories([trajectory])
      playback.setShowTrajectories(true)

      notifySuccess(t('common','success.trajectoryAnalysisLoaded'))
    } catch (error: unknown) {
      logError('Erro ao carregar histórico', { error }, 'AdminMap')
      notifyError(formatError(error, t('common','errors.loadHistory')))
    }
  }, [routes])

  // Carregar trajetos quando veículo selecionado
  const loadVeiculoTrajectory = useCallback(async (veiculo: veiculo) => {
    if (!veiculo.trip_id) {
      setHistoricalTrajectories([])
      return
    }

    try {
      // Carregar última viagem completa do veículo
      const { data: tripData, error: tripError } = await supabase
        .from('trips')
        .select('id, started_at, completed_at')
        .eq('id', veiculo.trip_id)
        .single()

      if (tripError || !tripData) {
        warn('Trip não encontrada', { error: tripError }, 'AdminMap')
        return
      }

      const tripDataTyped = tripData as SupabaseTripWithDates
      const from = tripDataTyped.started_at ? new Date(tripDataTyped.started_at) : new Date(Date.now() - 2 * 60 * 60 * 1000)
      const to = tripDataTyped.completed_at ? new Date(tripDataTyped.completed_at) : new Date()

      if (!playbackServiceRef.current) {
        playbackServiceRef.current = new PlaybackService()
      }

      const positions = await playbackServiceRef.current.loadPositions(
        null,
        veiculo.route_id || null,
        veiculo.veiculo_id,
        from,
        to,
        1
      )

      if (positions.length > 0) {
        const trajectory = {
          veiculo_id: veiculo.veiculo_id,
          trip_id: veiculo.trip_id,
          positions: positions.map((p) => ({
            lat: p.lat,
            lng: p.lng,
            timestamp: p.timestamp,
          })),
          color: '#F59E0B',
        }
        setHistoricalTrajectories([trajectory])
        playback.setShowTrajectories(true)
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
    
    if (playback.mode === 'live') {
      initRealtime()
      setHistoricalTrajectories([])
      playback.setShowTrajectories(false)
    } else {
      initPlayback()
    }
  }, [playback.mode, playback.setShowTrajectories, initRealtime, initPlayback])

  // Recarregar dados quando filtro de empresa mudar
  useEffect(() => {
    if (!mapInstanceRef.current) return
    
    // Normalizar companyFilter
    const normalizedCompanyId = companyFilter && 
      companyFilter.trim() !== '' && 
      companyFilter !== 'null' && 
      companyFilter !== 'undefined' 
      ? companyFilter 
      : undefined
    
    debug('Filtro de empresa mudou, recarregando dados', { 
      original: companyFilter,
      normalized: normalizedCompanyId 
    }, 'AdminMap')
    
    loadInitialData()
  }, [companyFilter, loadInitialData])

  // Carregar trajeto quando veículo selecionado
  useEffect(() => {
    if (selection.selectedVeiculo && playback.mode === 'live') {
      loadVeiculoTrajectory(selection.selectedVeiculo)
    } else if (!selection.selectedVeiculo && playback.mode === 'live') {
      setHistoricalTrajectories([])
      playback.setShowTrajectories(false)
    }
  }, [selection.selectedVeiculo, playback.mode, loadVeiculoTrajectory, playback.setShowTrajectories])

  // Atalhos de teclado
  useKeyboardShortcuts({
    onPlayPause: () => {
      if (playback.mode === 'history') {
        if (playback.isPlaying) {
          playbackServiceRef.current?.pause()
          playback.setIsPlaying(false)
        } else {
          // Reativar playback se necessário
          if (playbackServiceRef.current) {
            playbackServiceRef.current.play({
              speed: playback.playbackSpeed,
              from: playback.playbackFrom,
              to: playback.playbackTo,
              onPositionUpdate: () => {},
              onComplete: () => playback.setIsPlaying(false),
              onPause: () => playback.setIsPlaying(false),
              onPlay: () => playback.setIsPlaying(true),
            })
            playback.setIsPlaying(true)
          }
        }
      }
    },
    onStop: () => {
      if (playback.mode === 'history') {
        playbackServiceRef.current?.stop()
        playback.setIsPlaying(false)
        playback.setPlaybackProgress(0)
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
      if (playback.mode === 'history') {
        const speeds: (1 | 2 | 4)[] = [1, 2, 4]
        const currentIndex = speeds.indexOf(playback.playbackSpeed)
        if (currentIndex < speeds.length - 1) {
          const newSpeed = speeds[currentIndex + 1]
          playback.setPlaybackSpeed(newSpeed)
          playbackServiceRef.current?.setSpeed(newSpeed)
        }
      }
    },
    onSpeedDown: () => {
      if (playback.mode === 'history') {
        const speeds: (1 | 2 | 4)[] = [1, 2, 4]
        const currentIndex = speeds.indexOf(playback.playbackSpeed)
        if (currentIndex > 0) {
          const newSpeed = speeds[currentIndex - 1]
          playback.setPlaybackSpeed(newSpeed)
          playbackServiceRef.current?.setSpeed(newSpeed)
        }
      }
    },
    onToggleHeatmap: () => {
      playback.setShowHeatmap(!playback.showHeatmap)
    },
    enabled: !loading && !mapError,
  })

  // Despachar socorro
  const handleDispatchAssistance = useCallback(async (veiculo: veiculo) => {
    try {
      // Criar requisição de socorro
      const { data, error } = await supabase
        .from('gf_service_requests')
        .insert({
          empresa_id: veiculo.company_id,
          tipo: 'socorro',
          payload: {
            veiculo_id: veiculo.veiculo_id,
            motorista_id: veiculo.motorista_id,
            route_id: veiculo.route_id,
            latitude: veiculo.lat,
            longitude: veiculo.lng,
          },
          status: 'enviado',
          priority: 'urgente',
        })
        .select()
        .single()

      if (error) throw error

    notifySuccess(t('common','success.assistanceDispatched'))
      
      // Recarregar alertas chamando loadInitialData novamente
      // Isso vai recarregar todos os alertas incluindo o novo socorro
      loadInitialData()
    } catch (error: unknown) {
      logError('Erro ao despachar socorro', { error }, 'AdminMap')
    notifyError(formatError(error, t('common','errors.dispatchAssistance')))
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
          notifySuccess(t('common','success.exportPng'))
        } catch (error: unknown) {
          logError('Erro ao exportar PNG', { error }, 'AdminMap')
          notifyError(formatError(error, t('common','errors.exportPng')))
        }
      }
      
      // Exportar CSV dos veículos visíveis
      if (veiculos.length > 0) {
        const csvContent = [
          'Placa,Modelo,Rota,Motorista,Latitude,Longitude,Velocidade,Status,Passageiros',
          ...veiculos.map(v => [
            v.plate,
            v.model,
            v.route_name || 'N/A',
            v.motorista_name || 'N/A',
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
        notifySuccess(t('common','success.exportCsv'))
      }
    } catch (error: unknown) {
      logError('Erro ao exportar', { error }, 'AdminMap')
    notifyError(formatError(error, t('common','errors.export')))
    }
  }, [veiculos, listMode])

  // Sincronizar URL com filtros (deep-link)
  useEffect(() => {
    const params = new URLSearchParams()
    if (companyFilter) params.set('company_id', companyFilter)
    if (routeFilter) params.set('route_id', routeFilter)
    if (veiculoFilter) params.set('veiculo_id', veiculoFilter)
    if (motoristaFilter) params.set('motorista_id', motoristaFilter)
    if (statusFilter) params.set('status', statusFilter)
    if (shiftFilter) params.set('shift', shiftFilter)
    
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
    if (playback.mode === 'history') {
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
  }, [companyFilter, routeFilter, veiculoFilter, motoristaFilter, statusFilter, shiftFilter, playback.mode, router])

  return (
    <div className="relative w-full h-[calc(100vh-200px)] min-h-[600px]">
      {/* Filtros na topbar */}
      <div className="absolute top-4 left-4 right-4 z-20">
        <MapFilters
          filters={{
            company: companyFilter,
            route: routeFilter,
            veiculo: veiculoFilter,
            motorista: motoristaFilter,
            status: statusFilter,
            shift: shiftFilter,
            search: searchFilter,
          }}
          onFiltersChange={(newFilters) => setFilters(newFilters)}
          vehiclesCount={veiculos.length}
          routesCount={routes.length}
          alertsCount={alerts.length}
          mode={playback.mode}
          onModeChange={playback.setMode}
          playbackFrom={playback.playbackFrom}
          playbackTo={playback.playbackTo}
          onPlaybackPeriodChange={(from, to) => {
            playback.setPlaybackFrom(from)
            playback.setPlaybackTo(to)
            // Recarregar posições se estiver em modo histórico
            if (playback.mode === 'history' && playbackServiceRef.current) {
              initPlayback()
            }
          }}
        />
      </div>

      {/* Mapa */}
      {!listMode ? (
        <div 
          id="map-container" 
          ref={mapRef} 
          className="w-full h-full min-h-[600px] bg-muted"
          style={{ 
            minHeight: '600px',
            position: 'relative'
          }}
        />
      ) : (
        <div className="w-full h-full min-h-[600px] bg-bg-soft flex items-center justify-center">
          <div className="text-center p-6">
            <MapIcon className="h-16 w-16 text-ink-light mx-auto mb-4" />
            <p className="text-ink-muted">Mapa não disponível - Modo Lista Ativo</p>
          </div>
        </div>
      )}

      {/* Controles de Playback (quando em modo histórico) */}
      {playback.mode === 'history' && (
        <div className="absolute bottom-4 left-4 right-4 z-20">
        <PlaybackControls
          isPlaying={playback.isPlaying}
          onPlay={async () => {
            if (!playbackServiceRef.current) {
              await initPlayback()
            }
            
            if (playbackServiceRef.current) {
              playbackServiceRef.current.play({
                speed: playback.playbackSpeed,
                from: playback.playbackFrom,
                to: playback.playbackTo,
                onPositionUpdate: (position, timestamp) => {
                  // Atualizar marcador do veículo no mapa
                  const marker = markersRef.current.get(position.veiculo_id)
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
                        title: `Veículo ${position.veiculo_id}`,
                      })

                      markersRef.current.set(position.veiculo_id, newMarker)
                    }
                  }

                  // Atualizar veículo no estado (ou criar se não existir)
                  setVeiculos((prev) => {
                    const index = prev.findIndex(v => v.veiculo_id === position.veiculo_id)
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
                        veiculo_id: position.veiculo_id,
                        trip_id: position.trip_id,
                        route_id: position.route_id,
                        route_name: 'Rota',
                        motorista_id: position.motorista_id,
                        motorista_name: 'Motorista',
                        company_id: companyFilter || '',
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
                  const totalDuration = playback.playbackTo.getTime() - playback.playbackFrom.getTime()
                  const elapsed = timestamp.getTime() - playback.playbackFrom.getTime()
                  playback.setPlaybackProgress(Math.max(0, Math.min(100, (elapsed / totalDuration) * 100)))
                },
                onComplete: () => {
                  playback.setIsPlaying(false)
  notifySuccess('Playback concluído')
                },
                onPause: () => {
                  playback.setIsPlaying(false)
                },
                onPlay: () => {
                  playback.setIsPlaying(true)
                },
              })
              playback.setIsPlaying(true)
            }
          }}
          onPause={() => {
            playback.setIsPlaying(false)
            playbackServiceRef.current?.pause()
          }}
          onStop={() => {
            playback.setIsPlaying(false)
            playbackServiceRef.current?.stop()
            playback.setPlaybackProgress(0)
          }}
          onSpeedChange={(speed) => {
            playback.setPlaybackSpeed(speed)
            playbackServiceRef.current?.setSpeed(speed)
          }}
          progress={playback.playbackProgress}
          currentTime={playback.playbackFrom}
          duration={playback.playbackTo}
        />
        </div>
      )}

      {/* Painéis Laterais */}
      <AnimatePresence>
        {selection.selectedVeiculo && (
          <VehiclePanel
            veiculo={selection.selectedVeiculo}
            onClose={() => selection.setSelectedVeiculo(null)}
            onFollow={() => {
              // Seguir veículo (auto-center)
              if (selection.selectedVeiculo && mapInstanceRef.current) {
                mapInstanceRef.current.setCenter({
                  lat: selection.selectedVeiculo.lat,
                  lng: selection.selectedVeiculo.lng,
                })
                mapInstanceRef.current.setZoom(15)
              }
            }}
            onDispatch={async () => {
              if (selection.selectedVeiculo) {
                // Confirmar despacho
                const confirmed = window.confirm(
                  `Despachar socorro para o veículo ${selection.selectedVeiculo.plate}?\n\n` +
                  `Motorista: ${selection.selectedVeiculo.motorista_name}\n` +
                  `Rota: ${selection.selectedVeiculo.route_name}\n` +
                  `Posição: ${selection.selectedVeiculo.lat.toFixed(6)}, ${selection.selectedVeiculo.lng.toFixed(6)}`
                )
                
                if (confirmed) {
                  await handleDispatchAssistance(selection.selectedVeiculo)
                }
              }
            }}
            onViewHistory={async () => {
              if (selection.selectedVeiculo) {
                await handleViewVehicleHistory(selection.selectedVeiculo)
              }
            }}
          />
        )}
        {selection.selectedRoute && (
          <RoutePanel
            route={selection.selectedRoute}
            onClose={() => selection.setSelectedRoute(null)}
          />
        )}
        {selection.selectedAlert && (
          <AlertsPanel
            alerts={[selection.selectedAlert]}
            onClose={() => selection.setSelectedAlert(null)}
          />
        )}
        {playback.showTrajectoryAnalysis && trajectoryAnalysis && selection.selectedVeiculo && (
          <TrajectoryPanel
            analysis={trajectoryAnalysis}
            vehiclePlate={selection.selectedVeiculo.plate}
            routeName={selection.selectedVeiculo.route_name}
            onClose={() => {
              playback.setShowTrajectoryAnalysis(false)
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
            veiculos={veiculos}
            routes={routes}
            alerts={alerts}
            selectedVeiculo={selection.selectedVeiculo}
            onVehicleClick={selection.setSelectedVeiculo}
            onRouteClick={selection.setSelectedRoute}
            onAlertClick={(alert) => {
              selection.setSelectedAlert(alert)
              // Navegar para localização do alerta no mapa
              if (alert.lat && alert.lng && mapInstanceRef.current) {
                mapInstanceRef.current.setCenter({ lat: alert.lat, lng: alert.lng })
                mapInstanceRef.current.setZoom(15)
              }
            }}
            clustererRef={clustererRef}
            historicalTrajectories={historicalTrajectories}
            routeStops={routeStops}
            selectedRouteId={selection.selectedRouteId}
            showTrajectories={playback.showTrajectories}
            mode={playback.mode}
          />
          {/* Heatmap Layer */}
          <HeatmapLayer
            map={mapInstanceRef.current}
            veiculos={veiculos}
            enabled={playback.showHeatmap}
            mode={playback.mode}
          />
        </>
      )}

      

      {/* Overlay de Loading */}
      {loading && (
        <div className="absolute inset-0 z-40 flex items-center justify-center bg-white/70 backdrop-blur-sm">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-brand border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="mt-4 text-ink-muted">Carregando mapa...</p>
            {mapError && (
              <p className="mt-2 text-sm text-error">{mapError}</p>
            )}
          </div>
        </div>
      )}
      
      {/* Mensagem de erro se o mapa não carregou */}
      {mapError && !loading && !listMode && (
        <div className="absolute inset-0 z-30 flex items-center justify-center bg-white/90">
          <div className="text-center p-6">
            <AlertCircle className="h-12 w-12 text-error mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Erro ao carregar mapa</h3>
            <p className="text-ink-muted mb-4">{mapError}</p>
            <Button onClick={() => window.location.reload()}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Recarregar Página
            </Button>
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
                <p className="text-ink-muted">{mapError}</p>
              </div>
              <Button onClick={() => window.location.reload()}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Tentar Mapa Novamente
              </Button>
            </div>
            
            {/* Lista de Veículos */}
            {veiculos.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {veiculos.map((veiculo) => (
                  <Card key={veiculo.veiculo_id} className="p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h4 className="font-semibold">{veiculo.plate}</h4>
                        <p className="text-sm text-ink-muted">{veiculo.model}</p>
                      </div>
                      <Badge variant={veiculo.vehicle_status === 'moving' ? 'default' : 'secondary'}>
                        {veiculo.vehicle_status === 'moving'
                          ? 'Em Movimento'
                          : veiculo.vehicle_status === 'stopped_long'
                          ? 'Parado (>3min)'
                          : veiculo.vehicle_status === 'stopped_short'
                          ? 'Parado (<2min)'
                          : 'Na Garagem'}
                      </Badge>
                    </div>
                    <div className="text-sm text-ink-muted space-y-1">
                      <p>Rota: {veiculo.route_name || 'N/D'}</p>
                      <p>Motorista: {veiculo.motorista_name || 'N/D'}</p>
                      <p>Posição: {veiculo.lat?.toFixed(4)}, {veiculo.lng?.toFixed(4)}</p>
                      <p>Velocidade: {veiculo.speed ? `${(veiculo.speed * 3.6).toFixed(0)} km/h` : 'N/D'}</p>
                      <p>Passageiros: {veiculo.passenger_count || 0}</p>
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <MapIcon className="h-16 w-16 text-ink-muted mx-auto mb-4" />
                <p className="text-ink-muted">Nenhum veículo encontrado.</p>
              </div>
            )}
          </div>
        </div>
      ) : mapError && !listMode ? (
        <div className="absolute inset-0 z-40 flex items-center justify-center bg-white/80 backdrop-blur-sm">
          <div className="text-center max-w-md">
            <AlertCircle className="h-16 w-16 text-error mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">Erro no Mapa</h3>
            <p className="text-ink-muted mb-6">{mapError}</p>
            <Button onClick={() => window.location.reload()}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Tentar Novamente
            </Button>
          </div>
        </div>
      ) : null}

      {/* Estados Vazios - Só mostrar se realmente não houver veículos após carregamento completo */}
      {!loading && !mapError && dataLoaded && veiculos.length === 0 && (
        <div className="absolute inset-0 z-30 flex items-center justify-center bg-white/50 backdrop-blur-sm">
          <div className="text-center max-w-md p-6 bg-white rounded-lg shadow-lg">
            <MapIcon className="h-16 w-16 text-ink-muted mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">Sem veículos ativos</h3>
            <p className="text-sm text-ink-muted mb-4">
              Nenhum veículo encontrado com os filtros selecionados.
            </p>
            <div className="text-xs text-ink-light mb-4 p-2 bg-bg-soft rounded">
              <p>Debug: loading={String(loading)}, mapError={mapError || 'null'}, veiculos.length={veiculos.length}</p>
              <p>Filtros: company={companyFilter || 'nenhum'}, route={routeFilter || 'nenhum'}</p>
            </div>
            <details className="text-left text-sm text-ink-muted bg-bg-soft p-4 rounded mb-4">
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
            <p className="text-xs text-ink-light mt-4">
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
                className="bg-white shadow-lg hover:bg-bg-hover"
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
