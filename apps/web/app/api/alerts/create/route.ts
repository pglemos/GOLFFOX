
import { NextRequest, NextResponse } from 'next/server'

import { createClient } from '@supabase/supabase-js'

import { requireAuth } from '@/lib/api-auth'
import { logError } from '@/lib/logger'

export const runtime = 'nodejs'

function getSupabaseAdmin() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!url || !serviceKey) {
        throw new Error('Supabase não configurado')
    }
    return createClient(url, serviceKey)
}

export async function POST(request: NextRequest) {
    try {
        const authErrorResponse = await requireAuth(request)
        if (authErrorResponse) {
            // Permitir que usuários autenticados criem alertas, não apenas admins
            // Mas requireAuth já retorna erro se não logado
            return authErrorResponse
        }

        const { data: { user } } = await getSupabaseAdmin().auth.getUser(
            request.headers.get('authorization')?.split(' ')[1]
        )

        const body = await request.json()
        const { type, severity, title, message, details, source, metadata, company_id } = body

        if (!title || !message) {
            return NextResponse.json(
                { error: 'Título e mensagem são obrigatórios' },
                { status: 400 }
            )
        }

        const supabaseAdmin = getSupabaseAdmin()

        const { data, error } = await supabaseAdmin
            .from('gf_alerts')
            .insert({
                type: type || 'other',
                severity: severity || 'info',
                title,
                message,
                details: details || {},
                source: source || 'api',
                metadata: metadata || {},
                company_id: company_id || null, // Se vier no body
                is_resolved: false,
                created_at: new Date().toISOString()
            })
            .select()
            .single()

        if (error) {
            logError('Erro ao criar alerta', { error, body }, 'AlertsCreateAPI')
            return NextResponse.json(
                { error: 'Erro ao criar alerta', message: error.message },
                { status: 500 }
            )
        }

        return NextResponse.json({ success: true, alert: data })

    } catch (error: any) {
        logError('Erro ao criar alerta (catch)', { error }, 'AlertsCreateAPI')
        return NextResponse.json(
            { error: 'Erro interno ao criar alerta', message: error.message },
            { status: 500 }
        )
    }
}
