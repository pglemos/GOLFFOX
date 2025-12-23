import { isValidCoordinate, normalizeCoordinate } from "@/lib/coordinate-validator"
import { supabase } from "@/lib/supabase"
import { Veiculo, RoutePolyline, RouteStop } from "@/types/map"

export class MapDataService {
    /**
     * Carrega rotas visíveis com base no viewport (Otimizado)
     */
    static async listVisibleRoutes(companyId?: string, limit = 50): Promise<RoutePolyline[]> {
        let query = supabase
            .from('routes')
            .select('id, name, company_id')
            .eq('is_active', true)
            .limit(limit)

        if (companyId && companyId !== 'null') {
            query = query.eq('company_id', companyId)
        }

        const { data: routesData, error } = await query
        if (error || !routesData) return []

        const routeIds = routesData.map(r => r.id)
        const { data: stopsData } = await supabase
            .from('route_stops')
            .select('route_id, lat, lng, seq, name')
            .in('route_id', routeIds)
            .order('seq')

        const stopsByRoute = new Map<string, any[]>()
        if (stopsData) {
            stopsData.forEach((stop: any) => {
                if (!stopsByRoute.has(stop.route_id)) stopsByRoute.set(stop.route_id, [])
                stopsByRoute.get(stop.route_id)?.push({
                    lat: stop.lat,
                    lng: stop.lng,
                    order: stop.seq
                })
            })
        }

        return routesData.map(r => ({
            route_id: r.id,
            route_name: r.name,
            company_id: r.company_id,
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
            .from('route_stops')
            .select('id, route_id, seq, name, lat, lng, radius_m, routes!inner(name)')
            .in('route_id', routeIds)
            .order('seq')

        if (error || !data) return []
        return data.map(stop => ({
            id: stop.id,
            route_id: stop.route_id,
            route_name: (stop.routes as any)?.name || '',
            seq: stop.seq,
            name: stop.name,
            lat: stop.lat,
            lng: stop.lng,
            radius_m: stop.radius_m || 50
        }))
    }
}
