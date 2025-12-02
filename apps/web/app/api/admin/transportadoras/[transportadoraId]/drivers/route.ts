import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Helper para criar cliente admin
function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !serviceKey) {
    throw new Error('Supabase não configurado')
  }
  return createClient(url, serviceKey)
}

// GET /api/admin/transportadoras/[transportadoraId]/drivers
export async function GET(
  request: NextRequest,
  context: { params: Promise<Promise<{ transportadoraId?: string; carrierId?: string }>> }
) {
  const params = await context.params

  try {
    const { transportadoraId: tId, carrierId: cId } = await params
    const transportadoraId = tId || cId

    if (!transportadoraId) {
      return NextResponse.json(
        { success: false, error: 'ID da transportadora não fornecido' },
        { status: 400 }
      )
    }

    const supabase = getSupabaseAdmin()

    // Buscar motoristas na tabela users
    const { data: drivers, error } = await supabase
      .from('users')
      .select('*')
      .eq('role', 'driver')
      .eq('transportadora_id', transportadoraId)
      .order('name', { ascending: true })

    if (error) {
      console.error('Erro ao buscar motoristas:', error)
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, drivers })
  } catch (error: any) {
    console.error('Erro na API de motoristas:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Erro desconhecido' },
      { status: 500 }
    )
  }
}

// POST /api/admin/transportadoras/[transportadoraId]/drivers
export async function POST(
  request: NextRequest,
  context: { params: Promise<Promise<{ transportadoraId?: string; carrierId?: string }>> }
) {
  const params = await context.params

  try {
    const { transportadoraId: tId, carrierId: cId } = await params
    const transportadoraId = tId || cId

    if (!transportadoraId) {
      return NextResponse.json(
        { success: false, error: 'ID da transportadora não fornecido' },
        { status: 400 }
      )
    }

    const body = await request.json()
    const {
      name,
      email,
      phone,
      cpf,
      cnh,
      cnh_category,
      password,
      role,
      address_zip_code,
      address_street,
      address_number,
      address_neighborhood,
      address_complement,
      address_city,
      address_state
    } = body

    if (!name) {
      return NextResponse.json(
        { success: false, error: 'Nome é obrigatório' },
        { status: 400 }
      )
    }

    if (!cpf) {
      return NextResponse.json(
        { success: false, error: 'CPF é obrigatório' },
        { status: 400 }
      )
    }

    if (!address_zip_code || !address_street || !address_number || !address_neighborhood) {
      return NextResponse.json(
        { success: false, error: 'Endereço completo é obrigatório' },
        { status: 400 }
      )
    }

    if (!password || password.length < 6) {
      return NextResponse.json(
        { success: false, error: 'Senha é obrigatória e deve ter no mínimo 6 caracteres' },
        { status: 400 }
      )
    }

    const supabase = getSupabaseAdmin()

    // Gerar email se não fornecido (para auth)
    const driverEmail = email || `driver.${Date.now()}@temp.golffox.com`

    // 1. Criar usuário no Auth
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: driverEmail,
      password: password,
      email_confirm: true,
      user_metadata: { name, role: role || 'driver' }
    })

    if (authError) {
      console.error('Erro ao criar usuário Auth para motorista:', authError)
      return NextResponse.json(
        { success: false, error: 'Erro ao criar autenticação do motorista: ' + authError.message },
        { status: 500 }
      )
    }

    if (!authData.user) {
      return NextResponse.json(
        { success: false, error: 'Erro ao criar usuário Auth (sem dados)' },
        { status: 500 }
      )
    }

    // 2. Inserir na tabela users
    const { data: driver, error } = await supabase
      .from('users')
      .insert([
        {
          id: authData.user.id,
          transportadora_id: transportadoraId,
          name,
          email: driverEmail,
          phone: phone || null,
          cpf: cpf || null,
          cnh: cnh || null,
          cnh_category: cnh_category || null,
          role: role || 'driver',
          is_active: true,
          address_zip_code,
          address_street,
          address_number,
          address_neighborhood,
          address_complement,
          address_city,
          address_state
        }
      ])
      .select()
      .single()

    if (error) {
      console.error('Erro ao criar motorista na tabela users:', error)
      // Rollback auth user
      await supabase.auth.admin.deleteUser(authData.user.id)

      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, driver })
  } catch (error: any) {
    console.error('Erro na API de criar motorista:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Erro desconhecido' },
      { status: 500 }
    )
  }
}
