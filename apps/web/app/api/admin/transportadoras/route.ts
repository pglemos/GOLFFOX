/**
 * GET /api/admin/transportadoras
 * Listar transportadoras (alias para transportadoras-list)
 */

import { NextRequest, NextResponse } from 'next/server'

import { requireAuth } from '@/lib/api-auth'
import { successResponse, errorResponse } from '@/lib/api-response'
import { logError } from '@/lib/logger'
import { getSupabaseAdmin } from '@/lib/supabase-client'

export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  try {
    // Verificar autenticação admin
    const authError = await requireAuth(request, 'admin')
    if (authError) return authError

    const supabase = getSupabaseAdmin()
    const searchParams = request.nextUrl.searchParams

    // Filtros opcionais
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '100')
    const offset = (page - 1) * limit
    const search = searchParams.get('search') || undefined
    const isActive = searchParams.get('is_active')

    let query = supabase
      .from('transportadoras' as any)
      .select('id, name, address, phone, email, cnpj, contact_person, is_active, created_at, updated_at')
      .order('created_at', { ascending: false })

    // Aplicar filtros
    if (search) {
      query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%,cnpj.ilike.%${search}%`)
    }

    if (isActive !== null && isActive !== undefined) {
      query = query.eq('is_active', isActive === 'true')
    }

    // Paginação
    query = query.range(offset, offset + limit - 1)

    const { data, error } = await query

    if (error) {
      logError('Erro ao listar transportadoras', { error }, 'TransportadorasAPI')
      return errorResponse('Erro ao listar transportadoras', 500)
    }

    // Contar total (para paginação)
    let countQuery = supabase
      .from('transportadoras' as any)
      .select('id', { count: 'exact', head: true })

    if (search) {
      countQuery = countQuery.or(`name.ilike.%${search}%,email.ilike.%${search}%,cnpj.ilike.%${search}%`)
    }

    if (isActive !== null && isActive !== undefined) {
      countQuery = countQuery.eq('is_active', isActive === 'true')
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

