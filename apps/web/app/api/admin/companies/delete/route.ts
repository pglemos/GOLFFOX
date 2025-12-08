import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { requireAuth } from '@/lib/api-auth'
import { logger } from '@/lib/logger'
import { invalidateEntityCache } from '@/lib/next-cache'

export const runtime = 'nodejs'

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !serviceKey) {
    throw new Error('Supabase não configurado')
  }
  return createClient(url, serviceKey)
}

// Aceitar tanto DELETE quanto POST para compatibilidade
export async function DELETE(request: NextRequest) {
  return handleDelete(request)
}

export async function POST(request: NextRequest) {
  return handleDelete(request)
}

async function handleDelete(request: NextRequest) {
  try {
    const authErrorResponse = await requireAuth(request, 'admin')
    if (authErrorResponse) {
      return authErrorResponse
    }

    // Aceitar tanto query param quanto body
    const { searchParams } = new URL(request.url)
    let companyId = searchParams.get('id')
    
    // Se não estiver na query, tentar no body
    if (!companyId) {
      try {
        const body = await request.json()
        companyId = body.id || body.company_id
      } catch (e) {
        // Body vazio ou inválido, continuar com null
      }
    }

    if (!companyId) {
      return NextResponse.json(
        { error: 'ID da empresa é obrigatório' },
        { status: 400 }
      )
    }

    const supabaseAdmin = getSupabaseAdmin()

    logger.log(`🗑️ Tentando excluir empresa permanentemente: ${companyId}`)

    // ORDEM CRÍTICA DE EXCLUSÃO:
    // 1. Atualizar users para setar company_id = NULL (pode não ter ON DELETE SET NULL)
    logger.log('   1. Atualizando users (setando company_id para NULL)...')
    const { error: usersUpdateError } = await supabaseAdmin
      .from('users')
      .update({ company_id: null })
      .eq('company_id', companyId)

    if (usersUpdateError) {
      console.error('❌ Erro ao atualizar users:', usersUpdateError)
      return NextResponse.json(
        { 
          error: 'Erro ao atualizar usuários da empresa', 
          message: usersUpdateError.message,
          details: usersUpdateError.details || usersUpdateError.hint,
          code: usersUpdateError.code
        },
        { status: 500 }
      )
    }
    logger.log('   ✅ Users atualizados')

    // 2. Excluir dependências que podem ter CASCADE mas vamos excluir explicitamente para garantir
    logger.log('   2. Excluindo dependências...')
    
    // Excluir routes (e suas dependências serão excluídas via CASCADE)
    const { error: routesError } = await supabaseAdmin
      .from('routes')
      .delete()
      .eq('company_id', companyId)

    if (routesError && routesError.code !== '42P01') {
      console.error('❌ Erro ao excluir routes:', routesError)
      return NextResponse.json(
        { error: 'Erro ao excluir rotas da empresa', message: routesError.message },
        { status: 500 }
      )
    }

    // Excluir outras dependências
    const dependentTables = [
      'gf_employee_company',
      'gf_user_company_map',
      'gf_route_optimization_cache',
      'gf_report_schedules',
      'gf_costs',
      'gf_budgets',
      'gf_company_branding',
      'gf_service_requests' // Pode usar empresa_id ou company_id
    ]

    for (const table of dependentTables) {
      // Algumas tabelas podem usar empresa_id em vez de company_id
      const columnName = table === 'gf_service_requests' ? 'empresa_id' : 'company_id'
      
      const { error: depError } = await supabaseAdmin
        .from(table)
        .delete()
        .eq(columnName, companyId)

      if (depError && depError.code !== '42P01' && depError.code !== '42703') {
        console.error(`❌ Erro ao excluir ${table}:`, depError)
        // Não retornar erro fatal, algumas tabelas podem não existir
      }
    }
    logger.log('   ✅ Dependências excluídas')

    // 3. Excluir empresa permanentemente
    logger.log('   3. Excluindo empresa...')
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

    // Invalidar cache após exclusão
    await invalidateEntityCache('company', companyId)

    logger.log(`✅ Empresa excluída com sucesso: ${companyId}`, data)

    return NextResponse.json({
      success: true,
      message: 'Empresa excluída com sucesso'
    })
  } catch (err) {
    console.error('Erro ao excluir empresa:', err)
    const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido'
    return NextResponse.json(
      { error: 'Erro ao excluir empresa', message: errorMessage },
      { status: 500 }
    )
  }
}

