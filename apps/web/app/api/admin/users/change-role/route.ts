import { NextRequest, NextResponse } from 'next/server'
import { supabaseServiceRole } from '@/lib/supabase-server'
import { requireAuth } from '@/lib/api-auth'
import { applyRateLimit } from '@/lib/rate-limit'
import { z } from 'zod'
import { logger } from '@/lib/logger'

export const runtime = 'nodejs'

const changeRoleSchema = z.object({
    userId: z.string().uuid('ID de usuário inválido'),
    newRole: z.enum(['admin', 'operator', 'transportadora', 'driver', 'passenger']),
    oldRole: z.string().optional(),
})

export async function POST(req: NextRequest) {
    try {
        // ✅ Rate Limit (Sensitive operation)
        const rateLimitResponse = await applyRateLimit(req, 'sensitive')
        if (rateLimitResponse) return rateLimitResponse

        // ✅ Verificar autenticação e que usuário é admin
        const authErrorResponse = await requireAuth(req, 'admin')
        if (authErrorResponse) return authErrorResponse

        const body = await req.json()
        const validated = changeRoleSchema.parse(body)

        // Buscar usuário
        const { data: targetUser, error: fetchError } = await supabaseServiceRole
            .from('users')
            .select('id, email, role, name')
            .eq('id', validated.userId)
            .single()

        if (fetchError || !targetUser) {
            return NextResponse.json(
                { success: false, error: 'Usuário não encontrado' },
                { status: 404 }
            )
        }

        // Validação: não permitir mudar se role é a mesma
        if ((targetUser as any).role === validated.newRole) {
            return NextResponse.json(
                { success: false, error: 'O usuário já possui este papel' },
                { status: 400 }
            )
        }

        // Atualizar role usando service role (bypass RLS)
        const { data: updatedUser, error: updateError } = await supabaseServiceRole
            .from('users')
            .update({ role: validated.newRole } as any)
            .eq('id', validated.userId)
            .select()
            .single()

        if (updateError) {
            console.error('❌ Erro ao atualizar papel:', updateError)
            return NextResponse.json(
                {
                    success: false,
                    error: 'Erro ao alterar papel',
                    details: updateError.message
                },
                { status: 500 }
            )
        }

        // Log de auditoria (opcional - se falhar não impede a operação)
        try {
            await (supabaseServiceRole
                .from('audit_logs') as any)
                .insert({
                    user_id: validated.userId,
                    action: 'change_role',
                    resource_type: 'user',
                    resource_id: validated.userId,
                    details: {
                        old_role: (targetUser as any).role,
                        new_role: validated.newRole,
                        user_email: (targetUser as any).email,
                        changed_by: req.headers.get('user-email') || 'admin'
                    }
                } as any)
        } catch (auditError) {
            logger.warn('⚠️ Erro ao registrar log de auditoria:', auditError)
            // Não falhar a operação por causa de log
        }

        return NextResponse.json({
            success: true,
            user: updatedUser,
            message: `Papel alterado de "${(targetUser as any).role}" para "${validated.newRole}" com sucesso`
        })
    } catch (error: any) {
        console.error('❌ Erro ao processar mudança de papel:', error)

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
