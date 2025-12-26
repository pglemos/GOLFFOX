import { NextRequest, NextResponse } from 'next/server'

import { requireAuth } from '@/lib/api-auth'
import { successResponse, errorResponse, validationErrorResponse } from '@/lib/api-response'
import { redisCacheService, createCacheKey, withRedisCache } from '@/lib/cache/redis-cache.service'
import { debug, warn, logError } from '@/lib/logger'
import { UserService } from '@/lib/services/server/user-service'
import { getSupabaseAdmin } from '@/lib/supabase-client'
import { validateWithSchema, createDriverSchema, driverListQuerySchema } from '@/lib/validation/schemas'

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
    const searchParams = Object.fromEntries(request.nextUrl.searchParams)

    // Validar query parameters
    const queryValidation = validateWithSchema(driverListQuerySchema, searchParams)
    if (!queryValidation.success) {
      return validationErrorResponse(queryValidation.error)
    }

    const { page = 1, page_size = 20, search, transportadora_id, status } = queryValidation.data
    const limit = page_size
    const offset = (page - 1) * limit
    const isActive = status === 'active' ? true : status === 'inactive' ? false : undefined

    // ✅ Cache Redis para lista de motoristas (TTL: 3 minutos)
    // Criar chave de cache baseada nos filtros para cachear diferentes queries
    const cacheKeyParts = ['motoristas', 'list', page.toString(), limit.toString()]
    if (search) cacheKeyParts.push(`search:${search}`)
    if (transportadora_id) cacheKeyParts.push(`transportadora:${transportadora_id}`)
    if (isActive !== undefined) cacheKeyParts.push(`active:${isActive}`)
    const cacheKey = createCacheKey(...cacheKeyParts)

    const result = await withRedisCache(
      cacheKey,
      async () => {
        let query = supabase
          .from('users')
          .select('id, name, email, phone, cpf, role, transportadora_id, is_active, created_at, updated_at')
          .eq('role', 'motorista')
          .order('created_at', { ascending: false })

        // Aplicar filtros
        if (search) {
          query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%,cpf.ilike.%${search}%`)
        }

        if (transportadora_id) {
          query = query.eq('transportadora_id', transportadora_id)
        }

        if (isActive !== undefined) {
          query = query.eq('is_active', isActive)
        }

        // Paginação
        query = query.range(offset, offset + limit - 1)

        const { data, error } = await query

        if (error) {
          throw error
        }

        // Contar total (para paginação)
        let countQuery = supabase
          .from('users')
          .select('id', { count: 'exact', head: true })
          .eq('role', 'motorista')

        if (search) {
          countQuery = countQuery.or(`name.ilike.%${search}%,email.ilike.%${search}%,cpf.ilike.%${search}%`)
        }

        if (transportadora_id) {
          countQuery = countQuery.eq('transportadora_id', transportadora_id)
        }

        if (isActive !== undefined) {
          countQuery = countQuery.eq('is_active', isActive)
        }

        const { count } = await countQuery

        return {
          data: data || [],
          pagination: {
            page,
            limit,
            total: count || 0,
            totalPages: Math.ceil((count || 0) / limit),
          },
        }
      },
      180 // 3 minutos (dados mudam mais frequentemente)
    )

    return NextResponse.json({
      success: true,
      ...result,
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
    const body = await request.json()

    // Validar corpo da requisição
    const validation = validateWithSchema(createDriverSchema, body)
    if (!validation.success) {
      return validationErrorResponse(validation.error)
    }

    const validatedData = validation.data

    // Criar motorista no Auth e Tabela Users
    const newDriver = await UserService.createUser({
      name: validatedData.name,
      email: validatedData.email || '', // Email real ou vazio (mas UserService espera string)
      phone: validatedData.phone,
      cpf: validatedData.cpf,
      role: 'motorista',
      password: validatedData.cpf?.replace(/\D/g, '').slice(-6) || '123456',
      company_id: null,
      transportadora_id: validatedData.transportadora_id,
      cnh: validatedData.cnh,
      cnh_category: validatedData.cnh_category,
      address_zip_code: validatedData.address_zip_code ?? undefined,
      address_street: validatedData.address_street ?? undefined,
      address_number: validatedData.address_number ?? undefined,
      address_neighborhood: validatedData.address_neighborhood ?? undefined,
      address_complement: validatedData.address_complement ?? undefined,
      address_city: validatedData.address_city ?? undefined,
      address_state: validatedData.address_state ?? undefined,
      is_active: validatedData.is_active
    })

    return NextResponse.json({
      success: true,
      message: 'Motorista criado com sucesso',
      data: newDriver
    }, { status: 201 })

  } catch (error: unknown) {
    logError('Erro ao criar motorista', { error }, 'DriversAPI')
    return NextResponse.json(
      { error: 'Erro ao criar motorista', message: error instanceof Error ? error.message : 'Erro desconhecido' },
      { status: 500 }
    )
  }
}
