/**
 * Hook para inicialização do mapa Google Maps
 * Extrai a lógica de inicialização do componente principal
 */

import { useEffect, useRef, useState } from 'react'

import { loadGoogleMapsAPI } from '@/lib/google-maps-loader'
import { t } from '@/lib/i18n'
import { debug, warn, error as logError } from '@/lib/logger'
import { getMapsBillingMonitor } from '@/lib/maps-billing-monitor'

export interface UseMapInitializationOptions {
  mapRef: React.RefObject<HTMLDivElement>
  initialCenter?: { lat: number; lng: number }
  initialZoom?: number
  onMapReady?: (map: google.maps.Map) => void
  onError?: (error: string) => void
  onListMode?: () => void
}

export function useMapInitialization({
  mapRef,
  initialCenter,
  initialZoom,
  onMapReady,
  onError,
  onListMode
}: UseMapInitializationOptions) {
  const mapInstanceRef = useRef<google.maps.Map | null>(null)
  const [loading, setLoading] = useState(true)
  const [mapError, setMapError] = useState<string | null>(null)
  const [listMode, setListMode] = useState(false)

  useEffect(() => {
    let isMounted = true
    const abortController = new AbortController()

    const initMap = async () => {
      const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
      if (!apiKey) {
        if (isMounted) {
          const errorMsg = t('common', 'errors.mapApiKeyMissing')
          setMapError(errorMsg)
          setLoading(false)
          onError?.(errorMsg)
        }
        return
      }

      if (!mapRef.current) {
        if (isMounted) {
          const errorMsg = t('common', 'errors.mapElementMissing')
          setMapError(errorMsg)
          setLoading(false)
          onError?.(errorMsg)
        }
        return
      }

      try {
        // Verificar quota antes de carregar
        const billingMonitor = getMapsBillingMonitor()
        const billingStatus = billingMonitor.getStatus()
        
        if (billingMonitor.isQuotaExceeded()) {
          if (isMounted) {
            const errorMsg = t('common', 'errors.mapsQuotaExceededListMode')
            setMapError(errorMsg)
            setListMode(true)
            setLoading(false)
            onListMode?.()
          }
          return
        }

        await loadGoogleMapsAPI(apiKey)
        
        // Incrementar uso
        billingMonitor.incrementUsage(1)
        
        const defaultCenter = { lat: -19.916681, lng: -43.934493 }
        
        // Detectar modo dark
        const isDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
        
        // Estilos do mapa (dark mode ready)
        const mapStyles: google.maps.MapTypeStyle[] = [
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
        ]
        
        // Aplicar tema escuro se necessário
        if (isDark) {
          mapStyles.push(
            { elementType: 'geometry', stylers: [{ color: '#242f3e' }] },
            { elementType: 'labels.text.stroke', stylers: [{ color: '#242f3e' }] },
            { elementType: 'labels.text.fill', stylers: [{ color: '#746855' }] },
            {
              featureType: 'water',
              elementType: 'geometry',
              stylers: [{ color: '#17263c' }],
            },
            {
              featureType: 'road',
              elementType: 'geometry',
              stylers: [{ color: '#38414e' }],
            }
          )
        }
        
        const map = new google.maps.Map(mapRef.current, {
          center: initialCenter || defaultCenter,
          zoom: initialZoom || 12,
          styles: mapStyles,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: true,
          zoomControl: true,
          disableDefaultUI: false,
        })

        mapInstanceRef.current = map
        
        debug('Mapa do Google Maps criado com sucesso', {
          center: map.getCenter()?.toJSON(),
          zoom: map.getZoom()
        }, 'MapInitialization')
        
        // Forçar resize do mapa após um pequeno delay
        setTimeout(() => {
          if (map && window.google?.maps) {
            window.google.maps.event.trigger(map, 'resize')
            debug('Resize do mapa disparado', {}, 'MapInitialization')
          }
        }, 100)
        
        if (isMounted) {
          setLoading(false)
          onMapReady?.(map)
        }
      } catch (error: unknown) {
        if (isMounted) {
          logError('Erro ao inicializar mapa', { error }, 'MapInitialization')
          const errorMsg = t('common', 'errors.mapLoadFailedListMode')
          setMapError(errorMsg)
          setListMode(true)
          setLoading(false)
          onError?.(errorMsg)
          onListMode?.()
        }
      }
    }

    initMap()

    return () => {
      isMounted = false
      abortController.abort()
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return {
    mapInstance: mapInstanceRef.current,
    loading,
    mapError,
    listMode
  }
}

