import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { requireAuth } from '@/lib/api-auth'

export const runtime = 'nodejs'

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !serviceKey) {
    throw new Error('Supabase não configurado')
  }
  return createClient(url, serviceKey)
}

export async function DELETE(request: NextRequest) {
  try {
    const isDevelopment = process.env.NODE_ENV === 'development'
    const authErrorResponse = await requireAuth(request, 'admin')
    if (authErrorResponse && !isDevelopment) {
      return authErrorResponse
    }
    if (authErrorResponse && isDevelopment) {
      console.warn('⚠️ Autenticação falhou em desenvolvimento, mas continuando...')
    }

    const { searchParams } = new URL(request.url)
    const companyId = searchParams.get('id')

    if (!companyId) {
      return NextResponse.json(
        { error: 'ID da empresa é obrigatório' },
        { status: 400 }
      )
    }

    const supabaseAdmin = getSupabaseAdmin()

    // Excluir empresa permanentemente do banco de dados
    // As foreign keys com ON DELETE CASCADE vão excluir automaticamente:
    // - routes (rotas)
    // - gf_employee_company (funcionários)
    // - gf_user_company_map (mapeamentos usuário-empresa)
    // - gf_route_optimization_cache (cache de otimização)
    // - gf_report_schedules (agendamentos de relatórios)
    // - gf_costs (custos)
    // - gf_budgets (orçamentos)
    // A tabela users tem ON DELETE SET NULL, então apenas seta company_id para NULL
    
    console.log(`🗑️ Tentando excluir empresa: ${companyId}`)
    
    const { data, error } = await supabaseAdmin
      .from('companies')
      .delete()
      .eq('id', companyId)
      .select()

    if (error) {
      console.error('❌ Erro ao excluir empresa:', error)
      console.error('Detalhes do erro:', JSON.stringify(error, null, 2))
      return NextResponse.json(
        { 
          error: 'Erro ao excluir empresa', 
          message: error.message,
          details: error.details || error.hint || 'Sem detalhes adicionais',
          code: error.code
        },
        { status: 500 }
      )
    }

    console.log(`✅ Empresa excluída com sucesso: ${companyId}`, data)

    return NextResponse.json({
      success: true,
      message: 'Empresa excluída com sucesso'
    })
  } catch (error: any) {
    console.error('Erro ao excluir empresa:', error)
    return NextResponse.json(
      { error: 'Erro ao excluir empresa', message: error.message },
      { status: 500 }
    )
  }
}

