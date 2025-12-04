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
    const { transportadoraId: tId, carrierId: cId  } = params
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
    const { transportadoraId: tId, carrierId: cId  } = params
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

    if (!password || password.length < 6) {
      return NextResponse.json(
        { success: false, error: 'Senha é obrigatória e deve ter no mínimo 6 caracteres' },
        { status: 400 }
      )
    }

    const supabase = getSupabaseAdmin()

    // Gerar email se não fornecido (para auth)
    const driverEmail = email || `driver.${Date.now()}@temp.golffox.com`

    // 1. Verificar se usuário já existe no Auth
    let authUserId: string | null = null
    let existingAuthUser = false

    try {
      const { data: authUsers } = await supabase.auth.admin.listUsers()
      const found = authUsers?.users?.find((u: any) => u.email?.toLowerCase() === driverEmail.toLowerCase())
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
        email: driverEmail,
        password: password,
        email_confirm: true,
        user_metadata: { name, role: role || 'driver' }
      })

      if (authError) {
        // Se erro for "user already registered", tentar buscar o ID
        if (authError.message?.includes('already') || authError.message?.includes('registered')) {
          try {
            const { data: authUsers } = await supabase.auth.admin.listUsers()
            const found = authUsers?.users?.find((u: any) => u.email?.toLowerCase() === driverEmail.toLowerCase())
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

    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/802544c4-70d0-43c7-a57c-6692b28ca17d',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'drivers/route.ts:POST',message:'Before UPSERT driver',data:{authUserId,driverEmail,existingAuthUser,transportadoraId},timestamp:Date.now(),sessionId:'debug-session',runId:'post-fix'})}).catch(()=>{});
    // #endregion

    // 3. Usar UPSERT na tabela users para evitar erro de chave duplicada
    const { data: driver, error } = await supabase
      .from('users')
      .upsert({
        id: authUserId,
        transportadora_id: transportadoraId,
        name,
        email: driverEmail,
        phone: phone || null,
        cpf,
        cnh: cnh || null,
        cnh_category: cnh_category || null,
        role: role || 'driver',
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
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/802544c4-70d0-43c7-a57c-6692b28ca17d',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'drivers/route.ts:POST',message:'UPSERT ERROR',data:{authUserId,errorMessage:error.message,errorCode:error.code},timestamp:Date.now(),sessionId:'debug-session',runId:'post-fix'})}).catch(()=>{});
      // #endregion
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

    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/802544c4-70d0-43c7-a57c-6692b28ca17d',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'drivers/route.ts:POST',message:'UPSERT SUCCESS',data:{driverId:driver?.id,driverName:driver?.name},timestamp:Date.now(),sessionId:'debug-session',runId:'post-fix'})}).catch(()=>{});
    // #endregion

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
