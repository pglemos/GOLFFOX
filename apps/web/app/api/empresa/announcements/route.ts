import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase-server';

// GET /api/empresa/announcements - Listar avisos
export async function GET(request: NextRequest) {
    try {
        const supabase = createServerClient();
        const { searchParams } = new URL(request.url);

        const companyId = searchParams.get('company_id');
        const type = searchParams.get('type');
        const activeOnly = searchParams.get('active') !== 'false';
        const limit = parseInt(searchParams.get('limit') || '50');

        let query = supabase
            .from('announcements')
            .select('*')
            .order('published_at', { ascending: false })
            .limit(limit);

        if (companyId) {
            query = query.eq('company_id', companyId);
        }

        if (type) {
            query = query.eq('type', type);
        }

        if (activeOnly) {
            query = query.eq('is_active', true);
        }

        const { data, error } = await query;

        if (error) {
            console.error('Error fetching announcements:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ data });
    } catch (error) {
        console.error('Announcements API error:', error);
        return NextResponse.json(
            { error: 'Erro ao buscar avisos' },
            { status: 500 }
        );
    }
}

// POST /api/empresa/announcements - Criar aviso
export async function POST(request: NextRequest) {
    try {
        const supabase = createServerClient();
        const body = await request.json();
        const { company_id, carrier_id, title, message, type = 'info', target_role = 'all', expires_at } = body;

        if (!title || !message) {
            return NextResponse.json(
                { error: 'title e message são obrigatórios' },
                { status: 400 }
            );
        }

        const { data, error } = await supabase
            .from('announcements')
            .insert({
                company_id,
                carrier_id,
                title,
                message,
                type,
                target_role,
                expires_at,
                is_active: true,
                published_at: new Date().toISOString(),
            })
            .select()
            .single();

        if (error) {
            console.error('Error creating announcement:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ data });
    } catch (error) {
        console.error('Announcements POST API error:', error);
        return NextResponse.json(
            { error: 'Erro ao criar aviso' },
            { status: 500 }
        );
    }
}

// PUT /api/empresa/announcements - Atualizar aviso
export async function PUT(request: NextRequest) {
    try {
        const supabase = createServerClient();
        const body = await request.json();
        const { id, ...updates } = body;

        if (!id) {
            return NextResponse.json(
                { error: 'ID é obrigatório' },
                { status: 400 }
            );
        }

        const { data, error } = await supabase
            .from('announcements')
            .update(updates)
            .eq('id', id)
            .select()
            .single();

        if (error) {
            console.error('Error updating announcement:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ data });
    } catch (error) {
        console.error('Announcements PUT API error:', error);
        return NextResponse.json(
            { error: 'Erro ao atualizar aviso' },
            { status: 500 }
        );
    }
}

// DELETE /api/empresa/announcements - Desativar aviso
export async function DELETE(request: NextRequest) {
    try {
        const supabase = createServerClient();
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json(
                { error: 'ID é obrigatório' },
                { status: 400 }
            );
        }

        const { error } = await supabase
            .from('announcements')
            .update({ is_active: false })
            .eq('id', id);

        if (error) {
            console.error('Error deleting announcement:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Announcements DELETE API error:', error);
        return NextResponse.json(
            { error: 'Erro ao remover aviso' },
            { status: 500 }
        );
    }
}
