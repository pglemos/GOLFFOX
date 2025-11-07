import { NextRequest, NextResponse } from 'next/server'
import { supabaseServiceRole } from '@/lib/supabase-server'

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

    // Buscar dados da view v_costs_vs_budget
    const { data, error } = await supabaseServiceRole
      .from('v_costs_vs_budget')
      .select('*')
      .eq('company_id', companyId)
      .order('period_year', { ascending: false })
      .order('period_month', { ascending: false })

    if (error) {
      console.error('Erro ao buscar dados de orçamento vs realizado:', error)
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ data: data || [] })
  } catch (error: any) {
    console.error('Erro ao buscar dados de orçamento vs realizado:', error)
    return NextResponse.json(
      { error: error.message || 'Erro desconhecido' },
      { status: 500 }
    )
  }
}

