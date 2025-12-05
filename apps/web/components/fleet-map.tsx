"use client"

import { useEffect, useState, useCallback, useRef, memo } from "react"
import { warn, error as logError } from "@/lib/logger"
import { Card } from "./ui/card"
import { Button } from "./ui/button"
import { Badge } from "./ui/badge"
import { Input } from "./ui/input"
import { 
  RefreshCw, 
  Calendar, 
  History, 
  Layers,
  X,
  AlertCircle,
  Clock,
  Users as UsersIcon
} from "lucide-react"
import { supabase } from "@/lib/supabase"
import { motion, AnimatePresence } from "framer-motion"
import { modalContent } from "@/lib/animations"
import { loadGoogleMapsAPI } from "@/lib/google-maps-loader"
import { TemporalProgressBar } from "./temporal-progress-bar"
import { InteractiveMarkerHotspot } from "./interactive-marker-hotspot"
import { useRouter, useSearchParams } from "next/navigation"
import { MarkerClusterer } from "@googlemaps/markerclusterer"
import { formatRelativeTime } from "@/lib/kpi-utils"


interface Bus {
  id: string
  trip_id: string
  route_id: string
  route_name: string
  vehicle_id: string
  vehicle_plate: string
  vehicle_model: string
  capacity?: number
  driver_id: string
  driver_name: string
  company_id: string
  company_name: string
  lat: number
  lng: number
  speed: number
  heading: number
  status: string
  color: 'green' | 'yellow' | 'red' | 'blue'
  passenger_count: number
  last_update: string
}

interface Stop {
  id: string
  route_id: string
  stop_order: number
  lat: number
  lng: number
  address: string
  stop_name: string
  passenger_name?: string
  passenger_id?: string
  estimated_arrival?: string
}

interface Route {
  id: string
  name: string
  polyline_points?: Array<{ lat: number; lng: number }>
}

interface FleetMapProps {
  companyId?: string
  transportadoraId?: string
  routeId?: string
  initialCenter?: { lat: number; lng: number }
  initialZoom?: number
}

