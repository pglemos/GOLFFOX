import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-client';
import { logError } from '@/lib/logger';
import { requireAuth } from '@/lib/api-auth';

// GET /api/empresa/announcements - Listar avisos
export async function GET(request: NextRequest) {
    // Verificar autenticação (empresa ou admin)
    const authError = await requireAuth(request, ['admin', 'gestor_empresa', 'empresa', 'operador'])
    if (authError) return authError

    try {
        const supabase = getSupabaseAdmin();
        const { searchParams } = new URL(request.url);

        const companyId = searchParams.get('company_id');
        const type = searchParams.get('type');
        const activeOnly = searchParams.get('active') !== 'false';
        const limit = parseInt(searchParams.get('limit') || '50');

        let query = (supabase as any)
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
            logError('Error fetching announcements', { error, companyId }, 'AnnouncementsAPI');
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ data });
    } catch (error) {
        const errorCompanyId = request.nextUrl.searchParams.get('company_id');
        logError('Announcements API error', { error, companyId: errorCompanyId }, 'AnnouncementsAPI');
        return NextResponse.json(
            { error: 'Erro ao buscar avisos' },
            { status: 500 }
        );
    }
}

// POST /api/empresa/announcements - Criar aviso
export async function POST(request: NextRequest) {
    // Verificar autenticação (empresa ou admin)
    const authError = await requireAuth(request, ['admin', 'gestor_empresa', 'empresa', 'operador'])
    if (authError) return authError

    try {
        const supabase = getSupabaseAdmin();
        const body = await request.json();
        const { company_id, transportadora_id, title, message, type = 'info', target_role = 'all', expires_at } = body;

        if (!title || !message) {
            return NextResponse.json(
                { error: 'title e message são obrigatórios' },
                { status: 400 }
            );
        }

        const { data, error } = await (supabase as any)
            .from('announcements')
            .insert({
                company_id,
                transportadora_id,
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
            logError('Error creating announcement', { error, companyId: company_id }, 'AnnouncementsAPI');
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ data });
    } catch (error) {
        logError('Announcements POST API error', { error }, 'AnnouncementsAPI');
        return NextResponse.json(
            { error: 'Erro ao criar aviso' },
            { status: 500 }
        );
    }
}

// PUT /api/empresa/announcements - Atualizar aviso
export async function PUT(request: NextRequest) {
    // Verificar autenticação (empresa ou admin)
    const authError = await requireAuth(request, ['admin', 'gestor_empresa', 'empresa', 'operador'])
    if (authError) return authError

    try {
        const supabase = getSupabaseAdmin();
        const body = await request.json();
        const { id, ...updates } = body;

        if (!id) {
            return NextResponse.json(
                { error: 'ID é obrigatório' },
                { status: 400 }
            );
        }

        const { data, error } = await (supabase as any)
            .from('announcements')
            .update(updates)
            .eq('id', id)
            .select()
            .single();

        if (error) {
            logError('Error updating announcement', { error, announcementId: id }, 'AnnouncementsAPI');
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ data });
    } catch (error) {
        logError('Announcements PUT API error', { error }, 'AnnouncementsAPI');
        return NextResponse.json(
            { error: 'Erro ao atualizar aviso' },
            { status: 500 }
        );
    }
}

// DELETE /api/empresa/announcements - Desativar aviso
export async function DELETE(request: NextRequest) {
    // Verificar autenticação (empresa ou admin)
    const authError = await requireAuth(request, ['admin', 'gestor_empresa', 'empresa', 'operador'])
    if (authError) return authError

    try {
        const supabase = getSupabaseAdmin();
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json(
                { error: 'ID é obrigatório' },
                { status: 400 }
            );
        }

        const { error } = await (supabase as any)
            .from('announcements')
            .update({ is_active: false })
            .eq('id', id);

        if (error) {
            logError('Error deleting announcement', { error }, 'AnnouncementsAPI');
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        logError('Announcements DELETE API error', { error }, 'AnnouncementsAPI');
        return NextResponse.json(
            { error: 'Erro ao remover aviso' },
            { status: 500 }
        );
    }
}
