/**
 * Helper para registrar logs de auditoria no sistema
 * Formato padronizado: { actorId, companyId, action, resourceType, resourceId, details }
 * Sanitiza PII (CPF, endereços completos) antes de inserir
 */

import { supabase } from './supabase'
import { warn, error as logError } from './logger'

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
 * Sanitiza detalhes removendo PII (CPF, endereços completos)
 */
function sanitizeDetails(details: AuditLogDetails | null | undefined): AuditLogDetails | null {
  if (!details || typeof details !== 'object') {
    return null
  }

  const sanitized: AuditLogDetails = { ...details }

  // Remover CPF se existir
  if ('cpf' in sanitized) {
    delete sanitized.cpf
  }

  // Remover endereço completo se existir
  if ('address' in sanitized) {
    delete sanitized.address
  }
  if ('full_address' in sanitized) {
    delete sanitized.full_address
  }

  // Manter apenas cidade/estado se existir
  if ('city' in sanitized || 'state' in sanitized) {
    const cityState: AuditLogDetails = {}
    if (sanitized.city) cityState.city = sanitized.city
    if (sanitized.state) cityState.state = sanitized.state
    // Remover outros campos de endereço
    delete sanitized.street
    delete sanitized.number
    delete sanitized.zipcode
    delete sanitized.neighborhood
    // Manter apenas cidade/estado
    Object.assign(sanitized, cityState)
  }

  // Remover campos sensíveis recursivamente se details tiver objetos aninhados
  Object.keys(sanitized).forEach(key => {
    const value = sanitized[key]
    if (value && typeof value === 'object' && !Array.isArray(value) && value.constructor === Object) {
      sanitized[key] = sanitizeDetails(value as AuditLogDetails)
    }
  })

  return sanitized
}

/**
 * Registra um log de auditoria
 * Busca actorId e companyId automaticamente da sessão atual
 * Sanitiza PII (CPF, endereços completos) antes de inserir
 * Não quebra o fluxo se o log falhar (apenas loga erro no console)
 */
export async function logAudit(params: LogAuditParams): Promise<void> {
  try {
    const { data: { session } } = await supabase.auth.getSession()
    
    if (!session?.user) {
      warn('Nenhuma sessão encontrada, log não registrado', {}, 'AuditLog')
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

    // Sanitizar detalhes removendo PII
    const sanitizedDetails = sanitizeDetails(params.details)

  await (supabase as any).from('gf_audit_log').insert({
      actor_id: actorId,
      company_id: companyId,
      action_type: params.action,
      resource_type: params.resourceType,
      resource_id: params.resourceId || null,
      details: sanitizedDetails,
    })
  } catch (err) {
    // Não quebrar o fluxo se log falhar
    logError('Erro ao registrar log de auditoria', { error: err }, 'AuditLog')
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

