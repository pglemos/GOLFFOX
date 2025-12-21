import { useEffect, useRef, RefObject } from 'react'
import { loadGoogleMapsAPI } from '@/lib/google-maps-loader'
import { getMapsBillingMonitor } from '@/lib/maps-billing-monitor'
import { debug, logError } from '@/lib/logger'

interface UseMapInitializationOptions {
  /**
   * Referência para o elemento do mapa
   */
  mapRef: RefObject<HTMLDivElement>
  /**
   * Referência para a instância do Google Maps
   */
  mapInstanceRef: RefObject<google.maps.Map | null>
  /**
   * Centro inicial do mapa
   */
  initialCenter?: { lat: number; lng: number }
  /**
   * Zoom inicial do mapa
   */
  initialZoom?: number
  /**
   * Callback para definir estado de loading
   */
  onLoadingChange: (loading: boolean) => void
  /**
   * Callback para definir erro do mapa
   */
  onError: (error: string) => void
  /**
   * Callback para ativar modo lista
   */
  onListModeChange: (listMode: boolean) => void
  /**
   * Callback para definir status de billing
   */
  onBillingStatusChange: (status: any) => void
  /**
   * Callback para carregar dados iniciais
   */
  onLoadInitialData: () => Promise<void>
  /**
   * Callback para inicializar realtime
   */
  onInitRealtime: () => void
  /**
   * Callback para inicializar playback
   */
  onInitPlayback: () => Promise<void>
  /**
   * Callback para carregar rotas visíveis
   */
  onLoadVisibleRoutes: () => Promise<void>
  /**
   * Modo do mapa: 'live' ou 'history'
   */
  mode: 'live' | 'history'
  /**
   * Função de tradução
   */
  t: (ns: string, key: string, params?: any) => string
  /**
   * Callback para notificar erros
   */
  notifyError: (error: unknown, message?: string) => void
}

/**
 * Hook para inicializar o Google Maps com todas as configurações necessárias
 * 
 * @example
 * useMapInitialization({
 *   mapRef,
 *   mapInstanceRef,
 *   initialCenter,
 *   initialZoom,
 *   onLoadingChange: setLoading,
 *   onError: setMapError,
 *   onListModeChange: setListMode,
 *   onBillingStatusChange: setBillingStatus,
 *   onLoadInitialData: loadInitialData,
 *   onInitRealtime: initRealtime,
 *   onInitPlayback: initPlayback,
 *   onLoadVisibleRoutes: loadVisibleRoutes,
 *   mode,
 *   t,
 *   notifyError,
 * })
 */
