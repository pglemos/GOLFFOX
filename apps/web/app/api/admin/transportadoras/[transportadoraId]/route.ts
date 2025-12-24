import { NextRequest } from 'next/server'

import { requireAuth } from '@/lib/api-auth'
import { successResponse, errorResponse, notFoundResponse, validationErrorResponse } from '@/lib/api-response'
import { logError } from '@/lib/logger'
import { getSupabaseAdmin } from '@/lib/supabase-client'

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
            .from('transportadoras')
            .select('*')
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
    } catch (error: unknown) {
        logError('Erro inesperado na API de detalhe da transportadora', { error }, 'TransportadoraDetailAPI')
        return errorResponse(error, 500, 'Erro interno do servidor')
    }
}
