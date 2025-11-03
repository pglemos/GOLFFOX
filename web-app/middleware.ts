import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

interface UserData {
  id: string
  email: string
  role: string
  accessToken: string
}

function extractUserFromCookie(cookieValue: string): UserData | null {
  try {
    const decoded = atob(cookieValue) // Base64 decode
    return JSON.parse(decoded)
  } catch {
    return null
  }
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl
  
  console.log('🔍 Middleware executado para:', pathname)

  // Rotas públicas que não precisam de autenticação
  const publicRoutes = ['/', '/login', '/unauthorized', '/test-auth']
  const apiRoutes = ['/api/']
  
  // Verificar se é rota pública
  if (publicRoutes.includes(pathname) || apiRoutes.some(route => pathname.startsWith(route))) {
    console.log('✅ Rota pública permitida:', pathname)
    return NextResponse.next()
  }

  // Identificar tipo de rota protegida
  const isAdminRoute = pathname.startsWith('/admin')
  const isOperatorRoute = pathname.startsWith('/operator')
  const isCarrierRoute = pathname.startsWith('/carrier')

  console.log('🔒 Verificando rota protegida:', { pathname, isAdminRoute, isOperatorRoute, isCarrierRoute })

  // Se não é rota protegida, permitir acesso
  if (!isAdminRoute && !isOperatorRoute && !isCarrierRoute) {
    return NextResponse.next()
  }

  // Tentar obter dados do usuário do cookie personalizado
  let user: UserData | null = null
  
  try {
    const sessionCookie = req.cookies.get('golffox-session')?.value
    console.log('🍪 Cookie de sessão encontrado:', !!sessionCookie)
    
    if (sessionCookie) {
      user = extractUserFromCookie(sessionCookie)
      console.log('👤 Usuário extraído do cookie:', user ? `${user.email} (${user.role})` : 'null')
    }
  } catch (error) {
    console.error('❌ Erro ao extrair usuário do cookie:', error)
  }

  // Se não está autenticado e tenta acessar rota protegida
  if (!user && (isAdminRoute || isOperatorRoute || isCarrierRoute)) {
    console.log('❌ Usuário não autenticado tentando acessar rota protegida')
    const redirectUrl = new URL('/login', req.url)
    redirectUrl.searchParams.set('next', pathname)
    return NextResponse.redirect(redirectUrl)
  }

  // Se está autenticado, verificar permissões
  if (user) {
    console.log('🔐 Verificando permissões para:', user.role, 'na rota:', pathname)
    
    // Verificar se o usuário tem permissão para acessar a rota
    if (isAdminRoute && user.role !== 'admin') {
      console.log('❌ Acesso negado: usuário não é admin')
      const redirectUrl = new URL('/unauthorized', req.url)
      redirectUrl.searchParams.set('reason', 'insufficient_permissions')
      redirectUrl.searchParams.set('required', 'admin')
      redirectUrl.searchParams.set('current', user.role)
      return NextResponse.redirect(redirectUrl)
    }
    
    if (isOperatorRoute && !['admin', 'operator'].includes(user.role)) {
      console.log('❌ Acesso negado: usuário não é operator ou admin')
      const redirectUrl = new URL('/unauthorized', req.url)
      redirectUrl.searchParams.set('reason', 'insufficient_permissions')
      redirectUrl.searchParams.set('required', 'operator')
      redirectUrl.searchParams.set('current', user.role)
      return NextResponse.redirect(redirectUrl)
    }
    
    if (isCarrierRoute && !['admin', 'carrier'].includes(user.role)) {
      console.log('❌ Acesso negado: usuário não é carrier ou admin')
      const redirectUrl = new URL('/unauthorized', req.url)
      redirectUrl.searchParams.set('reason', 'insufficient_permissions')
      redirectUrl.searchParams.set('required', 'carrier')
      redirectUrl.searchParams.set('current', user.role)
      return NextResponse.redirect(redirectUrl)
    }
    
    console.log('✅ Acesso permitido')
    return NextResponse.next()
  }

  // Se chegou até aqui sem usuário válido, redirecionar para login
  console.log('❌ Falha na autenticação - redirecionando para login')
  const redirectUrl = new URL('/login', req.url)
  redirectUrl.searchParams.set('next', pathname)
  redirectUrl.searchParams.set('error', 'no_auth')
  return NextResponse.redirect(redirectUrl)
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
