/**
 * Camada de Heatmap de Densidade de Veículos
 * Usa google.maps.visualization.HeatmapLayer
 */

'use client'

import { useEffect, useRef } from 'react'
import type { Vehicle } from './admin-map'

interface HeatmapLayerProps {
  map: google.maps.Map
  vehicles: Vehicle[]
  enabled: boolean
  mode: 'live' | 'history'
}

interface HeatmapDataPoint {
  location: google.maps.LatLng
  weight: number
}

export function HeatmapLayer({
  map,
  vehicles,
  enabled,
  mode,
}: HeatmapLayerProps) {
  const heatmapLayerRef = useRef<google.maps.visualization.HeatmapLayer | null>(null)

  useEffect(() => {
    // Verificar se biblioteca visualization está disponível
    if (!window.google?.maps?.visualization) {
      console.warn('Google Maps visualization library not loaded. Heatmap will not work.')
      return
    }

    // Limpar heatmap anterior
    if (heatmapLayerRef.current) {
      heatmapLayerRef.current.setMap(null)
      heatmapLayerRef.current = null
    }

    if (!enabled || vehicles.length === 0) {
      return
    }

    // Preparar dados para heatmap
    const dataPoints: HeatmapDataPoint[] = vehicles.map((vehicle) => ({
      location: new google.maps.LatLng(vehicle.lat, vehicle.lng),
      weight: 1, // Peso igual para cada veículo
    }))

    // Criar heatmap layer
    const heatmap = new google.maps.visualization.HeatmapLayer({
      data: dataPoints,
      map,
      radius: 50, // Raio em pixels
      opacity: 0.6,
      gradient: [
        'rgba(0, 255, 255, 0)',
        'rgba(0, 255, 255, 1)',
        'rgba(0, 191, 255, 1)',
        'rgba(0, 127, 255, 1)',
        'rgba(0, 63, 255, 1)',
        'rgba(0, 0, 255, 1)',
        'rgba(0, 0, 223, 1)',
        'rgba(0, 0, 191, 1)',
        'rgba(0, 0, 159, 1)',
        'rgba(0, 0, 127, 1)',
        'rgba(63, 0, 91, 1)',
        'rgba(127, 0, 63, 1)',
        'rgba(191, 0, 31, 1)',
        'rgba(255, 0, 0, 1)',
      ], // Gradiente azul → vermelho
    })

    heatmapLayerRef.current = heatmap

    // Cleanup
    return () => {
      if (heatmapLayerRef.current) {
        heatmapLayerRef.current.setMap(null)
        heatmapLayerRef.current = null
      }
    }
  }, [map, vehicles, enabled, mode])

  return null
}

