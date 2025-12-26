import { NextRequest, NextResponse } from 'next/server'

import { debug, info, warn, logError } from '@/lib/logger'
import { createClient } from '@supabase/supabase-js'
import { requireAuth } from '@/lib/api-auth'
import { validateWithSchema, employeeListQuerySchema } from '@/lib/validation/schemas'
import { validationErrorResponse } from '@/lib/api-response'

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
    if (authErrorResponse) return authErrorResponse

    const { searchParams } = new URL(request.url)
    const queryParams = Object.fromEntries(searchParams.entries())

    // Validar query params
    const validation = validateWithSchema(employeeListQuerySchema, queryParams)
    if (!validation.success) {
      return validationErrorResponse(validation.error)
    }

    const { empresa_id, company_id: companyIdParam } = validation.data
    const companyId = empresa_id || companyIdParam

    const supabaseAdmin = getSupabaseAdmin()

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
      warn('[EmployeesListAPI] Tabela gf_employee_company vazia, tentando buscar na tabela users...', {}, 'EmployeesListAPI')

      let usersQuery = supabaseAdmin
        .from('users')
        .select('id, name, email, phone, company_id, role, is_active, address, latitude, longitude, cpf, login_cpf', { count: 'exact' })
        .in('role', ['gestor_empresa', 'funcionario'])
        .order('name', { ascending: true })

      if (companyId) {
        usersQuery = usersQuery.eq('company_id', companyId)
      }

      const { data: usersData, error: usersError, count: usersCount } = await usersQuery

      if (!usersError && usersData && usersData.length > 0) {
        info(`[EmployeesListAPI] Encontrados ${usersData.length} funcionários na tabela users`, { count: usersData.length }, 'EmployeesListAPI')
        finalData = usersData
        finalCount = usersCount
      } else {
        warn('[EmployeesListAPI] Nenhum funcionário encontrado na tabela users também', {
          error: usersError?.message,
          count: usersCount
        }, 'EmployeesListAPI')
      }
    }

    debug('[EmployeesListAPI] Query resultado', {
      count: finalData?.length || 0,
      totalCount: finalCount,
      error: finalError?.message,
      source: finalData === data ? 'gf_employee_company' : 'users'
    }, 'EmployeesListAPI')

    if (finalError) {
      logError('[EmployeesListAPI] Erro na query', {
        error: finalError.message,
        code: finalError.code,
        companyId
      }, 'EmployeesListAPI')
      return NextResponse.json({
        success: false,
        error: finalError.message
      }, { status: 500 })
    }

    // Se não há dados, retornar vazio
    if (!finalData || finalData.length === 0) {
      return NextResponse.json([])
    }

    // Buscar nomes das empresas separadamente
    const companyIds = [...new Set((finalData || []).map((emp: any) => emp.company_id).filter(Boolean))]
    const companiesMap = new Map<string, string>()

    if (companyIds.length > 0) {
      const { data: companiesData } = await supabaseAdmin
        .from('empresas')
        .select('id, name')
        .in('id', companyIds)

      if (companiesData) {
        companiesData.forEach((c: any) => {
          companiesMap.set(c.id, c.name || '')
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

    return NextResponse.json(employees)
  } catch (error: unknown) {
    logError('Erro inesperado no employees-list API', { error }, 'EmployeesListAPI')
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido'
    return NextResponse.json({ success: false, error: errorMessage }, { status: 500 })
  }
}

