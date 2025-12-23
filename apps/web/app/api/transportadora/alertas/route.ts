import { NextRequest, NextResponse } from 'next/server'

import { requireAuth, validateAuth } from '@/lib/api-auth'
import { successResponse, errorResponse, unauthorizedResponse, forbiddenResponse } from '@/lib/api-response'
import { supabaseServiceRole } from '@/lib/supabase-server'

export const runtime = 'nodejs'

export async function OPTIONS() {
    return new NextResponse(null, {
        status: 200,
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
    })
}

export async function GET(req: NextRequest) {
    try {
        const authErrorResponse = await requireAuth(req, 'gestor_transportadora')
        if (authErrorResponse) return authErrorResponse

        const user = await validateAuth(req)
        if (!user) {
            return unauthorizedResponse()
        }

        // Buscar transportadora_id do usuário
        const { data: userData } = await supabaseServiceRole
            .from('users')
            .select('transportadora_id')
            .eq('id', user.id)
            .single()

        if (!userData?.transportadora_id) {
            return forbiddenResponse('Usuário não está associado a uma transportadora')
        }

        // Buscar alertas de vencimento
        const alertLevel = req.nextUrl.searchParams.get('alert_level') || 'critical,warning'
        const alertLevels = alertLevel.split(',')

        // View materializada - selecionar todas as colunas
        const { data, error } = await supabaseServiceRole
            .from('v_carrier_expiring_documents')
            .select('*')
            .eq('transportadora_id', userData.transportadora_id)
            .in('alert_level', alertLevels)
            .order('days_to_expiry', { ascending: true })

        if (error) {
            return errorResponse(error, 500, 'Erro ao buscar alertas')
        }

        // Estatísticas
        const stats = {
            totalCount: data?.length || 0,
            criticalCount: data?.filter(a => a.alert_level === 'critical').length || 0,
            warningCount: data?.filter(a => a.alert_level === 'warning').length || 0,
            expiredCount: data?.filter(a => a.alert_level === 'expired').length || 0,
        }

        return successResponse(data || [], 200, {
            count: stats.totalCount,
            ...stats as any
        })
    } catch (err) {
        return errorResponse(err, 500, 'Erro ao processar requisição')
    }
}
