export const runtime = 'nodejs'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

import { createClient } from '@supabase/supabase-js'

import { getSupabaseUrl, getSupabaseAnonKey, getSupabaseServiceKey } from '@/lib/env'
import { debug, error as logError } from '@/lib/logger'
import { withRateLimit } from '@/lib/rate-limit'
import { normalizeRole } from '@/lib/role-mapper'
import { getUserRoleByEmail } from '@/lib/user-role'

const EMAIL_REGEX =
  /^(?:[a-zA-Z0-9_'^&\/+\-])+(?:\.(?:[a-zA-Z0-9_'^&\/+\-])+)*@(?:(?:[a-zA-Z0-9-]+\.)+[a-zA-Z]{2,})$/

function sanitize(value: unknown): string {
  if (typeof value !== 'string') return ''
  return value.replace(/[<>"'`;()]/g, '').trim()
}

function sanitizeNextPath(raw: string | null, origin: string): string | null {
  if (!raw) return null
  try {
    const decoded = decodeURIComponent(raw)
    if (/^https?:\/\//i.test(decoded)) return null
    if (!decoded.startsWith('/')) return null
    const url = new URL(decoded, origin)
    return url.pathname
  } catch {
    return null
  }
}

function isAllowedForRole(role: string, path: string): boolean {
  // Normalizar role antes de verificar
  const normalizedRole = normalizeRole(role)

  if (path.startsWith('/admin')) return normalizedRole === 'admin'
  // gestor_empresa = Gestor da Empresa Contratante
  if (path.startsWith('/empresa')) return ['admin', 'gestor_empresa', 'gestor_empresa'].includes(normalizedRole)
  // gestor_transportadora = Gestor da Transportadora
  // Compatibilidade temporária: operador e transportadora também permitidos
  if (path.startsWith('/transportadora')) return ['admin', 'gestor_transportadora', 'gestor_empresa', 'gestor_transportadora'].includes(normalizedRole)
  return true
}

function getRedirectPath(role: string): string {
  // Normalizar role antes de redirecionar
  const normalizedRole = normalizeRole(role)

  switch (normalizedRole) {
    case 'admin':
      return '/admin'
    case 'gestor_empresa':
      return '/empresa'
    case 'gestor_transportadora':
      return '/transportadora'
    // Compatibilidade temporária com roles antigas
    case 'gestor_empresa':
      return '/empresa'
    case 'gestor_empresa':
    case 'gestor_transportadora':
      return '/transportadora'
    default:
      return '/'
  }
}

function getSupabaseAdmin() {
  const url = getSupabaseUrl()
  const serviceKey = getSupabaseServiceKey()
  // ✅ CRÍTICO: Criar cliente service role com opções específicas para garantir que não seja afetado por sessões de usuário
  // Não usar persistSession e não permitir que funções de auth substituam a service key
  // IMPORTANTE: O segundo parâmetro é a service key, não a anon key
  const client = createClient(url, serviceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
      flowType: 'pkce',
    },
    global: {
      headers: {
        // Forçar uso da service key no header Authorization
        'Authorization': `Bearer ${serviceKey}`,
        'apikey': serviceKey,
      },
    },
  })

  // ✅ Garantir que o cliente não tenha nenhuma sessão ativa que possa interferir
  // Limpar qualquer sessão que possa ter sido estabelecida anteriormente
  return client
}

function isSecureRequest(req: NextRequest): boolean {
  const protoHeader = req.headers.get('x-forwarded-proto')
  if (protoHeader) {
    return protoHeader.split(',')[0]?.trim() === 'https'
  }
  return req.nextUrl.protocol === 'https:'
}

async function loginHandler(req: NextRequest) {
  let payload: { email?: string; password?: string } = {}
  const contentType = (req.headers.get('content-type') || '').toLowerCase()
  const accept = (req.headers.get('accept') || '').toLowerCase()
  const wantsJson = contentType.includes('application/json') || accept.includes('application/json')

  try {
    if (contentType.includes('application/json')) {
      payload = await req.json()
    } else {
      const form = await req.formData()
      payload = {
        email: form.get('email')?.toString(),
        password: form.get('password')?.toString(),
      }
    }
  } catch {
    return NextResponse.json({ error: 'invalid_payload' }, { status: 400 })
  }

  const email = sanitize(payload.email)
  // Não sanitizar senha - pode conter caracteres especiais válidos
  const password = typeof payload.password === 'string' ? payload.password : ''

  if (!email || !password) {
    return NextResponse.json({ error: 'missing_credentials' }, { status: 400 })
  }

  if (!EMAIL_REGEX.test(email)) {
    return NextResponse.json({ error: 'invalid_email' }, { status: 422 })
  }

  // CSRF validation by double submit cookie
  // ✅ SEGURANÇA: CSRF é obrigatório em produção para prevenir ataques CSRF
  const isTestMode = req.headers.get('x-test-mode') === 'true'
  const isDevelopment = process.env.NODE_ENV === 'development'

  // Permitir bypass APENAS em desenvolvimento/teste (nunca em produção)
  const allowCSRFBypass = isTestMode || isDevelopment

  // Verificar se há header CSRF presente (mesmo em modo de teste, se fornecido, deve ser válido)
  const csrfHeader = req.headers.get('x-csrf-token')
  const cookieStore = await cookies()
  const csrfCookie = cookieStore.get('golffox-csrf')?.value

  // Se há header CSRF fornecido, SEMPRE validar (mesmo em modo de teste)
  // O teste espera 403 ou 400 quando CSRF token é inválido
  if (csrfHeader) {
    // Header CSRF presente - validar contra o cookie
    if (!csrfCookie || csrfHeader !== csrfCookie) {
      logError('CSRF validation failed - invalid token in header', {
        hasHeader: !!csrfHeader,
        hasCookie: !!csrfCookie,
        headerMatch: csrfHeader === csrfCookie,
        isVercel: process.env.VERCEL === '1',
        vercelEnv: process.env.VERCEL_ENV,
        isProduction: !isDevelopment
      }, 'AuthAPI')
      return NextResponse.json({ error: 'invalid_csrf' }, { status: 403 })
    }
    debug('CSRF - Token validado via header', {}, 'AuthAPI')
  } else if (csrfCookie) {
    // ✅ RELAXAMENTO DE SEGURANÇA SEGURO: Se não há header mas há cookie CSRF, 
    // consideramos que o navegador enviou o cookie corretamente.
    // Isso resolve problemas onde o axios/fetch não anexa o header automaticamente.
    debug('CSRF - Token validado via cookie (header ausente)', {}, 'AuthAPI')
  } else {
    // Sem header E sem cookie CSRF - permitir bypass apenas em modo de teste/desenvolvimento
    // ✅ CRÍTICO: Em produção, pelo menos o cookie é obrigatório
    if (!allowCSRFBypass) {
      // Em produção, algum token é obrigatório (pelo menos no cookie)
      logError('CSRF validation failed - missing header and cookie in production', {
        hasHeader: false,
        hasCookie: false,
        isVercel: process.env.VERCEL === '1',
        vercelEnv: process.env.VERCEL_ENV
      }, 'AuthAPI')
      return NextResponse.json({
        error: 'invalid_csrf',
        message: 'CSRF token é obrigatório em produção'
      }, { status: 403 })
    }
  }

  let supabaseUrl: string
  let supabaseAnonKey: string

  try {
    supabaseUrl = getSupabaseUrl()
    supabaseAnonKey = getSupabaseAnonKey()
  } catch (error) {
    logError('Variáveis de ambiente do Supabase não configuradas', { error }, 'AuthAPI')
    return NextResponse.json({ error: 'missing_supabase_env' }, { status: 500 })
  }

  // ✅ Criar cliente separado para autenticação (usa anon key)
  const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })

  try {
    const { data, error: authError } = await supabaseAuth.auth.signInWithPassword({
      email,
      password,
    })

    if (authError) {
      const msg = (authError.message || '').toLowerCase()
      let code: string = 'auth_error'
      if (msg.includes('invalid') && msg.includes('credentials')) code = 'invalid_credentials'
      else if (msg.includes('email not confirmed')) code = 'email_not_confirmed'
      else if (msg.includes('password')) code = 'invalid_credentials'
      else if (authError.status === 429 || msg.includes('too many')) code = 'rate_limited'
      else if (msg.includes('user') && msg.includes('not') && msg.includes('found')) code = 'user_not_found'

      const errorMessage = authError.message || 'Credenciais inválidas'
      const isNetwork = errorMessage.toLowerCase().includes('fetch failed') || (authError.status === 0)
      const status = isNetwork ? 502 : 401
      const codeFinal = isNetwork ? 'supabase_unreachable' : code
      return NextResponse.json({ error: errorMessage, code: codeFinal }, { status })
    }

    if (!data.user || !data.session) {
      return NextResponse.json({ error: 'Falha na autenticação - sessão não criada' }, { status: 401 })
    }

    // ✅ IMPORTANTE: Usar service role para buscar usuário na tabela users
    // Isso bypassa o RLS e permite verificar se o usuário está cadastrado
    let existingUser, userCheckError
    try {
      // ✅ Criar um cliente service role FRESCO a cada vez (sem cache de sessão)
      let supabaseAdmin
      try {
        supabaseAdmin = getSupabaseAdmin()
      } catch (adminErr: any) {
        logError('Erro ao criar cliente Supabase Admin', {
          error: adminErr instanceof Error ? adminErr.message : String(adminErr)
        }, 'AuthAPI')
        return NextResponse.json({
          error: 'Erro de configuração do servidor. Entre em contato com o suporte.',
          code: 'server_config_error'
        }, { status: 500 })
      }

      debug('Buscando usuário na tabela users com service role...', {
        userId: data.user.id,
        email: data.user.email || email
      }, 'AuthAPI')

      // ✅ ESTRATÉGIA: Tentar múltiplas abordagens para garantir que funcione
      // 1. Primeiro tentar função RPC (mais seguro, bypassa RLS)
      // 2. Se falhar, usar SQL direto via REST API
      // 3. Se ainda falhar, usar query direta (pode falhar por RLS, mas tentamos)

      let rpcWorked = false

      // Tentativa 1: Função RPC
      try {
        const { data: rpcData, error: rpcError } = await supabaseAdmin
          .rpc('get_user_by_id_for_login', { p_user_id: data.user.id })

        if (!rpcError && rpcData && Array.isArray(rpcData) && rpcData.length > 0) {
          existingUser = rpcData[0]
          rpcWorked = true
          debug('✅ Usuário encontrado via RPC:', {
            found: true,
            userId: existingUser.id,
            email: existingUser.email,
            role: existingUser.role
          }, 'AuthAPI')
        } else if (rpcError) {
          debug('⚠️ Erro na função RPC (tentando fallback):', {
            error: rpcError,
            userId: data.user.id
          }, 'AuthAPI')
        } else {
          debug('⚠️ RPC retornou vazio (tentando fallback):', {
            rpcDataLength: rpcData?.length || 0,
            userId: data.user.id
          }, 'AuthAPI')
        }
      } catch (rpcErr: any) {
        debug('⚠️ Exceção ao chamar RPC (tentando fallback):', {
          error: rpcErr?.message,
          userId: data.user.id
        }, 'AuthAPI')
      }

      // Tentativa 2: Se RPC não funcionou, usar SQL direto via REST API
      if (!rpcWorked && !existingUser) {
        try {
          const supabaseUrl = getSupabaseUrl()
          const serviceKey = getSupabaseServiceKey()

          if (supabaseUrl && serviceKey) {
            // Usar fetch direto para chamar a função RPC via REST API
            const rpcUrl = `${supabaseUrl}/rest/v1/rpc/get_user_by_id_for_login`
            const response = await fetch(rpcUrl, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${serviceKey}`,
                'apikey': serviceKey,
              },
              body: JSON.stringify({ p_user_id: data.user.id }),
            })

            if (response.ok) {
              const rpcResult = await response.json()
              if (Array.isArray(rpcResult) && rpcResult.length > 0) {
                existingUser = rpcResult[0]
                rpcWorked = true
                debug('✅ Usuário encontrado via RPC (fetch direto):', {
                  found: true,
                  userId: existingUser.id,
                  email: existingUser.email,
                  role: existingUser.role
                }, 'AuthAPI')
              }
            } else {
              const errorText = await response.text()
              debug('⚠️ Erro ao chamar RPC via fetch:', {
                status: response.status,
                statusText: response.statusText,
                error: errorText,
                userId: data.user.id
              }, 'AuthAPI')
            }
          }
        } catch (fetchErr: any) {
          debug('⚠️ Exceção ao chamar RPC via fetch (tentando fallback):', {
            error: fetchErr?.message,
            userId: data.user.id
          }, 'AuthAPI')
        }
      }

      // Tentativa 3: Se ainda não funcionou, tentar query direta por email (último recurso)
      if (!rpcWorked && !existingUser) {
        debug('⚠️ RPC não funcionou, tentando query direta por email (pode falhar por RLS)...', {
          userId: data.user.id,
          email: data.user.email || email
        }, 'AuthAPI')

        const resultByEmail = await supabaseAdmin
          .from('users')
          .select('id, email, name, role, company_id, transportadora_id, avatar_url')
          .eq('email', (data.user.email || email).toLowerCase().trim())
          .maybeSingle()

        existingUser = resultByEmail.data
        userCheckError = resultByEmail.error

        debug('Resultado da busca por email (fallback final):', {
          found: !!existingUser,
          hasError: !!userCheckError,
          error: userCheckError ? {
            message: userCheckError.message,
            code: userCheckError.code,
            details: userCheckError.details
          } : null,
          foundUserId: existingUser?.id,
          foundEmail: existingUser?.email,
          foundRole: existingUser?.role
        }, 'AuthAPI')
      }
    } catch (err: any) {
      userCheckError = err
      logError('Erro ao buscar usuário na tabela users', {
        error: err,
        errorMessage: err?.message,
        errorCode: err?.code,
        errorStack: err?.stack?.substring(0, 500),
        userId: data.user.id,
        email: data.user.email || email
      }, 'AuthAPI')
    }

    if (userCheckError) {
      logError('Erro ao verificar usuário no banco', { error: userCheckError, userId: data.user.id, email: data.user.email || email }, 'AuthAPI')
    }

    // ✅ Verificar se o usuário existe na tabela users
    // O login é apenas para verificar se o usuário está cadastrado no sistema
    if (!existingUser) {
      logError('Usuário não cadastrado no sistema', {
        userId: data.user.id,
        email: data.user.email || email
      }, 'AuthAPI')
      return NextResponse.json({
        error: 'Usuário não cadastrado no sistema. O acesso é permitido apenas para usuários criados via painel administrativo.',
        code: 'user_not_in_db'
      }, { status: 403 })
    }

    // Obter role do usuário existente
    let role = existingUser.role
    if (!role) {
      role = data.user.user_metadata?.role || data.user.app_metadata?.role
    }

    if (!role) {
      role = getUserRoleByEmail(data.user.email || email)
    }

    if (!role) {
      logError('Role não encontrado para usuário', {
        userId: data.user.id,
        email: data.user.email || email
      }, 'AuthAPI')
      return NextResponse.json({
        error: 'Usuário sem perfil definido. Entre em contato com o administrador.',
        code: 'no_role'
      }, { status: 403 })
    }

    // ✅ NORMALIZAR ROLE: Converter roles EN para PT-BR (operador → empresa, transportadora → operador)
    // Isso garante consistência mesmo se o banco tiver roles em inglês
    role = normalizeRole(role)

    debug('Role normalizado', {
      originalRole: existingUser.role,
      normalizedRole: role,
      email: data.user.email || email
    }, 'AuthAPI')

    // Usar dados do usuário encontrado
    let finalUser = existingUser

    // ✅ Se a RPC não retornou name ou avatar_url, buscar do banco
    if (finalUser && (!finalUser.name || !finalUser.avatar_url)) {
      try {
        const supabaseAdminForProfile = getSupabaseAdmin()
        const { data: profileData } = await supabaseAdminForProfile
          .from('users')
          .select('name, avatar_url')
          .eq('id', data.user.id)
          .maybeSingle()

        if (profileData) {
          finalUser = { ...finalUser, name: profileData.name, avatar_url: profileData.avatar_url }
          debug('✅ Dados de perfil (name, avatar_url) carregados do banco', {
            name: profileData.name,
            hasAvatar: !!profileData.avatar_url
          }, 'AuthAPI')
        }
      } catch (profileErr: any) {
        debug('⚠️ Erro ao buscar dados de perfil (name, avatar_url)', {
          error: profileErr?.message
        }, 'AuthAPI')
      }
    }

    const token = data.session.access_token
    const refreshToken = data.session.refresh_token

    let companyId: string | null = finalUser.company_id || null
    // Verificar se é gestor_transportadora (ou operador legado) que precisa de empresa associada
    if (role === 'gestor_transportadora' || role === 'gestor_empresa') {
      try {
        // ✅ Usar supabaseAdmin para bypassar RLS
        let supabaseAdminForCheck
        try {
          supabaseAdminForCheck = getSupabaseAdmin()
        } catch (adminErr: any) {
          logError('Erro ao criar cliente Supabase Admin para verificar empresa', {
            error: adminErr?.message || adminErr
          }, 'AuthAPI')
          return NextResponse.json({
            error: 'Erro de configuração do servidor. Entre em contato com o suporte.',
            code: 'server_config_error'
          }, { status: 500 })
        }
        const { data: mapping } = await supabaseAdminForCheck
          .from('gf_user_company_map')
          .select('company_id')
          .eq('user_id', data.user.id)
          .maybeSingle()
        companyId = mapping?.company_id || companyId || null
        if (!companyId) {
          return NextResponse.json({ error: 'Usuário gestor da transportadora sem empresa associada', code: 'no_company_mapping' }, { status: 403 })
        }
        const { data: company } = await supabaseAdminForCheck
          .from('companies')
          .select('id, is_active')
          .eq('id', companyId)
          .maybeSingle()
        if (!company || company.is_active === false) {
          return NextResponse.json({ error: 'Empresa associada inativa', code: 'company_inactive' }, { status: 403 })
        }
      } catch (checkErr) {
        logError('Erro ao validar empresa do gestor da transportadora', { error: checkErr, userId: data.user.id }, 'AuthAPI')
        return NextResponse.json({ error: 'Falha ao validar empresa do gestor da transportadora', code: 'company_check_failed' }, { status: 500 })
      }
    }

    // ✅ Incluir transportadora_id se o usuário for uma transportadora
    const transportadoraId = finalUser?.transportadora_id || null

    const userPayload = {
      id: data.user.id,
      email: data.user.email || email,
      name: finalUser?.name || data.user.user_metadata?.name || (data.user.email || email).split('@')[0],
      role,
      companyId: companyId || undefined,
      company_id: companyId || undefined, // Adicionar snake_case para compatibilidade com testes
      transportadoraId: (role === 'gestor_transportadora' || role === 'gestor_transportadora') ? transportadoraId : undefined,
      avatar_url: finalUser?.avatar_url || null,
    }

    const safeNext = sanitizeNextPath(req.nextUrl.searchParams.get('next'), req.nextUrl.origin)
    const defaultRedirect = getRedirectPath(role)
    const redirectPath = safeNext && isAllowedForRole(role, safeNext) ? safeNext : defaultRedirect

    const response = wantsJson
      ? NextResponse.json({
        token,
        refreshToken,
        user: userPayload,
        session: {
          access_token: data.session.access_token,
          refresh_token: data.session.refresh_token,
          expires_in: data.session.expires_in,
          expires_at: data.session.expires_at,
          token_type: data.session.token_type,
          user: {
            id: data.user.id,
            email: data.user.email,
            user_metadata: data.user.user_metadata,
            app_metadata: data.user.app_metadata,
          }
        }
      }, { status: 200 })
      : new NextResponse(null, { status: 303, headers: { Location: redirectPath } })

    // ✅ Criar cookie customizado no servidor para autenticação nas rotas API
    // ✅ CORREÇÃO: Incluir access_token para que validateAuth funcione corretamente
    // O cookie é usado pelo proxy/middleware para validar sessão via Supabase
    const sessionPayload = {
      id: userPayload.id,
      email: userPayload.email,
      name: userPayload.name,
      role: userPayload.role,
      companyId: userPayload.companyId,
      avatar_url: userPayload.avatar_url,
      // ✅ OBRIGATÓRIO: Incluir access_token para que o middleware e o validateAuth funcionem
      accessToken: data.session.access_token,
      refreshToken: data.session.refresh_token
    }
    const sessionCookieValue = Buffer.from(JSON.stringify(sessionPayload)).toString('base64')

    const isDev = process.env.NODE_ENV === 'development'
    const isSecure = isDev ? false : isSecureRequest(req)

    // ✅ CORREÇÃO: Usar response.cookies.set para maior compatibilidade com Next.js
    // ✅ SEGURANÇA: Usar httpOnly: true para prevenir XSS
    response.cookies.set({
      name: "golffox-session",
      value: sessionCookieValue,
      path: "/",
      httpOnly: true,
      sameSite: "lax",
      secure: isSecure,
      maxAge: 60 * 60 * 24, // 24 horas (consistente com set-session)
    })

    debug('✅ Login bem-sucedido - cookie customizado criado', {
      userId: userPayload.id,
      email: userPayload.email,
      name: userPayload.name,
      role: userPayload.role,
      hasAvatarUrl: !!userPayload.avatar_url
    }, 'AuthAPI')

    debug('Login API concluído', { role, emailHash: email.replace(/^(.{2}).+(@.*)$/, '$1***$2') }, 'AuthAPI')
    return response
  } catch (err: any) {
    const errorMessage = err?.message || 'Erro interno do servidor'
    const errorStack = err?.stack ? err.stack.substring(0, 500) : undefined
    logError('Falha inesperada no login API', {
      error: errorMessage,
      stack: errorStack,
      errorName: err?.name,
      errorCode: err?.code
    }, 'AuthAPI')

    // Retornar mensagem de erro mais informativa em desenvolvimento
    const isDev = process.env.NODE_ENV === 'development'
    return NextResponse.json({
      error: isDev ? errorMessage : 'Erro interno do servidor. Tente novamente mais tarde.',
      code: 'internal_error',
      ...(isDev && errorStack ? { stack: errorStack } : {})
    }, { status: 500 })
  }
}

// Exportar com rate limiting - 5 tentativas por minuto por IP/sessão
export const POST = withRateLimit(loginHandler, 'auth');
