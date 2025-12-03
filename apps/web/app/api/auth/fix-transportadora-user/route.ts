import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const runtime = 'nodejs'

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

  const testUserEmail = 'transportadora@trans.com'
  const testUserPassword = 'senha123'
  const testUserRole = 'transportadora'
  const testUserName = 'Transportadora Teste'

  try {
    const { data: users, error: listError } = await supabaseAdmin.auth.admin.listUsers()
    if (listError) throw listError

    let existing = users?.users?.find((u: any) => u.email?.toLowerCase() === testUserEmail)
    let userId = existing?.id

    if (!existing) {
      const { data: created, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email: testUserEmail,
        password: testUserPassword,
        email_confirm: true,
        user_metadata: { role: testUserRole, name: testUserName }
      })
      if (createError) throw createError
      userId = created.user?.id
      existing = created.user
    } else {
      await supabaseAdmin.auth.admin.updateUserById(existing.id, {
        password: testUserPassword,
        email_confirm: true,
        user_metadata: { ...(existing.user_metadata || {}), role: testUserRole, name: testUserName }
      })
      userId = existing.id
    }

    if (userId) {
      // Buscar transportadora_id (carrier) associado
      const { data: carrierData } = await supabaseAdmin
        .from('gf_carriers')
        .select('id')
        .limit(1)
        .single()

      const transportadoraId = carrierData?.id

      const { error: upsertError } = await supabaseAdmin
        .from('users')
        .upsert({
          id: userId,
          email: testUserEmail,
          name: testUserName,
          role: testUserRole,
          is_active: true,
          transportadora_id: transportadoraId || null
        }, { onConflict: 'id' })
      if (upsertError) {
        console.warn('Falha ao upsert users:', upsertError.message)
      }
    }

    return NextResponse.json({ ok: true, email: testUserEmail, userId, message: "Usuario de transportadora configurado com sucesso" })
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Erro ao configurar usuário de transportadora' }, { status: 500 })
  }
}

