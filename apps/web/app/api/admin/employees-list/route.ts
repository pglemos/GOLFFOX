import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-client'
import { requireAuth } from '@/lib/api-auth'
import { logError } from '@/lib/logger'

export const runtime = 'nodejs'

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

    // Buscar funcionários (filtrado por empresa se company_id fornecido, senão todos)
    let query = supabaseAdmin
      .from('gf_employee_company')
      .select(`
        id, 
        company_id, 
        name, 
        email, 
        phone, 
        cpf, 
        address, 
        latitude, 
        longitude, 
        is_active,
        company:companies(name)
      `)
      .order('name')

    if (companyId) {
      query = query.eq('company_id', companyId)
    }

    const { data, error } = await query

    if (error) {
      logError('Erro ao buscar funcionários no admin API', { error, companyId }, 'EmployeesListAPI')
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    // Transformar para o formato esperado pela página
    const employees = (data || []).map((emp: any) => ({
      id: emp.id,
      employee_id: emp.id,
      company_id: emp.company_id,
      company_name: emp.company?.name || '',
      name: emp.name || '',
      first_name: emp.name?.split(' ')[0] || '',
      last_name: emp.name?.split(' ').slice(1).join(' ') || '',
      email: emp.email || '',
      phone: emp.phone || '',
      cpf: emp.cpf || '',
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

