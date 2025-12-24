import { NextRequest, NextResponse } from 'next/server'

import { requireAuth } from '@/lib/api-auth';
import { logError } from '@/lib/logger';
import { getSupabaseAdmin } from '@/lib/supabase-client';

// GET /api/transportadora/avaliacoes - Avaliações NPS das viagens
export async function GET(request: NextRequest) {
    // Verificar autenticação (transportadora)
    const authError = await requireAuth(request, ['admin', 'gestor_transportadora', 'gestor_empresa', 'gestor_transportadora'])
    if (authError) return authError

    try {
        const supabase = getSupabaseAdmin();
        const { searchParams } = new URL(request.url);

        const driverId = searchParams.get('motorista_id');
        const tripId = searchParams.get('trip_id');
        const minScore = searchParams.get('min_score');
        const maxScore = searchParams.get('max_score');
        const limit = parseInt(searchParams.get('limit') || '100');

        let query = supabase
            .from('trip_evaluations')
            .select(`
                *,
                passageiro:users!passageiro_id(id, name, email),
                motorista:users!motorista_id(id, name),
                trip:trips(id, scheduled_date, route:routes(name))
            `)
            .order('created_at', { ascending: false })
            .limit(limit);

        if (driverId) {
            query = query.eq('motorista_id', driverId);
        }

        if (tripId) {
            query = query.eq('trip_id', tripId);
        }

        if (minScore) {
            query = query.gte('nps_score', parseInt(minScore));
        }

        if (maxScore) {
            query = query.lte('nps_score', parseInt(maxScore));
        }

        const { data, error } = await query;

        if (error) {
            logError('Error fetching evaluations', { error }, 'TransportadoraEvaluationsAPI');
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        // Calcular NPS e estatísticas
        const scores: number[] = data?.map((e: { nps_score?: number }) => e.nps_score ?? 0).filter(s => s > 0) || [];
        const totalResponses = scores.length;

        const promoters = scores.filter((s: number) => s >= 9).length;
        const passives = scores.filter((s: number) => s >= 7 && s <= 8).length;
        const detractors = scores.filter((s: number) => s <= 6).length;

        const nps = totalResponses > 0
            ? Math.round(((promoters - detractors) / totalResponses) * 100)
            : 0;

        const avgScore = totalResponses > 0
            ? (scores.reduce((a, b) => a + b, 0) / totalResponses).toFixed(1)
            : 0;

        const stats = {
            totalResponses,
            avgScore: parseFloat(avgScore as string),
            nps,
            promoters,
            passives,
            detractors,
            distribution: Array.from({ length: 11 }, (_, i) => ({
                score: i,
                count: scores.filter((s: number) => s === i).length,
            })),
        };

        return NextResponse.json({ data, stats });
    } catch (error) {
        logError('Evaluations API error', { error }, 'EvaluationsAPI');
        return NextResponse.json(
            { error: 'Erro ao buscar avaliações' },
            { status: 500 }
        );
    }
}
