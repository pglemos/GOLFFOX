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

    if (!companyId) {
      return NextResponse.json({ success: false, error: 'company_id é obrigatório' }, { status: 400 })
    }

    // Buscar funcionários da empresa usando service role (bypass RLS)
    const { data, error } = await supabaseAdmin
      .from('gf_employee_company')
      .select('id, company_id, name, cpf, address, latitude, longitude')
      .eq('company_id', companyId)
      .order('name')

    if (error) {
      console.error('Erro ao buscar funcionários no admin API:', error)
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    // Transformar para o formato EmployeeLite
    const employees = (data || []).map((emp: any) => ({
      employee_id: emp.id,
      company_id: emp.company_id,
      first_name: emp.name?.split(' ')[0] || '',
      last_name: emp.name?.split(' ').slice(1).join(' ') || '',
      cpf: emp.cpf || '',
      address: emp.address || '',
      city: '',
      state: '',
      zipcode: '',
      lat: emp.latitude ? parseFloat(emp.latitude.toString()) : null,
      lng: emp.longitude ? parseFloat(emp.longitude.toString()) : null,
    }))

    return NextResponse.json({ success: true, employees })
  } catch (error: any) {
    console.error('Erro inesperado no employees-list API:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

