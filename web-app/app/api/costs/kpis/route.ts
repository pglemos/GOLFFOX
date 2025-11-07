import { NextRequest, NextResponse } from 'next/server'
import { supabaseServiceRole } from '@/lib/supabase-server'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const companyId = searchParams.get('company_id')
    const period = searchParams.get('period') || '30' // 30 ou 90 dias

    if (!companyId) {
      return NextResponse.json(
        { error: 'company_id é obrigatório' },
        { status: 400 }
      )
    }

    // Buscar KPIs da view
    const { data, error } = await supabaseServiceRole
      .from('v_costs_kpis')
      .select('*')
      .eq('company_id', companyId)
      .single()

    if (error) {
      console.error('Erro ao buscar KPIs de custos:', error)
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }

    // Adicionar variação vs orçamento se houver
    const periodDays = period === '90' ? 90 : 30
    const { data: budgetData } = await supabaseServiceRole
      .from('v_costs_vs_budget')
      .select('budgeted_amount, actual_amount, variance_percent')
      .eq('company_id', companyId)
      .gte('period_year', new Date().getFullYear())
      .limit(1)
      .single()

    const response = {
      ...data,
      budget_variance: budgetData ? {
        budgeted: budgetData.budgeted_amount || 0,
        actual: budgetData.actual_amount || 0,
        variance_percent: budgetData.variance_percent || 0,
        variance_absolute: (budgetData.actual_amount || 0) - (budgetData.budgeted_amount || 0)
      } : null,
      period_days: parseInt(period)
    }

    return NextResponse.json(response)
  } catch (error: any) {
    console.error('Erro ao buscar KPIs de custos:', error)
    return NextResponse.json(
      { error: error.message || 'Erro desconhecido' },
      { status: 500 }
    )
  }
}

