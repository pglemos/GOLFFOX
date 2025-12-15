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

export const proxy = async (request: NextRequest) => {
  const { pathname, searchParams } = request.nextUrl

  // ✅ Permitir desabilitar autenticação via variável de ambiente (apenas em desenvolvimento)
  // ⚠️ SEGURANÇA: Nunca permitir bypass em produção
  if (process.env.NEXT_PUBLIC_DISABLE_MIDDLEWARE === 'true' && isDevelopment) {
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

  // ✅ Redirecionar /operator para /empresa (compatibilidade - role antiga operator → nova role empresa)
  if (pathname.startsWith('/operator')) {
    const empresaUrl = new URL(pathname.replace('/operator', '/empresa'), request.url)
    empresaUrl.search = request.nextUrl.search
    return NextResponse.redirect(empresaUrl)
  }

  // ✅ Redirecionar /operador para /transportadora (compatibilidade - nome confuso)
  if (pathname.startsWith('/operador')) {
    const transportadoraUrl = new URL(pathname.replace('/operador', '/transportadora'), request.url)
    transportadoraUrl.search = request.nextUrl.search
    return NextResponse.redirect(transportadoraUrl)
  }

  // ✅ Proteger rotas /empresa, /admin e /transportadora com autenticação
  // VALIDAR token com Supabase antes de liberar acesso
  if (pathname.startsWith('/empresa') || pathname.startsWith('/admin') || pathname.startsWith('/transportadora')) {
    // Extrair access_token dos cookies
    const accessToken = extractAccessToken(request)
    const sessionCookie = request.cookies.get('golffox-session')?.value
    let cookieRole: string | null = null
    if (sessionCookie) {
      try {
        const decoded = Buffer.from(sessionCookie, 'base64').toString('utf-8')
        const session = JSON.parse(decoded)
        cookieRole = session?.role || null
      } catch {}
    }

    if (!accessToken) {
      // Em desenvolvimento, permitir acesso se cookie indicar role compatível com a rota
      if (isDevelopment && cookieRole) {
        const allowed =
          (pathname.startsWith('/admin') && cookieRole === 'admin') ||
          (pathname.startsWith('/empresa') && ['admin', 'empresa', 'operator'].includes(cookieRole)) ||
          (pathname.startsWith('/transportadora') && ['admin', 'operador', 'carrier', 'transportadora'].includes(cookieRole))
        if (allowed) {
          return NextResponse.next()
        }
      } else {
        if (isDevelopment) {
          console.log('[MIDDLEWARE] Nenhum token encontrado, redirecionando para login')
        }
        const loginUrl = new URL('/', request.url)
        loginUrl.searchParams.set('next', pathname)
        return NextResponse.redirect(loginUrl)
      }
    }

    // Validar token com Supabase Auth
    const isValid = accessToken ? await validateAccessToken(accessToken) : false

    if (!isValid) {
      // Em desenvolvimento, permitir acesso se cookie indicar role compatível com a rota
      if (isDevelopment && cookieRole) {
        const allowed =
          (pathname.startsWith('/admin') && cookieRole === 'admin') ||
          (pathname.startsWith('/empresa') && ['admin', 'empresa', 'operator'].includes(cookieRole)) ||
          (pathname.startsWith('/transportadora') && ['admin', 'operador', 'carrier', 'transportadora'].includes(cookieRole))
        if (allowed) {
          return NextResponse.next()
        }
      } else {
        if (isDevelopment) {
          console.log('[MIDDLEWARE] Token inválido, redirecionando para login')
        }
        const loginUrl = new URL('/', request.url)
        loginUrl.searchParams.set('next', pathname)
        return NextResponse.redirect(loginUrl)
      }
    }
  }

  // Limpar query param ?company (mantido)
  if (pathname === '/empresa' && searchParams.has('company')) {
    const url = request.nextUrl.clone()
    url.searchParams.delete('company')
    return NextResponse.redirect(url)
  }

  // ✅ Permitir que a página de login (raiz) gerencie seus próprios redirecionamentos
  // Não interferir na raiz para evitar loops de redirecionamento
  // A página de login verifica o cookie golffox-session e redireciona apropriadamente
  if (pathname === '/') {
    const sessionCookie = request.cookies.get('golffox-session')?.value
    const nextParamRaw = request.nextUrl.searchParams.get('next')

    const sanitizePath = (raw: string | null, base: string): string | null => {
      if (!raw) return null
      try {
        const decoded = decodeURIComponent(raw)
        if (/^https?:\/\//i.test(decoded)) return null
        if (!decoded.startsWith('/')) return null
        const url = new URL(decoded, base)
        url.searchParams.delete('company')
        return url.pathname
      } catch {
        return null
      }
    }
    const isAllowedForRole = (role: string, path: string): boolean => {
      if (path.startsWith('/admin')) return role === 'admin'
      if (path.startsWith('/empresa')) return ['admin', 'empresa', 'operator'].includes(role)
      if (path.startsWith('/transportadora')) return ['admin', 'operador', 'carrier', 'transportadora'].includes(role)
      return true
    }

    let role: string | null = null
    let token: string | null = null

    if (sessionCookie) {
      try {
        const decoded = Buffer.from(sessionCookie, 'base64').toString('utf-8')
        const session = JSON.parse(decoded)
        token = session?.access_token || session?.accessToken || null
        role = session?.role || null
      } catch {}
    }

    const safeNext = sanitizePath(nextParamRaw, request.url)

    if (safeNext && role && isAllowedForRole(role, safeNext)) {
      const url = new URL(safeNext, request.url)
      return NextResponse.redirect(url)
    }

    if (role) {
      // Em desenvolvimento, redirecionar mesmo sem validar token
      if (isDevelopment || (token && await validateAccessToken(token))) {
        let target: string | null = null
        if (role === 'admin') target = '/admin'
        else if (role === 'empresa' || role === 'operator') target = '/empresa'
        else if (role === 'operador' || role === 'transportadora' || role === 'carrier') target = '/transportadora'
        else target = null
        if (target) {
          const url = new URL(target, request.url)
          return NextResponse.redirect(url)
        }
      }
    }

    return NextResponse.next()
  }

  return response
}

export default proxy

export const config = {
  matcher: [
    '/login',
    '/login/:path*',
    '/admin/:path*',
    '/empresa',
    '/empresa/:path*',
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

