import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-client';
import { logError } from '@/lib/logger';
import { requireAuth } from '@/lib/api-auth';

// GET /api/transportadora/checklists - Listar checklists dos motoristas
export async function GET(request: NextRequest) {
    // Verificar autenticação (transportadora)
    const authError = await requireAuth(request, ['admin', 'transportadora', 'operador', 'carrier'])
    if (authError) return authError

    try {
        const supabase = getSupabaseAdmin();
        const { searchParams } = new URL(request.url);

        const driverId = searchParams.get('driver_id');
        const vehicleId = searchParams.get('vehicle_id');
        const status = searchParams.get('status');
        const date = searchParams.get('date');
        const limit = parseInt(searchParams.get('limit') || '50');

        let query = supabase
            .from('vehicle_checklists' as any)
            .select(`
                *,
                driver:users!driver_id(id, name, phone),
                vehicle:vehicles(id, plate, model),
                trip:trips(id, scheduled_date, route:routes(name))
            `)
            .order('created_at', { ascending: false })
            .limit(limit);

        if (driverId) {
            query = query.eq('driver_id', driverId);
        }

        if (vehicleId) {
            query = query.eq('vehicle_id', vehicleId);
        }

        if (status) {
            query = query.eq('status', status);
        }

        if (date) {
            const startOfDay = `${date}T00:00:00`;
            const endOfDay = `${date}T23:59:59`;
            query = query.gte('created_at', startOfDay).lte('created_at', endOfDay);
        }

        const { data, error } = await query;

        if (error) {
            logError('Error fetching checklists', { error }, 'ChecklistsAPI');
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        // Estatísticas
        const stats = {
            total: data?.length || 0,
            pending: data?.filter((c: any) => c.status === 'pending').length || 0,
            approved: data?.filter((c: any) => c.status === 'approved').length || 0,
            rejected: data?.filter((c: any) => c.status === 'rejected').length || 0,
            incomplete: data?.filter((c: any) => c.status === 'incomplete').length || 0,
        };

        return NextResponse.json({ data, stats });
    } catch (error) {
        logError('Checklists API error', { error }, 'ChecklistsAPI');
        return NextResponse.json(
            { error: 'Erro ao buscar checklists' },
            { status: 500 }
        );
    }
}

// PUT /api/transportadora/checklists - Aprovar/rejeitar checklist
export async function PUT(request: NextRequest) {
    // Verificar autenticação (transportadora)
    const authError = await requireAuth(request, ['admin', 'transportadora', 'operador', 'carrier'])
    if (authError) return authError

    try {
        const supabase = getSupabaseAdmin();
        const body = await request.json();
        const { id, status, reviewed_by } = body;

        if (!id || !status) {
            return NextResponse.json(
                { error: 'ID e status são obrigatórios' },
                { status: 400 }
            );
        }

        const { data, error } = await supabase
            .from('vehicle_checklists' as any)
            .update({
                status,
                reviewed_by,
                reviewed_at: new Date().toISOString(),
            } as any)
            .eq('id', id)
            .select()
            .single();

        if (error) {
            logError('Error updating checklist', { error }, 'ChecklistsAPI');
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ data });
    } catch (error) {
        logError('Checklists PUT API error', { error }, 'ChecklistsAPI');
        return NextResponse.json(
            { error: 'Erro ao atualizar checklist' },
            { status: 500 }
        );
    }
}
