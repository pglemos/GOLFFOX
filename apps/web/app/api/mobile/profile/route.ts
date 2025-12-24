import { NextRequest, NextResponse } from 'next/server'

import { requireAuth } from '@/lib/api-auth'
import { logError } from '@/lib/logger'
import { getSupabaseAdmin } from '@/lib/supabase-client'

// API para buscar perfil do usuário autenticado (bypassa RLS)
// GET /api/mobile/profile?userId=xxx

const corsHeaders = {
    'Access-Control-Allow-Origin': '*', // Permitir qualquer origem (ou restrinja se necessário)
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}

export async function OPTIONS() {
    return NextResponse.json({}, { headers: corsHeaders })
}

export async function GET(request: NextRequest) {
    // Verificar autenticação (qualquer usuário autenticado pode ver seu próprio perfil)
    const authError = await requireAuth(request)
    if (authError) return authError

    try {
        const { searchParams } = new URL(request.url)
        const userId = searchParams.get('userId')

        if (!userId) {
            return NextResponse.json({ error: 'userId é obrigatório' }, { status: 400, headers: corsHeaders })
        }

        const supabase = getSupabaseAdmin()

        const { data, error } = await supabase
            .from('users')
            .select('id, email, role, name, company_id, transportadora_id, phone, cpf')
            .eq('id', userId)
            .maybeSingle()

        if (error) {
            logError('Erro ao buscar perfil', { error, userId }, 'MobileProfileAPI')
            return NextResponse.json({ error: error.message }, { status: 500, headers: corsHeaders })
        }

        if (!data) {
            return NextResponse.json({ error: 'Perfil não encontrado' }, { status: 404, headers: corsHeaders })
        }

        return NextResponse.json(data, { headers: corsHeaders })
    } catch (error: unknown) {
        logError('Exception ao buscar perfil', { error, userId: request.nextUrl.searchParams.get('userId') }, 'MobileProfileAPI')
        return NextResponse.json({ error: error.message }, { status: 500, headers: corsHeaders })
    }
}
