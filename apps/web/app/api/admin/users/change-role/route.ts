import { NextRequest } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-client'
import { requireAuth } from '@/lib/api-auth'
import { applyRateLimit } from '@/lib/rate-limit'
import { z } from 'zod'
import { logger } from '@/lib/logger'
import { successResponse, errorResponse, notFoundResponse } from '@/lib/api-response'
import { normalizeRole, isValidRole } from '@/lib/role-mapper'

export const runtime = 'nodejs'

const changeRoleSchema = z.object({
    userId: z.string().uuid('ID de usuário inválido'),
    newRole: z.string().refine((role) => isValidRole(role), {
        message: 'Role inválido. Use: admin, empresa, transportadora, motorista, passageiro'
    }),
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

        // Normalizar role para nomenclatura canônica (PT-BR)
        const normalizedRole = normalizeRole(validated.newRole)
        
        const supabase = getSupabaseAdmin()

        // Buscar usuário
        const { data: targetUser, error: fetchError } = await supabase
            .from('users')
            .select('id, email, role, name')
            .eq('id', validated.userId)
            .single()

        if (fetchError || !targetUser) {
            logger.warn('Usuário não encontrado para mudança de papel', { userId: validated.userId, error: fetchError }, 'ChangeRoleAPI')
            return notFoundResponse('Usuário não encontrado')
        }

        // Validação: não permitir mudar se role é a mesma (comparar com role normalizado)
        if (normalizeRole((targetUser as any).role) === normalizedRole) {
            return errorResponse(new Error('O usuário já possui este papel'), 400)
        }

        // Atualizar role usando service role (bypass RLS) - usar role normalizado
        const { data: updatedUser, error: updateError } = await supabase
            .from('users')
            .update({ role: normalizedRole } as any)
            .eq('id', validated.userId)
            .select()
            .single()

        if (updateError) {
            logger.error('Erro ao atualizar papel', { error: updateError, userId: validated.userId }, 'ChangeRoleAPI')
            return errorResponse(updateError, 500, 'Erro ao alterar papel')
        }

        // Log de auditoria (opcional - se falhar não impede a operação)
        try {
            await ((supabase
                // @ts-ignore - Supabase type inference issue
                .from('audit_logs' as any)) as any)
                .insert({
                    user_id: validated.userId,
                    action: 'change_role',
                    resource_type: 'user',
                    resource_id: validated.userId,
                    details: {
                        old_role: (targetUser as any).role,
                        new_role: normalizedRole,
                        original_requested_role: validated.newRole,
                        user_email: (targetUser as any).email,
                        changed_by: req.headers.get('user-email') || 'admin'
                    }
                } as any)
        } catch (auditError) {
            logger.warn('⚠️ Erro ao registrar log de auditoria:', auditError)
            // Não falhar a operação por causa de log
        }

        return successResponse(
            { user: updatedUser },
            200,
            { message: `Papel alterado de "${(targetUser as any).role}" para "${normalizedRole}" com sucesso` }
        )
    } catch (error: any) {
        logger.error('Erro ao processar mudança de papel', { error }, 'ChangeRoleAPI')

        if (error instanceof z.ZodError) {
            return errorResponse(error, 400, 'Dados inválidos')
        }

        return errorResponse(error, 500)
    }
}
