/**
 * Camada de Heatmap de Densidade de Veículos
 * Usa google.maps.visualization.HeatmapLayer
 */

'use client'

import { useEffect, useRef } from 'react'

import { warn } from '@/lib/logger'

import type { veiculo } from './admin-map'

interface HeatmapLayerProps {
  map: google.maps.Map
  veiculos: veiculo[]
  enabled: boolean
  mode: 'live' | 'history'
}

interface HeatmapDataPoint {
  location: google.maps.LatLng
  weight: number
}

export function HeatmapLayer({
  map,
  veiculos,
  enabled,
  mode,
}: HeatmapLayerProps) {
  const heatmapLayerRef = useRef<google.maps.visualization.HeatmapLayer | null>(null)

  useEffect(() => {
    // Verificar se biblioteca visualization está disponível
    if (!window.google?.maps?.visualization) {
      warn('Google Maps visualization library not loaded. Heatmap disabled.', {
        component: 'HeatmapLayer',
      })
      return
    }

    // Limpar heatmap anterior
    if (heatmapLayerRef.current) {
      heatmapLayerRef.current.setMap(null)
      heatmapLayerRef.current = null
    }

    if (!enabled || veiculos.length === 0) {
      return
    }

    // Filtrar veículos com coordenadas válidas
    const validVehicles = veiculos.filter((v) => {
      const isValid = Number.isFinite(v.lat) && Number.isFinite(v.lng) && v.lat >= -90 && v.lat <= 90 && v.lng >= -180 && v.lng <= 180
      return isValid
    })

    if (validVehicles.length !== veiculos.length) {
      warn('Alguns veículos possuem coordenadas inválidas e foram ignorados no heatmap.', {
        component: 'HeatmapLayer',
        total: veiculos.length,
        valid: validVehicles.length,
        invalid: veiculos.length - validVehicles.length,
      })
    }

    // Preparar dados para heatmap
    const dataPoints: HeatmapDataPoint[] = validVehicles.map((veiculo) => ({
      location: new google.maps.LatLng(veiculo.lat, veiculo.lng),
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
  }, [map, veiculos, enabled, mode])

  return null
}

