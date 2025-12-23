import { NextRequest, NextResponse } from 'next/server';

import { requireAuth } from '@/lib/api-auth';
import { logError } from '@/lib/logger';
import { getSupabaseAdmin } from '@/lib/supabase-client';

// GET /api/transportadora/checkins - Listar check-ins e check-outs das viagens
export async function GET(request: NextRequest) {
    // Verificar autenticação (transportadora)
    const authError = await requireAuth(request, ['admin', 'gestor_transportadora', 'gestor_empresa', 'gestor_transportadora'])
    if (authError) return authError

    try {
        const supabase = getSupabaseAdmin();
        const { searchParams } = new URL(request.url);

        const tripId = searchParams.get('trip_id');
        const driverId = searchParams.get('motorista_id');
        const date = searchParams.get('date');
        const type = searchParams.get('type'); // 'boarding' ou 'dropoff'
        const limit = parseInt(searchParams.get('limit') || '100');

        let query = supabase
            .from('passageiro_checkins' as any)
            .select(`
                *,
                passageiro:users!passageiro_id(id, name, email, phone),
                motorista:users!motorista_id(id, name),
                trip:trips(id, scheduled_date, route:routes(name))
            `)
            .order('created_at', { ascending: false })
            .limit(limit);

        if (tripId) {
            query = query.eq('trip_id', tripId);
        }

        if (driverId) {
            query = query.eq('motorista_id', driverId);
        }

        if (date) {
            const startOfDay = `${date}T00:00:00`;
            const endOfDay = `${date}T23:59:59`;
            query = query.gte('created_at', startOfDay).lte('created_at', endOfDay);
        }

        if (type) {
            query = query.eq('type', type);
        }

        const { data, error } = await query;

        if (error) {
            logError('Error fetching checkins', { error }, 'CheckinsAPI');
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        // Calcular estatísticas
        const stats = {
            total: data?.length || 0,
            boardings: data?.filter((c: any) => c.type === 'boarding').length || 0,
            dropoffs: data?.filter((c: any) => c.type === 'dropoff').length || 0,
            byMethod: {
                qr: data?.filter((c: any) => c.method === 'qr').length || 0,
                nfc: data?.filter((c: any) => c.method === 'nfc').length || 0,
                manual: data?.filter((c: any) => c.method === 'manual').length || 0,
            },
        };

        return NextResponse.json({ data, stats });
    } catch (error) {
        logError('Checkins API error', { error }, 'CheckinsAPI');
        return NextResponse.json(
            { error: 'Erro ao buscar check-ins' },
            { status: 500 }
        );
    }
}
