import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { logError } from '@/lib/logger'

export const runtime = 'nodejs'

/**
 * Endpoint de desenvolvimento para garantir que o usuário de teste existe no Supabase Auth
 * Email: teste@empresa.com
 * Senha: senha123
 * Apenas disponível em NODE_ENV=development
 */
export async function GET(req: NextRequest) {
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 })
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE

  if (!supabaseUrl || !serviceKey) {
    return NextResponse.json({ error: 'Supabase não configurado' }, { status: 500 })
  }

  const supabaseAdmin = createClient(supabaseUrl, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false }
  })

  const testEmail = 'teste@empresa.com'
  const testPassword = 'senha123'
  const userId = '2efd3963-2661-4572-9aa5-6778ba62c5ce' // ID conhecido do banco

  try {
    // Verificar se o usuário existe no Auth
    let existing
    try {
      const { data: userData, error: getUserError } = await supabaseAdmin.auth.admin.getUserById(userId)
      if (!getUserError && userData?.user) {
        existing = userData.user
      }
    } catch (err) {
      logger.log('Usuário não encontrado por ID, tentando por email...')
    }

    // Se não encontrou por ID, tentar por email
    if (!existing) {
      const { data: users, error: listError } = await supabaseAdmin.auth.admin.listUsers()
      if (listError) throw listError

      existing = users?.users?.find((u: any) => u.email?.toLowerCase() === testEmail.toLowerCase())
    }

    if (!existing) {
      // Criar novo usuário
      const { data: created, error: createError } = await supabaseAdmin.auth.admin.createUser({
        id: userId, // Usar o ID existente da tabela users
        email: testEmail,
        password: testPassword,
        email_confirm: true,
        user_metadata: { role: 'operador', name: 'Teste Empresa' }
      })
      if (createError) throw createError
      existing = created.user
      logger.log('✅ Usuário criado no Supabase Auth')
    } else {
      // Atualizar senha e metadados
      const { data: updated, error: updateError } = await supabaseAdmin.auth.admin.updateUserById(existing.id, {
        password: testPassword,
        email_confirm: true,
        user_metadata: { ...(existing.user_metadata || {}), role: 'operador', name: 'Teste Empresa' }
      })
      if (updateError) throw updateError
      existing = updated.user
      logger.log('✅ Senha do usuário atualizada no Supabase Auth')
    }

    // Garantir que o usuário existe na tabela users com os dados corretos
    const { error: upsertError } = await supabaseAdmin
      .from('users')
      .upsert({
        id: existing.id,
        email: testEmail,
        name: 'Teste Empresa',
        role: 'operador',
        is_active: true
      }, { onConflict: 'id' })
    
    if (upsertError) {
      logger.warn('⚠️ Falha ao upsert users:', upsertError.message)
    } else {
      logger.log('✅ Usuário garantido na tabela users')
    }

    // Garantir mapeamento com empresa
    const companyId = 'f91a6141-d7d9-4683-a12c-7888d72f5c54'
    const { error: mapError } = await supabaseAdmin
      .from('gf_user_company_map')
      .upsert({
        user_id: existing.id,
        company_id: companyId
      }, { onConflict: 'user_id,company_id' })
    
    if (mapError) {
      logger.warn('⚠️ Falha ao garantir mapeamento empresa:', mapError.message)
    } else {
      logger.log('✅ Mapeamento com empresa garantido')
    }

    return NextResponse.json({ 
      ok: true, 
      email: testEmail,
      userId: existing.id,
      message: 'Usuário de teste configurado com sucesso'
    })
  } catch (error: unknown) {
    logError('Erro ao configurar usuário de teste', { error }, 'FixTestUserAPI')
    return NextResponse.json({ 
      error: error?.message || 'Erro ao configurar usuário de teste',
      details: error?.stack 
    }, { status: 500 })
  }
}

