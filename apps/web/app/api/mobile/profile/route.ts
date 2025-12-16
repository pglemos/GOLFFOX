import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// API para buscar perfil do usuário autenticado (bypassa RLS)
// GET /api/mobile/profile?userId=xxx

function getSupabaseAdmin() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!url || !serviceKey) {
        throw new Error('Supabase não configurado')
    }
    return createClient(url, serviceKey)
}

const corsHeaders = {
    'Access-Control-Allow-Origin': '*', // Permitir qualquer origem (ou restrinja se necessário)
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}

export async function OPTIONS() {
    return NextResponse.json({}, { headers: corsHeaders })
}

export async function GET(request: NextRequest) {
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
            console.error('Erro ao buscar perfil:', error)
            return NextResponse.json({ error: error.message }, { status: 500, headers: corsHeaders })
        }

        if (!data) {
            return NextResponse.json({ error: 'Perfil não encontrado' }, { status: 404, headers: corsHeaders })
        }

        return NextResponse.json(data, { headers: corsHeaders })
    } catch (error: any) {
        console.error('Exception ao buscar perfil:', error)
        return NextResponse.json({ error: error.message }, { status: 500, headers: corsHeaders })
    }
}