export function useMapInitialization({
  mapRef,
  mapInstanceRef,
  initialCenter,
  initialZoom,
  onLoadingChange,
  onError,
  onListModeChange,
  onBillingStatusChange,
  onLoadInitialData,
  onInitRealtime,
  onInitPlayback,
  onLoadVisibleRoutes,
  mode,
  t,
  notifyError,
}: UseMapInitializationOptions) {
  const isMountedRef = useRef(true)
  const boundsListenerRef = useRef<google.maps.MapsEventListener | null>(null)
  const boundsListenerTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    isMountedRef.current = true

    const initMap = async () => {
      const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
      if (!apiKey) {
        if (isMountedRef.current) {
          onError(t('common', 'errors.mapApiKeyMissing'))
          onLoadingChange(false)
        }
        return
      }

      if (!mapRef.current) {
        if (isMountedRef.current) {
          onError(t('common', 'errors.mapElementMissing'))
          onLoadingChange(false)
        }
        return
      }

      try {
        // Verificar quota antes de carregar
        const billingMonitor = getMapsBillingMonitor()
        const billingStatus = billingMonitor.getStatus()
        if (isMountedRef.current) {
          onBillingStatusChange(billingStatus)
        }

        if (billingMonitor.isQuotaExceeded()) {
          if (isMountedRef.current) {
            onError(t('common', 'errors.mapsQuotaExceededListMode'))
            onListModeChange(true)
            onLoadingChange(false)
          }
          await onLoadInitialData()
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
            },
            {
              featureType: 'road',
              elementType: 'geometry.stroke',
              stylers: [{ color: '#212a37' }],
            },
            {
              featureType: 'road',
              elementType: 'labels.text.fill',
              stylers: [{ color: '#9ca5b3' }],
            },
            {
              featureType: 'road',
              elementType: 'labels.text.stroke',
              stylers: [{ color: '#1a1a1a' }],
            },
            {
              featureType: 'administrative',
              elementType: 'geometry',
              stylers: [{ color: '#757575' }],
            },
            {
              featureType: 'administrative.locality',
              elementType: 'labels.text.fill',
              stylers: [{ color: '#b3b3b3' }],
            },
            {
              featureType: 'poi.park',
              elementType: 'geometry',
              stylers: [{ color: '#263c3f' }],
            },
            {
              featureType: 'poi.park',
              elementType: 'labels.text.fill',
              stylers: [{ color: '#6b9a76' }],
            },
            {
              featureType: 'road',
              elementType: 'labels.icon',
              stylers: [{ visibility: 'off' }],
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

        if (!isMountedRef.current) return

        mapInstanceRef.current = map
        
        // Garantir que o mapa seja renderizado
        debug('Mapa do Google Maps criado com sucesso', {
          center: map.getCenter()?.toJSON(),
          zoom: map.getZoom()
        }, 'AdminMap')
        
        // Forçar resize do mapa após um pequeno delay para garantir renderização
        setTimeout(() => {
          if (map && window.google?.maps && isMountedRef.current) {
            window.google.maps.event.trigger(map, 'resize')
            debug('Resize do mapa disparado', {}, 'AdminMap')
          }
        }, 100)
        
        // Carregar dados iniciais
        debug('Iniciando carregamento de dados iniciais', {}, 'AdminMap')
        try {
          await onLoadInitialData()
          if (isMountedRef.current) {
            debug('Dados iniciais carregados com sucesso', {}, 'AdminMap')
          }
        } catch (error: unknown) {
          if (isMountedRef.current) {
            logError('Erro ao carregar dados iniciais', { error }, 'AdminMap')
            notifyError(error, 'Erro ao carregar dados do mapa')
          }
        }
        
        // Configurar listener para lazy loading após dados iniciais
        if (isMountedRef.current) {
          boundsListenerTimeoutRef.current = null
          boundsListenerRef.current = map.addListener('bounds_changed', () => {
            if (boundsListenerTimeoutRef.current) {
              clearTimeout(boundsListenerTimeoutRef.current)
            }
            boundsListenerTimeoutRef.current = setTimeout(() => {
              if (isMountedRef.current) {
                onLoadVisibleRoutes()
              }
            }, 500)
          })
        }
        
        // Inicializar realtime ou playback baseado no modo
        if (isMountedRef.current) {
          if (mode === 'live') {
            debug('Inicializando modo realtime', {}, 'AdminMap')
            onInitRealtime()
          } else {
            debug('Inicializando modo playback', {}, 'AdminMap')
            await onInitPlayback()
          }
        }
        
        if (isMountedRef.current) {
          onLoadingChange(false)
          debug('Mapa inicializado com sucesso', { mode }, 'AdminMap')
        }
      } catch (error: unknown) {
        if (isMountedRef.current) {
          logError('Erro ao inicializar mapa', { error }, 'AdminMap')
          onError(t('common', 'errors.mapLoadFailedListMode'))
          onListModeChange(true)
          onLoadingChange(false)
          // Carregar dados em modo lista
          try {
            await onLoadInitialData()
          } catch (err) {
            if (isMountedRef.current) {
              logError('Erro ao carregar dados iniciais', { error: err }, 'AdminMap')
            }
          }
        }
      }
    }

    initMap()

    return () => {
      isMountedRef.current = false
      
      // Cleanup de listeners
      if (boundsListenerRef.current) {
        google.maps.event.removeListener(boundsListenerRef.current)
        boundsListenerRef.current = null
      }
      
      if (boundsListenerTimeoutRef.current) {
        clearTimeout(boundsListenerTimeoutRef.current)
        boundsListenerTimeoutRef.current = null
      }
    }
  }, [
    mapRef,
    mapInstanceRef,
    initialCenter,
    initialZoom,
    onLoadingChange,
    onError,
    onListModeChange,
    onBillingStatusChange,
    onLoadInitialData,
    onInitRealtime,
    onInitPlayback,
    onLoadVisibleRoutes,
    mode,
    t,
    notifyError,
  ])
}

