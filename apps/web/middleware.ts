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

  // ✅ Redirecionar /carrier para /transportadora (compatibilidade)
  if (pathname.startsWith('/carrier')) {
    const transportadoraUrl = new URL(pathname.replace('/carrier', '/transportadora'), request.url)
    transportadoraUrl.search = request.nextUrl.search
    return NextResponse.redirect(transportadoraUrl)
  }

  // ✅ Proteger rotas /operator, /admin e /transportadora com autenticação
  // A validação completa será feita no lado do cliente e nas rotas API
  // O middleware apenas verifica se há sessão Supabase ativa
  if (pathname.startsWith('/operator') || pathname.startsWith('/admin') || pathname.startsWith('/transportadora')) {
    // Verificar se há cookie de sessão do Supabase (validação rápida)
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    let hasSupabaseSession = false
    
    if (supabaseUrl) {
      const projectRef = supabaseUrl.split('//')[1]?.split('.')[0]
      if (projectRef) {
        const supabaseCookieName = `sb-${projectRef}-auth-token`
        const supabaseCookie = request.cookies.get(supabaseCookieName)?.value
        hasSupabaseSession = !!supabaseCookie
      }
    }
    
    // Se não há sessão Supabase, redirecionar para login
    // A validação completa será feita no cliente e nas APIs
    if (!hasSupabaseSession) {
      const loginUrl = new URL('/', request.url)
      loginUrl.searchParams.set('next', pathname)
      return NextResponse.redirect(loginUrl)
    }
  }

  // Limpar query param ?company (mantido)
  if (pathname === '/operator' && searchParams.has('company')) {
    const url = request.nextUrl.clone()
    url.searchParams.delete('company')
    return NextResponse.redirect(url)
  }

  // ✅ Redirecionar raiz com ?next= quando há sessão Supabase válida
  // A validação completa será feita no cliente
  if (pathname === '/' && searchParams.has('next')) {
    const nextRaw = searchParams.get('next') || ''
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    let hasSupabaseSession = false
    
    if (supabaseUrl && nextRaw.startsWith('/')) {
      const projectRef = supabaseUrl.split('//')[1]?.split('.')[0]
      if (projectRef) {
        const supabaseCookieName = `sb-${projectRef}-auth-token`
        const supabaseCookie = request.cookies.get(supabaseCookieName)?.value
        hasSupabaseSession = !!supabaseCookie
      }
      
      // Se há sessão Supabase, permitir redirecionamento
      // A validação completa será feita no cliente
      if (hasSupabaseSession) {
        const nextPath = new URL(nextRaw, request.url)
        return NextResponse.redirect(nextPath)
      }
    }
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
