import { isValidCoordinate, normalizeCoordinate } from "@/lib/coordinate-validator"
import { supabase } from "@/lib/supabase"
import { Veiculo, RoutePolyline, RouteStop } from "@/types/map"

export class MapDataService {
    /**
     * Carrega rotas visíveis com base no viewport (Otimizado)
     */
    static async listVisibleRoutes(companyId?: string, limit = 50): Promise<RoutePolyline[]> {
        let query = supabase
            .from('rotas')
            .select('id, name, empresa_id')
            .eq('is_active', true)
            .limit(limit)

        if (companyId && companyId !== 'null') {
            query = query.eq('empresa_id', companyId)
        }

        const { data: routesData, error } = await query
        if (error || !routesData) return []

        const routeIds = routesData.map(r => r.id)
        const { data: stopsData } = await supabase
            .from('gf_route_plan')
            .select('rota_id, latitude, longitude, stop_order, stop_name')
            .in('rota_id', routeIds)
            .order('stop_order')

        const stopsByRoute = new Map<string, any[]>()
        if (stopsData) {
            stopsData.forEach((stop: any) => {
                if (!stopsByRoute.has(stop.rota_id)) stopsByRoute.set(stop.rota_id, [])
                stopsByRoute.get(stop.rota_id)?.push({
                    lat: stop.latitude,
                    lng: stop.longitude,
                    order: stop.stop_order
                })
            })
        }

        return routesData.map(r => ({
            route_id: r.id,
            route_name: r.name,
            company_id: r.empresa_id,
            polyline_points: stopsByRoute.get(r.id) || [],
            stops_count: stopsByRoute.get(r.id)?.length || 0
        }))
    }

    /**
     * Carrega pontos de parada para as rotas ativas
     */
    static async listRouteStops(routeIds: string[]): Promise<RouteStop[]> {
        if (routeIds.length === 0) return []
        const { data, error } = await supabase
            .from('v_route_stops')
            .select('id, rota_id, stop_order, stop_name, latitude, longitude, route_name')
            .in('rota_id', routeIds)
            .order('stop_order')

        if (error || !data) return []
        return data.map(stop => ({
            id: stop.id || '',
            route_id: stop.rota_id || '',
            route_name: stop.route_name || '',
            seq: stop.stop_order || 0,
            name: stop.stop_name || '',
            lat: stop.latitude || 0,
            lng: stop.longitude || 0,
            radius_m: 50 // Valor padrão, pois não está na view
        }))
    }
}
