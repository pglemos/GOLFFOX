import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { requireAuth } from '@/lib/api-auth'
import { logError, logger } from '@/lib/logger'

export const runtime = 'nodejs'

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !serviceKey) {
    throw new Error('Supabase não configurado')
  }
  return createClient(url, serviceKey)
}

export async function POST(request: NextRequest) {
  try {
    const authErrorResponse = await requireAuth(request, 'admin')
    if (authErrorResponse) {
      return authErrorResponse
    }

    const body = await request.json()
    const { company_id, email, password, name, phone } = body

    // Validar e sanitizar dados
    const sanitizedEmail = email?.toString().toLowerCase().trim()
    const sanitizedPassword = password?.toString()
    const sanitizedName = name?.toString().trim()
    const sanitizedPhone = phone?.toString().trim() || null

    // Validações
    if (!company_id) {
      return NextResponse.json(
        { error: 'company_id é obrigatório' },
        { status: 400 }
      )
    }

    if (!sanitizedEmail) {
      return NextResponse.json(
        { error: 'Email é obrigatório' },
        { status: 400 }
      )
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(sanitizedEmail)) {
      return NextResponse.json(
        { error: 'Email inválido' },
        { status: 400 }
      )
    }

    if (!sanitizedPassword || sanitizedPassword.length < 6) {
      return NextResponse.json(
        { error: 'Senha deve ter no mínimo 6 caracteres' },
        { status: 400 }
      )
    }

    if (!sanitizedName) {
      return NextResponse.json(
        { error: 'Nome é obrigatório' },
        { status: 400 }
      )
    }

    // Validar formato de senha (evitar caracteres problemáticos)
    if (sanitizedPassword.length > 72) {
      return NextResponse.json(
        { error: 'Senha muito longa (máximo 72 caracteres)' },
        { status: 400 }
      )
    }

    const supabaseAdmin = getSupabaseAdmin()

    // Verificar se empresa existe
    const { data: company, error: companyError } = await supabaseAdmin
      .from('companies')
      .select('id, name')
      .eq('id', company_id)
      .single()

    if (companyError || !company) {
      return NextResponse.json(
        { error: 'Empresa não encontrada' },
        { status: 404 }
      )
    }

    // Verificar se email já existe na tabela users
    const { data: existingUser } = await supabaseAdmin
      .from('users')
      .select('id, email')
      .eq('email', sanitizedEmail)
      .maybeSingle()

    if (existingUser) {
      return NextResponse.json(
        { error: 'Este email já está cadastrado na tabela de usuários' },
        { status: 400 }
      )
    }

    // Verificar se email já existe no Auth (opcional, mas ajuda a prevenir erros)
    let existingAuthUser: any = null
    try {
      const { data: authUsers } = await supabaseAdmin.auth.admin.listUsers()
      existingAuthUser = authUsers?.users?.find((u: any) => u.email?.toLowerCase() === sanitizedEmail)

      if (existingAuthUser) {
        logger.warn('⚠️ Email já existe no Auth, mas não na tabela users')
        // Vamos tentar usar o usuário existente
      }
    } catch (listError) {
      logger.warn('⚠️ Não foi possível verificar usuários no Auth (continuando):', listError)
      // Não bloquear se não conseguir listar
    }

    logger.log(`🔐 Criando login de operador para empresa ${company.name}...`)
    logger.log(`   Email: ${sanitizedEmail}`)
    logger.log(`   Nome: ${sanitizedName}`)
    logger.log(`   Configuração Supabase:`, {
      url: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'Configurado' : 'NÃO CONFIGURADO',
      serviceKey: process.env.SUPABASE_SERVICE_ROLE_KEY ? 'Configurado' : 'NÃO CONFIGURADO'
    })

    let authData: any = null
    let createUserError: any = null

    // Se usuário já existe no Auth, usar ele
    if (existingAuthUser) {
      logger.log('   Usando usuário existente no Auth')
      authData = { user: existingAuthUser }
      createUserError = null
    } else {
      // Tentar criar novo usuário com múltiplas estratégias
      try {
        logger.log('   Tentando criar novo usuário no Auth...')

        // Estratégia 1: Criar usuário básico sem metadata
        let createResult = await supabaseAdmin.auth.admin.createUser({
          email: sanitizedEmail,
          password: sanitizedPassword,
          email_confirm: true,
          user_metadata: {
            name: sanitizedName
          }
        })

        // Se falhar com "Database error", pode ser problema de trigger
        // Tentar criar diretamente via SQL se possível, ou usar abordagem alternativa
        if (createResult.error && createResult.error.message?.includes('Database error')) {
          logger.warn('⚠️ Erro de banco detectado, tentando abordagem alternativa...')

          // Tentar criar sem email_confirm e sem metadata
          createResult = await supabaseAdmin.auth.admin.createUser({
            email: sanitizedEmail,
            password: sanitizedPassword
          })

          // Se ainda falhar, tentar criar o usuário de forma mais básica possível
          if (createResult.error && createResult.error.message?.includes('Database error')) {
            logger.warn('⚠️ Erro persistente, tentando criar usuário sem confirmação de email...')

            // Última tentativa: criar sem nenhuma opção adicional
            try {
              createResult = await supabaseAdmin.auth.admin.createUser({
                email: sanitizedEmail,
                password: sanitizedPassword,
                email_confirm: false
              })
            } catch (e) {
              // Se ainda falhar, vamos tentar continuar e criar o perfil manualmente
              logger.warn('⚠️ Erro ao criar no auth, mas vamos tentar criar perfil manualmente')
            }
          }
        }

        authData = createResult.data
        createUserError = createResult.error

        // Se houver erro mas o usuário foi criado mesmo assim (pode acontecer com Database error)
        if (createUserError && !authData?.user) {
          // Verificar se o usuário foi criado mesmo com erro
          logger.log('   Verificando se usuário foi criado apesar do erro...')
          try {
            const { data: authUsers } = await supabaseAdmin.auth.admin.listUsers()
            const foundUser = authUsers?.users?.find((u: any) => u.email?.toLowerCase() === sanitizedEmail)

            if (foundUser) {
              logger.log('   ✅ Usuário encontrado apesar do erro, usando existente')
              authData = { user: foundUser }
              createUserError = null
            }
          } catch (listErr) {
            logger.warn('   ⚠️ Não foi possível verificar usuários:', listErr)
          }
        }

        if (createUserError) {
          logError('Erro ao criar usuário', {
            message: createUserError.message,
            status: createUserError.status,
            code: (createUserError as any).code
          }, 'CreateEmpresaLoginAPI')

          // Se o erro for de usuário já existente, tentar buscar
          if (createUserError.message?.toLowerCase().includes('already') ||
            createUserError.message?.toLowerCase().includes('exists')) {
            logger.log('   Erro indica que usuário já existe, buscando...')
            const { data: authUsers } = await supabaseAdmin.auth.admin.listUsers()
            const foundUser = authUsers?.users?.find((u: any) => u.email?.toLowerCase() === sanitizedEmail)

            if (foundUser) {
              logger.log('   ✅ Usuário encontrado, usando existente')
              authData = { user: foundUser }
              createUserError = null
            }
          }
        } else {
          logger.log('✅ Usuário criado com sucesso no Auth')
        }
      } catch (err: any) {
        logError('Exceção ao chamar createUser', { error: err }, 'CreateEmpresaLoginAPI')
        createUserError = err
      }
    }

    if (createUserError) {
      logError('Erro ao criar usuário no Auth', {
        message: createUserError.message,
        status: createUserError.status,
        name: createUserError.name,
        code: (createUserError as any).code
      }, 'CreateEmpresaLoginAPI')

      // Verificar se o erro é porque o usuário já existe
      const errorMessage = createUserError.message?.toLowerCase() || ''
      const isAlreadyRegistered =
        errorMessage.includes('already registered') ||
        errorMessage.includes('user already registered') ||
        errorMessage.includes('already exists') ||
        (createUserError as any).code === 'user_already_registered'

      if (isAlreadyRegistered) {
        logger.log('🔍 Usuário já existe, tentando buscar e atualizar...')
        // Buscar usuário existente
        const { data: existingUsers, error: listError } = await supabaseAdmin.auth.admin.listUsers()

        if (listError) {
          logError('Erro ao listar usuários', { error: listError }, 'CreateEmpresaLoginAPI')
        }

        const existingUser = existingUsers?.users?.find((u: any) => u.email?.toLowerCase() === email.toLowerCase())

        if (existingUser) {
          logger.warn('⚠️ Usuário já existe, atualizando company_id')
          const userId = existingUser.id

          // Atualizar company_id na tabela users
          const { error: updateError } = await supabaseAdmin
            .from('users')
            .upsert({
              id: userId,
              email: sanitizedEmail,
              name: sanitizedName,
              phone: sanitizedPhone,
              role: 'gestor_empresa',
              company_id: company_id,
              is_active: true
            }, {
              onConflict: 'id'
            })

          if (updateError) {
            logError('Erro ao atualizar company_id', { error: updateError }, 'CreateEmpresaLoginAPI')
            return NextResponse.json(
              {
                error: 'Usuário já existe mas não foi possível associá-lo à empresa',
                message: updateError.message,
                details: process.env.NODE_ENV === 'development' ? updateError : undefined
              },
              { status: 400 }
            )
          }

          return NextResponse.json({
            success: true,
            message: 'Usuário já existia e foi associado à empresa',
            user: {
              id: userId,
              email: sanitizedEmail,
              name: sanitizedName,
              role: 'gestor_empresa',
              company_id: company_id
            }
          })
        } else {
          // Usuário não encontrado na lista, mas erro diz que já existe
          logger.warn('⚠️ Erro indica que usuário existe, mas não foi encontrado na lista')
          return NextResponse.json(
            {
              error: 'Este email já está cadastrado no sistema de autenticação, mas não foi possível localizá-lo',
              message: createUserError.message,
              details: process.env.NODE_ENV === 'development' ? createUserError : undefined
            },
            { status: 400 }
          )
        }
      }

      // Se o erro for "Database error", pode ser que o usuário foi criado mas o trigger falhou
      // Vamos verificar se o usuário existe e tentar criar o perfil mesmo assim
      if (createUserError.message?.includes('Database error')) {
        logger.warn('⚠️ Erro de banco detectado, verificando se usuário foi criado...')
        try {
          const { data: authUsers } = await supabaseAdmin.auth.admin.listUsers()
          const foundUser = authUsers?.users?.find((u: any) => u.email?.toLowerCase() === sanitizedEmail)

          if (foundUser) {
            logger.log('   ✅ Usuário encontrado apesar do erro de banco, continuando...')
            authData = { user: foundUser }
            createUserError = null
          } else {
            // Usuário não foi criado, retornar erro
            const detailedMessage = createUserError.message || 'Erro desconhecido ao criar usuário'
            logError('Usuário não foi criado', { message: detailedMessage }, 'CreateEmpresaLoginAPI')
            return NextResponse.json(
              {
                error: 'Erro ao criar usuário no sistema de autenticação',
                message: 'Ocorreu um erro no banco de dados. O usuário não foi criado. Verifique os logs do Supabase para mais detalhes.',
                details: process.env.NODE_ENV === 'development' ? {
                  originalError: detailedMessage,
                  code: (createUserError as any).code,
                  status: createUserError.status,
                  suggestion: 'Verifique se há triggers ou funções no banco que possam estar causando o problema'
                } : undefined
              },
              { status: 500 }
            )
          }
        } catch (checkError) {
          logError('Erro ao verificar usuário', { error: checkError }, 'CreateEmpresaLoginAPI')
        }
      }

      // Se ainda houver erro e não foi resolvido acima
      if (createUserError) {
        const detailedMessage = createUserError.message || 'Erro desconhecido ao criar usuário'
        logError('Erro detalhado ao criar login', {
          message: detailedMessage,
          status: createUserError.status,
          code: (createUserError as any).code
        }, 'CreateEmpresaLoginAPI')

        return NextResponse.json(
          {
            error: 'Erro ao criar usuário no sistema de autenticação',
            message: detailedMessage,
            details: process.env.NODE_ENV === 'development' ? {
              error: createUserError,
              code: (createUserError as any).code,
              status: createUserError.status
            } : undefined
          },
          { status: 500 }
        )
      }
    }

    if (!authData?.user) {
      logError('Usuário não foi criado (authData.user é null)', {}, 'CreateEmpresaLoginAPI')
      return NextResponse.json(
        {
          error: 'Erro ao criar usuário',
          message: 'Usuário não foi criado no sistema de autenticação'
        },
        { status: 500 }
      )
    }

    const userId = authData.user.id
    logger.log(`✅ Usuário criado no Auth: ${userId}`)

    // 2. Criar registro na tabela users
    logger.log(`   Criando registro na tabela users para: ${userId}`)
    const { error: userError } = await supabaseAdmin
      .from('users')
      .upsert({
        id: userId,
        email: sanitizedEmail,
        name: sanitizedName,
        phone: sanitizedPhone,
        role: 'gestor_empresa',
        company_id: company_id,
        is_active: true
      }, {
        onConflict: 'id'
      })

    if (userError) {
      logError('Erro ao criar registro na tabela users', {
        message: userError.message,
        code: userError.code,
        details: userError.details,
        hint: userError.hint
      })
      // Tentar remover usuário do Auth se possível
      try {
        await supabaseAdmin.auth.admin.deleteUser(userId)
        logger.log('✅ Usuário removido do Auth após falha')
      } catch (deleteError) {
        logError('Erro ao remover usuário do Auth após falha', { error: deleteError }, 'CreateEmpresaLoginAPI')
      }
      return NextResponse.json(
        {
          error: 'Erro ao criar registro do usuário',
          message: userError.message || 'Erro desconhecido',
          details: process.env.NODE_ENV === 'development' ? {
            code: userError.code,
            details: userError.details,
            hint: userError.hint
          } : undefined
        },
        { status: 500 }
      )
    }

    logger.log(`✅ Registro criado na tabela users para: ${sanitizedEmail}`)

    // 3. Criar mapeamento na tabela gf_user_company_map (se existir)
    try {
      const { error: mapError } = await supabaseAdmin
        .from('gf_user_company_map')
        .insert({
          user_id: userId,
          company_id: company_id,
          created_at: new Date().toISOString()
        })

      if (mapError && mapError.code !== '42P01') {
        // Se tabela não existir (42P01), ignorar
        logger.warn('⚠️ Erro ao criar mapeamento (pode não existir):', mapError.message)
      } else {
        logger.log(`✅ Mapeamento criado em gf_user_company_map`)
      }
    } catch (mapErr) {
      logger.warn('⚠️ Erro ao criar mapeamento (ignorado):', mapErr)
    }

    logger.log(`✅ Login de operador criado com sucesso: ${sanitizedEmail} para empresa ${company.name}`)

    return NextResponse.json({
      success: true,
      message: 'Login de operador criado com sucesso',
      user: {
        id: userId,
        email: sanitizedEmail,
        name: sanitizedName,
        role: 'gestor_empresa',
        company_id: company_id
      }
    })

  } catch (error: any) {
    logError('Erro ao criar login de operador', { error }, 'CreateEmpresaLoginAPI')
    return NextResponse.json(
      { error: 'Erro ao criar login de operador', message: error.message },
      { status: 500 }
    )
  }
}

