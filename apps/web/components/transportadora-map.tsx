"use client"

import { useEffect, useState, useCallback, useRef } from "react"
import { Map as MapIcon } from "lucide-react"
import { loadGoogleMapsAPI } from "@/lib/google-maps-loader"

interface Vehicle {
  id: string
  plate: string
  lat: number
  lng: number
  status: 'on_route' | 'available' | 'delayed'
}

interface CarrierMapProps {
  vehicles: Vehicle[]
  className?: string
}

export function CarrierMap({ vehicles, className = "" }: CarrierMapProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<google.maps.Map | null>(null)
  const markersRef = useRef<Map<string, google.maps.Marker>>(new Map())
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Cores dos veículos baseadas no status
  const statusColors = {
    on_route: '#3B82F6',    // Azul - Em rota
    available: '#10B981',   // Verde - Disponível
    delayed: '#EF4444'      // Vermelho - Atrasado
  }

  // Ícone de veículo
  const getVehicleIcon = useCallback((status: string) => {
    if (typeof google === 'undefined' || !google.maps) {
      return undefined
    }
    return {
      path: google.maps.SymbolPath.CIRCLE,
      scale: 8,
      fillColor: statusColors[status as keyof typeof statusColors] || '#6B7280',
      fillOpacity: 1,
      strokeColor: '#FFFFFF',
      strokeWeight: 2
    }
  }, [])

  // Inicializar mapa
  useEffect(() => {
    const initMap = async () => {
      const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
      if (!apiKey) {
        setError('API key do Google Maps não configurada')
        setLoading(false)
        return
      }

      if (!mapRef.current) return

      try {
        // Usar o loader compartilhado
        await loadGoogleMapsAPI(apiKey)

        // Criar mapa centrado no Brasil
        const map = new google.maps.Map(mapRef.current, {
          center: { lat: -14.235, lng: -51.9253 }, // Centro do Brasil
          zoom: 5,
          mapTypeId: 'roadmap',
          styles: [
            {
              featureType: 'poi',
              elementType: 'labels',
              stylers: [{ visibility: 'off' }]
            }
          ]
        })

        mapInstanceRef.current = map
        setLoading(false)
      } catch (error) {
        console.error('Erro ao inicializar mapa:', error)
        setError('Erro ao carregar o mapa')
        setLoading(false)
      }
    }

    initMap()
  }, [])

  // Atualizar marcadores quando os veículos mudarem
  useEffect(() => {
    if (!mapInstanceRef.current || loading) return

    // Limpar marcadores existentes
    markersRef.current.forEach(marker => marker.setMap(null))
    markersRef.current.clear()

    if (vehicles.length === 0) return

    // Adicionar novos marcadores
    const bounds = new google.maps.LatLngBounds()

    vehicles.forEach(vehicle => {
      const icon = getVehicleIcon(vehicle.status)
      const marker = new google.maps.Marker({
        position: { lat: vehicle.lat, lng: vehicle.lng },
        map: mapInstanceRef.current,
        ...(icon && { icon }),
        title: `${vehicle.plate} - ${vehicle.status}`
      })

      // Info window
      const infoWindow = new google.maps.InfoWindow({
        content: `
          <div style="padding: 8px;">
            <h3 style="margin: 0 0 4px 0; font-weight: bold;">${vehicle.plate}</h3>
            <p style="margin: 0; color: #666;">Status: ${vehicle.status}</p>
          </div>
        `
      })

      marker.addListener('click', () => {
        infoWindow.open(mapInstanceRef.current, marker)
      })

      markersRef.current.set(vehicle.id, marker)
      bounds.extend({ lat: vehicle.lat, lng: vehicle.lng })
    })

    // Ajustar zoom para mostrar todos os veículos
    if (mapInstanceRef.current) {
      if (vehicles.length > 1) {
        mapInstanceRef.current.fitBounds(bounds)
      } else if (vehicles.length === 1 && vehicles[0]) {
        mapInstanceRef.current.setCenter({ lat: vehicles[0].lat, lng: vehicles[0].lng })
        mapInstanceRef.current.setZoom(15)
      }
    }
  }, [vehicles, loading, getVehicleIcon])

  if (error) {
    return (
      <div className={`aspect-[4/3] bg-[var(--bg)] rounded-xl flex items-center justify-center border border-[var(--muted)]/20 ${className}`}>
        <div className="text-center">
          <MapIcon className="h-16 w-16 mx-auto mb-4 text-[var(--err)]" />
          <p className="text-[var(--err)]">{error}</p>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className={`aspect-[4/3] bg-[var(--bg)] rounded-xl flex items-center justify-center border border-[var(--muted)]/20 ${className}`}>
        <div className="text-center">
          <MapIcon className="h-16 w-16 mx-auto mb-4 text-[var(--muted)] animate-pulse" />
          <p className="text-[var(--muted)]">Carregando mapa...</p>
        </div>
      </div>
    )
  }

  return (
    <div className={`aspect-[4/3] rounded-xl overflow-hidden ${className}`}>
      <div ref={mapRef} className="w-full h-full" />
    </div>
  )
}