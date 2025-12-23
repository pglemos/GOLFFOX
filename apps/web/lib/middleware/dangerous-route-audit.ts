/**
 * Middleware de Auditoria para Rotas Perigosas
 * 
 * Força auditoria obrigatória antes de executar operações perigosas
 * (ex: execução de SQL, correções de banco)
 */

import { NextRequest, NextResponse } from 'next/server'

import { createClient } from '@supabase/supabase-js'

import { validateAuth } from '@/lib/api-auth'
import { logError, warn } from '@/lib/logger'

export interface AuditContext {
  userId: string
  userEmail: string
  userRole: string
  action: string
  resourceType: string
  details: Record<string, unknown>
  ipAddress?: string
  userAgent?: string
}

/**
 * Registra auditoria obrigatória
 */
async function createAuditLog(context: AuditContext): Promise<{ success: boolean; error?: string }> {
  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    
    if (!url || !serviceKey) {
      return { success: false, error: 'Supabase não configurado' }
    }

    const supabase = createClient(url, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    })

    const { error } = await supabase.from('gf_audit_log').insert({
      actor_id: context.userId,
      action_type: context.action,
      resource_type: context.resourceType,
      details: {
        ...context.details,
        userEmail: context.userEmail.replace(/^(.{2}).+(@.*)$/, '$1***$2'), // Mascarar email
        userRole: context.userRole,
        ipAddress: context.ipAddress,
        userAgent: context.userAgent,
        timestamp: new Date().toISOString(),
      },
      created_at: new Date().toISOString(),
    })

    if (error) {
      logError('Falha ao criar log de auditoria', { error, context }, 'DangerousRouteAudit')
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (error: any) {
    logError('Exceção ao criar log de auditoria', { error, context }, 'DangerousRouteAudit')
    return { success: false, error: error?.message || 'Erro desconhecido' }
  }
}

/**
 * Extrai informações do usuário da requisição
 */
async function extractUserContext(request: NextRequest): Promise<{
  userId: string
  userEmail: string
  userRole: string
} | null> {
  try {
    const user = await validateAuth(request)
    
    if (!user) {
      return null
    }

    return {
      userId: user.id,
      userEmail: user.email || 'unknown',
      userRole: user.role || 'unknown',
    }
  } catch (error) {
    warn('Erro ao extrair contexto do usuário', { error }, 'DangerousRouteAudit')
    return null
  }
}

/**
 * Wrapper para rotas perigosas que força auditoria
 * 
 * @param handler Função handler da rota
 * @param action Nome da ação para auditoria (ex: 'execute_sql_fix')
 * @param resourceType Tipo de recurso (ex: 'database')
 */
export function withDangerousRouteAudit<T = any>(
  handler: (request: NextRequest, context: AuditContext) => Promise<NextResponse<T>>,
  action: string,
  resourceType: string = 'database'
) {
  return async (request: NextRequest): Promise<NextResponse<T>> => {
    // 1. Extrair contexto do usuário
    const userContext = await extractUserContext(request)
    
    if (!userContext) {
      logError('Tentativa de acesso a rota perigosa sem autenticação', {
        path: request.nextUrl.pathname,
        action,
      }, 'DangerousRouteAudit')
      
      return NextResponse.json(
        { error: 'Acesso negado', message: 'Autenticação obrigatória para esta operação' },
        { status: 401 }
      ) as NextResponse<T>
    }

    // 2. Criar contexto de auditoria
    const auditContext: AuditContext = {
      userId: userContext.userId,
      userEmail: userContext.userEmail,
      userRole: userContext.userRole,
      action,
      resourceType,
      details: {
        path: request.nextUrl.pathname,
        method: request.method,
      },
      ipAddress: request.headers.get('x-forwarded-for') || 
                 request.headers.get('x-real-ip') || 
                 'unknown',
      userAgent: request.headers.get('user-agent') || 'unknown',
    }

    // 3. Registrar auditoria ANTES de executar
    const auditResult = await createAuditLog(auditContext)
    
    if (!auditResult.success) {
      logError('Falha ao registrar auditoria - bloqueando execução', {
        error: auditResult.error,
        context: auditContext,
      }, 'DangerousRouteAudit')
      
      return NextResponse.json(
        { 
          error: 'Falha na auditoria', 
          message: 'Não foi possível registrar a operação. Execução bloqueada por segurança.' 
        },
        { status: 500 }
      ) as NextResponse<T>
    }

    // 4. Executar handler
    try {
      const response = await handler(request, auditContext)
      
      // 5. Registrar resultado na auditoria (atualizar log existente)
      // Nota: Em produção, pode criar um log adicional com resultado
      const resultDetails = {
        ...auditContext.details,
        success: response.status < 400,
        statusCode: response.status,
      }
      
      await createAuditLog({
        ...auditContext,
        action: `${action}_result`,
        details: resultDetails,
      })
      
      return response
    } catch (error: any) {
      // Registrar erro na auditoria
      logError('Erro ao executar operação perigosa', {
        error,
        context: auditContext,
      }, 'DangerousRouteAudit')
      
      await createAuditLog({
        ...auditContext,
        action: `${action}_error`,
        details: {
          ...auditContext.details,
          error: error?.message || 'Erro desconhecido',
        },
      })
      
      throw error
    }
  }
}
