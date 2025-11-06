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
import { getMapsBillingMonitor } from '@/lib/maps-billing-monitor'
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
import toast from 'react-hot-toast'

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
  const [billingStatus, setBillingStatus] = useState<any>(null)
  const [listMode, setListMode] = useState(false) // Fallback modo lista
  const [playbackProgress, setPlaybackProgress] = useState(0)
  const [playbackFrom, setPlaybackFrom] = useState<Date>(new Date(Date.now() - 2 * 60 * 60 * 1000)) // Últimas 2h
  const [playbackTo, setPlaybackTo] = useState<Date>(new Date())
  const [playbackSpeed, setPlaybackSpeed] = useState<1 | 2 | 4>(1)
  const [historicalPositions, setHistoricalPositions] = useState<Map<string, any>>(new Map())
  
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
        
        // Inicializar realtime ou playback baseado no modo
        if (mode === 'live') {
          initRealtime()
        } else {
          initPlayback()
        }
        
        setLoading(false)
      } catch (error: any) {
        console.error('Erro ao inicializar mapa:', error)
        setMapError('Erro ao carregar o mapa. Usando modo lista.')
        setListMode(true)
        setLoading(false)
        // Carregar dados em modo lista
        loadInitialData().catch(console.error)
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

  // Processar atualizações do realtime
  const handleRealtimeUpdate = useCallback((update: RealtimeUpdateType) => {
    if (update.type === 'position') {
      setVehicles((prev) => {
        const index = prev.findIndex(
          (v) => v.vehicle_id === update.data.vehicle_id
        )
        if (index >= 0) {
          const updated = [...prev]
          // Atualizar campos do veículo existente
          updated[index] = {
            ...updated[index],
            lat: update.data.lat,
            lng: update.data.lng,
            speed: update.data.speed,
            heading: update.data.heading,
            vehicle_status: update.data.vehicle_status,
            passenger_count: update.data.passenger_count,
            last_position_time: update.data.timestamp,
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
  }, [])

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
        console.error('Erro no realtime:', error)
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
      toast.error('Nenhuma posição histórica encontrada para o período selecionado')
      return
    }

    toast.success(`${positions.length} posições carregadas para playback`)
  }, [filters.company, filters.route, filters.vehicle, playbackFrom, playbackTo])

  // Reagir a mudanças de modo
  useEffect(() => {
    if (!mapInstanceRef.current) return
    
    if (mode === 'live') {
      initRealtime()
    } else {
      initPlayback()
    }
  }, [mode, initRealtime, initPlayback])

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

      toast.success('Socorro despachado com sucesso!')
      
      // Recarregar alertas para mostrar o novo
      const { data: alertsData } = await supabase
        .from('v_alerts_open')
        .select('*')
        .eq('alert_id', data.id)
        .single()
      
      if (alertsData) {
        setAlerts((prev) => {
          const exists = prev.find(a => a.alert_id === alertsData.alert_id)
          if (!exists) {
            return [...prev, alertsData as any]
          }
          return prev
        })
      }
    } catch (error: any) {
      console.error('Erro ao despachar socorro:', error)
      toast.error('Erro ao despachar socorro: ' + (error.message || 'Erro desconhecido'))
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
          toast.success('Mapa exportado como PNG!')
        } catch (error: any) {
          console.error('Erro ao exportar PNG:', error)
          toast.error('Erro ao exportar PNG do mapa')
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
        toast.success('CSV exportado!')
      }
    } catch (error: any) {
      console.error('Erro ao exportar:', error)
      toast.error('Erro ao exportar')
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
                  toast.success('Playback concluído')
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
                        {vehicle.vehicle_status}
                      </Badge>
                    </div>
                    <div className="text-sm text-[var(--ink-muted)] space-y-1">
                      <p>Rota: {vehicle.route_name || 'N/A'}</p>
                      <p>Motorista: {vehicle.driver_name || 'N/A'}</p>
                      <p>Posição: {vehicle.lat?.toFixed(4)}, {vehicle.lng?.toFixed(4)}</p>
                      <p>Velocidade: {vehicle.speed ? `${vehicle.speed} km/h` : 'N/A'}</p>
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

