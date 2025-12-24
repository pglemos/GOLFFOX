import { NextRequest, NextResponse } from 'next/server'

import { z } from 'zod'

import { requireAuth } from '@/lib/api-auth'
import { applyRateLimit } from '@/lib/rate-limit'
import { getSupabaseAdmin } from '@/lib/supabase-client'
import { redisCacheService, createCacheKey } from '@/lib/cache/redis-cache.service'
import { logError } from '@/lib/logger'

export const runtime = 'nodejs'

const updateAlertSchema = z.object({
    id: z.string().uuid(),
    status: z.enum(['open', 'assigned', 'resolved']).optional(),
    assigned_to: z.string().uuid().optional().nullable(),
    description: z.string().optional(),
    message: z.string().optional(),
    severity: z.enum(['critical', 'warning', 'info', 'error']).optional(),
    resolved_at: z.string().optional(),
    resolved_by: z.string().uuid().optional().nullable(),
    resolution_notes: z.string().optional(),
})

export async function POST(req: NextRequest) {
    try {
        const rateLimitResponse = await applyRateLimit(req, 'sensitive')
        if (rateLimitResponse) return rateLimitResponse

        const authErrorResponse = await requireAuth(req, 'admin')
        if (authErrorResponse) return authErrorResponse

        const body = await req.json()
        const validated = updateAlertSchema.parse(body)

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
            return NextResponse.json(
                { success: false, error: 'Nenhum dado para atualizar' },
                { status: 400 }
            )
        }

        const supabaseAdmin = getSupabaseAdmin()

        // Atualizar alerta com campos básicos apenas
        const { data, error } = await supabaseAdmin
            .from('gf_alerts')
            .update(basicUpdateData)
            .eq('id', validated.id)
            .select()
            .single()

        if (error) {
            logError('Erro ao atualizar alerta', { error: error.message, alertId: validated.id, basicUpdateData }, 'AlertUpdateAPI')
            return NextResponse.json(
                { success: false, error: 'Erro ao atualizar alerta', message: error.message },
                { status: 500 }
            )
        }

        // Invalidar cache de lista
        try {
            await redisCacheService.del(createCacheKey('alerts_v4', 'all', 'all'))
        } catch (cacheErr) {
            // Ignorar erro de cache
        }

        return NextResponse.json({
            success: true,
            alert: data
        })
    } catch (error: unknown) {
        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { success: false, error: 'Dados inválidos', details: error.errors },
                { status: 400 }
            )
        }

        const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido'
        logError('Erro ao processar atualização de alerta', { error: errorMessage }, 'AlertUpdateAPI')

        return NextResponse.json(
            { success: false, error: 'Erro ao processar requisição', message: errorMessage },
            { status: 500 }
        )
    }
}

