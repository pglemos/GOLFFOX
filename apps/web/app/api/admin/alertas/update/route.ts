import { NextRequest, NextResponse } from 'next/server'

import { z } from 'zod'

import { requireAuth } from '@/lib/api-auth'
import { successResponse, errorResponse, validationErrorResponse } from '@/lib/api-response'
import { redisCacheService, createCacheKey } from '@/lib/cache/redis-cache.service'
import { logError } from '@/lib/logger'
import { applyRateLimit } from '@/lib/rate-limit'
import { supabaseServiceRole } from '@/lib/supabase-server'
import { updateAlertSchema, validateWithSchema } from '@/lib/validation/schemas'

export const runtime = 'nodejs'



export async function POST(req: NextRequest) {
    try {
        const rateLimitResponse = await applyRateLimit(req, 'sensitive')
        if (rateLimitResponse) return rateLimitResponse

        const authErrorResponse = await requireAuth(req, 'admin')
        if (authErrorResponse) return authErrorResponse

        const body = await req.json()

        // Validar com Zod centralizado
        // Note: o schema centralizado pode não ter o id, então estendemos se necessário
        const validation = validateWithSchema(updateAlertSchema.extend({ id: z.string().uuid() }), body)
        if (!validation.success) {
            return validationErrorResponse(validation.error)
        }

        const validated = validation.data

        // Campos básicos que SEMPRE existem no gf_alerts
        const basicUpdateData: Record<string, unknown> = {}

        // Mapeamento de status para is_resolved (coluna que sabemos existir)
        if (validated.status === 'resolved') {
            basicUpdateData.is_resolved = true
        } else if (validated.status === 'open' || validated.status === 'assigned') {
            basicUpdateData.is_resolved = false
        }

        if (validated.message) {
            basicUpdateData.message = validated.message
        } else if (validated.description) {
            basicUpdateData.message = validated.description
        }

        if (validated.severity) {
            basicUpdateData.severity = validated.severity
        }

        // Se não houver dados para atualizar, retornar erro
        if (Object.keys(basicUpdateData).length === 0) {
            return errorResponse('Nenhum dado para atualizar', 400)
        }

        // Atualizar alerta com campos básicos apenas
        const { data, error } = await supabaseServiceRole
            .from('gf_alerts')
            .update(basicUpdateData)
            .eq('id', validated.id)
            .select()
            .single()

        if (error) {
            logError('Erro ao atualizar alerta', { error, alertId: validated.id }, 'AlertUpdateAPI')
            return errorResponse(error, 500, 'Erro ao atualizar alerta')
        }

        // Invalidar cache de lista
        try {
            await redisCacheService.del(createCacheKey('alerts_v4', 'all', 'all'))
        } catch (cacheErr) {
            // Ignorar erro de cache
        }

        return successResponse(data)
    } catch (err) {
        logError('Erro ao processar atualização de alerta', { error: err }, 'AlertUpdateAPI')
        return errorResponse(err, 500, 'Erro ao processar requisição')
    }
}
