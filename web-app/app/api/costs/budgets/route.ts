import { NextRequest, NextResponse } from 'next/server'
import { supabaseServiceRole } from '@/lib/supabase-server'
import { requireCompanyAccess } from '@/lib/api-auth'
import { z } from 'zod'

const budgetSchema = z.object({
  company_id: z.string().uuid(),
  period_month: z.number().min(1).max(12),
  period_year: z.number().min(2020),
  category_id: z.string().uuid().optional().nullable(),
  amount_budgeted: z.number().min(0),
  notes: z.string().optional().nullable()
})

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const companyId = searchParams.get('company_id')
    const periodMonth = searchParams.get('period_month')
    const periodYear = searchParams.get('period_year')
    const categoryId = searchParams.get('category_id')

    if (!companyId) {
      return NextResponse.json(
        { error: 'company_id é obrigatório' },
        { status: 400 }
      )
    }

    // ✅ Validar autenticação e acesso à empresa
    const { user, error: authError } = await requireCompanyAccess(request, companyId)
    if (authError) {
      return authError
    }

    let query = supabaseServiceRole
      .from('gf_budgets')
      .select(`
        *,
        cost_category:gf_cost_categories(*)
      `)
      .eq('company_id', companyId)
      .order('period_year', { ascending: false })
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
      return NextResponse.json(
        { error: error.message },
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

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validated = budgetSchema.parse(body)

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

      if (error) throw error
      result = data
    } else {
      // Criar novo
      const { data, error } = await supabaseServiceRole
        .from('gf_budgets')
        .insert({
          ...validated,
          created_by: request.headers.get('x-user-id') || null
        })
        .select()
        .single()

      if (error) throw error
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
      { error: error.message || 'Erro desconhecido' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
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

