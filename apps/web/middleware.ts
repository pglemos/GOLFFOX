import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

/**
 * Middleware para proteger rotas e redirecionar usuários baseado em seus roles
 * 
 * Regras:
 * - Admin: acesso a /admin
 * - Operador: acesso a /operador
 * - Transportadora: acesso a /transportadora
 * - Driver/Passenger: bloqueados (devem usar app mobile)
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Permitir acesso público a rotas específicas
  const publicRoutes = ['/', '/unauthorized', '/api', '/_next', '/favicon.ico']
  const isPublicRoute = publicRoutes.some(route => 
    pathname === route || pathname.startsWith(route)
  )

  if (isPublicRoute) {
    return NextResponse.next()
  }

  // Extrair cookie de sessão
  const sessionCookie = request.cookies.get('golffox-session')
  
  if (!sessionCookie) {
    // Sem sessão - redirecionar para login com next param
    const loginUrl = new URL('/', request.url)
    loginUrl.searchParams.set('next', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // Decodificar dados do usuário do cookie
  let userData: { role?: string; email?: string } | null = null
  try {
    const decoded = atob(sessionCookie.value)
    userData = JSON.parse(decoded)
  } catch (error) {
    // Cookie inválido - limpar e redirecionar para login
    const loginUrl = new URL('/', request.url)
    loginUrl.searchParams.set('next', pathname)
    const response = NextResponse.redirect(loginUrl)
    response.cookies.delete('golffox-session')
    return response
  }

  const userRole = userData?.role || ''

  // Bloquear acesso de driver e passenger - devem usar app mobile
  if (userRole === 'driver' || userRole === 'passenger') {
    const unauthorizedUrl = new URL('/unauthorized', request.url)
    unauthorizedUrl.searchParams.set('reason', 'mobile_only')
    unauthorizedUrl.searchParams.set('role', userRole)
    return NextResponse.redirect(unauthorizedUrl)
  }

  // Proteger rotas por role
  if (pathname.startsWith('/admin')) {
    if (userRole !== 'admin') {
      const unauthorizedUrl = new URL('/unauthorized', request.url)
      unauthorizedUrl.searchParams.set('reason', 'admin_only')
      unauthorizedUrl.searchParams.set('role', userRole)
      return NextResponse.redirect(unauthorizedUrl)
    }
  }

  if (pathname.startsWith('/operador') || pathname.startsWith('/operator')) {
    if (!['admin', 'operador', 'operator', 'empresa'].includes(userRole)) {
      const unauthorizedUrl = new URL('/unauthorized', request.url)
      unauthorizedUrl.searchParams.set('reason', 'operator_access_required')
      unauthorizedUrl.searchParams.set('role', userRole)
      return NextResponse.redirect(unauthorizedUrl)
    }
  }

  if (pathname.startsWith('/transportadora') || pathname.startsWith('/carrier')) {
    if (!['admin', 'transportadora', 'carrier'].includes(userRole)) {
      const unauthorizedUrl = new URL('/unauthorized', request.url)
      unauthorizedUrl.searchParams.set('reason', 'carrier_access_required')
      unauthorizedUrl.searchParams.set('role', userRole)
      return NextResponse.redirect(unauthorizedUrl)
    }
  }

  // Bloquear acesso direto a /driver e /passenger (mesmo que os arquivos não existam mais)
  if (pathname.startsWith('/driver') || pathname.startsWith('/passenger')) {
    const unauthorizedUrl = new URL('/unauthorized', request.url)
    unauthorizedUrl.searchParams.set('reason', 'mobile_only')
    unauthorizedUrl.searchParams.set('role', userRole || 'unknown')
    return NextResponse.redirect(unauthorizedUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}

