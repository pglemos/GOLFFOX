/**
 * Camadas do Mapa
 * Gerencia desenho de rotas, trajetos, paradas, veículos e alertas
 */

'use client'

import { useEffect, useRef } from 'react'
import { MarkerClusterer } from '@googlemaps/markerclusterer'
import { calculateHeading } from '@/lib/map-utils'
import type { Vehicle, RoutePolyline, Alert } from './admin-map'

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
}: MapLayersProps) {
  const vehicleMarkersRef = useRef<Map<string, google.maps.Marker>>(new Map())
  const routePolylinesRef = useRef<Map<string, google.maps.Polyline>>(new Map())
  const stopMarkersRef = useRef<Map<string, google.maps.Marker>>(new Map())
  const alertMarkersRef = useRef<Map<string, google.maps.Marker>>(new Map())

  // Desenhar rotas planejadas (polyline azul)
  useEffect(() => {
    // Limpar polylines antigas
    routePolylinesRef.current.forEach((polyline) => polyline.setMap(null))
    routePolylinesRef.current.clear()

    routes.forEach((route) => {
      if (!route.polyline_points || route.polyline_points.length < 2) return

      const path = route.polyline_points
        .sort((a, b) => a.order - b.order)
        .map((p) => new google.maps.LatLng(p.lat, p.lng))

      // Sombra
      const shadowPolyline = new google.maps.Polyline({
        path,
        geodesic: true,
        strokeColor: '#000000',
        strokeOpacity: 0.3,
        strokeWeight: 6,
        zIndex: 499,
      })
      shadowPolyline.setMap(map)

      // Linha principal azul (4px)
      const polyline = new google.maps.Polyline({
        path,
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

  // Desenhar veículos
  useEffect(() => {
    // Limpar marcadores antigos
    vehicleMarkersRef.current.forEach((marker) => marker.setMap(null))
    vehicleMarkersRef.current.clear()

    if (clustererRef.current) {
      clustererRef.current.clearMarkers()
    }

    const markers: google.maps.Marker[] = []

    vehicles.forEach((vehicle) => {
      // Determinar cor baseado no status
      let color = '#10B981' // verde - em movimento
      if (vehicle.vehicle_status === 'stopped_short') color = '#F59E0B' // amarelo
      if (vehicle.vehicle_status === 'stopped_long') color = '#EF4444' // vermelho
      if (vehicle.vehicle_status === 'garage') color = '#3B82F6' // azul

      // Criar ícone com heading
      const heading = vehicle.heading || 0
      const icon = {
        path: google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
        scale: 6,
        fillColor: color,
        fillOpacity: 1,
        strokeColor: '#FFFFFF',
        strokeWeight: 2,
        rotation: heading,
      }

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
    })

    // Clusterer se tiver muitos marcadores
    if (markers.length > 50) {
      if (!clustererRef.current) {
        clustererRef.current = new MarkerClusterer({ map, markers })
      } else {
        clustererRef.current.addMarkers(markers)
      }
    } else {
      markers.forEach((marker) => marker.setMap(map))
    }
  }, [vehicles, map, onVehicleClick, clustererRef])

  // Desenhar alertas (pinos pulsantes)
  useEffect(() => {
    alertMarkersRef.current.forEach((marker) => marker.setMap(null))
    alertMarkersRef.current.clear()

    alerts.forEach((alert) => {
      if (!alert.lat || !alert.lng) return

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

  return null
}

