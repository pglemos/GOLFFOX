import { NextRequest, NextResponse } from 'next/server'

import { logError } from '@/lib/logger'
import { getSupabaseAdmin } from '@/lib/supabase-client'
import type { Database } from '@/types/supabase'

type CostsVsBudgetRow = Database['public']['Views']['v_costs_vs_budget']['Row']

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const companyId = searchParams.get('company_id')

    if (!companyId) {
      return NextResponse.json(
        { error: 'company_id é obrigatório' },
        { status: 400 }
      )
    }

    // Buscar dados da view v_costs_vs_budget (view materializada - selecionar apenas colunas usadas)
    const supabase = getSupabaseAdmin()
    const { data, error } = await supabase
      .from('v_costs_vs_budget')
      .select('company_id, period_year, period_month, budgeted_amount, actual_amount, variance_percent, variance_absolute')
      .eq('company_id', companyId)
      .order('period_year', { ascending: false })
      .order('period_month', { ascending: false })

    if (error) {
      logError('Erro ao buscar dados de orçamento vs realizado', { error, companyId }, 'CostsVsBudgetAPI')
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ data: data || [] })
  } catch (err) {
    logError('Erro ao buscar dados de orçamento vs realizado', { error: err, companyId: request.nextUrl.searchParams.get('company_id') }, 'CostsVsBudgetAPI')
    const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido'
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    )
  }
}

