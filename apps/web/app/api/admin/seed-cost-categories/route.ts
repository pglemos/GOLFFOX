import { NextRequest, NextResponse } from 'next/server'

import { requireAuth } from '@/lib/api-auth'
import { logger, logError } from '@/lib/logger'
import { withRateLimit } from '@/lib/rate-limit'
import { getSupabaseAdmin } from '@/lib/supabase-server'
import type { Database } from '@/types/supabase'
import { validateWithSchema, seedCostCategoriesPostSchema } from '@/lib/validation/schemas'
import { validationErrorResponse } from '@/lib/api-response'

type GfCostCategoriesInsert = Database['public']['Tables']['gf_cost_categories']['Insert']

/**
 * Endpoint para popular categorias de custo essenciais
 * Útil para testes e configuração inicial
 * REQUER AUTENTICAÇÃO ADMIN
 */

const ESSENTIAL_CATEGORIES = [
  {
    id: 'a1b2c3d4-e5f6-7890-1234-567890abcdef',
    name: 'Combustível',
    description: 'Custos relacionados a combustível',
    is_active: true,
  },
  {
    id: 'b2c3d4e5-f6a7-8901-2345-67890abcdef0',
    name: 'Manutenção',
    description: 'Custos de manutenção de veículos',
    is_active: true,
  },
  {
    id: 'c3d4e5f6-a7b8-9012-3456-7890abcdef01',
    name: 'Seguro',
    description: 'Custos de seguro de veículos',
    is_active: true,
  },
  {
    id: 'd4e5f6a7-b8c9-0123-4567-890abcdef012',
    name: 'Pedágio',
    description: 'Custos de pedágios',
    is_active: true,
  },
  {
    id: 'e5f6a7b8-c9d0-1234-5678-90abcdef0123',
    name: 'Licenciamento',
    description: 'Custos de licenciamento e documentação',
    is_active: true,
  },
]

async function seedCostCategoriesHandler(request: NextRequest) {
  try {
    // Validar autenticação (apenas admin)
    const authErrorResponse = await requireAuth(request, 'admin')
    if (authErrorResponse) return authErrorResponse

    const body = await request.json().catch(() => ({}))

    // Validar corpo
    const validation = validateWithSchema(seedCostCategoriesPostSchema, body)
    if (!validation.success) {
      return validationErrorResponse(validation.error)
    }

    const { categories: customCategories } = validation.data
    const categoriesToSeed = customCategories || ESSENTIAL_CATEGORIES

    const supabase = getSupabaseAdmin()

    // Verificar se tabela existe
    const { error: tableCheckError } = await supabase
      .from('gf_cost_categories')
      .select('id', { head: true, count: 'exact' })
      .limit(1)

    if (tableCheckError && tableCheckError.message?.includes('does not exist')) {
      return NextResponse.json(
        {
          error: 'Tabela gf_cost_categories não existe',
          message: 'Execute as migrations do banco de dados primeiro',
          hint: 'psql $DATABASE_URL -f database/seeds/essential_cost_categories.sql',
        },
        { status: 500 }
      )
    }

    // Inserir categorias (upsert para evitar duplicatas)
    const results = []
    for (const category of categoriesToSeed) {
      const { data, error } = await supabase
        .from('gf_cost_categories')
        .upsert(category as GfCostCategoriesInsert, { onConflict: 'id' })
        .select()

      if (error) {
        results.push({
          category: category.name,
          status: 'error',
          error: error.message,
        })
      } else {
        results.push({
          category: category.name,
          status: 'success',
          data: data?.[0],
        })
      }
    }

    const successCount = results.filter((r) => r.status === 'success').length
    const failCount = results.filter((r) => r.status === 'error').length

    return NextResponse.json({
      success: true,
      message: `${successCount} categorias inseridas/atualizadas com sucesso`,
      total: categoriesToSeed.length,
      successCount,
      failCount,
      results,
    })
  } catch (error: unknown) {
    logError('Erro ao popular categorias de custo', { error }, 'SeedCostCategoriesAPI')
    return NextResponse.json(
      {
        error: 'Erro ao popular categorias de custo',
        details: error instanceof Error ? error.message : 'Erro desconhecido',
      },
      { status: 500 }
    )
  }
}

async function getCostCategoriesHandler() {
  try {
    const supabase = getSupabaseAdmin()

    const { data, error, count } = await supabase
      .from('gf_cost_categories')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: true })

    if (error) {
      return NextResponse.json(
        { error: 'Erro ao buscar categorias', details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      count: count ?? 0,
      categories: data,
    })
  } catch (error: unknown) {
    logger.error('Erro ao buscar categorias', { error })
    return NextResponse.json(
      {
        error: 'Erro ao buscar categorias',
        details: error instanceof Error ? error.message : 'Erro desconhecido',
      },
      { status: 500 }
    )
  }
}

// Exportar com rate limiting e autenticação
export const POST = withRateLimit(seedCostCategoriesHandler, 'sensitive')
export const GET = withRateLimit(getCostCategoriesHandler, 'api')

