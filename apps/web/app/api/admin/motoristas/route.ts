import { NextRequest, NextResponse } from 'next/server'

import { requireAuth } from '@/lib/api-auth'
import { successResponse, errorResponse, validationErrorResponse } from '@/lib/api-response'
import { debug, warn, logError } from '@/lib/logger'
import { UserService } from '@/lib/services/server/user-service'
import { getSupabaseAdmin } from '@/lib/supabase-client'

/**
 * GET /api/admin/motoristas
 * Listar motoristas
 */
export async function GET(request: NextRequest) {
  // Verificar autenticação admin
  const authError = await requireAuth(request, 'admin')
  if (authError) return authError

  try {
    const supabase = getSupabaseAdmin()
    const searchParams = request.nextUrl.searchParams

    // Filtros opcionais
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '100')
    const offset = (page - 1) * limit
    const search = searchParams.get('search') || undefined
    const transportadoraId = searchParams.get('transportadora_id') || undefined
    const isActive = searchParams.get('is_active')

    let query = supabase
      .from('users')
      .select('id, name, email, phone, cpf, role, transportadora_id, is_active, created_at, updated_at')
      .eq('role', 'motorista')
      .order('created_at', { ascending: false })

    // Aplicar filtros
    if (search) {
      query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%,cpf.ilike.%${search}%`)
    }

    if (transportadoraId) {
      query = query.eq('transportadora_id', transportadoraId)
    }

    if (isActive !== null && isActive !== undefined) {
      query = query.eq('is_active', isActive === 'true')
    }

    // Paginação
    query = query.range(offset, offset + limit - 1)

    const { data, error } = await query

    if (error) {
      logError('Erro ao listar motoristas', { error }, 'DriversAPI')
      return NextResponse.json(
        { error: 'Erro ao listar motoristas', message: error.message },
        { status: 500 }
      )
    }

    // Contar total (para paginação)
    let countQuery = supabase
      .from('users')
      .select('id', { count: 'exact', head: true })
      .eq('role', 'motorista')

    if (search) {
      countQuery = countQuery.or(`name.ilike.%${search}%,email.ilike.%${search}%,cpf.ilike.%${search}%`)
    }

    if (transportadoraId) {
      countQuery = countQuery.eq('transportadora_id', transportadoraId)
    }

    if (isActive !== null && isActive !== undefined) {
      countQuery = countQuery.eq('is_active', isActive === 'true')
    }

    const { count } = await countQuery

    return NextResponse.json({
      success: true,
      data: data || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
    })
  } catch (error) {
    logError('Erro ao listar motoristas', { error }, 'DriversAPI')
    return NextResponse.json(
      { error: 'Erro ao listar motoristas', message: error instanceof Error ? error.message : 'Erro desconhecido' },
      { status: 500 }
    )
  }
}

// POST /api/admin/motoristas - Criar motorista
export async function POST(request: NextRequest) {
  // Verificar autenticação admin
  const authError = await requireAuth(request, 'admin')
  if (authError) return authError

  try {
    const supabase = getSupabaseAdmin()
    const body = await request.json()

    const {
      name,
      email,
      phone,
      transportadora_id,
      cpf,
      cnh,
      cnh_category,
      is_active,
      // Campos de endereço (opcionais)
      address_zip_code,
      address_street,
      address_number,
      address_neighborhood,
      address_complement,
      address_city,
      address_state
    } = body

    if (!name) {
      return validationErrorResponse('Nome é obrigatório')
    }

    const transportadoraId = transportadora_id
    if (!transportadoraId) {
      return validationErrorResponse('Transportadora é obrigatória')
    }

    // 3. Criar motorista usando UserService
    const newDriver = await UserService.createUser({
      name,
      email: email || '', // Email real ou vazio (mas UserService espera string)
      phone,
      cpf,
      role: 'motorista',
      password: cpf?.replace(/\D/g, '').slice(-6) || '123456',
      company_id: null,
      transportadora_id: transportadoraId,
      cnh,
      cnh_category,
      address_zip_code,
      address_street,
      address_number,
      address_neighborhood,
      address_complement,
      address_city,
      address_state
    })

    return successResponse({ motorista: newDriver })
  } catch (error: unknown) {
    logError('Erro na API de criar motorista', { error }, 'DriversAPI')
    return errorResponse(error, 500, 'Erro ao criar motorista')
  }
}
