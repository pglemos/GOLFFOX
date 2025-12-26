import { NextRequest } from 'next/server'

import { requireAuth } from '@/lib/api-auth'
import { successResponse, errorResponse, validationErrorResponse } from '@/lib/api-response'
import { logError, logger } from '@/lib/logger'
import { withRateLimit } from '@/lib/rate-limit'
import { supabaseServiceRole } from '@/lib/supabase-server'
import { validateWithSchema, createCompanyLoginSchema } from '@/lib/validation/schemas'

export const runtime = 'nodejs'

async function postHandler(request: NextRequest) {
  try {
    const authErrorResponse = await requireAuth(request, 'admin')
    if (authErrorResponse) return authErrorResponse

    const body = await request.json()

    // Validar dados
    const validation = validateWithSchema(createCompanyLoginSchema, body)
    if (!validation.success) {
      return validationErrorResponse(validation.error)
    }

    const { company_id, email, password, name, phone } = validation.data
    const sanitizedEmail = email.toLowerCase().trim()

    // Verificar se empresa existe
    const { data: company, error: companyError } = await supabaseServiceRole
      .from('empresas')
      .select('id, name')
      .eq('id', company_id)
      .single()

    if (companyError || !company) return errorResponse('Empresa não encontrada', 404)

    // Verificar se email já existe na tabela users
    const { data: existingUser } = await supabaseServiceRole
      .from('users')
      .select('id, email')
      .eq('email', sanitizedEmail)
      .maybeSingle()

    if (existingUser) return errorResponse('Este email já está cadastrado na tabela de usuários', 400)

    // Verificar se email já existe no Auth
    let existingAuthUser: { id: string; email?: string;[key: string]: unknown } | null = null
    try {
      const { data: authUsers } = await supabaseServiceRole.auth.admin.listUsers()
      existingAuthUser = authUsers?.users?.find((u: { email?: string }) => u.email?.toLowerCase() === sanitizedEmail) as { id: string; email?: string;[key: string]: unknown } | undefined || null
    } catch (listError) {
      logger.warn('⚠️ Não foi possível verificar usuários no Auth:', listError)
    }

    logger.log(`🔐 Criando login de operador para empresa ${company.name}...`)

    let authData: { user?: { id: string; email?: string;[key: string]: unknown } } | null = null
    let createUserError: { message?: string;[key: string]: unknown } | null = null

    // Se usuário já existe no Auth, usar ele
    if (existingAuthUser) {
      logger.log('   Usando usuário existente no Auth')
      authData = { user: existingAuthUser }
    } else {
      // Tentar criar novo usuário
      try {
        const createResult = await supabaseServiceRole.auth.admin.createUser({
          email: sanitizedEmail,
          password: password,
          email_confirm: true,
          user_metadata: { name: name }
        })

        authData = createResult.data
        createUserError = createResult.error

        if (createUserError && !authData?.user) {
          // Verificar se o usuário foi criado mesmo com erro
          const { data: authUsers } = await supabaseServiceRole.auth.admin.listUsers()
          const foundUser = authUsers?.users?.find((u: { email?: string }) => u.email?.toLowerCase() === sanitizedEmail)
          if (foundUser) {
            authData = { user: foundUser }
            createUserError = null
          }
        }
      } catch (err: unknown) {
        createUserError = err as { message?: string;[key: string]: unknown }
      }
    }

    if (createUserError) {
      logError('Erro ao criar usuário no Auth', { error: createUserError })
      return errorResponse(createUserError.message || 'Erro ao criar usuário no Auth', 500)
    }

    if (!authData?.user) return errorResponse('Erro ao criar usuário no Auth', 500)

    const userId = authData.user.id

    // 2. Criar registro na tabela users
    const { error: userError } = await supabaseServiceRole
      .from('users')
      .upsert({
        id: userId,
        email: sanitizedEmail,
        name: name,
        phone: phone,
        role: 'gestor_empresa',
        company_id: company_id,
        is_active: true
      }, { onConflict: 'id' })

    if (userError) {
      logError('Erro ao criar registro na tabela users', { error: userError })
      try { await supabaseServiceRole.auth.admin.deleteUser(userId) } catch (_) { }
      return errorResponse('Erro ao criar registro do usuário: ' + userError.message, 500)
    }

    // 3. Criar mapeamento (se existir)
    try {
      await supabaseServiceRole.from('gf_user_company_map').insert({
        user_id: userId,
        empresa_id: company_id,
        created_at: new Date().toISOString()
      })
    } catch (_) { }

    return successResponse({
      id: userId,
      email: sanitizedEmail,
      name: name,
      role: 'gestor_empresa',
      company_id: company_id
    }, 201, { message: 'Login de operador criado com sucesso' })

  } catch (error: unknown) {
    const err = error as { message?: string }
    logError('Erro ao criar login de operador', { error: err })
    return errorResponse(err.message || 'Erro desconhecido', 500)
  }
}

// ✅ SEGURANÇA: Rate limiting para proteção contra abuso
export const POST = withRateLimit(postHandler, 'admin')

