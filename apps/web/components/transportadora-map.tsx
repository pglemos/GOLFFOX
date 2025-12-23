"use client"

import { useEffect, useState, useCallback, useRef } from "react"

import { Map as MapIcon } from "lucide-react"

import { loadGoogleMapsAPI } from "@/lib/google-maps-loader"

interface veiculo {
  id: string
  plate: string
  lat: number
  lng: number
  status: 'on_route' | 'available' | 'delayed'
}

interface TransportadoraMapProps {
  veiculos: veiculo[]
  className?: string
}

export function CarrierMap({ veiculos, className = "" }: TransportadoraMapProps) {
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

    if (veiculos.length === 0) return

    // Adicionar novos marcadores
    const bounds = new google.maps.LatLngBounds()

    veiculos.forEach(veiculo => {
      const icon = getVehicleIcon(veiculo.status)
      const marker = new google.maps.Marker({
        position: { lat: veiculo.lat, lng: veiculo.lng },
        map: mapInstanceRef.current,
        ...(icon && { icon }),
        title: `${veiculo.plate} - ${veiculo.status}`
      })

      // Info window
      const infoWindow = new google.maps.InfoWindow({
        content: `
          <div style="padding: 8px;">
            <h3 style="margin: 0 0 4px 0; font-weight: bold;">${veiculo.plate}</h3>
            <p style="margin: 0; color: #666;">Status: ${veiculo.status}</p>
          </div>
        `
      })

      marker.addListener('click', () => {
        infoWindow.open(mapInstanceRef.current, marker)
      })

      markersRef.current.set(veiculo.id, marker)
      bounds.extend({ lat: veiculo.lat, lng: veiculo.lng })
    })

    // Ajustar zoom para mostrar todos os veículos
    if (mapInstanceRef.current) {
      if (veiculos.length > 1) {
        mapInstanceRef.current.fitBounds(bounds)
      } else if (veiculos.length === 1 && veiculos[0]) {
        mapInstanceRef.current.setCenter({ lat: veiculos[0].lat, lng: veiculos[0].lng })
        mapInstanceRef.current.setZoom(15)
      }
    }
  }, [veiculos, loading, getVehicleIcon])

  if (error) {
    return (
      <div className={`aspect-[4/3] bg-bg-bg rounded-xl flex items-center justify-center border border-text-muted-foreground/20 ${className}`}>
        <div className="text-center">
          <MapIcon className="h-16 w-16 mx-auto mb-4 text-error" />
          <p className="text-error">{error}</p>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className={`aspect-[4/3] bg-bg-bg rounded-xl flex items-center justify-center border border-text-muted-foreground/20 ${className}`}>
        <div className="text-center">
          <MapIcon className="h-16 w-16 mx-auto mb-4 text-text-muted-foreground animate-pulse" />
          <p className="text-text-muted-foreground">Carregando mapa...</p>
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