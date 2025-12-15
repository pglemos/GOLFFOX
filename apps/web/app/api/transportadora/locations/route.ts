import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-server';

// GET /api/transportadora/locations - Rastreamento GPS em tempo real
export async function GET(request: NextRequest) {
    try {
        const supabase = getSupabaseAdmin();
        const { searchParams } = new URL(request.url);

        const driverId = searchParams.get('driver_id');
        const tripId = searchParams.get('trip_id');
        const lastOnly = searchParams.get('last_only') === 'true';
        const since = searchParams.get('since'); // ISO timestamp

        if (lastOnly) {
            // Buscar última localização de cada motorista ativo
            const { data, error } = await supabase
                .from('driver_locations' as any)
                .select(`
                    *,
                    driver:users!driver_id(id, name, phone),
                    trip:trips(id, status, route:routes(name))
                `)
                .order('recorded_at', { ascending: false });

            if (error) {
                return NextResponse.json({ error: error.message }, { status: 500 });
            }

            // Agrupar por motorista e pegar apenas a última
            const latestByDriver = new Map();
            data?.forEach((location: any) => {
                if (!latestByDriver.has(location.driver_id)) {
                    latestByDriver.set(location.driver_id, location);
                }
            });

            return NextResponse.json({
                data: Array.from(latestByDriver.values()),
                count: latestByDriver.size
            });
        }

        // Busca com filtros
        let query = supabase
            .from('driver_locations' as any)
            .select(`
                *,
                driver:users!driver_id(id, name)
            `)
            .order('recorded_at', { ascending: false })
            .limit(500);

        if (driverId) {
            query = query.eq('driver_id', driverId);
        }

        if (tripId) {
            query = query.eq('trip_id', tripId);
        }

        if (since) {
            query = query.gte('recorded_at', since);
        }

        const { data, error } = await query;

        if (error) {
            console.error('Error fetching locations:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ data });
    } catch (error) {
        console.error('Locations API error:', error);
        return NextResponse.json(
            { error: 'Erro ao buscar localizações' },
            { status: 500 }
        );
    }
}
