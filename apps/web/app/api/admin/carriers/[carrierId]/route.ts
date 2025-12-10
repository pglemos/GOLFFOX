import { NextRequest, NextResponse } from 'next/server'
import { supabaseServiceRole } from '@/lib/supabase-server'
import { requireAuth } from '@/lib/api-auth'

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

        const { data, error } = await supabaseServiceRole
            .from('carriers')
            .select('*')
            .eq('id', carrierId)
            .single()

        if (error) {
            console.error('Erro ao buscar transportadora:', error)
            return NextResponse.json({ error: 'Erro ao buscar dados' }, { status: 500 })
        }

        if (!data) {
            return NextResponse.json({ error: 'Transportadora não encontrada' }, { status: 404 })
        }

        return NextResponse.json(data)
    } catch (error: any) {
        console.error('Erro inesperado:', error)
        return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
    }
}
