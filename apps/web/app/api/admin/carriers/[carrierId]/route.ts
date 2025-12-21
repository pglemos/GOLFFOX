import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-client'
import { requireAuth } from '@/lib/api-auth'
import { logError } from '@/lib/logger'

export const runtime = 'nodejs'

export async function GET(
    request: NextRequest,
    props: { params: Promise<{ carrierId: string }> }
) {
    try {
        const params = await props.params
        const authErrorResponse = await requireAuth(request, 'admin')
        if (authErrorResponse) {
            return authErrorResponse
        }

        const { carrierId } = params

        if (!carrierId) {
            return NextResponse.json({ error: 'ID da transportadora obrigatório' }, { status: 400 })
        }

        const supabase = getSupabaseAdmin()
        const { data, error } = await supabase
            .from('transportadoras' as any)
            .select('id, name, cnpj, address, phone, email, is_active, created_at, updated_at')
            .eq('id', carrierId)
            .single()

        if (error) {
            logError('Erro ao buscar transportadora', { error, carrierId }, 'CarriersGetAPI')
            return NextResponse.json({ error: 'Erro ao buscar dados' }, { status: 500 })
        }

        if (!data) {
            return NextResponse.json({ error: 'Transportadora não encontrada' }, { status: 404 })
        }

        return NextResponse.json(data)
    } catch (error: any) {
        const params = await props.params
        const { carrierId: errorCarrierId } = params
        logError('Erro inesperado', { error, carrierId: errorCarrierId }, 'CarriersGetAPI')
        return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
    }
}
