import { NextRequest, NextResponse } from 'next/server'
import { supabaseServiceRole } from '@/lib/supabase-server'
import { requireCompanyAccess, requireAuth, validateAuth } from '@/lib/api-auth'
import { z } from 'zod'
import { withRateLimit } from '@/lib/rate-limit'

const budgetSchema = z.object({
  company_id: z.string().uuid(),
  period_month: z.number().min(1).max(12),
  period_year: z.number().min(2020),
  category_id: z.string().uuid().optional().nullable(),
  amount_budgeted: z.number().min(0),
  notes: z.string().optional().nullable()
})

async function getBudgetsHandler(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const companyId = searchParams.get('company_id')
    const periodMonth = searchParams.get('period_month')
    const periodYear = searchParams.get('period_year')
    const categoryId = searchParams.get('category_id')

    // ✅ Validar autenticação primeiro (admin pode listar sem company_id)
    const authError = await requireAuth(request, ['admin', 'operator'])
    if (authError) {
      return authError
    }

    // Verificar se tabela existe antes de usar
    // Se não existir, retornar erro mais descritivo
    let query = supabaseServiceRole
      .from('gf_budgets')
      .select(`
        *,
        cost_category:gf_cost_categories(*)
      `)

    // Se há company_id, filtrar por ele e validar acesso
    if (companyId) {
      // ✅ Validar acesso à empresa específica
      const { user, error: companyError } = await requireCompanyAccess(request, companyId)
      if (companyError) {
        return companyError
      }
      query = query.eq('company_id', companyId)
    } else {
      // Se não há company_id, verificar se é admin (pode listar todos)
      const user = await validateAuth(request)
      if (!user || user.role !== 'admin') {
        return NextResponse.json(
          { 
            error: 'company_id é obrigatório',
            message: 'O parâmetro company_id é obrigatório para operadores. Admins podem omitir para listar todos os orçamentos.'
          },
          { status: 400 }
        )
      }
      // Admin pode listar sem filtro de company (lista todos)
    }

    query = query.order('period_year', { ascending: false })
      .order('period_month', { ascending: false })

    if (periodMonth) {
      query = query.eq('period_month', parseInt(periodMonth))
    }
    if (periodYear) {
      query = query.eq('period_year', parseInt(periodYear))
    }
    if (categoryId) {
      query = query.eq('category_id', categoryId)
    }

    const { data, error } = await query

    if (error) {
      console.error('Erro ao buscar orçamentos:', error)
      
      // Verificar se erro é porque tabela não existe
      if (error.message?.includes('does not exist') || error.message?.includes('relation') || error.message?.includes('table')) {
        return NextResponse.json(
          { 
            error: 'Tabela gf_budgets não encontrada',
            message: 'A tabela gf_budgets não existe no banco de dados. Execute a migração v44_costs_taxonomy.sql para criar a tabela.',
            hint: 'Execute o script database/scripts/verify_gf_budgets_schema.sql para criar a tabela'
          },
          { status: 500 }
        )
      }
      
      return NextResponse.json(
        { 
          error: error.message || 'Erro ao buscar orçamentos',
          details: process.env.NODE_ENV === 'development' ? error : undefined
        },
        { status: 500 }
      )
    }

    return NextResponse.json({ data: data || [] })
  } catch (error: any) {
    console.error('Erro ao buscar orçamentos:', error)
    return NextResponse.json(
      { error: error.message || 'Erro desconhecido' },
      { status: 500 }
    )
  }
}

