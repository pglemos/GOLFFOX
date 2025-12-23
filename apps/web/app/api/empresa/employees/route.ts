import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/api-auth'
import { logger, logError } from '@/lib/logger'
import { getSupabaseAdmin } from '@/lib/supabase-client'

export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  try {
    const { validateAuth } = await import('@/lib/api-auth')
    const authenticatedUser = await validateAuth(request)
    
    logger.log('🔍 [API /api/operador/employees] validateAuth resultado:', {
      hasUser: !!authenticatedUser,
      userId: authenticatedUser?.id,
      role: authenticatedUser?.role,
      companyId: authenticatedUser?.companyId
    })
    
    if (!authenticatedUser) {
      logger.warn('⚠️ [API /api/operador/employees] Usuário não autenticado')
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const companyId = searchParams.get('company_id')
    const page = parseInt(searchParams.get('page') || '1')
    const pageSize = parseInt(searchParams.get('pageSize') || '50')
    const searchQuery = searchParams.get('search') || ''

    // Se é operador, usar o company_id dele se não fornecido
    let finalCompanyId = companyId
    if (!finalCompanyId && (authenticatedUser.role === 'gestor_transportadora' || authenticatedUser.role === 'operador')) {
      finalCompanyId = authenticatedUser.companyId || null
      
      // Se ainda não tem, buscar do banco
      if (!finalCompanyId && authenticatedUser.id) {
        const supabase = getSupabaseAdmin()
        const { data: userData } = await supabase
          .from('users')
          .select('company_id')
          .eq('id', authenticatedUser.id)
          .single()
        finalCompanyId = userData?.company_id || null
      }
    }

    if (!finalCompanyId) {
      return NextResponse.json(
        { error: 'company_id é obrigatório' },
        { status: 400 }
      )
    }

    const supabase = getSupabaseAdmin()

    // Debug: Verificar todos os registros na tabela
    const { data: allEmployees, error: debugError } = await supabase
      .from('gf_employee_company')
      .select('id, company_id, name, email')
      .limit(10)
    
    logger.log('🔍 [API /api/operador/employees] Debug - Todos os registros na tabela:', {
      totalFound: allEmployees?.length || 0,
      employees: allEmployees,
      error: debugError?.message
    })

    let query = supabase
      .from('gf_employee_company')
      .select('id, company_id, name, cpf, email, phone, is_active, address', { count: 'exact' })
      .eq('company_id', finalCompanyId)

    if (searchQuery) {
      query = query.or(
        `name.ilike.%${searchQuery}%,email.ilike.%${searchQuery}%,cpf.ilike.%${searchQuery}%`
      )
    }

    query = query
      .order('name', { ascending: true })
      .range((page - 1) * pageSize, page * pageSize - 1)

    const { data, error, count } = await query

    logger.log('🔍 [API /api/operador/employees] Resultado:', {
      companyId: finalCompanyId,
      dataLength: data?.length,
      count,
      error: error?.message,
      firstItem: data?.[0]
    })

    if (error) {
      logError('[API /api/operador/employees] Erro', { error }, 'EmployeesAPI')
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      data: data || [],
      count: count || 0,
      totalPages: Math.ceil((count || 0) / pageSize),
      page,
      pageSize
    })
  } catch (error: any) {
    logError('[API /api/operador/employees] Erro inesperado', { error }, 'EmployeesAPI')
    return NextResponse.json(
      { error: error.message || 'Erro desconhecido' },
      { status: 500 }
    )
  }
}

