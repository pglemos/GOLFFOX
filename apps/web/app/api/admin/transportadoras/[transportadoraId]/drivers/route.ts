import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { logger } from '@/lib/logger'

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
  context: { params: Promise<{ transportadoraId?: string; carrierId?: string }> }
) {
  const params = await context.params

  try {
    const { transportadoraId: tId, carrierId: cId } = params
    const transportadoraId = tId || cId

    if (!transportadoraId) {
      return NextResponse.json(
        { success: false, error: 'ID da transportadora não fornecido' },
        { status: 400 }
      )
    }

    const supabase = getSupabaseAdmin()

    // Buscar motoristas na tabela users (selecionar todas as colunas para evitar erros)
    const { data: drivers, error } = await supabase
      .from('users')
      .select('*')
      .eq('role', 'motorista')
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
  } catch (err) {
    console.error('Erro na API de motoristas:', err)
    const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido'
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    )
  }
}

// POST /api/admin/transportadoras/[transportadoraId]/drivers
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ transportadoraId?: string; carrierId?: string }> }
) {
  const params = await context.params

  try {
    const { transportadoraId: tId, carrierId: cId } = params
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

    if (!address_zip_code || !address_street || !address_number || !address_neighborhood || !address_city || !address_state) {
      return NextResponse.json(
        { success: false, error: 'Endereço completo é obrigatório (CEP, rua, número, bairro, cidade e estado)' },
        { status: 400 }
      )
    }

    // Determinar senha: usar fornecida ou gerar dos últimos 6 dígitos do CPF
    const cleanCpf = cpf?.replace(/\D/g, '') || ''
    let finalPassword = password
    if (!password || password.length < 6) {
      // Se não foi fornecida senha, usar últimos 6 dígitos do CPF
      if (cleanCpf.length < 6) {
        return NextResponse.json(
          { success: false, error: 'CPF inválido para gerar senha' },
          { status: 400 }
        )
      }
      finalPassword = cleanCpf.slice(-6)
    }

    const supabase = getSupabaseAdmin()

    // Gerar email para Auth baseado no CPF (para login com CPF)
    let authEmail: string
    if (cleanCpf.length >= 11) {
      // Login com CPF: email fictício baseado no CPF
      authEmail = `${cleanCpf}@motorista.golffox.app`
    } else if (email) {
      authEmail = email
    } else {
      authEmail = `driver.${Date.now()}@temp.golffox.com`
    }

    // 1. Verificar se usuário já existe no Auth
    let authUserId: string | null = null
    let existingAuthUser = false

    try {
      const { data: authUsers } = await supabase.auth.admin.listUsers()
      const found = authUsers?.users?.find((u: any) => u.email?.toLowerCase() === authEmail.toLowerCase())
      if (found) {
        authUserId = found.id
        existingAuthUser = true
        logger.log('Motorista já existe no Auth, usando ID existente:', authUserId)
      }
    } catch (listErr) {
      logger.warn('Não foi possível verificar usuários existentes no Auth:', listErr)
    }

    // 2. Criar usuário no Auth se não existir
    if (!authUserId) {
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: authEmail,
        password: finalPassword,
        email_confirm: true,
        user_metadata: { name, role: 'motorista' }
      })

      if (authError) {
        // Se erro for "user already registered", tentar buscar o ID
        if (authError.message?.includes('already') || authError.message?.includes('registered')) {
          try {
            const { data: authUsers } = await supabase.auth.admin.listUsers()
            const found = authUsers?.users?.find((u: any) => u.email?.toLowerCase() === authEmail.toLowerCase())
            if (found) {
              authUserId = found.id
              existingAuthUser = true
            }
          } catch (e) { /* ignore */ }
        }

        if (!authUserId) {
          console.error('Erro ao criar usuário Auth para motorista:', authError)
          return NextResponse.json(
            { success: false, error: 'Erro ao criar autenticação do motorista: ' + authError.message },
            { status: 500 }
          )
        }
      } else if (authData?.user) {
        authUserId = authData.user.id
      }
    }

    if (!authUserId) {
      return NextResponse.json(
        { success: false, error: 'Erro ao criar usuário Auth (sem ID)' },
        { status: 500 }
      )
    }



    // 3. Usar UPSERT na tabela users para evitar erro de chave duplicada
    const { data: driver, error } = await supabase
      .from('users')
      .upsert({
        id: authUserId,
        transportadora_id: transportadoraId,
        name,
        email: email || null, // Email real do usuário, não o fictício do Auth
        phone: phone || null,
        cpf,
        cnh: cnh || null,
        cnh_category: cnh_category || null,
        role: 'motorista',
        is_active: true,
        address_zip_code,
        address_street,
        address_number,
        address_neighborhood,
        address_complement: address_complement || null,
        address_city,
        address_state
      }, { onConflict: 'id' })
      .select()
      .single()

    if (error) {

      console.error('Erro ao criar motorista na tabela users:', error)
      // Só deleta do Auth se não era um usuário existente
      if (!existingAuthUser) {
        await supabase.auth.admin.deleteUser(authUserId)
      }

      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      )
    }



    return NextResponse.json({ success: true, driver })
  } catch (err) {
    console.error('Erro na API de criar motorista:', err)
    const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido'
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    )
  }
}
