import { NextRequest, NextResponse } from 'next/server'
import { supabaseServiceRole } from '@/lib/supabase-server'

export async function GET(request: NextRequest) {
  try {
    const { data, error } = await supabaseServiceRole
      .from('gf_cost_categories')
      .select('*')
      .eq('is_active', true)
      .order('group_name')
      .order('category')
      .order('subcategory')

    if (error) {
      console.error('Erro ao buscar categorias:', error)
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json(data || [])
  } catch (error: any) {
    console.error('Erro ao buscar categorias:', error)
    return NextResponse.json(
      { error: error.message || 'Erro desconhecido' },
      { status: 500 }
    )
  }
}

