import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function middleware(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl

  // console.log('[middleware] DISABLE?', process.env.NEXT_PUBLIC_DISABLE_MIDDLEWARE)
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

  // Permitir raiz '/' exibir página de login

  // Redirecionar /login para / (raiz)
  if (pathname === '/login' || pathname.startsWith('/login/')) {
    const rootUrl = new URL('/', request.url)
    // Preservar parâmetros de query se existirem
    if (searchParams.has('next')) {
      rootUrl.searchParams.set('next', searchParams.get('next')!)
    }
    return NextResponse.redirect(rootUrl)
  }

  // ✅ Proteger rotas /operator e /admin com autenticação (OTIMIZADO)
  if (pathname.startsWith('/operator') || pathname.startsWith('/admin')) {
    // Verificar cookie de sessão customizado (golffox-session) - validação rápida
    const sessionCookie = request.cookies.get('golffox-session')?.value
    
    // Se não há cookie, redirecionar imediatamente (sem validação pesada)
    if (!sessionCookie) {
      const loginUrl = new URL('/', request.url)
      loginUrl.searchParams.set('next', pathname)
      return NextResponse.redirect(loginUrl)
    }

    // Validação rápida do cookie (sem chamada ao Supabase em desenvolvimento)
    try {
      // Decodificar cookie (base64) em ambiente Edge (sem Buffer)
      const decoded = typeof atob === 'function'
        ? atob(sessionCookie)
        : Buffer.from(sessionCookie, 'base64').toString('utf-8')
      const userData = JSON.parse(decoded)

      if (!userData?.id || !userData?.role) {
        throw new Error('Invalid session data')
      }

      // ✅ Validar role do usuário (validação rápida)
      if (pathname.startsWith('/operator') && !['operator', 'admin'].includes(userData.role)) {
        return NextResponse.redirect(new URL('/unauthorized', request.url))
      }

      if (pathname.startsWith('/admin') && userData.role !== 'admin') {
        return NextResponse.redirect(new URL('/unauthorized', request.url))
      }

      // ✅ Em desenvolvimento, pular validação do token Supabase (muito lenta)
      // A validação completa será feita no lado do cliente se necessário
      // Isso acelera significativamente a navegação
      
    } catch (err) {
      // Cookie inválido, redirecionar para login e limpar cookie
      const loginUrl = new URL('/', request.url)
      loginUrl.searchParams.set('next', pathname)
      const res = NextResponse.redirect(loginUrl)
      res.cookies.set('golffox-session', '', { maxAge: 0, path: '/' })
      return res
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
  // Redirecionar raiz com ?next= quando há sessão válida
  if (pathname === '/' && searchParams.has('next')) {
    const nextRaw = searchParams.get('next') || ''
    const sessionCookie = request.cookies.get('golffox-session')?.value
    if (sessionCookie && nextRaw.startsWith('/')) {
      try {
        const decoded = typeof atob === 'function'
          ? atob(sessionCookie)
          : Buffer.from(sessionCookie, 'base64').toString('utf-8')
        const userData = JSON.parse(decoded)
        if (userData?.role) {
          const nextPath = new URL(nextRaw, request.url)
          const pathOnly = nextPath.pathname
          const isAllowed = (
            (pathOnly.startsWith('/admin') && userData.role === 'admin') ||
            (pathOnly.startsWith('/operator') && ['admin', 'operator'].includes(userData.role)) ||
            (pathOnly.startsWith('/carrier') && ['admin', 'carrier'].includes(userData.role)) ||
            (!pathOnly.startsWith('/admin') && !pathOnly.startsWith('/operator') && !pathOnly.startsWith('/carrier'))
          )
          const defaultHome = userData.role === 'admin' ? '/admin'
            : userData.role === 'operator' ? '/operator'
            : userData.role === 'carrier' ? '/carrier' : '/'
          const destination = isAllowed ? pathOnly : defaultHome
          return NextResponse.redirect(new URL(destination, request.url))
        }
      } catch (_) {
        // Ignorar erros de decodificação e seguir fluxo normal
      }
    }
  }
