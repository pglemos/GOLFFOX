import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { companyName, operatorEmail, operatorPhone } = body

    if (!companyName || !operatorEmail) {
      return NextResponse.json(
        { error: 'Nome da empresa e email do operador são obrigatórios' },
        { status: 400 }
      )
    }

    // Validar email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(operatorEmail)) {
      return NextResponse.json(
        { error: 'Email inválido' },
        { status: 400 }
      )
    }

    // Passo 1: Verificar se empresa já existe
    const { data: existingCompany } = await supabaseAdmin
      .from('companies')
      .select('id')
      .eq('name', companyName)
      .single()

    if (existingCompany) {
      return NextResponse.json(
        { error: 'Uma empresa com esse nome já existe' },
        { status: 400 }
      )
    }

    // Passo 2: Criar empresa
    const { data: company, error: companyError } = await supabaseAdmin
      .from('companies')
      .insert({
        name: companyName,
        is_active: true,
      })
      .select()
      .single()

    if (companyError) throw companyError

    // Passo 3: Gerar senha temporária
    const tempPassword = Math.random().toString(36).slice(-12) + 
                        Math.random().toString(36).slice(-12).toUpperCase() + 
                        "!@#"

    // Passo 4: Criar usuário no Supabase Auth
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: operatorEmail,
      password: tempPassword,
      email_confirm: true,
      user_metadata: {
        name: operatorEmail.split('@')[0],
        role: 'operator',
      }
    })

    if (authError) {
      // Rollback: deletar empresa criada
      await supabaseAdmin.from('companies').delete().eq('id', company.id)
      throw authError
    }

    if (!authData.user) {
      await supabaseAdmin.from('companies').delete().eq('id', company.id)
      throw new Error('Erro ao criar usuário')
    }

    // Passo 5: Atualizar perfil do usuário
    const { error: profileError } = await supabaseAdmin
      .from('users')
      .upsert({
        id: authData.user.id,
        email: operatorEmail,
        name: operatorEmail.split('@')[0],
        role: 'operator',
        phone: operatorPhone || null,
        company_id: company.id,
        is_active: true,
      }, {
        onConflict: 'id'
      })

    if (profileError) {
      console.error('Erro ao atualizar perfil:', profileError)
      // Não falhar, pode ser que já exista
    }

    // Passo 6: Mapear usuário à empresa
    const { error: mapError } = await supabaseAdmin
      .from('gf_user_company_map')
      .insert({
        user_id: authData.user.id,
        company_id: company.id,
      })
      .select()

    if (mapError) {
      console.warn('Erro ao mapear usuário-empresa:', mapError)
      // Não falhar, pode ser que a tabela não exista ou já tenha mapeamento
    }

    // Passo 7: Log de auditoria
    const authHeader = request.headers.get('authorization')
    let actorId: string | null = null

    if (authHeader) {
      const token = authHeader.replace('Bearer ', '')
      const { data: { user } } = await supabaseAdmin.auth.getUser(token)
      actorId = user?.id || null
    }

    if (actorId) {
      try {
        await supabaseAdmin.from('gf_audit_log').insert({
          actor_id: actorId,
          action_type: 'create_operator',
          resource_type: 'company',
          resource_id: company.id,
          details: {
            company_name: companyName,
            operator_email: operatorEmail,
            operator_id: authData.user.id,
          }
        })
      } catch (auditError) {
        console.error('Erro ao registrar log de auditoria:', auditError)
        // Não falhar se log falhar
      }
    }

    return NextResponse.json({
      success: true,
      company,
      operator: {
        id: authData.user.id,
        email: operatorEmail,
      },
      tempPassword, // Retornar senha temporária (apenas nesta resposta)
    }, { status: 201 })
  } catch (error: any) {
    console.error('Erro ao criar operador:', error)
    return NextResponse.json(
      { error: error.message || 'Erro ao criar operador' },
      { status: 500 }
    )
  }
}

