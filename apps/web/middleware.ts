import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const isDevelopment = process.env.NODE_ENV === 'development'

/**
 * Valida token de acesso com Supabase Auth
 * Retorna true se token válido, false caso contrário
 */
async function validateAccessToken(accessToken: string): Promise<boolean> {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseAnonKey) {
      if (isDevelopment) {
        console.error('[MIDDLEWARE] Supabase não configurado')
      }
      return false
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      auth: { persistSession: false, autoRefreshToken: false }
    })

    const { data: { user }, error } = await supabase.auth.getUser(accessToken)

    if (error || !user) {
      if (isDevelopment) {
        console.warn('[MIDDLEWARE] Token inválido:', error?.message || 'Usuário não encontrado')
      }
      return false
    }

    if (isDevelopment) {
      console.log('[MIDDLEWARE] Token válido para usuário:', user.email)
    }

    return true
  } catch (error) {
    if (isDevelopment) {
      console.error('[MIDDLEWARE] Erro ao validar token:', error)
    }
    return false
  }
}

/**
 * Extrai access_token de cookies disponíveis
 * Prioridade: golffox-session (base64) > Supabase cookie
 */
function extractAccessToken(request: NextRequest): string | null {
  // 1. Tentar obter do cookie golffox-session (base64)
  const golffoxSession = request.cookies.get('golffox-session')?.value
  if (golffoxSession) {
    try {
      const decoded = Buffer.from(golffoxSession, 'base64').toString('utf-8')
      const sessionData = JSON.parse(decoded)
      const token = sessionData.access_token || sessionData.accessToken
      if (token) {
        if (isDevelopment) {
          console.log('[MIDDLEWARE] Token encontrado no cookie golffox-session')
        }
        return token
      }
    } catch (error) {
      if (isDevelopment) {
        console.warn('[MIDDLEWARE] Erro ao decodificar golffox-session:', error)
      }
    }
  }

  // 2. Tentar obter do cookie do Supabase
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  if (supabaseUrl) {
    const projectRef = supabaseUrl.split('//')[1]?.split('.')[0]
    if (projectRef) {
      const supabaseCookieName = `sb-${projectRef}-auth-token`
      const supabaseCookie = request.cookies.get(supabaseCookieName)?.value
      if (supabaseCookie) {
        try {
          const tokenData = JSON.parse(supabaseCookie)
          const token = tokenData?.access_token || tokenData?.accessToken
          if (token) {
            if (isDevelopment) {
              console.log('[MIDDLEWARE] Token encontrado no cookie do Supabase')
            }
            return token
          }
        } catch (error) {
          if (isDevelopment) {
            console.warn('[MIDDLEWARE] Erro ao processar cookie do Supabase:', error)
          }
        }
      }
    }
  }

  return null
}

export async function middleware(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl

  // ✅ Permitir desabilitar autenticação via variável de ambiente (útil para testes locais)
  if (process.env.NEXT_PUBLIC_DISABLE_MIDDLEWARE === 'true') {
    return NextResponse.next()
  }
  
  // ✅ Bypass para rotas de API - não aplicar middleware em rotas de API
  if (pathname.startsWith('/api')) {
    return NextResponse.next()
  }
  // ✅ Bypass para assets e rotas internas do Next/Vercel
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/static') ||
    pathname.startsWith('/assets') ||
    pathname.startsWith('/icons') ||
    pathname === '/favicon.ico' ||
    pathname.startsWith('/_vercel')
  ) {
    return NextResponse.next()
  }
  
  const response = NextResponse.next()

  // Redirecionar /login para / (raiz)
  if (pathname === '/login' || pathname.startsWith('/login/')) {
    const rootUrl = new URL('/', request.url)
    // Preservar parâmetros de query se existirem
    if (searchParams.has('next')) {
      rootUrl.searchParams.set('next', searchParams.get('next')!)
    }
    return NextResponse.redirect(rootUrl)
  }

  // ✅ Redirecionar /carrier para /transportadora (compatibilidade)
  if (pathname.startsWith('/carrier')) {
    const transportadoraUrl = new URL(pathname.replace('/carrier', '/transportadora'), request.url)
    transportadoraUrl.search = request.nextUrl.search
    return NextResponse.redirect(transportadoraUrl)
  }

  // ✅ Redirecionar /operator para /operador (compatibilidade)
  if (pathname.startsWith('/operator')) {
    const operadorUrl = new URL(pathname.replace('/operator', '/operador'), request.url)
    operadorUrl.search = request.nextUrl.search
    return NextResponse.redirect(operadorUrl)
  }

  // ✅ Proteger rotas /operador, /admin e /transportadora com autenticação
  // VALIDAR token com Supabase antes de liberar acesso
  if (pathname.startsWith('/operador') || pathname.startsWith('/admin') || pathname.startsWith('/transportadora')) {
    // Extrair access_token dos cookies
    const accessToken = extractAccessToken(request)
    
    if (!accessToken) {
      if (isDevelopment) {
        console.log('[MIDDLEWARE] Nenhum token encontrado, redirecionando para login')
      }
      const loginUrl = new URL('/', request.url)
      loginUrl.searchParams.set('next', pathname)
      return NextResponse.redirect(loginUrl)
    }

    // Validar token com Supabase Auth
    const isValid = await validateAccessToken(accessToken)
    
    if (!isValid) {
      if (isDevelopment) {
        console.log('[MIDDLEWARE] Token inválido, redirecionando para login')
      }
      const loginUrl = new URL('/', request.url)
      loginUrl.searchParams.set('next', pathname)
      return NextResponse.redirect(loginUrl)
    }
  }

  // Limpar query param ?company (mantido)
  if (pathname === '/operador' && searchParams.has('company')) {
    const url = request.nextUrl.clone()
    url.searchParams.delete('company')
    return NextResponse.redirect(url)
  }

  // ✅ Permitir que a página de login (raiz) gerencie seus próprios redirecionamentos
  // Não interferir na raiz para evitar loops de redirecionamento
  // A página de login verifica o cookie golffox-session e redireciona apropriadamente
  if (pathname === '/') {
    // Não fazer nada na raiz - deixar a página de login gerenciar
    return NextResponse.next()
  }

  return response
}

export const config = {
  matcher: [
    '/login',
    '/login/:path*',
    '/admin/:path*',
    '/operator/:path*',
    '/operador',
    '/operador/:path*',
    '/carrier/:path*',
    '/transportadora/:path*',
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}
