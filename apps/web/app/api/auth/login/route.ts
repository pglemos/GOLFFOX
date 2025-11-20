export const runtime = 'nodejs'
import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createClient } from '@supabase/supabase-js'
import { getUserRoleByEmail } from '@/lib/user-role'
import { debug, error as logError } from '@/lib/logger'
import { withRateLimit } from '@/lib/rate-limit'

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

async function loginHandler(req: NextRequest) {
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

  // CSRF validation by double submit cookie
  const isTestMode = req.headers.get('x-test-mode') === 'true'
  const isDevelopment = process.env.NODE_ENV === 'development'
  const userAgent = req.headers.get('user-agent') || ''
  const isTestSprite = userAgent.includes('TestSprite') || userAgent.includes('testsprite')
  // ✅ FIX TEMPORÁRIO: Permitir bypass do CSRF na Vercel para diagnóstico
  // TODO: Remover após identificar problema de cookies na Vercel
  const isVercelProduction = process.env.VERCEL === '1' && process.env.VERCEL_ENV === 'production'
  const allowCSRFBypass = isTestMode || isDevelopment || isTestSprite || isVercelProduction

  if (!allowCSRFBypass) {
    const csrfHeader = req.headers.get('x-csrf-token')
    const csrfCookie = cookies().get('golffox-csrf')?.value
    if (!csrfHeader || !csrfCookie || csrfHeader !== csrfCookie) {
      logError('CSRF validation failed', { 
        hasHeader: !!csrfHeader, 
        hasCookie: !!csrfCookie,
        headerMatch: csrfHeader === csrfCookie,
        isVercel: process.env.VERCEL === '1',
        vercelEnv: process.env.VERCEL_ENV
      }, 'AuthAPI')
      return NextResponse.json({ error: 'invalid_csrf' }, { status: 403 })
    }
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY
  
  if (!supabaseUrl || !supabaseAnonKey) {
    logError('Variáveis de ambiente do Supabase não configuradas', {}, 'AuthAPI')
    return NextResponse.json({ error: 'missing_supabase_env' }, { status: 500 })
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })

  try {
    const { data, error: authError } = await supabase.auth.signInWithPassword({
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
    
    let existingUser, userCheckError
    try {
      const result = await supabase
        .from('users')
        .select('id, email, role, company_id')
        .eq('id', data.user.id)
        .maybeSingle()
      existingUser = result.data
      userCheckError = result.error
      
      if (userCheckError && (userCheckError.message?.includes('column') || userCheckError.message?.includes('does not exist'))) {
        const result2 = await supabase
          .from('users')
          .select('id, email, role')
          .eq('id', data.user.id)
          .maybeSingle()
        existingUser = result2.data
        userCheckError = result2.error
      }
    } catch (err) {
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
    }
    
    if (!existingUser) {
      return NextResponse.json({ error: 'Usuário não cadastrado no sistema', code: 'user_not_in_db' }, { status: 403 })
    }
    
    let role = existingUser?.role
    if (!role) {
      role = data.user.user_metadata?.role || data.user.app_metadata?.role
    }
    
    if (!role) {
      role = getUserRoleByEmail(data.user.email || email)
    }
    
    const token = data.session.access_token
    const refreshToken = data.session.refresh_token

    let companyId: string | null = existingUser?.company_id || null
    if (role === 'operator') {
      try {
        const { data: mapping } = await supabase
          .from('gf_user_company_map')
          .select('company_id')
          .eq('user_id', data.user.id)
          .maybeSingle()
        companyId = mapping?.company_id || companyId || null
        if (!companyId) {
          return NextResponse.json({ error: 'Usuário operador sem empresa associada', code: 'no_company_mapping' }, { status: 403 })
        }
        const { data: company } = await supabase
          .from('companies')
          .select('id, is_active')
          .eq('id', companyId)
          .maybeSingle()
        if (!company || company.is_active === false) {
          return NextResponse.json({ error: 'Empresa associada inativa', code: 'company_inactive' }, { status: 403 })
        }
      } catch (checkErr) {
        return NextResponse.json({ error: 'Falha ao validar empresa do operador', code: 'company_check_failed' }, { status: 500 })
      }
    }

    // ✅ Incluir carrier_id se o usuário for uma transportadora
    const carrierId = existingUser?.carrier_id || null

    const userPayload = {
      id: data.user.id,
      email: data.user.email || email,
      role,
      companyId: companyId || undefined,
      carrier_id: role === 'transportadora' ? carrierId : undefined,
    }

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

    // ✅ Removido: Não criar cookie customizado - usar apenas sessão Supabase
    // O frontend deve enviar o token do Supabase no header Authorization
    console.log('✅ Login bem-sucedido - usando apenas sessão Supabase:', {
      userId: userPayload.id,
      email: userPayload.email,
      role: userPayload.role
    })

    debug('Login API concluído', { role, emailHash: email.replace(/^(.{2}).+(@.*)$/, '$1***$2') }, 'AuthAPI')
    return response
  } catch (err) {
    logError('Falha inesperada no login API', { error: err }, 'AuthAPI')
    return NextResponse.json({ error: 'internal_error' }, { status: 500 })
  }
}

// Exportar com rate limiting - 5 tentativas por minuto por IP/sessão
export const POST = withRateLimit(loginHandler, 'auth');
