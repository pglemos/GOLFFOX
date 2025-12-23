import { NextRequest } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-client'
import { requireAuth } from '@/lib/api-auth'
import { logError } from '@/lib/logger'
import { successResponse, errorResponse, notFoundResponse, validationErrorResponse } from '@/lib/api-response'

export const runtime = 'nodejs'

export async function GET(
    request: NextRequest,
    props: { params: Promise<{ transportadoraId: string }> }
) {
    try {
        const { transportadoraId } = await props.params
        const authErrorResponse = await requireAuth(request, 'admin')
        if (authErrorResponse) {
            return authErrorResponse
        }

        if (!transportadoraId) {
            return validationErrorResponse('ID da transportadora obrigatório')
        }

        const supabase = getSupabaseAdmin()
        const { data, error } = await supabase
            .from('transportadoras' as any)
            .select('id, name, cnpj, address, phone, email, is_active, created_at, updated_at')
            .eq('id', transportadoraId)
            .single()

        if (error) {
            logError('Erro ao buscar transportadora', { error, transportadoraId }, 'TransportadoraDetailAPI')
            return errorResponse(error, 500, 'Erro ao buscar dados da transportadora')
        }

        if (!data) {
            return notFoundResponse('Transportadora não encontrada')
        }

        return successResponse(data)
    } catch (error: any) {
        logError('Erro inesperado na API de detalhe da transportadora', { error }, 'TransportadoraDetailAPI')
        return errorResponse(error, 500, 'Erro interno do servidor')
    }
}
