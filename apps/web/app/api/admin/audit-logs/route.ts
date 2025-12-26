import { NextRequest, NextResponse } from 'next/server'

import { requireAuth } from '@/lib/api-auth'
import { successResponse, errorResponse, validationErrorResponse } from '@/lib/api-response'
import { logError } from '@/lib/logger'
import { supabaseServiceRole } from '@/lib/supabase-server'
import { validateWithSchema, auditLogQuerySchema } from '@/lib/validation/schemas'

export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  try {
    const authErrorResponse = await requireAuth(request, 'admin')
    if (authErrorResponse) return authErrorResponse

    const { searchParams } = new URL(request.url)
    const queryParams = Object.fromEntries(searchParams.entries())

    // Validar query params
    const validation = validateWithSchema(auditLogQuerySchema, queryParams)
    if (!validation.success) {
      return validationErrorResponse(validation.error)
    }

    const { page = 1, limit = 20, user_id, action, resource_type } = validation.data
    const offset = (page - 1) * limit

    // Selecionar apenas colunas necessárias para listagem
    const auditColumns = 'id,actor_id,action_type,resource_type,resource_id,details,created_at'
    let query = supabaseServiceRole
      .from('gf_audit_log')
      .select(auditColumns, { count: 'exact' })

    if (user_id) query = query.eq('actor_id', user_id)
    if (action) query = query.eq('action_type', action)
    if (resource_type) query = query.eq('resource_type', resource_type)

    const { data, error, count } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      logError('Erro ao buscar audit log', { error, limit }, 'AuditLogAPI')
      return errorResponse(error, 500, 'Erro ao buscar audit log')
    }

    return successResponse(data || [], 200, {
      count: count || 0,
      limit,
      offset
    })
  } catch (err) {
    logError('Erro ao listar audit log', { error: err }, 'AuditLogAPI')
    return errorResponse(err, 500, 'Erro ao listar audit log')
  }
}
