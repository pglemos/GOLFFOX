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
  const password = sanitize(payload.password)

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
      // Log detalhado do erro para debug
      logError('Erro de autenticação Supabase', { 
        error: authError.message, 
        status: authError.status,
        email: email.replace(/^(.{2}).+(@.*)$/, '$1***$2')
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
        email: email.replace(/^(.{2}).+(@.*)$/, '$1***$2')
      }, 'AuthAPI')
      return NextResponse.json({ error: 'Falha na autenticação - sessão não criada' }, { status: 401 })
    }

    const role = getUserRoleByEmail(data.user.email || email)
    const token = data.session.access_token
    const userPayload = {
      id: data.user.id,
      email: data.user.email ?? email,
      role,
      accessToken: token,
    }

    const response = NextResponse.json({ token, user: userPayload }, { status: 200 })

    const cookieValue = Buffer.from(JSON.stringify(userPayload)).toString('base64')
    response.cookies.set('golffox-session', cookieValue, {
      httpOnly: false,
      maxAge: 60 * 60,
      sameSite: 'lax',
      secure: isSecureRequest(req),
      path: '/',
    })

    debug('Login API concluído', { role, emailHash: email.replace(/^(.{2}).+(@.*)$/, '$1***$2') }, 'AuthAPI')
    return response
  } catch (err) {
    logError('Falha inesperada no login API', { error: err }, 'AuthAPI')
    return NextResponse.json({ error: 'internal_error' }, { status: 500 })
  }
}

