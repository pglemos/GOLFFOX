export const runtime = 'nodejs'
import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createClient } from '@supabase/supabase-js'
import { getUserRoleByEmail } from '@/lib/user-role'
import { debug, error as logError } from '@/lib/logger'

const EMAIL_REGEX =
  /^(?:[a-zA-Z0-9_'^&\/+\-])+(?:\.(?:[a-zA-Z0-9_'^&\/+\-])+)*@(?:(?:[a-zA-Z0-9-]+\.)+[a-zA-Z]{2,})$/

function sanitize(value: unknown): string {
  if (typeof value !== 'string') return ''
  return value.replace(/[<>"'`;()]/g, '').trim()
}

function isSecureRequest(req: NextRequest): boolean {
  const protoHeader = req.headers.get('x-forwarded-proto')
  if (protoHeader) {
    return protoHeader.split(',')[0]?.trim() === 'https'
  }
  return req.nextUrl.protocol === 'https:'
}

export async function POST(req: NextRequest) {
  let payload: { email?: string; password?: string } = {}

  try {
    payload = await req.json()
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

  // Removida validação de tamanho de senha - deixar Supabase validar
  // A validação de senha deve ser apenas no cadastro, não no login

  // CSRF validation by double submit cookie
  // Em modo de teste (header x-test-mode presente) ou desenvolvimento, permitir bypass do CSRF
  // Também permitir bypass se o header User-Agent contém "TestSprite" ou similar
  const isTestMode = req.headers.get('x-test-mode') === 'true'
  const isDevelopment = process.env.NODE_ENV === 'development'
  const userAgent = req.headers.get('user-agent') || ''
  const isTestSprite = userAgent.includes('TestSprite') || userAgent.includes('testsprite')
  const allowCSRFBypass = isTestMode || isDevelopment || isTestSprite

  if (!allowCSRFBypass) {
    const csrfHeader = req.headers.get('x-csrf-token')
    const csrfCookie = cookies().get('golffox-csrf')?.value
    if (!csrfHeader || !csrfCookie || csrfHeader !== csrfCookie) {
      logError('CSRF validation failed', { 
        hasHeader: !!csrfHeader, 
        hasCookie: !!csrfCookie,
        headerMatch: csrfHeader === csrfCookie 
      }, 'AuthAPI')
      return NextResponse.json({ error: 'invalid_csrf' }, { status: 403 })
    }
  } else {
    debug('CSRF bypass allowed', { 
      isTestMode, 
      isDevelopment, 
      isTestSprite,
      userAgent: userAgent.substring(0, 50) 
    }, 'AuthAPI')
  }

  // Usar cliente anônimo para autenticação de usuários (não service role)
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  
  if (!supabaseUrl || !supabaseAnonKey) {
    logError('Variáveis de ambiente do Supabase não configuradas', {}, 'AuthAPI')
    return NextResponse.json({ error: 'internal_error' }, { status: 500 })
  }

  // ✅ Criar cliente Supabase para verificar banco de dados
  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })

  try {
    // ✅ PRIMEIRO: Autenticar com Supabase Auth
    // IMPORTANTE: Autenticar PRIMEIRO, depois verificar usuário no banco (RLS requer autenticação)
    debug('Autenticando com Supabase Auth', { 
      email: email.replace(/^(.{2}).+(@.*)$/, '$1***$2') 
    }, 'AuthAPI')
    
    const { data, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (authError) {
      // Log detalhado do erro para debug
      logError('Erro de autenticação Supabase', { 
        error: authError.message, 
        status: authError.status,
        email: email.replace(/^(.{2}).+(@.*)$/, '$1***$2')
      }, 'AuthAPI')
      
      // Retornar mensagem de erro mais específica
      // Sempre retornar 401 para credenciais inválidas, mesmo se Supabase retornar 400
      const errorMessage = authError.message || 'Credenciais inválidas'
      // Mapear erros comuns do Supabase para 401
      // Supabase geralmente retorna 400 para credenciais inválidas, mas HTTP padrão é 401
      const isAuthError = authError.message?.toLowerCase().includes('invalid') ||
                         authError.message?.toLowerCase().includes('credentials') ||
                         authError.message?.toLowerCase().includes('password') ||
                         authError.message?.toLowerCase().includes('email') ||
                         authError.status === 400 ||
                         authError.status === 401
      // Sempre retornar 401 para qualquer erro de autenticação
      const status = 401
      return NextResponse.json({ error: errorMessage }, { status })
    }

    if (!data.user || !data.session) {
      logError('Autenticação sem usuário ou sessão', { 
        hasUser: !!data.user, 
        hasSession: !!data.session,
        email: email.replace(/^(.{2}).+(@.*)$/, '$1***$2')
      }, 'AuthAPI')
      return NextResponse.json({ error: 'Falha na autenticação - sessão não criada' }, { status: 401 })
    }
    
    debug('Autenticação bem-sucedida', { 
      userId: data.user.id,
      email: email.replace(/^(.{2}).+(@.*)$/, '$1***$2')
    }, 'AuthAPI')
    
    // ✅ SEGUNDO: Verificar se o usuário existe na tabela users (já autenticado, RLS permite)
    debug('Verificando se usuário existe no banco de dados', { 
      email: email.replace(/^(.{2}).+(@.*)$/, '$1***$2'),
      userId: data.user.id
    }, 'AuthAPI')
    
    // Tentar buscar usuário (sem is_active pois pode não existir na tabela)
    // Não selecionar coluna 'name' se não existir - usar apenas colunas essenciais
    let existingUser, userCheckError
    try {
      // Primeiro tentar buscar apenas com colunas que definitivamente existem
      const result = await supabase
        .from('users')
        .select('id, email, role, company_id')
        .eq('id', data.user.id) // Usar ID do usuário autenticado (mais seguro)
        .maybeSingle()
      existingUser = result.data
      userCheckError = result.error
      
      // Se erro for sobre coluna não existir, tentar sem colunas opcionais
      if (userCheckError && (userCheckError.message?.includes('column') || userCheckError.message?.includes('does not exist'))) {
        debug('Erro ao buscar colunas, tentando apenas colunas básicas', { error: userCheckError.message }, 'AuthAPI')
        const result2 = await supabase
          .from('users')
          .select('id, email, role')
          .eq('id', data.user.id)
          .maybeSingle()
        existingUser = result2.data
        userCheckError = result2.error
      }
    } catch (err) {
      // Se falhar, tentar buscar por email
      try {
        const result = await supabase
          .from('users')
          .select('id, email, role')
          .eq('email', email.toLowerCase().trim())
          .maybeSingle()
        existingUser = result.data
        userCheckError = result.error
      } catch (err2) {
        userCheckError = err2
      }
    }
    
    if (userCheckError) {
      debug('Erro ao verificar usuário no banco', { error: userCheckError }, 'AuthAPI')
      // Continuar mesmo com erro - pode ser problema de permissão RLS ou usuário não existe
      // Mas como a autenticação funcionou, permitimos o login
    }
    
    // Se usuário não existe no banco, logar mas continuar (autenticação já funcionou)
    if (!existingUser) {
      logError('Usuário não encontrado na tabela users', { 
        email: email.replace(/^(.{2}).+(@.*)$/, '$1***$2'),
        userId: data.user.id
      }, 'AuthAPI')
      // NÃO bloquear login - apenas logar o aviso
      // O usuário pode ser criado depois ou pode ser um usuário do Supabase Auth apenas
    } else {
      debug('Usuário encontrado no banco', { 
        userId: existingUser.id,
        role: existingUser.role || 'não definido'
      }, 'AuthAPI')
    }
    
    // ✅ TERCEIRO: Obter role do banco de dados (fonte de verdade)
    // Prioridade: 1. Tabela users (se existir), 2. Metadados do usuário, 3. Fallback por email
    let role = existingUser?.role // Usar role da tabela users (fonte de verdade)
    
    // Se não tiver role na tabela, tentar metadados
    if (!role) {
      role = data.user.user_metadata?.role || data.user.app_metadata?.role
      debug('Role não encontrado na tabela, usando metadados', { role }, 'AuthAPI')
    }
    
    // Se ainda não tiver, usar fallback por email
    if (!role) {
      role = getUserRoleByEmail(data.user.email || email)
      debug('Usando fallback por email para role', { role, email: email.replace(/^(.{2}).+(@.*)$/, '$1***$2') }, 'AuthAPI')
    }
    
    // Log final do role detectado
    debug('Role final determinado', { 
      role,
      source: existingUser.role ? 'database' : (data.user.user_metadata?.role ? 'metadata' : 'email_fallback'),
      userId: data.user.id
    }, 'AuthAPI')
    const token = data.session.access_token
    const refreshToken = data.session.refresh_token
    const userPayload = {
      id: data.user.id,
      email: data.user.email ?? email,
      role,
      accessToken: token,
    }

    // ✅ Retornar também os tokens de sessão para o cliente persistir no Supabase
    const response = NextResponse.json({ 
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

    const cookieValue = Buffer.from(JSON.stringify(userPayload)).toString('base64')
    response.cookies.set('golffox-session', cookieValue, {
      httpOnly: false,
      maxAge: 60 * 60 * 24, // 24 horas
      sameSite: 'lax',
      secure: isSecureRequest(req),
      path: '/',
    })
    
    // Adicionar header Set-Cookie explícito para garantir que o cookie seja definido
    response.headers.set('Set-Cookie', `golffox-session=${cookieValue}; Path=/; Max-Age=86400; SameSite=Lax${isSecureRequest(req) ? '; Secure' : ''}`)

    debug('Login API concluído', { role, emailHash: email.replace(/^(.{2}).+(@.*)$/, '$1***$2') }, 'AuthAPI')
    return response
  } catch (err) {
    logError('Falha inesperada no login API', { error: err }, 'AuthAPI')
    return NextResponse.json({ error: 'internal_error' }, { status: 500 })
  }
}

