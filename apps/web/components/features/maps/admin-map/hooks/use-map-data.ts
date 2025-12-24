/**
 * Hook para carregamento de dados do mapa
 * Gerencia veículos, rotas, alertas e outras entidades do mapa
 */

import { useState, useCallback, useRef } from 'react'

import { isValidCoordinate, normalizeCoordinate } from '@/lib/coordinate-validator'
import { t } from '@/lib/i18n'
import { debug, warn, error as logError } from '@/lib/logger'
import { loadVehicles } from '@/lib/services/map/map-services/vehicle-loader'
import { supabase } from '@/lib/supabase'
import { notifySuccess } from '@/lib/toast'
import type { Veiculo, RoutePolyline, MapAlert, RouteStop } from '@/types/map'
import type { SupabaseRoute, SupabaseStopWithRoute } from '@/types/supabase-data'

export interface UseMapDataOptions {
  companyFilter?: string | null
}

export function useMapData({ companyFilter }: UseMapDataOptions = {}) {
  const [veiculos, setVeiculos] = useState<Veiculo[]>([])
  const [routes, setRoutes] = useState<RoutePolyline[]>([])
  const [alerts, setAlerts] = useState<MapAlert[]>([])
  const [routeStops, setRouteStops] = useState<RouteStop[]>([])

  // Cache de rotas para lazy loading
  const routesCacheRef = useRef<Map<string, RoutePolyline>>(new Map())
  const loadedRouteIdsRef = useRef<Set<string>>(new Set())
  const lastZoomRef = useRef<number | null>(null)
  const lastCompanyRef = useRef<string | null>(null)
  const routesLoadTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  /**
   * Carrega rotas visíveis no viewport (lazy loading otimizado)
   */
  const loadVisibleRoutes = useCallback(
    async (map: google.maps.Map) => {
      const bounds = map.getBounds()
      if (!bounds) return

      const LIMIT = 50
      const currentZoom = map.getZoom() || 0
      const currentCompany = companyFilter || null

      // Limpar cache se empresa mudou
      if (lastCompanyRef.current !== currentCompany) {
        routesCacheRef.current.clear()
        loadedRouteIdsRef.current.clear()
        lastCompanyRef.current = currentCompany
      }

      // Limpar cache se zoom mudou significativamente (>2 níveis)
      if (lastZoomRef.current !== null && Math.abs(currentZoom - lastZoomRef.current) > 2) {
        routesCacheRef.current.clear()
        loadedRouteIdsRef.current.clear()
      }
      lastZoomRef.current = currentZoom

      // Debounce para evitar muitas chamadas
      if (routesLoadTimeoutRef.current) {
        clearTimeout(routesLoadTimeoutRef.current)
      }

      routesLoadTimeoutRef.current = setTimeout(async () => {
        try {
          let routesQuery = supabase
            .from('rotas')
            .select(`id, name, empresa_id`)
            .eq('is_active', true)
            .limit(LIMIT)

          if (currentCompany && currentCompany !== 'null' && currentCompany !== '') {
            routesQuery = routesQuery.eq('empresa_id', currentCompany)
          }

          const { data: routesData, error: routesError } = await routesQuery

          if (!routesError && routesData && routesData.length > 0) {
            const routeIds = routesData.map((r: RotasRow) => r.id)

            const { data: stopsData } = await supabase
              .from('v_route_stops')
              .select('route_id, lat, lng, seq, name')
              .in('route_id', routeIds)
              .order('route_id')
              .order('seq')

            // Agrupar stops por route_id
            const stopsByRoute = new Map<string, Array<{ lat: number; lng: number; order: number }>>()
            if (stopsData) {
              stopsData.forEach((stop: GfRoutePlanRow) => {
                const routeId = stop.route_id || ''
                if (!stopsByRoute.has(routeId)) {
                  stopsByRoute.set(routeId, [])
                }
                stopsByRoute.get(routeId)?.push({
                  lat: stop.lat || 0,
                  lng: stop.lng || 0,
                  order: stop.seq || 0
                })
              })
            }

            const formattedRoutes = (routesData || []).map((r: RotasRow) => ({
              route_id: r.id,
              route_name: r.name || '',
              company_id: r.empresa_id || '',
              polyline_points: stopsByRoute.get(r.id) || [],
              stops_count: stopsByRoute.get(r.id)?.length || 0
            }))

            const newRoutes = formattedRoutes.filter(
              (r: RoutePolyline) => !loadedRouteIdsRef.current.has(r.route_id)
            )

            if (newRoutes.length > 0) {
              newRoutes.forEach((route: RoutePolyline) => {
                routesCacheRef.current.set(route.route_id, route)
                loadedRouteIdsRef.current.add(route.route_id)
              })

              setRoutes(Array.from(routesCacheRef.current.values()))
            }
          } else if (routesError) {
            warn('Erro ao carregar rotas', { error: routesError }, 'MapData')
          }
        } catch (error) {
          logError('Erro ao carregar rotas visíveis', { error }, 'MapData')
        }
      }, 300)
    },
    [companyFilter]
  )

  /**
   * Carrega dados iniciais (veículos, rotas, alertas)
   */
  const loadInitialData = useCallback(
    async (signal?: AbortSignal, map?: google.maps.Map) => {
      try {
        debug('Carregando dados iniciais com filtros', { company: companyFilter }, 'MapData')

        // Carregar veículos
        const vehicles = await loadVehicles(companyFilter || undefined)

        if (signal?.aborted) return

        // Normalizar coordenadas dos veículos
        const normalizedVehicles = vehicles.map((v: Veiculo) => {
          if (v.lat !== null && v.lng !== null && isValidCoordinate(v.lat, v.lng)) {
            const normalized = normalizeCoordinate(v.lat, v.lng)
            if (normalized) {
              return { ...v, lat: normalized.lat, lng: normalized.lng }
            }
          }

          return {
            ...v,
            speed: v.speed !== null && !isNaN(v.speed) ? v.speed : null,
            heading: v.heading !== null && !isNaN(v.heading) ? v.heading : null
          }
        })

        setVeiculos(normalizedVehicles)

        const withCoords = normalizedVehicles.filter(
          (v: Veiculo) => v.lat !== null && v.lng !== null
        ).length
        const withoutCoords = normalizedVehicles.length - withCoords

        debug(`Carregados ${normalizedVehicles.length} veículos ativos`, {
          total: normalizedVehicles.length,
          withCoords,
          withoutCoords
        }, 'MapData')

        if (withCoords === 0 && normalizedVehicles.length > 0) {
          notifySuccess(
            t('common', 'success.noRecentGpsPositions', { count: normalizedVehicles.length }),
            { duration: 5000 }
          )
        }

        // Carregar rotas
        if (map) {
          await loadVisibleRoutes(map)
        }

        // Inicializar alertas vazios (serão carregados via realtime)
        setAlerts([])

        // Carregar paradas das rotas
        const routeIds = routes?.map((r: RoutePolyline) => r.route_id) || []
        if (routeIds.length > 0) {
          const { data: stopsData, error: stopsError } = await supabase
            .from('v_route_stops')
            .select(
              `id, rota_id, stop_order, stop_name, latitude, longitude, route_name`
            )
            .in('rota_id', routeIds)
            .order('rota_id', { ascending: true })
            .order('stop_order', { ascending: true })

          if (!stopsError && stopsData) {
            setRouteStops(
              (stopsData || []).map((stop: GfRoutePlanRow) => ({
                id: stop.id || '',
                route_id: stop.rota_id || '',
                route_name: stop.route_name || '',
                seq: stop.stop_order || 0,
                name: stop.stop_name || '',
                lat: stop.latitude || 0,
                lng: stop.longitude || 0,
                radius_m: 50
              }))
            )
          }
        }
      } catch (error) {
        logError('Erro ao carregar dados iniciais', { error }, 'MapData')
      }
    },
    [companyFilter, routes, loadVisibleRoutes]
  )

  return {
    veiculos,
    routes,
    alerts,
    routeStops,
    setVeiculos,
    setRoutes,
    setAlerts,
    setRouteStops,
    loadInitialData,
    loadVisibleRoutes
  }
}

