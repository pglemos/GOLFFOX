import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function middleware(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl
  
  // ✅ Bypass para rotas de API - não aplicar middleware em rotas de API
  if (pathname.startsWith('/api')) {
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

  // ✅ Proteger rotas /operator e /admin com autenticação
  if (pathname.startsWith('/operator') || pathname.startsWith('/admin')) {
    // Verificar cookie de sessão customizado (golffox-session)
    const sessionCookie = request.cookies.get('golffox-session')?.value
    
    // Log para debug (apenas em desenvolvimento)
    if (process.env.NODE_ENV === 'development') {
      console.log('[Middleware] Verificando acesso:', {
        pathname,
        hasCookie: !!sessionCookie,
        cookieLength: sessionCookie?.length || 0,
        referer: request.headers.get('referer')
      })
    }
    
    // Se não há cookie, verificar se há sessão do Supabase Auth
    if (!sessionCookie) {
      // Tentar obter do header Authorization (fallback)
      const authHeader = request.headers.get('authorization')
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        const loginUrl = new URL('/', request.url)
        loginUrl.searchParams.set('next', pathname)
        
        if (process.env.NODE_ENV === 'development') {
          console.log('[Middleware] Redirecionando para login - sem cookie e sem auth header')
        }
        
        return NextResponse.redirect(loginUrl)
      }
    }

    // Se há cookie de sessão, validar
    if (sessionCookie) {
      try {
        // Decodificar cookie (base64) em ambiente Edge (sem Buffer)
        const decoded = typeof atob === 'function'
          ? atob(sessionCookie)
          : Buffer.from(sessionCookie, 'base64').toString('utf-8')
        const userData = JSON.parse(decoded)

        if (!userData?.id || !userData?.role) {
          throw new Error('Invalid session data')
        }

        // ✅ Validar role do usuário
        if (pathname.startsWith('/operator') && !['operator', 'admin'].includes(userData.role)) {
          return NextResponse.redirect(new URL('/unauthorized', request.url))
        }

        if (pathname.startsWith('/admin') && userData.role !== 'admin') {
          return NextResponse.redirect(new URL('/unauthorized', request.url))
        }

        // Validar token com Supabase (opcional, para garantir que ainda é válido)
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
        const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

        if (supabaseUrl && supabaseAnonKey && userData.accessToken) {
          const supabase = createClient(supabaseUrl, supabaseAnonKey, {
            auth: {
              persistSession: false,
              autoRefreshToken: false,
            },
          })

          const { error: authError } = await supabase.auth.getUser(userData.accessToken)
          if (authError) {
            // Token inválido, redirecionar para login
            const loginUrl = new URL('/', request.url)
            loginUrl.searchParams.set('next', pathname)
            return NextResponse.redirect(loginUrl)
          }
        }
      } catch (err) {
        // Cookie inválido ou erro de parsing, redirecionar para login
        const loginUrl = new URL('/', request.url)
        loginUrl.searchParams.set('next', pathname)
        return NextResponse.redirect(loginUrl)
      }
    }
  }

  // Limpar query param ?company (mantido)
  if (pathname === '/operator' && searchParams.has('company')) {
    const url = request.nextUrl.clone()
    url.searchParams.delete('company')
    return NextResponse.redirect(url)
  }

  return response
}

export const config = {
  matcher: [
    '/login',
    '/login/:path*',
    '/admin/:path*',
    '/operator',
    '/operator/:path*',
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
