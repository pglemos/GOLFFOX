import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-client';
import { logError } from '@/lib/logger';
import { requireAuth } from '@/lib/api-auth';

// GET /api/empresa/cancellations - Não-embarques dos funcionários
export async function GET(request: NextRequest) {
    // Verificar autenticação (empresa ou admin)
    const authError = await requireAuth(request, ['admin', 'gestor_empresa', 'empresa', 'gestor_transportadora', 'operador'])
    if (authError) return authError

    try {
        const supabase = getSupabaseAdmin();
        const { searchParams } = new URL(request.url);

        const passengerId = searchParams.get('passageiro_id');
        const date = searchParams.get('date');
        const reason = searchParams.get('reason');
        const limit = parseInt(searchParams.get('limit') || '100');

        let query = supabase
            .from('passageiro_cancellations' as any)
            .select(`
                *,
                passageiro:users!passageiro_id(id, name, email, phone)
            `)
            .order('created_at', { ascending: false })
            .limit(limit);

        if (passengerId) {
            query = query.eq('passageiro_id', passengerId);
        }

        if (date) {
            query = query.eq('scheduled_date', date);
        }

        if (reason) {
            query = query.eq('reason', reason);
        }

        const { data, error } = await query;

        if (error) {
            logError('Error fetching cancellations', { error }, 'CancellationsAPI');
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        // Estatísticas por motivo
        const stats = {
            total: data?.length || 0,
            byReason: {
                home_office: data?.filter((c: any) => c.reason === 'home_office').length || 0,
                folga: data?.filter((c: any) => c.reason === 'folga').length || 0,
                ferias: data?.filter((c: any) => c.reason === 'ferias').length || 0,
                medico: data?.filter((c: any) => c.reason === 'medico').length || 0,
                outro: data?.filter((c: any) => c.reason === 'outro').length || 0,
            },
            pausedNotifications: data?.filter((c: any) => c.pause_notifications).length || 0,
        };

        return NextResponse.json({ data, stats });
    } catch (error) {
        logError('Cancellations API error', { error }, 'CancellationsAPI');
        return NextResponse.json(
            { error: 'Erro ao buscar cancelamentos' },
            { status: 500 }
        );
    }
}