async function createOrUpdateBudgetHandler(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Melhorar mensagens de erro de validação
    let validated
    try {
      validated = budgetSchema.parse(body)
    } catch (zodError: any) {
      if (zodError instanceof z.ZodError) {
        const missingFields: string[] = []
        const invalidFields: string[] = []
        
        zodError.errors.forEach((err) => {
          if (err.code === 'invalid_type' && err.received === 'undefined') {
            missingFields.push(err.path.join('.'))
          } else {
            invalidFields.push(`${err.path.join('.')}: ${err.message}`)
          }
        })
        
        let errorMessage = 'Dados inválidos'
        if (missingFields.length > 0) {
          errorMessage += `. Campos obrigatórios faltando: ${missingFields.join(', ')}`
        }
        if (invalidFields.length > 0) {
          errorMessage += `. Campos inválidos: ${invalidFields.join('; ')}`
        }
        
        // Adicionar hint sobre formato esperado
        errorMessage += '. Formato esperado: { company_id: string (UUID), period_month: number (1-12), period_year: number (>=2020), amount_budgeted: number (>=0), category_id?: string (UUID, opcional), notes?: string (opcional) }'
        
        return NextResponse.json(
          { 
            error: 'Dados inválidos',
            message: errorMessage,
            details: zodError.errors,
            expectedFormat: {
              company_id: 'string (UUID)',
              period_month: 'number (1-12)',
              period_year: 'number (>=2020)',
              amount_budgeted: 'number (>=0)',
              category_id: 'string (UUID, opcional)',
              notes: 'string (opcional)'
            }
          },
          { status: 400 }
        )
      }
      throw zodError
    }

    // ✅ Validar autenticação e acesso à empresa
    const { user, error: authError } = await requireCompanyAccess(request, validated.company_id)
    if (authError) {
      return authError
    }

    // Verificar se já existe orçamento para o mesmo período/categoria
    const { data: existing } = await supabaseServiceRole
      .from('gf_budgets')
      .select('id')
      .eq('company_id', validated.company_id)
      .eq('period_month', validated.period_month)
      .eq('period_year', validated.period_year)
      .eq('category_id', validated.category_id || null)
      .single()

    let result
    if (existing) {
      // Atualizar existente
      const { data, error } = await supabaseServiceRole
        .from('gf_budgets')
        .update({
          amount_budgeted: validated.amount_budgeted,
          notes: validated.notes,
          updated_at: new Date().toISOString()
        })
        .eq('id', existing.id)
        .select()
        .single()

      if (error) {
        console.error('Erro ao atualizar orçamento:', error)
        if (error.message?.includes('does not exist') || error.message?.includes('relation') || error.message?.includes('table')) {
          return NextResponse.json(
            { 
              error: 'Tabela gf_budgets não encontrada',
              message: 'A tabela gf_budgets não existe no banco de dados. Execute a migração v44_costs_taxonomy.sql para criar a tabela.',
              hint: 'Execute o script database/scripts/verify_gf_budgets_schema.sql para criar a tabela'
            },
            { status: 500 }
          )
        }
        throw error
      }
      result = data
    } else {
      // Criar novo
      const { data, error } = await supabaseServiceRole
        .from('gf_budgets')
        .insert({
          company_id: validated.company_id,
          period_month: validated.period_month,
          period_year: validated.period_year,
          category_id: validated.category_id || null,
          amount_budgeted: validated.amount_budgeted,
          notes: validated.notes || null,
          created_by: user.id
        })
        .select()
        .single()

      if (error) {
        console.error('Erro ao criar orçamento:', error)
        if (error.message?.includes('does not exist') || error.message?.includes('relation') || error.message?.includes('table')) {
          return NextResponse.json(
            { 
              error: 'Tabela gf_budgets não encontrada',
              message: 'A tabela gf_budgets não existe no banco de dados. Execute a migração v44_costs_taxonomy.sql para criar a tabela.',
              hint: 'Execute o script database/scripts/verify_gf_budgets_schema.sql para criar a tabela'
            },
            { status: 500 }
          )
        }
        throw error
      }
      result = data
    }

    return NextResponse.json({ success: true, data: result }, { status: existing ? 200 : 201 })
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: error.errors },
        { status: 400 }
      )
    }
    console.error('Erro ao salvar orçamento:', error)
    return NextResponse.json(
      { 
        error: error.message || 'Erro desconhecido',
        details: process.env.NODE_ENV === 'development' ? error : undefined
      },
      { status: 500 }
    )
  }
}

async function deleteBudgetHandler(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const budgetId = searchParams.get('id')

    if (!budgetId) {
      return NextResponse.json(
        { error: 'id é obrigatório' },
        { status: 400 }
      )
    }

    // Buscar budget para obter company_id
    const { data: budget, error: fetchError } = await supabaseServiceRole
      .from('gf_budgets')
      .select('company_id')
      .eq('id', budgetId)
      .single()

    if (fetchError || !budget) {
      return NextResponse.json(
        { error: 'Orçamento não encontrado' },
        { status: 404 }
      )
    }

    // ✅ Validar autenticação e acesso à empresa
    const { user, error: authError } = await requireCompanyAccess(request, budget.company_id)
    if (authError) {
      return authError
    }

    const { error } = await supabaseServiceRole
      .from('gf_budgets')
      .delete()
      .eq('id', budgetId)

    if (error) {
      console.error('Erro ao deletar orçamento:', error)
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Erro ao deletar orçamento:', error)
    return NextResponse.json(
      { error: error.message || 'Erro desconhecido' },
      { status: 500 }
    )
  }
}

export const GET = withRateLimit(getBudgetsHandler, 'api')
export const POST = withRateLimit(createOrUpdateBudgetHandler, 'sensitive')
export const DELETE = withRateLimit(deleteBudgetHandler, 'sensitive')

