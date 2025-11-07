/**
 * Camadas do Mapa
 * Gerencia desenho de rotas, trajetos, paradas, veículos e alertas
 */

'use client'

import { useEffect, useRef } from 'react'
import { MarkerClusterer } from '@googlemaps/markerclusterer'
import { calculateHeading } from '@/lib/map-utils'
import type { Vehicle, RoutePolyline, Alert } from './admin-map'
import type { HistoricalPosition } from '@/lib/playback-service'
import { MarkerManager } from './marker-manager'
import { isValidPolyline, filterValidCoordinates, isValidCoordinate } from '@/lib/coordinate-validator'

export interface HistoricalTrajectory {
  vehicle_id: string
  trip_id: string
  positions: Array<{ lat: number; lng: number; timestamp: Date }>
  color?: string // Opcional para diferenciação
}

export interface RouteStop {
  id: string
  route_id: string
  route_name: string
  seq: number
  name: string
  lat: number
  lng: number
  radius_m: number
}

interface MapLayersProps {
  map: google.maps.Map
  vehicles: Vehicle[]
  routes: RoutePolyline[]
  alerts: Alert[]
  selectedVehicle: Vehicle | null
  onVehicleClick: (vehicle: Vehicle) => void
  onRouteClick: (route: RoutePolyline) => void
  onAlertClick: (alert: Alert) => void
  clustererRef: React.MutableRefObject<MarkerClusterer | null>
  historicalTrajectories?: HistoricalTrajectory[]
  routeStops?: RouteStop[]
  selectedRouteId?: string | null
  showTrajectories?: boolean
  mode?: 'live' | 'history'
}

