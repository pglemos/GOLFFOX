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
  const csrfHeader = req.headers.get('x-csrf-token')
  const csrfCookie = cookies().get('golffox-csrf')?.value
  if (!csrfHeader || !csrfCookie || csrfHeader !== csrfCookie) {
    return NextResponse.json({ error: 'invalid_csrf' }, { status: 403 })
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
    // ✅ PRIMEIRO: Verificar se o usuário existe na tabela users do Supabase
    debug('Verificando se usuário existe no banco de dados', { 
      email: email.replace(/^(.{2}).+(@.*)$/, '$1***$2') 
    }, 'AuthAPI')
    
    const { data: existingUser, error: userCheckError } = await supabase
      .from('users')
      .select('id, email, role, is_active')
      .eq('email', email.toLowerCase().trim())
      .maybeSingle()
    
    if (userCheckError) {
      debug('Erro ao verificar usuário no banco', { error: userCheckError }, 'AuthAPI')
      // Continuar mesmo com erro - pode ser problema de permissão RLS
    }
    
    // Se usuário não existe no banco, retornar erro
    if (!existingUser) {
      logError('Usuário não encontrado no banco de dados', { 
        email: email.replace(/^(.{2}).+(@.*)$/, '$1***$2') 
      }, 'AuthAPI')
      return NextResponse.json({ 
        error: 'Usuário não encontrado. Verifique se o email está correto ou entre em contato com o administrador.' 
      }, { status: 404 })
    }
    
    // Verificar se usuário está ativo
    if (existingUser.is_active === false) {
      logError('Tentativa de login com usuário inativo', { 
        email: email.replace(/^(.{2}).+(@.*)$/, '$1***$2'),
        userId: existingUser.id
      }, 'AuthAPI')
      return NextResponse.json({ 
        error: 'Usuário inativo. Entre em contato com o administrador.' 
      }, { status: 403 })
    }
    
    debug('Usuário encontrado no banco', { 
      userId: existingUser.id,
      role: existingUser.role,
      isActive: existingUser.is_active
    }, 'AuthAPI')
    
    // ✅ SEGUNDO: Autenticar com Supabase Auth
    const { data, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (authError) {
      // Log detalhado do erro para debug
      logError('Erro de autenticação Supabase', { 
        error: authError.message, 
        status: authError.status,
        email: email.replace(/^(.{2}).+(@.*)$/, '$1***$2'),
        userId: existingUser.id
      }, 'AuthAPI')
      
      // Retornar mensagem de erro mais específica
      const errorMessage = authError.message || 'Credenciais inválidas'
      const status = authError.status ?? 401
      return NextResponse.json({ error: errorMessage }, { status })
    }

    if (!data.user || !data.session) {
      logError('Autenticação sem usuário ou sessão', { 
        hasUser: !!data.user, 
        hasSession: !!data.session,
        email: email.replace(/^(.{2}).+(@.*)$/, '$1***$2'),
        userId: existingUser.id
      }, 'AuthAPI')
      return NextResponse.json({ error: 'Falha na autenticação - sessão não criada' }, { status: 401 })
    }
    
    // ✅ TERCEIRO: Obter role do banco de dados (fonte de verdade)
    // Prioridade: 1. Tabela users (já temos), 2. Metadados do usuário, 3. Fallback por email
    let role = existingUser.role // Usar role da tabela users (fonte de verdade)
    
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

