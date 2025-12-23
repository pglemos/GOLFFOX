import { NextRequest, NextResponse } from 'next/server'

import { createClient } from '@supabase/supabase-js'

import { requireAuth } from '@/lib/api-auth'
import { logError, debug } from '@/lib/logger'

export const runtime = 'nodejs'

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !serviceKey) {
    throw new Error('Supabase não configurado')
  }
  return createClient(url, serviceKey)
}

export async function GET(request: NextRequest) {
  try {
    // Validar autenticação (apenas admin)
    const authErrorResponse = await requireAuth(request, 'admin')
    if (authErrorResponse) {
      return authErrorResponse
    }

    const supabaseAdmin = getSupabaseAdmin()
    const { searchParams } = new URL(request.url)
    const companyId = searchParams.get('company_id')

    // Buscar funcionários da tabela gf_employee_company
    // A tabela existe e tem 57 registros segundo o relatório de análise
    // Usar service role key que bypassa RLS
    
    // Primeiro, verificar se há dados na tabela gf_employee_company
    let query = supabaseAdmin
      .from('gf_employee_company')
      .select('*', { count: 'exact' })
      .order('name', { ascending: true })

    if (companyId) {
      query = query.eq('company_id', companyId)
    }

    const { data, error, count } = await query
    
    // Se não há dados em gf_employee_company, tentar buscar na tabela users
    let finalData = data
    const finalError = error
    let finalCount = count
    
    if ((!data || data.length === 0) && !error) {
      console.log('⚠️ [EmployeesListAPI] Tabela gf_employee_company vazia, tentando buscar na tabela users...')
      
      let usersQuery = supabaseAdmin
        .from('users')
        .select('id, name, email, phone, company_id, role, is_active', { count: 'exact' })
        .in('role', ['gestor_empresa', 'funcionario'])
        .order('name', { ascending: true })
      
      if (companyId) {
        usersQuery = usersQuery.eq('company_id', companyId)
      }
      
      const { data: usersData, error: usersError, count: usersCount } = await usersQuery
      
      if (!usersError && usersData && usersData.length > 0) {
        console.log(`✅ [EmployeesListAPI] Encontrados ${usersData.length} funcionários na tabela users`)
        finalData = usersData
        finalCount = usersCount
      } else {
        console.log('⚠️ [EmployeesListAPI] Nenhum funcionário encontrado na tabela users também', {
          error: usersError?.message,
          count: usersCount
        })
      }
    }

    console.log('🔍 [EmployeesListAPI] Query resultado:', {
      count: finalData?.length || 0,
      totalCount: finalCount,
      error: finalError?.message,
      errorCode: finalError?.code,
      errorDetails: finalError?.details,
      errorHint: finalError?.hint,
      firstItem: finalData?.[0],
      hasData: !!finalData,
      dataIsArray: Array.isArray(finalData),
      source: finalData === data ? 'gf_employee_company' : 'users'
    })

    if (finalError) {
      console.error('❌ [EmployeesListAPI] Erro na query:', {
        error: finalError.message,
        code: finalError.code,
        details: finalError.details,
        hint: finalError.hint,
        companyId
      })
      logError('Erro ao buscar funcionários no admin API', { error: finalError, companyId }, 'EmployeesListAPI')
      return NextResponse.json({ 
        success: false, 
        error: finalError.message,
        errorCode: finalError.code,
        errorDetails: finalError.details,
        errorHint: finalError.hint
      }, { status: 500 })
    }

    // Se não há dados, retornar vazio com informações de debug
    if (!finalData || finalData.length === 0) {
      console.log('⚠️ [EmployeesListAPI] Nenhum funcionário encontrado', {
        totalCount: finalCount,
        hasData: !!finalData,
        dataType: typeof finalData,
        companyId: companyId || 'todas',
        checkedTables: ['gf_employee_company', 'users']
      })
      
      // Retornar informações de debug em desenvolvimento
      if (process.env.NODE_ENV === 'development') {
        return NextResponse.json([], {
          headers: {
            'X-Debug-Info': JSON.stringify({
              message: 'Nenhum funcionário encontrado',
              totalCount: finalCount,
              companyId: companyId || 'todas',
              checkedTables: ['gf_employee_company', 'users']
            })
          }
        })
      }
      
      return NextResponse.json([])
    }

    console.log('✅ [EmployeesListAPI] Funcionários encontrados:', {
      count: finalData.length,
      totalCount: finalCount,
      firstItem: finalData[0],
      source: finalData === data ? 'gf_employee_company' : 'users'
    })

    // Buscar nomes das empresas separadamente
    const companyIds = [...new Set((finalData || []).map((emp: any) => emp.company_id).filter(Boolean))]
    const companiesMap = new Map<string, string>()
    
    if (companyIds.length > 0) {
      const { data: companiesData } = await supabaseAdmin
        .from('companies')
        .select('id, name')
        .in('id', companyIds)
      
      if (companiesData) {
        companiesData.forEach((c: any) => {
          companiesMap.set(c.id, c.name)
        })
      }
    }

    // Transformar para o formato esperado pela página
    const employees = (finalData || []).map((emp: any) => ({
      id: emp.id,
      employee_id: emp.id,
      company_id: emp.company_id,
      company_name: companiesMap.get(emp.company_id) || '',
      name: emp.name || '',
      first_name: emp.name?.split(' ')[0] || '',
      last_name: emp.name?.split(' ').slice(1).join(' ') || '',
      email: emp.email || '',
      phone: emp.phone || '',
      cpf: emp.cpf || emp.login_cpf || '',
      role: 'funcionario',
      address: emp.address || '',
      city: '',
      state: '',
      zipcode: '',
      lat: emp.latitude ? parseFloat(emp.latitude.toString()) : null,
      lng: emp.longitude ? parseFloat(emp.longitude.toString()) : null,
      is_active: emp.is_active !== false,
    }))

    debug('Debug - Funcionários transformados:', { 
      count: employees.length,
      firstEmployee: employees[0]
    }, 'EmployeesListAPI')

    return NextResponse.json(employees)
  } catch (error: unknown) {
    logError('Erro inesperado no employees-list API', { error }, 'EmployeesListAPI')
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido'
    return NextResponse.json({ success: false, error: errorMessage }, { status: 500 })
  }
}

