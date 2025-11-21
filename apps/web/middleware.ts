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

  // ✅ Redirecionar /operator para /operador (compatibilidade)
  if (pathname.startsWith('/operator')) {
    const operadorUrl = new URL(pathname.replace('/operator', '/operador'), request.url)
    operadorUrl.search = request.nextUrl.search
    return NextResponse.redirect(operadorUrl)
  }

  // ✅ Proteger rotas /operador, /admin e /transportadora com autenticação
  // Verificar tanto cookie golffox-session quanto Supabase para compatibilidade
  if (pathname.startsWith('/operador') || pathname.startsWith('/admin') || pathname.startsWith('/transportadora')) {
    // Verificar cookie golffox-session primeiro (sistema principal)
    const golffoxSession = request.cookies.get('golffox-session')?.value
    let hasSession = !!golffoxSession
    
    // Se não há golffox-session, verificar Supabase como fallback
    if (!hasSession) {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
      if (supabaseUrl) {
        const projectRef = supabaseUrl.split('//')[1]?.split('.')[0]
        if (projectRef) {
          const supabaseCookieName = `sb-${projectRef}-auth-token`
          const supabaseCookie = request.cookies.get(supabaseCookieName)?.value
          hasSession = !!supabaseCookie
        }
      }
    }
    
    // Se não há nenhuma sessão, redirecionar para login
    // A validação completa será feita no cliente e nas APIs
    if (!hasSession) {
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
