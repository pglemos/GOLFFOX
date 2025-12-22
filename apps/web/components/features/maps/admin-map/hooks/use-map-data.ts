/**
 * Hook para carregamento de dados do mapa
 * Gerencia veículos, rotas, alertas e outras entidades do mapa
 */

import { useState, useCallback, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { loadVehicles } from '@/lib/services/map/map-services/vehicle-loader'
import { isValidCoordinate, normalizeCoordinate } from '@/lib/coordinate-validator'
import { debug, warn, error as logError } from '@/lib/logger'
import { notifySuccess } from '@/lib/toast'
import { t } from '@/lib/i18n'
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
            .from('routes')
            .select(`id, name, company_id`)
            .eq('is_active', true)
            .limit(LIMIT)

          if (currentCompany && currentCompany !== 'null' && currentCompany !== '') {
            routesQuery = routesQuery.eq('company_id', currentCompany)
          }

          const { data: routesData, error: routesError } = await routesQuery

          if (!routesError && routesData && routesData.length > 0) {
            const routeIds = routesData.map((r: SupabaseRoute) => r.id)

            const { data: stopsData } = await supabase
              .from('route_stops')
              .select('route_id, lat, lng, seq, name')
              .in('route_id', routeIds)
              .order('route_id')
              .order('seq')

            // Agrupar stops por route_id
            const stopsByRoute = new Map()
            if (stopsData) {
              stopsData.forEach((stop: any) => {
                if (!stopsByRoute.has(stop.route_id)) {
                  stopsByRoute.set(stop.route_id, [])
                }
                stopsByRoute.get(stop.route_id).push({
                  lat: stop.lat,
                  lng: stop.lng,
                  order: stop.seq
                })
              })
            }

            const formattedRoutes = (routesData || []).map((r: SupabaseRoute) => ({
              route_id: r.id,
              route_name: r.name,
              company_id: r.company_id,
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
            .from('route_stops')
            .select(
              `id, route_id, seq, name, lat, lng, radius_m, routes!inner(name)`
            )
            .in('route_id', routeIds)
            .order('route_id', { ascending: true })
            .order('seq', { ascending: true })

          if (!stopsError && stopsData) {
            setRouteStops(
              stopsData.map((stop: SupabaseStopWithRoute) => ({
                id: stop.id,
                route_id: stop.route_id,
                route_name: stop.routes?.name || '',
                seq: stop.seq,
                name: stop.name,
                lat: stop.lat,
                lng: stop.lng,
                radius_m: stop.radius_m || 50
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

