import { NextRequest, NextResponse } from 'next/server';

import { requireAuth } from '@/lib/api-auth';
import { logError } from '@/lib/logger';
import { getSupabaseAdmin } from '@/lib/supabase-client';

// GET /api/empresa/cancellations - Não-embarques dos funcionários
export async function GET(request: NextRequest) {
    // Verificar autenticação (empresa ou admin)
    const authError = await requireAuth(request, ['admin', 'gestor_empresa', 'gestor_empresa', 'gestor_transportadora', 'gestor_empresa'])
    if (authError) return authError

    try {
        const supabase = getSupabaseAdmin();
        const { searchParams } = new URL(request.url);

        const passengerId = searchParams.get('passageiro_id');
        const date = searchParams.get('date');
        const reason = searchParams.get('reason');
        const limit = parseInt(searchParams.get('limit') || '100');

        let query = supabase
            .from('passageiro_cancellations')
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
                home_office: data?.filter((c: { reason?: string }) => c.reason === 'home_office').length || 0,
                folga: data?.filter((c: { reason?: string }) => c.reason === 'folga').length || 0,
                ferias: data?.filter((c: { reason?: string }) => c.reason === 'ferias').length || 0,
                medico: data?.filter((c: { reason?: string }) => c.reason === 'medico').length || 0,
                outro: data?.filter((c: { reason?: string }) => c.reason === 'outro').length || 0,
            },
            pausedNotifications: data?.filter((c: { pause_notifications?: boolean }) => c.pause_notifications).length || 0,
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
