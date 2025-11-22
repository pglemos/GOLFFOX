import { NextRequest, NextResponse } from 'next/server'
import { supabaseServiceRole } from '@/lib/supabase-server'
import { requireAuth } from '@/lib/api-auth'
import { applyRateLimit } from '@/lib/rate-limit'
import { z } from 'zod'

export const runtime = 'nodejs'

const updateAlertSchema = z.object({
    id: z.string().uuid(),
    status: z.enum(['open', 'assigned', 'resolved']).optional(),
    assigned_to: z.string().uuid().optional().nullable(),
    description: z.string().optional(),
    severity: z.enum(['critical', 'warning', 'info']).optional(),
    resolved_at: z.string().optional(),
    resolved_by: z.string().uuid().optional(),
})

export async function POST(req: NextRequest) {
    try {
        const rateLimitResponse = await applyRateLimit(req, 'sensitive')
        if (rateLimitResponse) return rateLimitResponse

        const authErrorResponse = await requireAuth(req, 'admin')
        if (authErrorResponse) return authErrorResponse

        const body = await req.json()
        const validated = updateAlertSchema.parse(body)

        const updateData: any = {}
        if (validated.status) updateData.status = validated.status
        if (validated.assigned_to !== undefined) updateData.assigned_to = validated.assigned_to
        if (validated.description) updateData.description = validated.description
        if (validated.severity) updateData.severity = validated.severity
        if (validated.resolved_at) updateData.resolved_at = validated.resolved_at
        if (validated.resolved_by) updateData.resolved_by = validated.resolved_by

        const { data, error } = await supabaseServiceRole
            .from('gf_incidents')
            .update(updateData)
            .eq('id', validated.id)
            .select()
            .single()

        if (error) {
            return NextResponse.json(
                { success: false, error: 'Erro ao atualizar alerta', details: error.message },
                { status: 500 }
            )
        }

        // Log de auditoria
        const userEmail = req.headers.get('user-email') || 'admin'
        await supabaseServiceRole.from('gf_audit_log').insert({
            actor_id: req.headers.get('user-id'), // Pode ser null se não vier do middleware, mas requireAuth garante
            action_type: 'update',
            resource_type: 'incident',
            resource_id: validated.id,
            details: {
                changes: updateData,
                updated_by: userEmail
            }
        })

        return NextResponse.json({
            success: true,
            alert: data
        })
    } catch (error: any) {
        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { success: false, error: 'Dados inválidos', details: error.errors },
                { status: 400 }
            )
        }
        return NextResponse.json(
            { success: false, error: 'Erro ao processar requisição', message: error.message },
            { status: 500 }
        )
    }
}
