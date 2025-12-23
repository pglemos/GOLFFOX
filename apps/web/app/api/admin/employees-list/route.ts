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
    let query = supabaseAdmin
      .from('gf_employee_company')
      .select('*', { count: 'exact' })
      .order('name', { ascending: true })

    if (companyId) {
      query = query.eq('company_id', companyId)
    }

    const { data, error, count } = await query

    console.log('🔍 [EmployeesListAPI] Query resultado:', {
      count: data?.length || 0,
      totalCount: count,
      error: error?.message,
      errorCode: error?.code,
      errorDetails: error?.details,
      firstItem: data?.[0]
    })

    if (error) {
      console.error('❌ [EmployeesListAPI] Erro na query:', {
        error: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint,
        companyId
      })
      logError('Erro ao buscar funcionários no admin API', { error, companyId }, 'EmployeesListAPI')
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    // Se não há dados, retornar vazio com informações de debug
    if (!data || data.length === 0) {
      console.log('⚠️ [EmployeesListAPI] Nenhum funcionário encontrado na tabela gf_employee_company')
      return NextResponse.json([])
    }

    console.log('✅ [EmployeesListAPI] Funcionários encontrados:', {
      count: data.length,
      totalCount: count,
      firstItem: data[0]
    })

    // Buscar nomes das empresas separadamente
    const companyIds = [...new Set((data || []).map((emp: any) => emp.company_id).filter(Boolean))]
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
    const employees = (data || []).map((emp: any) => ({
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

