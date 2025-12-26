import { NextRequest, NextResponse } from 'next/server'

import { requireAuth } from '@/lib/api-auth'
import { successResponse, errorResponse, validationErrorResponse } from '@/lib/api-response'
import { createCacheKey, withRedisCache } from '@/lib/cache/redis-cache.service'
import { logError } from '@/lib/logger'
import { supabaseServiceRole } from '@/lib/supabase-server'
import { validateWithSchema, carrierListQuerySchema } from '@/lib/validation/schemas'

export const runtime = 'nodejs'

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  })
}

export async function GET(req: NextRequest) {
  try {
    const authErrorResponse = await requireAuth(req, 'admin')
    if (authErrorResponse) return authErrorResponse

    const { searchParams } = new URL(req.url)
    const queryParams = Object.fromEntries(searchParams.entries())

    // Validar query params
    const validation = validateWithSchema(carrierListQuerySchema, queryParams)
    if (!validation.success) {
      return validationErrorResponse(validation.error)
    }

    // ✅ Cache Redis para lista de transportadoras (TTL: 5 minutos)
    const cacheKey = createCacheKey('transportadoras', 'list')

    const data = await withRedisCache(
      cacheKey,
      async () => {
        // Selecionar apenas colunas principais usadas
        const { data, error } = await (supabaseServiceRole
          .from('transportadoras')
          .select('id, name, cnpj, email, phone, contact_person, address, address_city, address_state, address_zip_code, is_active, created_at, updated_at')
          .order('name', { ascending: true }))

        if (error) {
          logError('Erro ao buscar transportadoras', { error }, 'TransportadorasListAPI')
          throw error
        }

        return data || []
      },
      300 // 5 minutos
    )

    return successResponse(data)
  } catch (err) {
    return errorResponse(err, 500, 'Erro ao processar requisição')
  }
}
