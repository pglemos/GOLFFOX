import { NextRequest, NextResponse } from 'next/server'
import { supabaseServiceRole } from '@/lib/supabase-server'

export async function GET(request: NextRequest) {
  try {
    // Verificar se a tabela existe antes de fazer a query
    // Selecionar apenas colunas necessárias para listagem
    const categoryColumns = 'id,group_name,category,subcategory,description,is_active,created_at,updated_at'
    const { data, error } = await supabaseServiceRole
      .from('gf_cost_categories')
      .select(categoryColumns)

    if (error) {
      console.error('Erro ao buscar categorias:', error)
      
      // Se a tabela não existe, retornar array vazio ao invés de erro
      if (error.message?.includes('does not exist') || 
          error.message?.includes('relation') || 
          error.message?.includes('table')) {
        return NextResponse.json(
          { 
            error: 'Tabela gf_cost_categories não encontrada',
            message: 'A tabela gf_cost_categories não existe no banco de dados. Execute a migração v44_costs_taxonomy.sql para criar a tabela.',
            hint: 'Execute o script database/scripts/verify_gf_budgets_schema.sql para criar a tabela',
            data: [] // Retornar array vazio para não quebrar a UI
          },
          { status: 200 } // Retornar 200 com array vazio para não quebrar a UI
        )
      }
      
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }

    const filtered = (data || []).filter((cat: { is_active?: boolean }) => (cat.is_active === undefined ? true : cat.is_active === true))
    const sorted = filtered.sort((a: { group_name?: string; category?: string; subcategory?: string }, b: { group_name?: string; category?: string; subcategory?: string }) => {
      const gA = (a.group_name || '').localeCompare(b.group_name || '')
      if (gA !== 0) return gA
      const cA = (a.category || '').localeCompare(b.category || '')
      if (cA !== 0) return cA
      return (a.subcategory || '').localeCompare(b.subcategory || '')
    })

    return NextResponse.json(sorted)
  } catch (err) {
    console.error('Erro ao buscar categorias:', err)
    const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido'
    return NextResponse.json(
      { 
        error: errorMessage,
        data: [] // Retornar array vazio para não quebrar a UI
      },
      { status: 200 } // Retornar 200 com array vazio para não quebrar a UI
    )
  }
}

