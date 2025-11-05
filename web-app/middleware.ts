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
  // Determinar origem confiável para redirecionamentos
  const envBase = process.env.NEXT_PUBLIC_BASE_URL
  const headerHost = req.headers.get('host') || ''
  const requestOrigin = `${req.nextUrl.protocol}//${headerHost}`
  const origin = envBase ? envBase : requestOrigin

  // Structured logging helper
  const now = new Date().toISOString()
  const userAgent = req.headers.get('user-agent') || 'unknown'
  const forwardedFor = req.headers.get('x-forwarded-for') || ''
  const clientIp = (forwardedFor.split(',')[0] || '').trim() || 'unknown'
  const log = (level: 'info' | 'warning' | 'error', message: string, meta: Record<string, any> = {}) => {
    const entry = { ts: now, level, path: pathname, ip: clientIp, ua: userAgent, ...meta }
    if (level === 'error') console.error(message, entry)
    else if (level === 'warning') console.warn(message, entry)
    else console.log(message, entry)
  }

  log('info', '🔍 Middleware executado', { origin })

  // Rotas públicas que não precisam de autenticação
  const publicRoutes = ['/', '/login', '/unauthorized', '/test-auth']
  const apiRoutes = ['/api/']
  
  // Verificar se é rota pública
  if (publicRoutes.includes(pathname) || apiRoutes.some(route => pathname.startsWith(route))) {
    log('info', '✅ Rota pública permitida', {})
    return NextResponse.next()
  }

  // Identificar tipo de rota protegida
  const isAdminRoute = pathname.startsWith('/admin')
  const isOperatorRoute = pathname.startsWith('/operator')
  const isCarrierRoute = pathname.startsWith('/carrier')

  log('info', '🔒 Verificando rota protegida', { isAdminRoute, isOperatorRoute, isCarrierRoute })

  // Se não é rota protegida, permitir acesso
  if (!isAdminRoute && !isOperatorRoute && !isCarrierRoute) {
    return NextResponse.next()
  }

  // Tentar obter dados do usuário do cookie personalizado
  let user: UserData | null = null
  
  try {
    const sessionCookie = req.cookies.get('golffox-session')?.value
    if (!sessionCookie) {
      log('info', '🍪 Cookie de sessão ausente', {})
    }
    
    if (sessionCookie) {
      user = extractUserFromCookie(sessionCookie)
      log('info', '👤 Usuário extraído do cookie', { email: user?.email, role: user?.role })
    }
  } catch (error) {
    log('error', '❌ Erro ao extrair usuário do cookie', { error })
  }

  // Se não está autenticado e tenta acessar rota protegida
  if (!user && (isAdminRoute || isOperatorRoute || isCarrierRoute)) {
    log('info', '❌ Usuário não autenticado tentando acessar rota protegida')
    const redirectUrl = new URL('/login', origin)
    redirectUrl.searchParams.set('next', pathname)
    log('info', '↪️ Redirecionando para login', { redirect: redirectUrl.toString() })
    return NextResponse.redirect(redirectUrl)
  }

  // Se está autenticado, verificar permissões
  if (user) {
    log('info', '🔐 Verificando permissões', { role: user.role })
    
    // Verificar se o usuário tem permissão para acessar a rota
    if (isAdminRoute && user.role !== 'admin') {
      log('warning', '❌ Acesso negado: usuário não é admin', { current: user.role, required: 'admin' })
      const redirectUrl = new URL('/unauthorized', origin)
      redirectUrl.searchParams.set('reason', 'insufficient_permissions')
      redirectUrl.searchParams.set('required', 'admin')
      redirectUrl.searchParams.set('current', user.role)
      log('warning', '↪️ Redirecionando para unauthorized', { redirect: redirectUrl.toString() })
      return NextResponse.redirect(redirectUrl)
    }
    
    if (isOperatorRoute && !['admin', 'operator'].includes(user.role)) {
      log('warning', '❌ Acesso negado: usuário não é operator ou admin', { current: user.role, required: 'operator' })
      const redirectUrl = new URL('/unauthorized', origin)
      redirectUrl.searchParams.set('reason', 'insufficient_permissions')
      redirectUrl.searchParams.set('required', 'operator')
      redirectUrl.searchParams.set('current', user.role)
      log('warning', '↪️ Redirecionando para unauthorized', { redirect: redirectUrl.toString() })
      return NextResponse.redirect(redirectUrl)
    }
    
    if (isCarrierRoute && !['admin', 'carrier'].includes(user.role)) {
      log('warning', '❌ Acesso negado: usuário não é carrier ou admin', { current: user.role, required: 'carrier' })
      const redirectUrl = new URL('/unauthorized', origin)
      redirectUrl.searchParams.set('reason', 'insufficient_permissions')
      redirectUrl.searchParams.set('required', 'carrier')
      redirectUrl.searchParams.set('current', user.role)
      log('warning', '↪️ Redirecionando para unauthorized', { redirect: redirectUrl.toString() })
      return NextResponse.redirect(redirectUrl)
    }
    
    log('info', '✅ Acesso permitido')
    return NextResponse.next()
  }

  // Se chegou até aqui sem usuário válido, redirecionar para login
  log('info', '❌ Falha na autenticação - redirecionando para login')
  const redirectUrl = new URL('/login', origin)
  redirectUrl.searchParams.set('next', pathname)
  redirectUrl.searchParams.set('error', 'no_auth')
  log('info', '↪️ Redirecionando para login (final fallback)', { redirect: redirectUrl.toString() })
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
