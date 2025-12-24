import { NextRequest, NextResponse } from 'next/server';

import { requireAuth } from '@/lib/api-auth';
import { logError } from '@/lib/logger';
import { getSupabaseAdmin } from '@/lib/supabase-client';

// GET /api/empresa/evaluations - Ver avaliações dos funcionários
export async function GET(request: NextRequest) {
    // Verificar autenticação (empresa ou admin)
    const authError = await requireAuth(request, ['admin', 'gestor_empresa', 'gestor_empresa', 'gestor_transportadora', 'gestor_empresa'])
    if (authError) return authError

    try {
        const supabase = getSupabaseAdmin();
        const { searchParams } = new URL(request.url);

        const companyId = searchParams.get('company_id');
        const passengerId = searchParams.get('passageiro_id');
        const limit = parseInt(searchParams.get('limit') || '100');

        let query = supabase
            .from('trip_evaluations')
            .select(`
                *,
                passageiro:users!passageiro_id(id, name, email, company_id),
                motorista:users!motorista_id(id, name),
                trip:trips(id, scheduled_date, route:routes(name))
            `)
            .order('created_at', { ascending: false })
            .limit(limit);

        if (passengerId) {
            query = query.eq('passageiro_id', passengerId);
        }

        const { data, error } = await query;

        if (error) {
            logError('Error fetching evaluations', { error }, 'EvaluationsAPI');
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        // Filtrar por company_id se fornecido
        let filteredData = data;
        if (companyId && data) {
            filteredData = data.filter((e: { passageiro?: { company_id?: string } | null }) => e.passageiro?.company_id === companyId);
        }

        // Calcular estatísticas
        const scores: number[] = filteredData?.map((e: { nps_score?: number }) => e.nps_score ?? 0).filter(s => s > 0) || [];
        const totalResponses = scores.length;

        const promoters = scores.filter((s: number) => s >= 9).length;
        const detractors = scores.filter((s: number) => s <= 6).length;

        const nps = totalResponses > 0
            ? Math.round(((promoters - detractors) / totalResponses) * 100)
            : 0;

        const avgScore = totalResponses > 0
            ? (scores.reduce((a: number, b: number) => a + b, 0) / totalResponses).toFixed(1)
            : 0;

        const stats = {
            totalResponses,
            avgScore: parseFloat(avgScore as string),
            nps,
        };

        return NextResponse.json({ data: filteredData, stats });
    } catch (error) {
        logError('Evaluations API error', { error }, 'EvaluationsAPI');
        return NextResponse.json(
            { error: 'Erro ao buscar avaliações' },
            { status: 500 }
        );
    }
}
