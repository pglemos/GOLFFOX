"use client"

import { useEffect, useState, useCallback, useRef } from "react"
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

// Declaração de tipos para Google Maps
declare global {
  interface Window {
    google: any
  }
}

interface Bus {
  id: string
  trip_id: string
  route_id: string
  route_name: string
  vehicle_id: string
  vehicle_plate: string
  vehicle_model: string
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
  routeId?: string
  initialCenter?: { lat: number; lng: number }
  initialZoom?: number
}

export function FleetMap({ companyId, routeId, initialCenter, initialZoom }: FleetMapProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<google.maps.Map | null>(null)
  const markersRef = useRef<Map<string, google.maps.Marker>>(new Map())
  const polylineRef = useRef<google.maps.Polyline | null>(null)
  const [selectedBus, setSelectedBus] = useState<Bus | null>(null)
  const [buses, setBuses] = useState<Bus[]>([])
  const [stops, setStops] = useState<Stop[]>([])
  const [routes, setRoutes] = useState<Route[]>([])
  const [loading, setLoading] = useState(true)
  const [mapError, setMapError] = useState<string | null>(null)
  const [selectedStopId, setSelectedStopId] = useState<string | null>(null)
  const [hotspotPosition, setHotspotPosition] = useState<{ x: number; y: number } | null>(null)
  const [filters, setFilters] = useState({
    company: companyId || '',
    route: routeId || '',
    status: ''
  })

  // Atualizar filtro quando routeId mudar
  useEffect(() => {
    if (routeId) {
      setFilters(prev => ({ ...prev, route: routeId }))
    }
  }, [routeId])

  // Cores dos ônibus
  const busColors = {
    green: '#10B981',    // Em movimento
    yellow: '#F59E0B',   // Parado <2min
    red: '#EF4444',      // Parado >3min
    blue: '#3B82F6'      // Na garagem
  }

  // Ícone de ônibus
  const getBusIcon = useCallback((color: string, _heading: number = 0) => {
    if (typeof google === 'undefined' || !google.maps) {
      return undefined
    }
    return {
      path: google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
      scale: 6,
      fillColor: color,
      fillOpacity: 1,
      strokeColor: '#FFFFFF',
      strokeWeight: 2
    }
  }, [])

  // Dados de demonstração
  const getDemoData = () => {
    const demoBuses: Bus[] = [
      {
        id: '1',
        trip_id: 'trip_001',
        route_id: 'route_001',
        route_name: 'Linha 101 - Centro/Aeroporto',
        vehicle_id: 'veh_001',
        vehicle_plate: 'ABC-1234',
        vehicle_model: 'Mercedes-Benz O500U',
        driver_id: 'drv_001',
        driver_name: 'João Silva',
        company_id: 'comp_001',
        company_name: 'Transportes GOLF FOX',
        lat: -19.916681,
        lng: -43.934493,
        speed: 35,
        heading: 90,
        status: 'Em movimento',
        color: 'green' as const,
        passenger_count: 28,
        last_update: new Date().toISOString()
      },
      {
        id: '2',
        trip_id: 'trip_002',
        route_id: 'route_002',
        route_name: 'Linha 202 - Shopping/Universidade',
        vehicle_id: 'veh_002',
        vehicle_plate: 'DEF-5678',
        vehicle_model: 'Volvo B270F',
        driver_id: 'drv_002',
        driver_name: 'Maria Santos',
        company_id: 'comp_001',
        company_name: 'Transportes GOLF FOX',
        lat: -19.920000,
        lng: -43.940000,
        speed: 0,
        heading: 180,
        status: 'Parado',
        color: 'yellow' as const,
        passenger_count: 15,
        last_update: new Date().toISOString()
      },
      {
        id: '3',
        trip_id: 'trip_003',
        route_id: 'route_003',
        route_name: 'Linha 303 - Industrial/Residencial',
        vehicle_id: 'veh_003',
        vehicle_plate: 'GHI-9012',
        vehicle_model: 'Scania K270IB',
        driver_id: 'drv_003',
        driver_name: 'Carlos Oliveira',
        company_id: 'comp_001',
        company_name: 'Transportes GOLF FOX',
        lat: -19.910000,
        lng: -43.930000,
        speed: 45,
        heading: 270,
        status: 'Em movimento',
        color: 'green' as const,
        passenger_count: 32,
        last_update: new Date().toISOString()
      }
    ]

    const demoStops: Stop[] = [
      {
        id: 'stop_001',
        route_id: 'route_001',
        stop_order: 1,
        lat: -19.916681,
        lng: -43.934493,
        address: 'Praça da Liberdade, 100',
        stop_name: 'Terminal Central'
      },
      {
        id: 'stop_002',
        route_id: 'route_001',
        stop_order: 2,
        lat: -19.920000,
        lng: -43.940000,
        address: 'Av. Afonso Pena, 500',
        stop_name: 'Shopping Center'
      }
    ]

    const demoRoutes: Route[] = [
      {
        id: 'route_001',
        name: 'Linha 101 - Centro/Aeroporto',
        polyline_points: [
          { lat: -19.916681, lng: -43.934493 },
          { lat: -19.920000, lng: -43.940000 },
          { lat: -19.925000, lng: -43.945000 }
        ]
      }
    ]

    return { buses: demoBuses, stops: demoStops, routes: demoRoutes }
  }

  // Carregar dados do mapa
  const loadMapData = useCallback(async () => {
    try {
      // Tentar carregar dados reais primeiro
      const { data, error } = await supabase.rpc('gf_map_snapshot_full', {
        p_company_id: filters.company || null,
        p_route_id: filters.route || null
      })

      if (error) {
        console.warn('RPC não encontrada, usando dados de demonstração:', error.message)
        // Usar dados de demonstração se a RPC falhar
        const demoData = getDemoData()
        setBuses(demoData.buses)
        setStops(demoData.stops)
        setRoutes(demoData.routes)
        return
      }

      if (data) {
        setBuses(data.buses || [])
        setStops(data.stops || [])
        setRoutes(data.routes || [])
      } else {
        // Se não há dados, usar demonstração
        const demoData = getDemoData()
        setBuses(demoData.buses)
        setStops(demoData.stops)
        setRoutes(demoData.routes)
      }
    } catch (error) {
      console.warn('Erro ao carregar dados do mapa, usando demonstração:', error)
      // Usar dados de demonstração em caso de erro
      const demoData = getDemoData()
      setBuses(demoData.buses)
      setStops(demoData.stops)
      setRoutes(demoData.routes)
    } finally {
      setLoading(false)
    }
  }, [filters.company, filters.route])

  // Função para obter a API Key de forma robusta
  const getGoogleMapsApiKey = () => {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ||
      (typeof window !== 'undefined' && (window as any).__NEXT_DATA__?.env?.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY)
    
    if (!apiKey) {
      // NEXT_PUBLIC_GOOGLE_MAPS_API_KEY não configurado
      setMapError('API Key do Google Maps não configurada. Verifique as variáveis de ambiente.')
      return null
    }

    // Validar formato básico da API key
    if (!apiKey.startsWith('AIza') || apiKey.length < 35) {
      // API Key do Google Maps parece inválida
      setMapError('API Key do Google Maps parece inválida. Verifique a configuração no Google Cloud Console.')
      return null
    }

    return apiKey
  }

  // Inicializar mapa
  useEffect(() => {
    const initMap = async () => {
      // Inicializando mapa...
      
      const apiKey = getGoogleMapsApiKey()
      // API Key disponível
      
      if (!apiKey) {
        // Erro já foi definido na função getGoogleMapsApiKey
        setLoading(false)
        return
      }

      // Aguardar até que o mapRef esteja disponível
      let attempts = 0
      const maxAttempts = 50 // 5 segundos máximo
      
      while (!mapRef.current && attempts < maxAttempts) {
        // Aguardando mapRef...
        await new Promise(resolve => setTimeout(resolve, 100))
        attempts++
      }

      if (!mapRef.current) {
        // Elemento do mapa não encontrado após aguardar
        setMapError('Elemento do mapa não foi encontrado.')
        setLoading(false)
        return
      }

      // mapRef.current disponível

      try {
        // Carregando Google Maps API...
        
        // Adicionar listener para erros do Google Maps
        const originalConsoleError = console.error
        console.error = (...args) => {
          const errorMessage = args.join(' ')
          if (errorMessage.includes('ApiProjectMapError')) {
            setMapError('Erro no projeto da API do Google Maps. Verifique se o billing está habilitado e a API JavaScript está ativa no Google Cloud Console.')
          } else if (errorMessage.includes('RefererNotAllowedMapError')) {
            setMapError('Domínio não autorizado. Configure as restrições de referrer no Google Cloud Console.')
          } else if (errorMessage.includes('InvalidKeyMapError')) {
            setMapError('API Key inválida. Verifique a chave no Google Cloud Console.')
          }
          originalConsoleError.apply(console, args)
        }
        
        // Carregar API do Google Maps usando gerenciador centralizado
        await loadGoogleMapsAPI(apiKey)
        
        // Google Maps API carregada com sucesso
        
        // Criando instância do mapa...
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
          disableDefaultUI: false
        })

        // Mapa criado com sucesso
        mapInstanceRef.current = map
        
        // Carregar dados após o mapa estar pronto
        // Carregando dados do mapa...
        await loadMapData()
        // Dados do mapa carregados
        setLoading(false)
      } catch (error) {
        // Erro detalhado ao carregar Google Maps
        let errorMessage = 'Erro ao carregar o mapa. Verifique sua conexão com a internet.'
        
        if (error instanceof Error) {
          // Mensagem do erro e Stack trace
          
          // Verificar tipos específicos de erro
          if (error.message.includes('ApiProjectMapError')) {
            errorMessage = 'Erro de configuração da API do Google Maps. Entre em contato com o suporte.'
            console.error('Erro de projeto da API - verifique se a API está habilitada e a chave é válida')
          } else if (error.message.includes('ApiNotActivatedMapError')) {
            errorMessage = 'API do Google Maps não está ativada para este projeto.'
            console.error('API do Google Maps não ativada para este projeto')
          } else if (error.message.includes('ApiKeyNotValid')) {
            errorMessage = 'Chave da API do Google Maps inválida.'
            console.error('Chave da API inválida')
          }
        }
        
        setMapError(errorMessage)
        setLoading(false)
        
        // Tentar recarregar após um delay se for um erro temporário
        setTimeout(() => {
          if (!mapInstanceRef.current && !errorMessage.includes('configuração')) {
            // Tentando recarregar o mapa após erro...
            setMapError(null)
            setLoading(true)
            initMap()
          }
        }, 10000)
      }
    }

    initMap()
  }, [])

  // Atualizar marcadores no mapa
  useEffect(() => {
    if (!mapInstanceRef.current) return

    const updateMarkers = async () => {
      const map = mapInstanceRef.current

      // Limpar marcadores antigos
      markersRef.current.forEach(marker => marker.setMap(null))
      markersRef.current.clear()
      
      // Limpar polyline antigo
      if (polylineRef.current) {
        polylineRef.current.setMap(null)
        polylineRef.current = null
      }

      try {
        // Verificar se o Google Maps está disponível
        if (!window.google || !window.google.maps) {
          console.error('Google Maps não está carregado')
          return
        }

        // Adicionar ônibus
        buses.forEach(bus => {
          const icon = getBusIcon(busColors[bus.color], bus.heading)
          if (!icon) return
          
          const marker = new google.maps.Marker({
            position: { lat: bus.lat, lng: bus.lng },
            map,
            icon,
            title: `${bus.vehicle_plate} - ${bus.route_name}`
          })

          // Aplicar rotação se heading disponível
          if (bus.heading) {
            marker.setIcon({
              ...icon,
              rotation: bus.heading
            } as any)
          }

          marker.addListener('click', () => {
            setSelectedBus(bus)
          })

          markersRef.current.set(bus.id, marker)
        })

        // Adicionar pontos de parada (se rota selecionada) com SVG marcadores
        if (selectedBus || filters.route) {
          const routeStops = stops
            .filter(stop => !selectedBus || stop.route_id === selectedBus.route_id)
            .sort((a, b) => a.stop_order - b.stop_order)
          
          routeStops.forEach((stop, index) => {
            // Determinar se é embarque ou desembarque (por padrão, par ímpar = embarque, par = desembarque)
            const isPickup = index === 0 || index % 2 === 0
            const stopType = isPickup ? 'pickup' : 'dropoff'
            
            // Criar SVG para marcador (círculo para embarque, quadrado para desembarque)
            const markerSize = 32
            const svgMarkup = stopType === 'pickup'
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
            
            const marker = new google.maps.Marker({
              position: { lat: stop.lat, lng: stop.lng },
              map,
              icon,
              title: `${stop.stop_name || stop.address} - Parada ${index + 1}`,
              label: {
                text: `${index + 1}`,
                color: '#FFFFFF',
                fontSize: '12px',
                fontWeight: 'bold'
              },
              zIndex: 1000 + index
            })

            // Adicionar tooltip persistente ao passar o mouse
            const infoWindow = new google.maps.InfoWindow({
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

            marker.addListener('mouseover', () => {
              infoWindow.open(map, marker)
            })

            marker.addListener('mouseout', () => {
              // Manter tooltip aberto (persistente)
            })

            marker.addListener('click', (e: any) => {
              // Fechar tooltip ao clicar para não sobrepor com hotspot
              infoWindow.close()
              
              // Calcular posição do hotspot baseado no evento do mapa
              if (e && mapInstanceRef.current) {
                const overlay = new google.maps.OverlayView()
                overlay.draw = () => {
                  const projection = overlay.getProjection()
                  if (projection && e.latLng) {
                    const point = projection.fromLatLngToContainerPixel(e.latLng)
                    if (point) {
                      setHotspotPosition({ x: point.x, y: point.y })
                      setSelectedStopId(stop.id)
                    }
                  }
                }
                overlay.setMap(mapInstanceRef.current)
                setTimeout(() => overlay.setMap(null), 100)
              } else {
                // Fallback: usar posição central do marcador
                if (mapInstanceRef.current) {
                  const bounds = mapInstanceRef.current.getBounds()
                  if (bounds) {
                    const ne = bounds.getNorthEast()
                    const sw = bounds.getSouthWest()
                    if (ne && sw) {
                      const centerPixel = mapInstanceRef.current.getProjection()?.fromLatLngToPoint(
                        new google.maps.LatLng(stop.lat, stop.lng)
                      )
                      if (centerPixel) {
                        const scale = Math.pow(2, mapInstanceRef.current.getZoom() || 12)
                        const worldCoordinate = new google.maps.Point(
                          centerPixel.x * scale,
                          centerPixel.y * scale
                        )
                        setHotspotPosition({ 
                          x: worldCoordinate.x, 
                          y: worldCoordinate.y 
                        })
                      }
                    }
                  }
                }
              }
            })

            markersRef.current.set(`stop-${stop.id}`, marker)
          })
        }

        // Desenhar polylines das rotas com linha contínua #2E7D32 e sombra
        if (selectedBus || filters.route) {
          routes
            .filter(route => !selectedBus || route.id === selectedBus.route_id)
            .forEach(route => {
              if (route.polyline_points && route.polyline_points.length > 0) {
                // Linha principal - cor #2E7D32, 4px, com sombra
                const polyline = new google.maps.Polyline({
                  path: route.polyline_points.map(p => ({ lat: p.lat, lng: p.lng })),
                  geodesic: true,
                  strokeColor: '#2E7D32',
                  strokeOpacity: 1.0,
                  strokeWeight: 4,
                  zIndex: 500
                })

                polyline.setMap(map)
                polylineRef.current = polyline
                
                // Linha de sombra (para efeito de profundidade)
                const shadowPolyline = new google.maps.Polyline({
                  path: route.polyline_points.map(p => ({ lat: p.lat, lng: p.lng })),
                  geodesic: true,
                  strokeColor: '#000000',
                  strokeOpacity: 0.3,
                  strokeWeight: 6,
                  zIndex: 499
                })
                shadowPolyline.setMap(map)
              } else {
                // Se não tem polyline_points, criar linha conectando as paradas
                const routeStops = stops
                  .filter(stop => stop.route_id === route.id)
                  .sort((a, b) => a.stop_order - b.stop_order)
                
                if (routeStops.length > 1) {
                  const stopPath = routeStops.map(stop => ({ lat: stop.lat, lng: stop.lng }))
                  
                  const polyline = new google.maps.Polyline({
                    path: stopPath,
                    geodesic: true,
                    strokeColor: '#2E7D32',
                    strokeOpacity: 1.0,
                    strokeWeight: 4,
                    zIndex: 500
                  })

                  polyline.setMap(map)
                  polylineRef.current = polyline
                  
                  // Sombra
                  const shadowPolyline = new google.maps.Polyline({
                    path: stopPath,
                    geodesic: true,
                    strokeColor: '#000000',
                    strokeOpacity: 0.3,
                    strokeWeight: 6,
                    zIndex: 499
                  })
                  shadowPolyline.setMap(map)
                }
              }
            })
        }
      } catch (error) {
        console.error('Erro ao atualizar marcadores:', error)
      }
    }

    updateMarkers()
  }, [buses, stops, routes, selectedBus, filters.route, getBusIcon])

  // Realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel('map-updates')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'driver_positions' 
        }, 
        () => {
          loadMapData()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [loadMapData])

  // Atualizar a cada 5 segundos
  useEffect(() => {
    const interval = setInterval(loadMapData, 5000)
    return () => clearInterval(interval)
  }, [loadMapData])

  // Calcular zoom automático para englobar todos os pontos quando routeId mudar
  useEffect(() => {
    if (!mapInstanceRef.current || !routeId || stops.length === 0) return

    const routeStops = stops
      .filter(stop => stop.route_id === routeId)
      .sort((a, b) => a.stop_order - b.stop_order)

    if (routeStops.length === 0) return

    const bounds = new google.maps.LatLngBounds()
    routeStops.forEach(stop => {
      bounds.extend(new google.maps.LatLng(stop.lat, stop.lng))
    })

    // Adicionar margem de 20%
    const ne = bounds.getNorthEast()
    const sw = bounds.getSouthWest()
    if (!ne || !sw) return

    const latMargin = (ne.lat() - sw.lat()) * 0.2
    const lngMargin = (ne.lng() - sw.lng()) * 0.2

    bounds.extend(new google.maps.LatLng(ne.lat() + latMargin, ne.lng() + lngMargin))
    bounds.extend(new google.maps.LatLng(sw.lat() - latMargin, sw.lng() - lngMargin))

    mapInstanceRef.current.fitBounds(bounds)
  }, [routeId, stops])

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

  // Calcular tempo total da rota
  const calculateRouteDuration = () => {
    if (formattedStops.length < 2) return '00:00'
    const first = formattedStops[0]
    const last = formattedStops[formattedStops.length - 1]
    if (!first || !last) return '00:00'
    
    const startTime = new Date(first.scheduledTime)
    const endTime = new Date(last.scheduledTime)
    const duration = endTime.getTime() - startTime.getTime()
    const hours = Math.floor(duration / (1000 * 60 * 60))
    const minutes = Math.floor((duration % (1000 * 60 * 60)) / (1000 * 60))
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`
  }

  const routeDuration = calculateRouteDuration()

  // Early returns após todos os hooks
  if (loading) {
    return (
      <div className="w-full h-[calc(100vh-300px)] rounded-[var(--radius-xl)] bg-[var(--bg-soft)] flex items-center justify-center border border-[var(--border)]">
        <div className="text-center">
          <div className="loader-spinner mx-auto"></div>
          <p className="mt-4 text-[var(--ink-muted)]">Carregando mapa...</p>
        </div>
      </div>
    )
  }

  if (mapError) {
    return (
      <div className="w-full h-[calc(100vh-300px)] rounded-[var(--radius-xl)] bg-[var(--bg-soft)] flex items-center justify-center border border-[var(--border)]">
        <div className="text-center max-w-md">
          <AlertCircle className="h-16 w-16 text-[var(--danger)] mx-auto mb-4" />
          <h3 className="text-xl font-semibold mb-2 text-[var(--ink)]">Erro no Mapa</h3>
          <p className="text-[var(--ink-muted)] mb-6">{mapError}</p>
          <Button 
            onClick={() => {
              setMapError(null)
              setLoading(true)
              // Recarregar a página para tentar novamente
              window.location.reload()
            }}
            className="flex items-center gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Tentar Novamente
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="relative w-full rounded-[var(--radius-xl)] overflow-hidden border border-[var(--border)] shadow-lg">
      {/* Barra Superior Fixa com Tempo Total */}
      {(selectedBus || filters.route) && formattedStops.length > 0 && (
        <div className="absolute top-0 left-0 right-0 z-30 bg-white/95 backdrop-blur-sm border-b border-[var(--border)] px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div>
              <div className="text-xs text-[var(--ink-muted)]">Tempo Total da Rota</div>
              <div className="text-2xl font-bold text-[var(--ink-strong)] font-mono">
                {routeDuration}
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
              onChange={(e) => setFilters({ ...filters, company: e.target.value })}
            />
            <Input
              placeholder="Rota"
              className="w-48"
              value={filters.route}
              onChange={(e) => setFilters({ ...filters, route: e.target.value })}
            />
            <select
              className="px-3 py-2 rounded-[var(--radius-lg)] border border-[var(--border)] bg-white min-w-[140px] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--brand)] focus:ring-opacity-20"
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
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

      {/* Hotspot Interativo para Parada Selecionada */}
      {selectedStopId && hotspotPosition && (() => {
        const selectedStop = stops.find(s => s.id === selectedStopId)
        if (!selectedStop) return null
        
        const stopIndex = formattedStops.findIndex(s => s.id === selectedStopId)
        const stopType = stopIndex >= 0 ? formattedStops[stopIndex].type : 'pickup'
        
        return (
          <InteractiveMarkerHotspot
            stop={{
              id: selectedStop.id,
              type: stopType,
              address: selectedStop.address || selectedStop.stop_name || '',
              scheduledTime: selectedStop.estimated_arrival || new Date().toISOString(),
              passenger: {
                id: selectedStop.passenger_id || '',
                name: selectedStop.passenger_name || selectedStop.stop_name || 'Passageiro',
                type: 'regular',
                photo: undefined
              },
              coordinates: { lat: selectedStop.lat, lng: selectedStop.lng },
              stopNumber: stopIndex + 1,
              isCompleted: false,
              isCurrent: false
            }}
            position={hotspotPosition}
            onClose={() => {
              setSelectedStopId(null)
              setHotspotPosition(null)
            }}
            onCenterMap={(coords) => {
              if (mapInstanceRef.current) {
                mapInstanceRef.current.setCenter(coords)
                mapInstanceRef.current.setZoom(16)
              }
            }}
          />
        )
      })()}

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
            className="absolute top-6 right-6 w-80 z-20"
          >
            <Card className="p-6 glass shadow-2xl">
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h3 className="font-bold text-xl">{selectedBus.vehicle_plate}</h3>
                  <p className="text-sm text-[var(--ink-muted)]">{selectedBus.vehicle_model}</p>
                </div>
                <Button size="icon" variant="ghost" onClick={() => setSelectedBus(null)} className="hover:bg-[var(--bg-hover)]">
                  <X className="h-4 w-4" />
                </Button>
              </div>

              <div className="space-y-4 text-sm">
                <div>
                  <span className="text-[var(--ink-muted)] block mb-1">Motorista:</span>
                  <p className="font-semibold text-base">{selectedBus.driver_name}</p>
                </div>
                <div>
                  <span className="text-[var(--ink-muted)] block mb-1">Rota:</span>
                  <p className="font-semibold text-base">{selectedBus.route_name}</p>
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
                    <span className="font-semibold">{selectedBus.passenger_count || 0}</span>
                  </div>
                  <Clock className="h-4 w-4 text-[var(--ink-muted)]" />
                  <div>
                    <span className="text-[var(--ink-muted)] block text-xs">Última atualização</span>
                    <span className="font-semibold text-xs">
                      {new Date(selectedBus.last_update).toLocaleTimeString()}
                    </span>
                  </div>
                </div>

                <Button className="w-full mt-4" variant="destructive">
                  <AlertCircle className="h-4 w-4 mr-2" />
                  Despachar Socorro
                </Button>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Legenda */}
      <div className="absolute bottom-6 left-6 z-10">
        <Card className="p-4 glass shadow-xl">
          <div className="space-y-2 text-sm font-medium">
            <div className="flex items-center gap-3">
              <div className="w-4 h-4 rounded-full" style={{ backgroundColor: busColors.green }}></div>
              <span>Em Movimento</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-4 h-4 rounded-full" style={{ backgroundColor: busColors.yellow }}></div>
              <span>Parado (&lt;2min)</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-4 h-4 rounded-full" style={{ backgroundColor: busColors.red }}></div>
              <span>Parado (&gt;3min)</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-4 h-4 rounded-full" style={{ backgroundColor: busColors.blue }}></div>
              <span>Na Garagem</span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}