export const FleetMap = memo(function FleetMap({ companyId, transportadoraId, routeId, initialCenter, initialZoom }: FleetMapProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<google.maps.Map | null>(null)
  const markersRef = useRef<Map<string, google.maps.Marker>>(new Map())
  const polylineRef = useRef<google.maps.Polyline | null>(null)
  const shadowPolylineRef = useRef<google.maps.Polyline | null>(null)
  const clustererRef = useRef<MarkerClusterer | null>(null)
  const infoWindowsRef = useRef<Map<string, google.maps.InfoWindow>>(new Map())
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null)
  
  const [selectedBus, setSelectedBus] = useState<Bus | null>(null)
  const [buses, setBuses] = useState<Bus[]>([])
  const [stops, setStops] = useState<Stop[]>([])
  const [routes, setRoutes] = useState<Route[]>([])
  const [loading, setLoading] = useState(true)
  const [mapError, setMapError] = useState<string | null>(null)
  const [selectedStopId, setSelectedStopId] = useState<string | null>(null)
  const [hotspotPosition, setHotspotPosition] = useState<{ x: number; y: number } | null>(null)
  
  // Filtros persistidos na URL
  const [filters, setFilters] = useState({
    company: companyId || searchParams?.get('company') || '',
    transportadora: transportadoraId || searchParams?.get('transportadora') || '',
    route: routeId || searchParams?.get('route') || '',
    status: searchParams?.get('status') || ''
  })

  useEffect(() => {
    setFilters((prev) => ({
      ...prev,
      company: companyId ?? prev.company,
      transportadora: transportadoraId ?? prev.transportadora,
      route: routeId ?? prev.route,
    }))
  }, [companyId, transportadoraId, routeId])

  // Atualizar URL quando filtros mudarem (debounce)
  const updateUrlFilters = useCallback((newFilters: typeof filters) => {
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
    }, 300) // Debounce 300ms
  }, [router])

  // Cores dos ônibus
  const busColors = {
    green: '#10B981',    // Em movimento
    yellow: '#F59E0B',   // Parado <2min
    red: '#EF4444',      // Parado >3min
    blue: '#3B82F6'      // Na garagem
  }

  // Ícone de ônibus
  const getBusIcon = useCallback((color: string, heading: number = 0) => {
    if (typeof google === 'undefined' || !google.maps) {
      return undefined
    }
    return {
      path: google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
      scale: 6,
      fillColor: color,
      fillOpacity: 1,
      strokeColor: '#FFFFFF',
      strokeWeight: 2,
      rotation: heading
    }
  }, [])

  // Carregar dados do mapa
  const loadMapData = useCallback(async () => {
    try {
      const { data, error } = await (supabase as any).rpc('gf_map_snapshot_full', {
        p_company_id: filters.company || null,
        p_transportadora_id: filters.transportadora || null,
        p_route_id: filters.route || null
      })

      if (error) {
        warn('Erro ao carregar dados do mapa', { error: error.message }, 'FleetMap')
        setBuses([])
        setStops([])
        setRoutes([])
        return
      }

      if (data) {
        setBuses(data.buses || [])
        setStops(data.stops || [])
        setRoutes(data.routes || [])
      }
    } catch (error) {
      logError('Erro ao carregar dados do mapa', { error }, 'FleetMap')
      setBuses([])
      setStops([])
      setRoutes([])
    }
  }, [filters.company, filters.transportadora, filters.route])

  // Função para obter a API Key
  const getGoogleMapsApiKey = () => {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
    
    if (!apiKey) {
      setMapError('API Key do Google Maps não configurada.')
      return null
    }

    if (!apiKey.startsWith('AIza') || apiKey.length < 35) {
      setMapError('API Key do Google Maps parece inválida.')
      return null
    }

    return apiKey
  }

  // Inicializar mapa
  useEffect(() => {
    const initMap = async () => {
      const apiKey = getGoogleMapsApiKey()
      if (!apiKey) {
        setLoading(false)
        return
      }

      // Garantir que o contêiner do mapa exista (ref deve estar definido após o primeiro render)
      if (!mapRef.current) {
        setMapError('Elemento do mapa não foi encontrado.')
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
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: true,
          zoomControl: true,
        })

        mapInstanceRef.current = map
        await loadMapData()
        setLoading(false)
      } catch (error) {
        logError('Erro ao carregar Google Maps', { error }, 'FleetMap')
        setMapError('Erro ao carregar o mapa. Verifique sua conexão.')
        setLoading(false)
      }
    }

    initMap()
  }, [])

  // Atualizar marcadores no mapa com clusterização
  useEffect(() => {
    if (!mapInstanceRef.current || !window.google) return

    const map = mapInstanceRef.current

    // Limpar marcadores antigos
    markersRef.current.forEach(marker => marker.setMap(null))
    markersRef.current.clear()
    infoWindowsRef.current.forEach(infoWindow => infoWindow.close())
    infoWindowsRef.current.clear()
    
    // Limpar polylines
    if (polylineRef.current) {
      polylineRef.current.setMap(null)
      polylineRef.current = null
    }
    if (shadowPolylineRef.current) {
      shadowPolylineRef.current.setMap(null)
      shadowPolylineRef.current = null
    }

    // Limpar clusterer
    if (clustererRef.current) {
      clustererRef.current.clearMarkers()
      clustererRef.current = null
    }

    try {
      // Filtrar ônibus por status se necessário
      const filteredBuses = buses.filter(bus => {
        if (filters.status && bus.color !== filters.status) return false
        return true
      })

      // Criar marcadores
      const markers: google.maps.Marker[] = []
      
      filteredBuses.forEach(bus => {
        const icon = getBusIcon(busColors[bus.color], bus.heading)
        if (!icon) return
        
        // ✅ Acessibilidade: título descritivo para screen readers
        const markerTitle = `Veículo ${bus.vehicle_plate} - Rota ${bus.route_name} - Status: ${bus.status} - ${bus.passenger_count || 0} passageiros`
        
        const marker = new google.maps.Marker({
          position: { lat: bus.lat, lng: bus.lng },
          map: null, // Não adicionar ao mapa diretamente (clusterer vai fazer isso)
          icon,
          title: markerTitle,
          label: {
            text: `${bus.passenger_count || 0}/${bus.capacity || 0}`,
            color: '#FFFFFF',
            fontSize: '11px',
            fontWeight: 'bold',
            className: 'map-passenger-badge'
          },
          // Nota: Google Maps não suporta aria-label nativamente.
          // Para navegação por teclado, seria necessário criar overlay customizado com <button>.
        })

        // Criar tooltip persistente
        const infoWindow = new google.maps.InfoWindow({
          content: `
            <div style="padding: 12px; min-width: 220px; font-family: system-ui;">
              <div style="font-weight: bold; font-size: 16px; margin-bottom: 8px; color: #1f2937;">
                ${bus.vehicle_plate}
              </div>
              <div style="font-size: 13px; color: #4b5563; margin-bottom: 4px;">
                <strong>Rota:</strong> ${bus.route_name}
              </div>
              <div style="font-size: 13px; color: #4b5563; margin-bottom: 4px;">
                <strong>Motorista:</strong> ${bus.driver_name}
              </div>
              <div style="font-size: 13px; color: #4b5563; margin-bottom: 4px;">
                <strong>Status:</strong> ${bus.status}
              </div>
              <div style="font-size: 13px; color: #4b5563; margin-bottom: 4px;">
                <strong>Passageiros:</strong> ${bus.passenger_count || 0}
              </div>
              <div style="font-size: 11px; color: #6b7280; margin-top: 8px; border-top: 1px solid #e5e7eb; padding-top: 8px;">
                Última atualização: ${formatRelativeTime(bus.last_update)}
              </div>
            </div>
          `,
          pixelOffset: new google.maps.Size(0, -10)
        })

        marker.addListener('click', () => {
          setSelectedBus(bus)
          infoWindow.close() // Fechar tooltip ao clicar
        })

        marker.addListener('mouseover', () => {
          infoWindow.open(map, marker)
        })

        marker.addListener('mouseout', () => {
          // Manter tooltip aberto (persistente)
        })

        markers.push(marker)
        markersRef.current.set(bus.id, marker)
        infoWindowsRef.current.set(bus.id, infoWindow)
      })

      // Criar clusterer
      if (markers.length > 0) {
        clustererRef.current = new MarkerClusterer({ 
          map, 
          markers
        })
      }

      // Adicionar pontos de parada e polylines
      if (selectedBus || filters.route) {
        const routeStops = stops
          .filter(stop => !selectedBus || stop.route_id === selectedBus.route_id)
          .sort((a, b) => a.stop_order - b.stop_order)
        
        // Criar marcadores de parada
        routeStops.forEach((stop, index) => {
          const isPickup = index === 0 || index % 2 === 0
          const markerSize = 32
          const svgMarkup = isPickup
            ? `<svg width="${markerSize}" height="${markerSize}" xmlns="http://www.w3.org/2000/svg">
                 <circle cx="${markerSize/2}" cy="${markerSize/2}" r="${markerSize/2 - 2}" fill="#10B981" stroke="#FFFFFF" stroke-width="2"/>
                 <text x="50%" y="50%" text-anchor="middle" dominant-baseline="central" fill="#FFFFFF" font-size="14" font-weight="bold">${index + 1}</text>
               </svg>`
            : `<svg width="${markerSize}" height="${markerSize}" xmlns="http://www.w3.org/2000/svg">
                 <rect x="2" y="2" width="${markerSize - 4}" height="${markerSize - 4}" fill="#F59E0B" stroke="#FFFFFF" stroke-width="2" rx="4"/>
                 <text x="50%" y="50%" text-anchor="middle" dominant-baseline="central" fill="#FFFFFF" font-size="14" font-weight="bold">${index + 1}</text>
               </svg>`
          
          const icon = {
            url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(svgMarkup),
            scaledSize: new google.maps.Size(markerSize, markerSize),
            anchor: new google.maps.Point(markerSize/2, markerSize/2)
          }
          
          const stopMarker = new google.maps.Marker({
            position: { lat: stop.lat, lng: stop.lng },
            map,
            icon,
            title: `${stop.stop_name || stop.address} - Parada ${index + 1}`,
            zIndex: 1000 + index
          })

          const stopInfoWindow = new google.maps.InfoWindow({
            content: `
              <div style="padding: 8px; min-width: 200px;">
                <div style="font-weight: bold; margin-bottom: 4px; font-size: 14px;">
                  ${stop.passenger_name || stop.stop_name || 'Parada sem nome'}
                </div>
                <div style="font-size: 12px; color: #666; margin-bottom: 4px;">
                  ${stop.address || 'Endereço não informado'}
                </div>
                <div style="font-size: 11px; color: #888;">
                  Horário: ${stop.estimated_arrival ? new Date(stop.estimated_arrival).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : 'Não definido'}
                </div>
              </div>
            `,
            pixelOffset: new google.maps.Size(0, -10)
          })

          stopMarker.addListener('mouseover', () => {
            stopInfoWindow.open(map, stopMarker)
          })

          stopMarker.addListener('click', () => {
            setSelectedStopId(stop.id)
            stopInfoWindow.close()
          })

          markersRef.current.set(`stop-${stop.id}`, stopMarker)
        })

        // Desenhar polylines das rotas
        routes
          .filter(route => !selectedBus || route.id === selectedBus.route_id)
          .forEach(route => {
            let path: google.maps.LatLng[] = []
            
            if (route.polyline_points && route.polyline_points.length > 0) {
              path = route.polyline_points.map(p => new google.maps.LatLng(p.lat, p.lng))
            } else {
              // Criar linha conectando as paradas
              const routeStops = stops
                .filter(stop => stop.route_id === route.id)
                .sort((a, b) => a.stop_order - b.stop_order)
              
              if (routeStops.length > 1) {
                path = routeStops.map(stop => new google.maps.LatLng(stop.lat, stop.lng))
              }
            }

            if (path.length > 1) {
              // Linha de sombra (para profundidade)
              const shadowPolyline = new google.maps.Polyline({
                path,
                geodesic: true,
                strokeColor: '#000000',
                strokeOpacity: 0.3,
                strokeWeight: 6,
                zIndex: 499
              })
              shadowPolyline.setMap(map)
              shadowPolylineRef.current = shadowPolyline

              // Linha principal - cor #2E7D32, 4px
              const polyline = new google.maps.Polyline({
                path,
                geodesic: true,
                strokeColor: '#2E7D32',
                strokeOpacity: 1.0,
                strokeWeight: 4,
                zIndex: 500
              })
              polyline.setMap(map)
              polylineRef.current = polyline
            }
          })

        // ✅ fitBounds com padding de 20% (80px em tela padrão)
        if (routeStops.length > 0) {
          const bounds = new google.maps.LatLngBounds()
          routeStops.forEach(stop => {
            bounds.extend(new google.maps.LatLng(stop.lat, stop.lng))
          })

          // Aplicar padding de 20% usando parâmetro do fitBounds
          map.fitBounds(bounds, {
            top: 80,
            right: 80,
            bottom: 80,
            left: 80
          })
        }
      }
    } catch (error) {
      // Erro ao atualizar marcadores
    }
  }, [buses, stops, routes, selectedBus, filters.route, filters.status, getBusIcon])

  // Realtime subscription com Supabase Realtime
  useEffect(() => {
    // Primeira carga
    loadMapData()

    // Configurar Realtime subscription
    const channel = supabase
      .channel('fleet-map-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'driver_positions'
        },
        (payload: any) => {
          // Recarregar dados ao receber mudança na posição
          loadMapData()
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'trips'
        },
        (payload: any) => {
          // Recarregar dados ao receber mudança no status da viagem
          loadMapData()
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'trip_passengers'
        },
        (payload: any) => {
          // Recarregar dados ao receber mudança nos passageiros
          loadMapData()
        }
      )
      .subscribe()

    // Fallback: polling a cada 30 segundos para garantir sincronização
    const interval = setInterval(() => {
      loadMapData()
    }, 30000) // 30 segundos como fallback

    return () => {
      supabase.removeChannel(channel)
      clearInterval(interval)
    }
  }, [loadMapData])

  // Atualizar filtros e URL
  const handleFilterChange = (key: keyof typeof filters, value: string) => {
    const newFilters = { ...filters, [key]: value }
    setFilters(newFilters)
    updateUrlFilters(newFilters)
  }

  // Calcular paradas formatadas para a barra temporal
  const formattedStops = stops
    .filter(stop => selectedBus?.route_id === stop.route_id || filters.route === stop.route_id)
    .sort((a, b) => a.stop_order - b.stop_order)
    .map((stop, index) => ({
      id: stop.id,
      scheduledTime: stop.estimated_arrival || new Date().toISOString(),
      address: stop.address || stop.stop_name || '',
      type: (index === 0 || index % 2 === 0 ? 'pickup' : 'dropoff') as 'pickup' | 'dropoff',
      passengerName: stop.passenger_name || stop.stop_name || ''
    }))

  return (
    <div className="relative w-full rounded-[var(--radius-xl)] overflow-hidden border border-[var(--border)] shadow-lg">
      {/* Barra Superior Fixa */}
      {(selectedBus || filters.route) && formattedStops.length > 0 && (
        <div className="absolute top-0 left-0 right-0 z-30 bg-white/95 backdrop-blur-sm border-b border-[var(--border)] px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div>
              <div className="text-xs text-[var(--ink-muted)]">Tempo Total da Rota</div>
              <div className="text-2xl font-bold text-[var(--ink-strong)] font-mono">
                {(() => {
                  if (formattedStops.length < 2) return '00:00'
                  const first = formattedStops[0]
                  const last = formattedStops[formattedStops.length - 1]
                  const duration = new Date(last.scheduledTime).getTime() - new Date(first.scheduledTime).getTime()
                  const hours = Math.floor(duration / (1000 * 60 * 60))
                  const minutes = Math.floor((duration % (1000 * 60 * 60)) / (1000 * 60))
                  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`
                })()}
              </div>
            </div>
            {selectedBus && (
              <div className="border-l border-[var(--border)] pl-4">
                <div className="text-xs text-[var(--ink-muted)]">Veículo</div>
                <div className="text-lg font-semibold">{selectedBus.vehicle_plate}</div>
              </div>
            )}
          </div>
          <div className="text-sm text-[var(--ink-muted)]">
            {formattedStops.length} paradas
          </div>
        </div>
      )}

      {/* Mapa */}
      <div 
        ref={mapRef} 
        className={`w-full ${(selectedBus || filters.route) && formattedStops.length > 0 ? 'h-[calc(100vh-450px)]' : 'h-[calc(100vh-300px)]'}`}
      />

      {/* Overlay de loading */}
      {loading && (
        <div className="absolute inset-0 z-40 flex items-center justify-center bg-white/70 backdrop-blur-sm">
          <div className="text-center">
            <div className="loader-spinner mx-auto"></div>
            <p className="mt-4 text-[var(--ink-muted)]">Carregando mapa...</p>
          </div>
        </div>
      )}

      {/* Overlay de erro */}
      {mapError && (
        <div className="absolute inset-0 z-40 flex items-center justify-center bg-white/80 backdrop-blur-sm">
          <div className="text-center max-w-md">
            <AlertCircle className="h-16 w-16 text-[var(--danger)] mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2 text-[var(--ink)]">Erro no Mapa</h3>
            <p className="text-[var(--ink-muted)] mb-6">{mapError}</p>
            <Button 
              onClick={() => {
                setMapError(null)
                setLoading(true)
                window.location.reload()
              }}
              className="flex items-center gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Tentar Novamente
            </Button>
          </div>
        </div>
      )}

      {/* Filtros Flutuantes */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="absolute top-6 left-6 z-10"
      >
        <Card className="p-4 glass shadow-xl">
          <div className="flex flex-wrap gap-3">
            <Input
              placeholder="Empresa"
              className="w-48"
              value={filters.company}
              onChange={(e) => handleFilterChange('company', e.target.value)}
            />
            <Input
              placeholder="Rota"
              className="w-48"
              value={filters.route}
              onChange={(e) => handleFilterChange('route', e.target.value)}
            />
            <select
              className="px-3 py-2 rounded-[var(--radius-lg)] border border-[var(--border)] bg-white min-w-[140px] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--brand)] focus:ring-opacity-20"
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
            >
              <option value="">Todos os Status</option>
              <option value="green">Em Movimento</option>
              <option value="yellow">Parado (&lt;2min)</option>
              <option value="red">Parado (&gt;3min)</option>
              <option value="blue">Garagem</option>
            </select>
          </div>
        </Card>
      </motion.div>

      {/* Barra Temporal Interativa */}
      {(selectedBus || filters.route) && formattedStops.length > 0 && (
        <div className="absolute bottom-0 left-0 right-0 z-30 bg-white border-t border-[var(--border)]">
          <TemporalProgressBar stops={formattedStops} />
        </div>
      )}

      {/* Ações flutuantes */}
      <div className="absolute bottom-6 right-6 z-10 flex flex-col gap-2">
        <Button size="icon" onClick={loadMapData} className="bg-white hover:bg-[var(--bg-hover)] shadow-lg">
          <RefreshCw className="h-4 w-4" />
        </Button>
        <Button size="icon" variant="outline" className="bg-white shadow-lg">
          <Calendar className="h-4 w-4" />
        </Button>
        <Button size="icon" variant="outline" className="bg-white shadow-lg">
          <History className="h-4 w-4" />
        </Button>
        <Button size="icon" variant="outline" className="bg-white shadow-lg">
          <Layers className="h-4 w-4" />
        </Button>
      </div>

      {/* Painel lateral do veículo selecionado */}
      <AnimatePresence>
        {selectedBus && (
          <motion.div
            initial="hidden"
            animate="visible"
            exit="hidden"
            variants={modalContent}
            className="absolute top-2 right-2 sm:top-6 sm:right-6 w-[calc(100vw-1rem)] sm:w-80 z-20 max-w-sm"
          >
            <Card className="p-4 sm:p-6 glass shadow-2xl">
              <div className="flex items-start justify-between mb-4 sm:mb-6">
                <div className="flex-1 min-w-0 pr-2">
                  <h3 className="font-bold text-lg sm:text-xl truncate">{selectedBus.vehicle_plate}</h3>
                  <p className="text-sm text-[var(--ink-muted)] truncate">{selectedBus.vehicle_model}</p>
                </div>
                <Button size="icon" variant="ghost" onClick={() => setSelectedBus(null)} className="hover:bg-[var(--bg-hover)]">
                  <X className="h-4 w-4" />
                </Button>
              </div>

              <div className="space-y-3 sm:space-y-4 text-sm">
                <div>
                  <span className="text-[var(--ink-muted)] block mb-1 text-xs sm:text-sm">Motorista:</span>
                  <p className="font-semibold text-sm sm:text-base truncate">{selectedBus.driver_name}</p>
                </div>
                <div>
                  <span className="text-[var(--ink-muted)] block mb-1 text-xs sm:text-sm">Rota:</span>
                  <p className="font-semibold text-sm sm:text-base truncate">{selectedBus.route_name}</p>
                </div>
                <div>
                  <span className="text-[var(--ink-muted)] block mb-2">Status:</span>
                  <Badge 
                    variant={
                      selectedBus.color === 'green' ? 'success' : 
                      selectedBus.color === 'red' ? 'destructive' : 
                      selectedBus.color === 'yellow' ? 'warning' : 'default'
                    }
                  >
                    {selectedBus.color === 'green' ? 'Em Movimento' : 
                     selectedBus.color === 'yellow' ? 'Parado' :
                     selectedBus.color === 'red' ? 'Parado (>3min)' : 'Garagem'}
                  </Badge>
                </div>
                <div className="flex items-center gap-4 pt-2 border-t border-[var(--border)]">
                  <UsersIcon className="h-4 w-4 text-[var(--ink-muted)]" />
                  <div className="flex-1">
                    <span className="text-[var(--ink-muted)] block text-xs">Passageiros</span>
                    <span className="font-semibold">{selectedBus.passenger_count || 0}/{selectedBus.capacity || 0}</span>
                  </div>
                  <Clock className="h-4 w-4 text-[var(--ink-muted)]" />
                  <div>
                    <span className="text-[var(--ink-muted)] block text-xs">Última atualização</span>
                    <span className="font-semibold text-xs">
                      {formatRelativeTime(selectedBus.last_update)}
                    </span>
                  </div>
                </div>

                <Button className="w-full mt-4 text-xs sm:text-sm" variant="destructive">
                  <AlertCircle className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                  Despachar Socorro
                </Button>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Legenda */}
      <div className="absolute bottom-2 left-2 sm:bottom-6 sm:left-6 z-10">
        <Card className="p-2 sm:p-4 glass shadow-xl">
          <div className="space-y-1 sm:space-y-2 text-xs sm:text-sm font-medium">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="w-3 h-3 sm:w-4 sm:h-4 rounded-full" style={{ backgroundColor: busColors.green }}></div>
              <span>Em Movimento</span>
            </div>
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="w-3 h-3 sm:w-4 sm:h-4 rounded-full" style={{ backgroundColor: busColors.yellow }}></div>
              <span>Parado (&lt;2min)</span>
            </div>
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="w-3 h-3 sm:w-4 sm:h-4 rounded-full" style={{ backgroundColor: busColors.red }}></div>
              <span>Parado (&gt;3min)</span>
            </div>
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="w-3 h-3 sm:w-4 sm:h-4 rounded-full" style={{ backgroundColor: busColors.blue }}></div>
              <span>Na Garagem</span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
})
