import { NextRequest, NextResponse } from 'next/server'

import { createClient } from '@supabase/supabase-js'

import { requireAuth } from '@/lib/api-auth'
import { createCacheKey, withRedisCache } from '@/lib/cache/redis-cache.service'
import { info, logError, logger } from '@/lib/logger'
import { validateWithSchema, companyListQuerySchema } from '@/lib/validation/schemas'
import { validationErrorResponse } from '@/lib/api-response'

export const runtime = 'nodejs'

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !serviceKey) {
    throw new Error('Supabase não configurado')
  }
  return createClient(url, serviceKey)
}

export async function GET(request: NextRequest) {
  try {
    const authErrorResponse = await requireAuth(request, 'admin')
    if (authErrorResponse) return authErrorResponse

    const { searchParams } = new URL(request.url)
    const queryParams = Object.fromEntries(searchParams.entries())

    // Validar query params
    const validation = validateWithSchema(companyListQuerySchema, queryParams)
    if (!validation.success) {
      return validationErrorResponse(validation.error)
    }

    const supabaseAdmin = getSupabaseAdmin()

    // ✅ Cache Redis para lista de empresas (TTL: 5 minutos)
    const cacheKey = createCacheKey('empresas', 'list')

    const result = await withRedisCache(
      cacheKey,
      async () => {
        // Buscar TODAS as empresas primeiro (sem filtro)
        let { data, error } = await supabaseAdmin
          .from('empresas')
          .select('id, name, is_active')

        // Se houver erro, tentar com seleção mínima
        if (error) {
          logger.warn('⚠️ Erro na busca inicial, tentando com seleção mínima:', error.message)
          const result = await supabaseAdmin
            .from('empresas')
            .select('id, name, is_active')

          data = result.data?.map((c: any) => ({ ...c, is_active: c.is_active ?? true })) || null
          error = result.error
        }

        // Filtrar empresas inativas se a coluna existir (sem usar .eq() na query)
        if (data && !error) {
          // Tentar filtrar is_active se existir na resposta
          const activeCompanies = data.filter((c: any) => {
            return c.is_active !== false
          })

          // Ordenar por nome manualmente
          activeCompanies.sort((a: any, b: any) => {
            const nameA = (a.name || '').toLowerCase()
            const nameB = (b.name || '').toLowerCase()
            return nameA.localeCompare(nameB)
          })

          data = activeCompanies
        }

        if (error) throw error

        // Garantir que os dados estão no formato correto
        return (data || []).map((c: any) => ({
          id: c.id,
          name: c.name || 'Sem nome'
        })).filter((c: any) => c.id && c.name)
      },
      300 // 5 minutos
    )

    if (process.env.NODE_ENV === 'development') {
      info(`✅ ${result.length} empresas encontradas`)
    }

    return NextResponse.json({
      success: true,
      companies: result
    })
  } catch (error: unknown) {
    const err = error as { message?: string }
    logError('Erro ao listar empresas', { error }, 'CompaniesListAPI')
    return NextResponse.json(
      { success: false, error: 'Erro ao listar empresas', message: err.message },
      { status: 500 }
    )
  }
}