export function MapLayers({
  map,
  vehicles,
  routes,
  alerts,
  selectedVehicle,
  onVehicleClick,
  onRouteClick,
  onAlertClick,
  clustererRef,
  historicalTrajectories = [],
  routeStops = [],
  selectedRouteId = null,
  showTrajectories = false,
  mode = 'live',
}: MapLayersProps) {
  const vehicleMarkersRef = useRef<Map<string, google.maps.Marker>>(new Map())
  const routePolylinesRef = useRef<Map<string, google.maps.Polyline>>(new Map())
  const stopMarkersRef = useRef<Map<string, google.maps.Marker>>(new Map())
  const alertMarkersRef = useRef<Map<string, google.maps.Marker>>(new Map())
  const trajectoryPolylinesRef = useRef<Map<string, google.maps.Polyline>>(new Map())
  const markerManagerRef = useRef<MarkerManager | null>(null)
  const useVirtualization = vehicles.length > 50 // Usar virtualização se >50 veículos

  // Desenhar rotas planejadas (polyline azul)
  useEffect(() => {
    // Limpar polylines antigas
    routePolylinesRef.current.forEach((polyline) => polyline.setMap(null))
    routePolylinesRef.current.clear()

    routes.forEach((route) => {
      if (!route.polyline_points || route.polyline_points.length < 2) return

      // Validar polyline antes de renderizar
      if (!isValidPolyline(route.polyline_points)) {
        console.warn(`Rota ${route.route_id} tem polyline inválido`)
        return
      }

      // Filtrar e validar coordenadas
      const validPoints = filterValidCoordinates(route.polyline_points)
      if (validPoints.length < 2) {
        console.warn(`Rota ${route.route_id} tem menos de 2 pontos válidos após filtragem`)
        return
      }

      // Converter polyline_points para array de LatLng
      const points = validPoints
        .sort((a: any, b: any) => (a.order || 0) - (b.order || 0))
        .map((p: any) => {
          try {
            return new google.maps.LatLng(p.lat, p.lng)
          } catch (error) {
            console.error(`Erro ao criar LatLng para ponto:`, p, error)
            return null
          }
        })
        .filter((p: any) => p !== null) as google.maps.LatLng[]

      if (points.length < 2) return

      // Sombra (polyline escura por trás)
      const shadowPolyline = new google.maps.Polyline({
        path: points,
        geodesic: true,
        strokeColor: '#000000',
        strokeOpacity: 0.3,
        strokeWeight: 6,
        zIndex: 499,
      })
      shadowPolyline.setMap(map)

      // Linha principal azul (4px)
      const polyline = new google.maps.Polyline({
        path: points,
        geodesic: true,
        strokeColor: '#3B82F6',
        strokeOpacity: 1.0,
        strokeWeight: 4,
        zIndex: 500,
      })
      polyline.setMap(map)

      polyline.addListener('click', () => {
        onRouteClick(route)
      })

      routePolylinesRef.current.set(route.route_id, polyline)
    })
  }, [routes, map, onRouteClick])

  // Inicializar MarkerManager se necessário
  useEffect(() => {
    if (useVirtualization && !markerManagerRef.current) {
      markerManagerRef.current = new MarkerManager(map)
    } else if (!useVirtualization && markerManagerRef.current) {
      markerManagerRef.current.destroy()
      markerManagerRef.current = null
    }

    return () => {
      if (markerManagerRef.current) {
        markerManagerRef.current.destroy()
        markerManagerRef.current = null
      }
    }
  }, [map, useVirtualization])

  // Desenhar veículos
  useEffect(() => {
    // Limpar marcadores antigos
    vehicleMarkersRef.current.forEach((marker) => marker.setMap(null))
    vehicleMarkersRef.current.clear()

    if (clustererRef.current) {
      clustererRef.current.clearMarkers()
    }

    if (markerManagerRef.current) {
      markerManagerRef.current.clear()
    }

    const markers: google.maps.Marker[] = []

    vehicles.forEach((vehicle) => {
      // Verificar se o veículo tem coordenadas válidas
      // Se não tiver, pular a criação do marcador no mapa, mas o veículo ainda aparecerá na lista
      if (!isValidCoordinate(vehicle.lat, vehicle.lng)) {
        // Veículo sem coordenadas GPS - não criar marcador no mapa
        // Mas o veículo ainda estará disponível na lista de veículos
        console.log(`ℹ️ Veículo ${vehicle.plate} (${vehicle.vehicle_id}) sem coordenadas GPS - não será exibido no mapa, mas estará na lista`)
        return
      }

      // Determinar cor baseado no status
      let color = '#10B981' // verde - em movimento
      if (vehicle.vehicle_status === 'stopped_short') color = '#F59E0B' // amarelo
      if (vehicle.vehicle_status === 'stopped_long') color = '#EF4444' // vermelho
      if (vehicle.vehicle_status === 'garage') color = '#3B82F6' // azul

      // Criar ícone com heading
      const heading = vehicle.heading !== null && !isNaN(vehicle.heading) 
        ? vehicle.heading % 360 // Normalizar para 0-360
        : 0
      
      const icon = {
        path: google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
        scale: 6,
        fillColor: color,
        fillOpacity: 1,
        strokeColor: '#FFFFFF',
        strokeWeight: 2,
        rotation: heading,
      }

      try {
        const marker = new google.maps.Marker({
          position: { lat: vehicle.lat, lng: vehicle.lng },
          map: null, // Clusterer vai adicionar
          icon,
          title: `${vehicle.plate} - ${vehicle.route_name}`,
        })

        // Tooltip no hover
        const infoWindow = new google.maps.InfoWindow({
          content: `
            <div style="padding: 8px; min-width: 200px; font-family: system-ui;">
              <div style="font-weight: bold; margin-bottom: 4px;">${vehicle.plate}</div>
              <div style="font-size: 12px; color: #666;">${vehicle.route_name}</div>
              <div style="font-size: 12px; color: #666;">${vehicle.driver_name}</div>
              <div style="font-size: 11px; color: #999; margin-top: 4px;">
                ${vehicle.speed ? `${(vehicle.speed * 3.6).toFixed(0)} km/h` : 'Parado'}
              </div>
            </div>
          `,
        })

        marker.addListener('click', () => {
          onVehicleClick(vehicle)
          infoWindow.close()
        })

        marker.addListener('mouseover', () => {
          infoWindow.open(map, marker)
        })

        markers.push(marker)
        vehicleMarkersRef.current.set(vehicle.vehicle_id, marker)

        // Usar MarkerManager para virtualização se ativo
        if (useVirtualization && markerManagerRef.current) {
          markerManagerRef.current.addMarker(vehicle.vehicle_id, marker)
        }
      } catch (error) {
        console.error(`Erro ao criar marcador para veículo ${vehicle.vehicle_id}:`, error)
        return // Pular este veículo
      }
    })

    // Clusterer se tiver muitos marcadores E não estiver usando virtualização
    if (!useVirtualization) {
      if (markers.length > 50) {
        if (!clustererRef.current) {
          clustererRef.current = new MarkerClusterer({ map, markers })
        } else {
          clustererRef.current.addMarkers(markers)
        }
      } else {
        markers.forEach((marker) => marker.setMap(map))
      }
    } else if (markerManagerRef.current) {
      // Atualizar visibilidade após adicionar todos os marcadores
      markerManagerRef.current.refresh()
    }
  }, [vehicles, map, onVehicleClick, clustererRef, useVirtualization])

  // Desenhar alertas (pinos pulsantes)
  useEffect(() => {
    alertMarkersRef.current.forEach((marker) => marker.setMap(null))
    alertMarkersRef.current.clear()

    alerts.forEach((alert) => {
      if (!alert.lat || !alert.lng) return
      
      // Validar coordenadas
      if (!isValidCoordinate(alert.lat, alert.lng)) {
        console.warn(`Alerta ${alert.alert_id} tem coordenadas inválidas`)
        return
      }

      const icon = {
        path: google.maps.SymbolPath.BACKWARD_CLOSED_ARROW,
        scale: 8,
        fillColor: alert.severity === 'critical' ? '#EF4444' : '#F59E0B',
        fillOpacity: 1,
        strokeColor: '#FFFFFF',
        strokeWeight: 2,
      }

      const marker = new google.maps.Marker({
        position: { lat: alert.lat, lng: alert.lng },
        map,
        icon,
        title: alert.description,
        zIndex: 1000,
      })

      // Animação pulsante
      let pulseInterval: NodeJS.Timeout
      const animatePulse = () => {
        let opacity = 1
        const step = 0.1
        pulseInterval = setInterval(() => {
          opacity -= step
          if (opacity <= 0.3) {
            opacity = 1
          }
          // Atualizar opacidade do marcador (limitado pela API do Google)
        }, 100)
      }
      animatePulse()

      marker.addListener('click', () => {
        onAlertClick(alert)
      })

      alertMarkersRef.current.set(alert.alert_id, marker)

      return () => {
        if (pulseInterval) clearInterval(pulseInterval)
      }
    })
  }, [alerts, map, onAlertClick])

  // Desenhar trajetos reais (histórico)
  useEffect(() => {
    // Limpar trajetos antigos
    trajectoryPolylinesRef.current.forEach((polyline) => polyline.setMap(null))
    trajectoryPolylinesRef.current.clear()

    // Mostrar trajetos apenas quando:
    // - Modo histórico ativo OU
    // - Veículo selecionado (última viagem completa) OU
    // - showTrajectories explícito
    const shouldShowTrajectories = 
      mode === 'history' || 
      selectedVehicle !== null || 
      showTrajectories

    if (!shouldShowTrajectories || historicalTrajectories.length === 0) {
      return
    }

    historicalTrajectories.forEach((trajectory) => {
      if (!trajectory.positions || trajectory.positions.length < 2) return

      // Validar e filtrar posições
      const validPositions = filterValidCoordinates(trajectory.positions)
      if (validPositions.length < 2) {
        console.warn(`Trajetória ${trajectory.vehicle_id} tem menos de 2 posições válidas`)
        return
      }

      // Converter posições válidas para array de LatLng
      const points = validPositions
        .map((p) => {
          try {
            return new google.maps.LatLng(p.lat, p.lng)
          } catch (error) {
            console.error('Erro ao criar LatLng para posição histórica:', p, error)
            return null
          }
        })
        .filter((p: any) => p !== null) as google.maps.LatLng[]
      
      if (points.length < 2) return

      // Criar polyline amarela/laranja para trajeto real
      const color = trajectory.color || '#F59E0B'
      const polyline = new google.maps.Polyline({
        path: points,
        geodesic: true,
        strokeColor: color,
        strokeOpacity: 0.8,
        strokeWeight: 3,
        zIndex: 450, // Abaixo das rotas planejadas (500) mas acima do fundo
      })
      polyline.setMap(map)

      trajectoryPolylinesRef.current.set(
        `${trajectory.vehicle_id}-${trajectory.trip_id}`,
        polyline
      )
    })
  }, [historicalTrajectories, map, mode, selectedVehicle, showTrajectories])

  // Desenhar marcadores de paradas
  useEffect(() => {
    // Limpar marcadores de paradas antigos
    stopMarkersRef.current.forEach((marker) => marker.setMap(null))
    stopMarkersRef.current.clear()

    // Filtrar paradas: mostrar apenas da rota selecionada ou todas se nenhuma selecionada
    const filteredStops = selectedRouteId
      ? routeStops.filter((stop) => stop.route_id === selectedRouteId)
      : routeStops

    filteredStops.forEach((stop) => {
      // Validar coordenadas da parada
      if (!isValidCoordinate(stop.lat, stop.lng)) {
        console.warn(`Parada ${stop.id} tem coordenadas inválidas:`, stop.lat, stop.lng)
        return
      }
      
      // Criar marcador com ícone de círculo roxo
      const icon = {
        path: google.maps.SymbolPath.CIRCLE,
        scale: 8,
        fillColor: '#8B5CF6',
        fillOpacity: 1,
        strokeColor: '#FFFFFF',
        strokeWeight: 2,
      }

      const marker = new google.maps.Marker({
        position: { lat: stop.lat, lng: stop.lng },
        map,
        icon,
        title: `${stop.name} - Parada ${stop.seq}`,
        zIndex: 600, // Acima das rotas
      })

      // Tooltip com informações da parada
      const infoWindow = new google.maps.InfoWindow({
        content: `
          <div style="padding: 8px; min-width: 200px; font-family: system-ui;">
            <div style="font-weight: bold; margin-bottom: 4px; color: #8B5CF6;">
              ${stop.name}
            </div>
            <div style="font-size: 12px; color: #666;">
              Rota: ${stop.route_name}
            </div>
            <div style="font-size: 12px; color: #666;">
              Sequência: ${stop.seq}
            </div>
            <div style="font-size: 11px; color: #999; margin-top: 4px;">
              Raio de detecção: ${stop.radius_m}m
            </div>
          </div>
        `,
      })

      marker.addListener('click', () => {
        infoWindow.open(map, marker)
      })

      marker.addListener('mouseover', () => {
        infoWindow.open(map, marker)
      })

      // Desenhar círculo de raio de detecção (opcional, visual)
      const circle = new google.maps.Circle({
        map,
        center: { lat: stop.lat, lng: stop.lng },
        radius: stop.radius_m || 50,
        fillColor: '#8B5CF6',
        fillOpacity: 0.1,
        strokeColor: '#8B5CF6',
        strokeOpacity: 0.3,
        strokeWeight: 1,
        zIndex: 599,
      })

      stopMarkersRef.current.set(stop.id, marker)
    })
  }, [routeStops, map, selectedRouteId])

  return null
}

