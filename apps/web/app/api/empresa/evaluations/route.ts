import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-client';
import { logError } from '@/lib/logger';
import { requireAuth } from '@/lib/api-auth';

// GET /api/empresa/evaluations - Ver avaliações dos funcionários
export async function GET(request: NextRequest) {
    // Verificar autenticação (empresa ou admin)
    const authError = await requireAuth(request, ['admin', 'empresa', 'operador'])
    if (authError) return authError

    try {
        const supabase = getSupabaseAdmin();
        const { searchParams } = new URL(request.url);

        const companyId = searchParams.get('company_id');
        const passengerId = searchParams.get('passenger_id');
        const limit = parseInt(searchParams.get('limit') || '100');

        let query = supabase
            .from('trip_evaluations' as any)
            .select(`
                *,
                passenger:users!passenger_id(id, name, email, company_id),
                driver:users!driver_id(id, name),
                trip:trips(id, scheduled_date, route:routes(name))
            `)
            .order('created_at', { ascending: false })
            .limit(limit);

        if (passengerId) {
            query = query.eq('passenger_id', passengerId);
        }

        const { data, error } = await query;

        if (error) {
            logError('Error fetching evaluations', { error }, 'EvaluationsAPI');
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        // Filtrar por company_id se fornecido
        let filteredData = data;
        if (companyId && data) {
            filteredData = data.filter((e: any) => (e.passenger as any)?.company_id === companyId);
        }

        // Calcular estatísticas
        const scores: number[] = filteredData?.map((e: any) => e.nps_score as number) || [];
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
