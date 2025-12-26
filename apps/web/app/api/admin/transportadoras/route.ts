/**
 * GET /api/admin/transportadoras
 * Listar transportadoras (alias para transportadoras-list)
 */

import { NextRequest, NextResponse } from 'next/server'

import { requireAuth } from '@/lib/api-auth'
import { successResponse, errorResponse, validationErrorResponse } from '@/lib/api-response'
import { logError } from '@/lib/logger'
import { getSupabaseAdmin } from '@/lib/supabase-client'
import { validateWithSchema, carrierListQuerySchema } from '@/lib/validation/schemas'

export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  try {
    // Verificar autenticação admin
    const authError = await requireAuth(request, 'admin')
    if (authError) return authError

    const { searchParams } = new URL(request.url)
    const queryParams = Object.fromEntries(searchParams.entries())

    // Validar query params
    const validation = validateWithSchema(carrierListQuerySchema, queryParams)
    if (!validation.success) {
      return validationErrorResponse(validation.error)
    }

    const { page, limit, search, status } = validation.data
    const offset = (page - 1) * limit

    const supabase = getSupabaseAdmin()

    let query = supabase
      .from('transportadoras')
      .select('id, name, address, phone, email, cnpj, contact_person, is_active, created_at, updated_at')
      .order('created_at', { ascending: false })

    // Aplicar filtros
    if (search) {
      query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%,cnpj.ilike.%${search}%`)
    }

    if (status) {
      query = query.eq('is_active', status === 'active')
    }

    // Paginação
    query = query.range(offset, offset + limit - 1)

    const { data, error } = await query

    if (error) {
      logError('Erro ao listar transportadoras', { error }, 'TransportadorasAPI')
      return errorResponse(error, 500, 'Erro ao listar transportadoras')
    }

    // Contar total (para paginação)
    let countQuery = supabase
      .from('transportadoras')
      .select('id', { count: 'exact', head: true })

    if (search) {
      countQuery = countQuery.or(`name.ilike.%${search}%,email.ilike.%${search}%,cnpj.ilike.%${search}%`)
    }

    if (status) {
      countQuery = countQuery.eq('is_active', status === 'active')
    }

    const { count } = await countQuery

    return successResponse(data || [], 200, {
      count: count || 0,
      limit,
      offset
    })
  } catch (error) {
    logError('Erro ao listar transportadoras', { error }, 'TransportadorasAPI')
    return errorResponse('Erro ao listar transportadoras', 500)
  }
}

