import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-server';

// GET /api/transportadora/messages - Listar mensagens dos motoristas
export async function GET(request: NextRequest) {
    try {
        const supabase = getSupabaseAdmin();
        const { searchParams } = new URL(request.url);

        const driverId = searchParams.get('driver_id');
        const carrierId = searchParams.get('carrier_id');
        const isEmergency = searchParams.get('emergency') === 'true';
        const unreadOnly = searchParams.get('unread') === 'true';
        const limit = parseInt(searchParams.get('limit') || '100');

        let query = supabase
            .from('driver_messages' as any)
            .select(`
                *,
                driver:users!driver_id(id, name, phone)
            `)
            .order('created_at', { ascending: false })
            .limit(limit);

        if (driverId) {
            query = query.eq('driver_id', driverId);
        }

        if (carrierId) {
            query = query.eq('carrier_id', carrierId);
        }

        if (isEmergency) {
            query = query.eq('is_emergency', true);
        }

        if (unreadOnly) {
            query = query.is('read_at', null);
        }

        const { data, error } = await query;

        if (error) {
            console.error('Error fetching messages:', error);
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
        console.error('Messages API error:', error);
        return NextResponse.json(
            { error: 'Erro ao buscar mensagens' },
            { status: 500 }
        );
    }
}

// POST /api/transportadora/messages - Enviar mensagem para motorista
export async function POST(request: NextRequest) {
    try {
        const supabase = getSupabaseAdmin();
        const body = await request.json();
        const { driver_id, carrier_id, message, message_type = 'text' } = body;

        if (!driver_id || !message) {
            return NextResponse.json(
                { error: 'driver_id e message são obrigatórios' },
                { status: 400 }
            );
        }

        const { data, error } = await supabase
            .from('driver_messages' as any)
            .insert({
                driver_id,
                carrier_id,
                sender: 'central',
                message,
                message_type,
                is_emergency: false,
            } as any)
            .select()
            .single();

        if (error) {
            console.error('Error sending message:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ data });
    } catch (error) {
        console.error('Messages POST API error:', error);
        return NextResponse.json(
            { error: 'Erro ao enviar mensagem' },
            { status: 500 }
        );
    }
}

// PUT /api/transportadora/messages - Marcar mensagens como lidas
export async function PUT(request: NextRequest) {
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
            .from('driver_messages' as any)
            .update({ read_at: new Date().toISOString() } as any)
            .in('id', ids)
            .select();

        if (error) {
            console.error('Error marking messages as read:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ data, updated: data?.length || 0 });
    } catch (error) {
        console.error('Messages PUT API error:', error);
        return NextResponse.json(
            { error: 'Erro ao atualizar mensagens' },
            { status: 500 }
        );
    }
}
