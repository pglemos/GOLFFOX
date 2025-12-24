import { NextRequest, NextResponse } from 'next/server'

import { requireAuth, validateAuth } from '@/lib/api-auth'
import { successResponse, errorResponse, unauthorizedResponse, forbiddenResponse } from '@/lib/api-response'
import { supabaseServiceRole } from '@/lib/supabase-server'

export const runtime = 'nodejs'

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

        // Buscar motoristas da transportadora
        const { data, error } = await supabaseServiceRole
            .from('users')
            .select('id, name, email, cpf, phone, cnh, cnh_category, avatar_url, is_active, transportadora_id, empresa_id, role, created_at, updated_at')
            .eq('transportadora_id', userData.transportadora_id)
            .eq('role', 'motorista')
            .order('name', { ascending: true })

        if (error) {
            return errorResponse(error, 500, 'Erro ao buscar motoristas')
        }

        return successResponse(data || [])
    } catch (err) {
        return errorResponse(err, 500, 'Erro ao processar requisição')
    }
}
