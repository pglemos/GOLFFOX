import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE
  if (!url || !serviceKey) {
    throw new Error('Supabase não configurado: defina NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY')
  }
  return createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false }
  })
}

export async function POST(request: NextRequest) {
  try {
    const supabase = getSupabaseAdmin()
    const { email, name, phone, role = 'passenger' } = await request.json()

    if (!email || !name) {
      return NextResponse.json(
        { error: 'Email e nome são obrigatórios' },
        { status: 400 }
      )
    }

    // Verificar se usuário já existe
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('email', email.toLowerCase())
      .single()

    if (existingUser) {
      return NextResponse.json({
        userId: existingUser.id,
        created: false
      })
    }

    // Criar usuário no Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: email.toLowerCase(),
      password: `temp_${Math.random().toString(36).slice(2)}`, // Senha temporária
      email_confirm: true,
      user_metadata: {
        name,
        phone,
        role
      }
    })

    if (authError || !authData.user) {
      return NextResponse.json(
        { error: authError?.message || 'Erro ao criar usuário' },
        { status: 500 }
      )
    }

    // Criar registro na tabela users
    const { error: userError } = await supabase
      .from('users')
      .insert({
        id: authData.user.id,
        email: email.toLowerCase(),
        name,
        phone,
        role
      })

    if (userError) {
      // Tentar limpar o usuário do auth se falhar na tabela
      await supabase.auth.admin.deleteUser(authData.user.id)
      return NextResponse.json(
        { error: userError.message || 'Erro ao criar registro de usuário' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      userId: authData.user.id,
      created: true
    })
  } catch (error: any) {
    console.error('Erro ao criar funcionário:', error)
    return NextResponse.json(
      { error: error.message || 'Erro desconhecido' },
      { status: 500 }
    )
  }
}

