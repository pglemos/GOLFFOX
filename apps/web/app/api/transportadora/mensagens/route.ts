import { NextRequest, NextResponse } from 'next/server';

import { requireAuth } from '@/lib/api-auth';
import { logError } from '@/lib/logger';
import { getSupabaseAdmin } from '@/lib/supabase-client';

// GET /api/transportadora/mensagens - Listar mensagens dos motoristas
export async function GET(request: NextRequest) {
    // Verificar autenticação (transportadora)
    const authError = await requireAuth(request, ['admin', 'gestor_transportadora', 'gestor_empresa', 'gestor_transportadora'])
    if (authError) return authError

    try {
        const supabase = getSupabaseAdmin();
        const { searchParams } = new URL(request.url);

        const driverId = searchParams.get('motorista_id');
        const carrierId = searchParams.get('transportadora_id');
        const isEmergency = searchParams.get('emergency') === 'true';
        const unreadOnly = searchParams.get('unread') === 'true';
        const limit = parseInt(searchParams.get('limit') || '100');

        let query = supabase
            .from('motorista_messages' as any)
            .select(`
                *,
                motorista:users!motorista_id(id, name, phone)
            `)
            .order('created_at', { ascending: false })
            .limit(limit);

        if (driverId) {
            query = query.eq('motorista_id', driverId);
        }

        if (carrierId) {
            query = query.eq('transportadora_id', carrierId);
        }

        if (isEmergency) {
            query = query.eq('is_emergency', true);
        }

        if (unreadOnly) {
            query = query.is('read_at', null);
        }

        const { data, error } = await query;

        if (error) {
            logError('Error fetching messages', { error }, 'MessagesAPI');
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        // Estatísticas
        const stats = {
            total: data?.length || 0,
            unread: data?.filter((m: any) => !m.read_at).length || 0,
            emergencies: data?.filter((m: any) => m.is_emergency).length || 0,
        };

        return NextResponse.json({ data, stats });
    } catch (error) {
        logError('Messages API error', { error }, 'MessagesAPI');
        return NextResponse.json(
            { error: 'Erro ao buscar mensagens' },
            { status: 500 }
        );
    }
}

// POST /api/transportadora/mensagens - Enviar mensagem para motorista
export async function POST(request: NextRequest) {
    // Verificar autenticação (transportadora)
    const authError = await requireAuth(request, ['admin', 'gestor_transportadora', 'gestor_empresa', 'gestor_transportadora'])
    if (authError) return authError

    try {
        const supabase = getSupabaseAdmin();
        const body = await request.json();
        const { motorista_id, transportadora_id, message, message_type = 'text' } = body;

        if (!motorista_id || !message) {
            return NextResponse.json(
                { error: 'motorista_id e message são obrigatórios' },
                { status: 400 }
            );
        }

        const { data, error } = await supabase
            .from('motorista_messages' as any)
            .insert({
                motorista_id,
                transportadora_id,
                sender: 'central',
                message,
                message_type,
                is_emergency: false,
            } as any)
            .select()
            .single();

        if (error) {
            logError('Error sending message', { error }, 'MessagesAPI');
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ data });
    } catch (error) {
        logError('Messages POST API error', { error }, 'MessagesAPI');
        return NextResponse.json(
            { error: 'Erro ao enviar mensagem' },
            { status: 500 }
        );
    }
}

// PUT /api/transportadora/mensagens - Marcar mensagens como lidas
export async function PUT(request: NextRequest) {
    // Verificar autenticação (transportadora)
    const authError = await requireAuth(request, ['admin', 'gestor_transportadora', 'gestor_empresa', 'gestor_transportadora'])
    if (authError) return authError

    try {
        const supabase = getSupabaseAdmin();
        const body = await request.json();
        const { ids } = body; // Array de IDs

        if (!ids || !Array.isArray(ids)) {
            return NextResponse.json(
                { error: 'ids deve ser um array de UUIDs' },
                { status: 400 }
            );
        }

        const { data, error } = await supabase
            .from('motorista_messages' as any)
            .update({ read_at: new Date().toISOString() } as any)
            .in('id', ids)
            .select();

        if (error) {
            logError('Error marking messages as read', { error }, 'MessagesAPI');
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ data, updated: data?.length || 0 });
    } catch (error) {
        logError('Messages PUT API error', { error }, 'MessagesAPI');
        return NextResponse.json(
            { error: 'Erro ao atualizar mensagens' },
            { status: 500 }
        );
    }
}
