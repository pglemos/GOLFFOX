import { NextRequest, NextResponse } from 'next/server'

import { requireAuth } from '@/lib/api-auth'
import { validationErrorResponse, errorResponse, successResponse } from '@/lib/api-response'
import { logger, logError } from '@/lib/logger'
import { invalidateEntityCache } from '@/lib/next-cache'
import { withRateLimit } from '@/lib/rate-limit'
import { getSupabaseAdmin } from '@/lib/supabase-client'
import { validateWithSchema, idQuerySchema } from '@/lib/validation/schemas'
import type { Database } from '@/types/supabase'

type UserUpdate = Database['public']['Tables']['users']['Update']

export const runtime = 'nodejs'

// ✅ SEGURANÇA: Rate limiting para proteção contra abuso
export const DELETE = withRateLimit((request: NextRequest) => handleDelete(request), 'sensitive')
export const POST = withRateLimit((request: NextRequest) => handleDelete(request), 'sensitive')

async function handleDelete(request: NextRequest) {
  try {
    const authErrorResponse = await requireAuth(request, 'admin')
    if (authErrorResponse) return authErrorResponse

    const { searchParams } = new URL(request.url)
    const queryParams = Object.fromEntries(searchParams.entries())

    // Validar query params
    const validation = validateWithSchema(idQuerySchema, queryParams)
    if (!validation.success) {
      return validationErrorResponse(validation.error)
    }

    const { id: companyId } = validation.data

    const supabaseAdmin = getSupabaseAdmin()

    logger.log(`🗑️ Tentando excluir empresa permanentemente: ${companyId}`)

    // ORDEM CRÍTICA DE EXCLUSÃO:
    // 1. Atualizar users para setar company_id = NULL
    logger.log('   1. Atualizando users (setando company_id para NULL)...')
    const { error: usersUpdateError } = await supabaseAdmin
      .from('users')
      .update({ empresa_id: null } as UserUpdate)
      .eq('company_id', companyId)

    if (usersUpdateError) {
      logError('Erro ao atualizar users', { error: usersUpdateError, companyId }, 'CompaniesDeleteAPI')
      return errorResponse(usersUpdateError, 500, 'Erro ao atualizar usuários da empresa')
    }
    logger.log('   ✅ Users atualizados')

    // 2. Excluir dependências
    logger.log('   2. Excluindo dependências...')

    // Excluir routes (e suas dependências serão excluídas via CASCADE)
    const { error: routesError } = await supabaseAdmin
      .from('rotas')
      .delete()
      .eq('empresa_id', companyId)

    if (routesError && routesError.code !== '42P01') {
      logError('Erro ao excluir routes', { error: routesError, companyId }, 'CompaniesDeleteAPI')
      return errorResponse(routesError, 500, 'Erro ao excluir rotas da empresa')
    }

    // Excluir outras dependências
    const dependentTables = [
      'gf_employee_company',
      'gf_user_company_map',
      'gf_route_optimization_cache',
      'gf_report_schedules',
      'gf_costs',
      'gf_budgets',
      'gf_company_branding',
      'gf_service_requests'
    ]

    for (const table of dependentTables) {
      const columnName = table === 'gf_service_requests' ? 'empresa_id' : 'company_id'

      const { error: depError } = await supabaseAdmin
        .from(table)
        .delete()
        .eq(columnName, companyId)

      if (depError && depError.code !== '42P01' && depError.code !== '42703') {
        logError(`Erro ao excluir ${table}`, { error: depError, table, companyId }, 'CompaniesDeleteAPI')
      }
    }
    logger.log('   ✅ Dependências excluídas')

    // 3. Excluir empresa permanentemente
    logger.log('   3. Excluindo empresa...')
    const { data, error } = await supabaseAdmin
      .from('empresas')
      .delete()
      .eq('id', companyId)
      .select()

    if (error) {
      logError('Erro ao excluir empresa', { error, companyId }, 'CompaniesDeleteAPI')
      return errorResponse(error, 500, 'Erro ao excluir empresa')
    }

    // Invalidar cache após exclusão
    await invalidateEntityCache('company', companyId)

    logger.log(`✅ Empresa excluída com sucesso: ${companyId}`)

    return successResponse(null, 200, { message: 'Empresa excluída com sucesso' })
  } catch (err) {
    logError('Erro ao excluir empresa', { error: err }, 'CompaniesDeleteAPI')
    return errorResponse(err, 500, 'Erro ao excluir empresa')
  }
}

