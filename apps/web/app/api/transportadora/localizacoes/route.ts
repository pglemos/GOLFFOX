import { NextRequest, NextResponse } from 'next/server';

import { requireAuth } from '@/lib/api-auth';
import { logError } from '@/lib/logger';
import { getSupabaseAdmin } from '@/lib/supabase-client';

// GET /api/transportadora/localizacoes - Rastreamento GPS em tempo real
export async function GET(request: NextRequest) {
    // Verificar autenticação (transportadora)
    const authError = await requireAuth(request, ['admin', 'gestor_transportadora', 'gestor_empresa', 'gestor_transportadora'])
    if (authError) return authError

    try {
        const supabase = getSupabaseAdmin();
        const { searchParams } = new URL(request.url);

        const driverId = searchParams.get('motorista_id');
        const tripId = searchParams.get('trip_id');
        const lastOnly = searchParams.get('last_only') === 'true';
        const since = searchParams.get('since'); // ISO timestamp

        if (lastOnly) {
            // Buscar última localização de cada motorista ativo
            const { data, error } = await supabase
                .from('motorista_positions')
                .select(`
                    *,
                    motorista:users!motorista_id(id, name, phone),
                    trip:trips(id, status, route:routes(name))
                `)
                .order('recorded_at', { ascending: false });

            if (error) {
                return NextResponse.json({ error: error.message }, { status: 500 });
            }

            // Agrupar por motorista e pegar apenas a última
            const latestByDriver = new Map<string, unknown>();
            data?.forEach((location: { motorista_id: string; [key: string]: unknown }) => {
                if (!latestByDriver.has(location.motorista_id)) {
                    latestByDriver.set(location.motorista_id, location);
                }
            });

            return NextResponse.json({
                data: Array.from(latestByDriver.values()),
                count: latestByDriver.size
            });
        }

        // Busca com filtros
        let query = supabase
            .from('motorista_positions')
            .select(`
                *,
                motorista:users!motorista_id(id, name)
            `)
            .order('recorded_at', { ascending: false })
            .limit(500);

        if (driverId) {
            query = query.eq('motorista_id', driverId);
        }

        if (tripId) {
            query = query.eq('trip_id', tripId);
        }

        if (since) {
            query = query.gte('recorded_at', since);
        }

        const { data, error } = await query;

        if (error) {
            logError('Error fetching locations', { error }, 'LocationsAPI');
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ data });
    } catch (error) {
        logError('Locations API error', { error }, 'LocationsAPI');
        return NextResponse.json(
            { error: 'Erro ao buscar localizações' },
            { status: 500 }
        );
    }
}
