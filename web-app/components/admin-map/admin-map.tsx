/**
 * Componente Principal do Mapa Admin
 */

'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { loadGoogleMapsAPI } from '@/lib/google-maps-loader'
import { RealtimeService, RealtimeUpdateType } from '@/lib/realtime-service'
import { PlaybackService } from '@/lib/playback-service'
import { fitBoundsWithMargin, createBoundsFromPositions } from '@/lib/map-utils'
import { MapFilters } from './filters'
import { MapLayers } from './layers'
import { VehiclePanel, RoutePanel, AlertsPanel } from './panels'
import { PlaybackControls } from './playback-controls'
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
  last_position_time: string
}

export interface RoutePolyline {
  route_id: string
  route_name: string
  company_id: string
  polyline_points: Array<{ lat: number; lng: number; order: number }>
  stops_count: number
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
  const [mode, setMode] = useState<'live' | 'history'>('live')
  const [isPlaying, setIsPlaying] = useState(false)
  
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
        await loadGoogleMapsAPI(apiKey)
        
        const defaultCenter = { lat: -19.916681, lng: -43.934493 }
        const map = new google.maps.Map(mapRef.current, {
          center: initialCenter || defaultCenter,
          zoom: initialZoom || 12,
          styles: [
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
          ],
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: true,
          zoomControl: true,
        })

        mapInstanceRef.current = map
        
        // Carregar dados iniciais
        await loadInitialData()
        
        // Inicializar realtime
        if (mode === 'live') {
          initRealtime()
        }
        
        setLoading(false)
      } catch (error: any) {
        console.error('Erro ao inicializar mapa:', error)
        setMapError('Erro ao carregar o mapa')
        setLoading(false)
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

  // Carregar dados iniciais
  const loadInitialData = useCallback(async () => {
    try {
      // Carregar veículos
      const { data: vehiclesData, error: vehiclesError } = await supabase
        .from('v_live_vehicles')
        .select('*')
        .eq('company_id', filters.company || null)

      if (!vehiclesError && vehiclesData) {
        setVehicles(vehiclesData as any)
      }

      // Carregar rotas
      const { data: routesData, error: routesError } = await supabase
        .from('v_route_polylines')
        .select('*')
        .eq('company_id', filters.company || null)

      if (!routesError && routesData) {
        setRoutes(routesData as any)
      }

      // Carregar alertas
      const { data: alertsData, error: alertsError } = await supabase
        .from('v_alerts_open')
        .select('*')

      if (!alertsError && alertsData) {
        setAlerts(alertsData as any)
      }
    } catch (error) {
      console.error('Erro ao carregar dados iniciais:', error)
    }
  }, [filters.company])

  // Inicializar realtime
  const initRealtime = useCallback(() => {
    const service = new RealtimeService({
      onUpdate: (update: RealtimeUpdateType) => {
        handleRealtimeUpdate(update)
      },
      onError: (error) => {
        console.error('Erro no realtime:', error)
      },
    })

    service.connect()
    realtimeServiceRef.current = service
  }, [])

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

      // TODO: Mostrar toast de sucesso
      console.log('Socorro despachado:', data)
    } catch (error: any) {
      console.error('Erro ao despachar socorro:', error)
    }
  }, [])

  // Exportar visão (PNG + CSV)
  const handleExport = useCallback(async () => {
    try {
      // Exportar PNG do mapa
      if (mapInstanceRef.current && mapRef.current) {
        // Usar html2canvas ou similar para capturar screenshot
        // Por enquanto, apenas log
        console.log('Exportar PNG do mapa')
      }

      // Exportar CSV dos pontos visíveis
      const csvData = vehicles.map((v) => ({
        timestamp: v.last_position_time,
        vehicle_id: v.vehicle_id,
        plate: v.plate,
        lat: v.lat,
        lng: v.lng,
        speed: v.speed,
        heading: v.heading,
        status: v.vehicle_status,
        passengers: v.passenger_count,
      }))

      const csv = [
        'timestamp,vehicle_id,plate,lat,lng,speed,heading,status,passengers',
        ...csvData.map((row) =>
          Object.values(row).map((v) => `"${v}"`).join(',')
        ),
      ].join('\n')

      const blob = new Blob([csv], { type: 'text/csv' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `mapa-export-${new Date().toISOString()}.csv`
      a.click()
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Erro ao exportar:', error)
    }
  }, [vehicles, mapInstanceRef, mapRef])

  // Processar atualizações do realtime
  const handleRealtimeUpdate = useCallback((update: RealtimeUpdateType) => {
    if (update.type === 'position') {
      setVehicles((prev) => {
        const index = prev.findIndex(
          (v) => v.vehicle_id === update.data.vehicle_id
        )
        if (index >= 0) {
          const updated = [...prev]
          updated[index] = { ...updated[index], ...update.data }
          return updated
        } else {
          return [...prev, update.data as Vehicle]
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
  }, [])

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

    router.replace(newUrl, { scroll: false })
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
        />
      </div>

      {/* Mapa */}
      <div ref={mapRef} className="w-full h-full" />

      {/* Controles de Playback (quando em modo histórico) */}
      {mode === 'history' && (
        <div className="absolute bottom-4 left-4 right-4 z-20">
        <PlaybackControls
          isPlaying={isPlaying}
          onPlay={() => {
            setIsPlaying(true)
            // Iniciar playback quando implementado
          }}
          onPause={() => {
            setIsPlaying(false)
            playbackServiceRef.current?.pause()
          }}
          onStop={() => {
            setIsPlaying(false)
            playbackServiceRef.current?.stop()
          }}
          onSpeedChange={(speed) => {
            playbackServiceRef.current?.setSpeed(speed)
          }}
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
            onDispatch={() => {
              // Abrir modal de assistência
              if (selectedVehicle) {
                // TODO: Integrar com AssistanceModal
                // Por enquanto, criar requisição direta
                handleDispatchAssistance(selectedVehicle)
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
        {/* AlertsPanel pode ser mostrado via botão, não sempre */}
      </AnimatePresence>

      {/* Camadas do Mapa */}
      {mapInstanceRef.current && (
        <MapLayers
          map={mapInstanceRef.current}
          vehicles={vehicles}
          routes={routes}
          alerts={alerts}
          selectedVehicle={selectedVehicle}
          onVehicleClick={setSelectedVehicle}
          onRouteClick={setSelectedRoute}
          onAlertClick={(alert) => {
            // Implementar ação de alerta
          }}
          clustererRef={clustererRef}
        />
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

      {/* Overlay de Erro */}
      {mapError && (
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
      )}

      {/* Estados Vazios */}
      {!loading && !mapError && vehicles.length === 0 && (
        <div className="absolute inset-0 z-30 flex items-center justify-center bg-white/50 backdrop-blur-sm">
          <div className="text-center max-w-md">
            <MapIcon className="h-16 w-16 text-[var(--ink-muted)] mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">Sem veículos ativos</h3>
            <p className="text-[var(--ink-muted)]">
              Nenhum veículo encontrado com os filtros selecionados.
            </p>
          </div>
        </div>
      )}

      {/* Botão de Exportar */}
      <div className="absolute bottom-6 right-6 z-20">
        <Button
          size="icon"
          variant="outline"
          onClick={handleExport}
          className="bg-white shadow-lg hover:bg-[var(--bg-hover)]"
          title="Exportar visão (PNG + CSV)"
        >
          <Download className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}

