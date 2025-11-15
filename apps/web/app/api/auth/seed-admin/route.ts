import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const runtime = 'nodejs'

/**
 * Endpoint de desenvolvimento para criar/garantir o usuário admin no Supabase Auth
 * Email: golffox@admin.com
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

  const adminEmail = 'golffox@admin.com'
  const adminPassword = 'senha123'

  try {
    // Listar usuários e verificar se já existe
    const { data: users, error: listError } = await supabaseAdmin.auth.admin.listUsers()
    if (listError) throw listError

    let existing = users?.users?.find((u: any) => u.email?.toLowerCase() === adminEmail)

    if (!existing) {
      const { data: created, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email: adminEmail,
        password: adminPassword,
        email_confirm: true,
        user_metadata: { role: 'admin', name: 'Administrador' }
      })
      if (createError) throw createError
      existing = created.user
    } else {
      // Garantir metadados e permitir redefinir senha
      await supabaseAdmin.auth.admin.updateUserById(existing.id, {
        password: adminPassword,
        email_confirm: true,
        user_metadata: { ...(existing.user_metadata || {}), role: 'admin' }
      })
    }

    // Upsert na tabela users para assegurar role
    if (existing?.id) {
      const { error: upsertError } = await supabaseAdmin
        .from('users')
        .upsert({
          id: existing.id,
          email: adminEmail,
          name: 'Administrador',
          role: 'admin',
          is_active: true
        }, { onConflict: 'id' })
      if (upsertError) {
        // Não falhar o endpoint por causa da tabela; apenas log
        console.warn('Falha ao upsert users:', upsertError.message)
      }
    }

    return NextResponse.json({ ok: true, email: adminEmail })
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Erro ao criar admin' }, { status: 500 })
  }
}

