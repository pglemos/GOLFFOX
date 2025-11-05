/**
 * Helper para registrar logs de auditoria no sistema
 * Formato padronizado: { actorId, companyId, action, resourceType, resourceId, details }
 */

import { supabase } from './supabase'

export interface AuditLogDetails {
  [key: string]: any
}

export interface LogAuditParams {
  action: string
  resourceType: string
  resourceId?: string | null
  details?: AuditLogDetails
  companyId?: string | null
}

/**
 * Registra um log de auditoria
 * Busca actorId e companyId automaticamente da sessão atual
 * Não quebra o fluxo se o log falhar (apenas loga erro no console)
 */
export async function logAudit(params: LogAuditParams): Promise<void> {
  try {
    const { data: { session } } = await supabase.auth.getSession()
    
    if (!session?.user) {
      console.warn('logAudit: Nenhuma sessão encontrada, log não registrado')
      return
    }

    const actorId = session.user.id
    let companyId = params.companyId || null

    // Tentar buscar companyId do usuário se não fornecido
    if (!companyId) {
      try {
        const { data: userData } = await supabase
          .from('users')
          .select('company_id')
          .eq('id', actorId)
          .single()

        companyId = userData?.company_id || null
      } catch (error) {
        // Ignorar erro, usar null
      }
    }

    await supabase.from('gf_audit_log').insert({
      actor_id: actorId,
      company_id: companyId,
      action_type: params.action,
      resource_type: params.resourceType,
      resource_id: params.resourceId || null,
      details: params.details || null,
    })
  } catch (error) {
    // Não quebrar o fluxo se log falhar
    console.error('Erro ao registrar log de auditoria:', error)
  }
}

/**
 * Helper para ações comuns
 */
export const auditLogs = {
  create: (resourceType: string, resourceId: string, details?: AuditLogDetails) =>
    logAudit({ action: 'create', resourceType, resourceId, details }),

  update: (resourceType: string, resourceId: string, details?: AuditLogDetails) =>
    logAudit({ action: 'update', resourceType, resourceId, details }),

  delete: (resourceType: string, resourceId: string, details?: AuditLogDetails) =>
    logAudit({ action: 'delete', resourceType, resourceId, details }),

  approve: (resourceType: string, resourceId: string, details?: AuditLogDetails) =>
    logAudit({ action: 'approve', resourceType, resourceId, details }),

  reject: (resourceType: string, resourceId: string, details?: AuditLogDetails) =>
    logAudit({ action: 'reject', resourceType, resourceId, details }),

  resolve: (resourceType: string, resourceId: string, details?: AuditLogDetails) =>
    logAudit({ action: 'resolve', resourceType, resourceId, details }),
}

