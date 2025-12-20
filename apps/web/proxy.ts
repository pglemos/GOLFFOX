/**
 * Next.js 16.1 Middleware (Proxy)
 * 
 * Centraliza autenticação, autorização e roteamento de requisições.
 * Segue as melhores práticas do Next.js 16.1 com TypeScript strict mode.
 * 
 * Responsabilidades:
 * - Validação de autenticação via Supabase
 * - Proteção de rotas baseada em roles
 * - Redirecionamentos de compatibilidade (transportadora → transportadora, etc.)
 * - Normalização de URLs
 */

import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { validateAuth, hasRole, type AuthenticatedUser } from '@/lib/api-auth'
import { normalizeRole } from '@/lib/role-mapper'
import { debug, warn, error as logError } from '@/lib/logger'

const isDevelopment = process.env.NODE_ENV === 'development'

/**
 * Rotas que não requerem autenticação
 */
const PUBLIC_ROUTES = [
  '/',
  '/unauthorized',
  '/diagnostico',
] as const

/**
 * Rotas de assets e internas do Next.js que devem ser ignoradas
 */
const STATIC_ROUTES = [
  '/_next',
  '/static',
  '/assets',
  '/icons',
  '/favicon.ico',
  '/_vercel',
] as const

/**
 * Mapeamento de rotas antigas para novas (compatibilidade)
 */
const ROUTE_REDIRECTS: Record<string, string> = {
  '/transportadora': '/transportadora',
  '/operador': '/empresa',
  '/operador': '/transportadora',
  '/login': '/',
}

/**
 * Roles permitidas para cada rota protegida
 * Nota: Roles são normalizadas antes da verificação, então aceitamos ambos os formatos
 */
const ROUTE_ROLES: Record<string, string[]> = {
  '/admin': ['admin'],
  '/empresa': ['admin', 'empresa'], // operador será normalizado para empresa
  '/transportadora': ['admin', 'operador', 'transportadora'], // transportadora será normalizado para operador
}

/**
 * Mapeamento de role para rota padrão de redirecionamento
 * Nota: Roles são normalizadas antes do redirecionamento
 */
const ROLE_DEFAULT_ROUTES: Record<string, string> = {
  admin: '/admin',
  empresa: '/empresa',
  operador: '/transportadora',
  transportadora: '/transportadora', // sinônimo de operador
}

/**
 * Verifica se uma rota é pública (não requer autenticação)
 */
function isPublicRoute(pathname: string): boolean {
  return PUBLIC_ROUTES.some(route => pathname === route || pathname.startsWith(`${route}/`))
}

/**
 * Verifica se uma rota é estática (assets, _next, etc.)
 */
function isStaticRoute(pathname: string): boolean {
  return STATIC_ROUTES.some(route => pathname.startsWith(route)) || pathname === '/favicon.ico'
}

/**
 * Verifica se uma rota requer autenticação
 */
function isProtectedRoute(pathname: string): boolean {
  return Object.keys(ROUTE_ROLES).some(route => pathname.startsWith(route))
}

/**
 * Obtém roles permitidas para uma rota
 */
function getAllowedRoles(pathname: string): string[] | null {
  for (const [route, roles] of Object.entries(ROUTE_ROLES)) {
    if (pathname.startsWith(route)) {
      return roles
    }
  }
  return null
}

/**
 * Sanitiza e valida um path de redirecionamento
 */
function sanitizeRedirectPath(raw: string | null, baseUrl: string): string | null {
  if (!raw) return null
  
  try {
    const decoded = decodeURIComponent(raw)
    
    // Rejeitar URLs absolutas (prevenir open redirect)
    if (/^https?:\/\//i.test(decoded)) {
      warn('Tentativa de redirecionamento para URL absoluta bloqueada', { path: decoded }, 'Proxy')
      return null
    }
    
    // Deve começar com /
    if (!decoded.startsWith('/')) {
      return null
    }
    
    // Validar URL
    const url = new URL(decoded, baseUrl)
    
    // Remover parâmetros sensíveis
    url.searchParams.delete('company')
    
    return url.pathname
  } catch {
    return null
  }
}

/**
 * Obtém rota padrão para um role
 * Normaliza o role antes de buscar a rota
 */
function getDefaultRouteForRole(role: string): string | null {
  const normalizedRole = normalizeRole(role)
  return ROLE_DEFAULT_ROUTES[normalizedRole] || null
}

/**
 * Aplica redirecionamentos de compatibilidade
 */
function applyCompatibilityRedirects(pathname: string, request: NextRequest): NextResponse | null {
  for (const [oldRoute, newRoute] of Object.entries(ROUTE_REDIRECTS)) {
    if (pathname === oldRoute || pathname.startsWith(`${oldRoute}/`)) {
      const newPath = pathname.replace(oldRoute, newRoute)
      const newUrl = new URL(newPath, request.url)
      newUrl.search = request.nextUrl.search
      
      debug('Redirecionamento de compatibilidade', {
        from: pathname,
        to: newPath
      }, 'Proxy')
      
      return NextResponse.redirect(newUrl)
    }
  }
  
  return null
}

/**
 * Limpa parâmetros de query indesejados
 */
function cleanQueryParams(pathname: string, request: NextRequest): NextResponse | null {
  // Limpar ?company da rota /empresa
  if (pathname === '/empresa' && request.nextUrl.searchParams.has('company')) {
    const url = request.nextUrl.clone()
    url.searchParams.delete('company')
    
    debug('Limpando parâmetro company da URL', { pathname }, 'Proxy')
    
    return NextResponse.redirect(url)
  }
  
  return null
}

/**
 * Proxy/Middleware principal
 * 
 * Next.js 16.1: Edge Runtime por padrão
 * - Não pode usar Node.js APIs
 * - Deve ser assíncrono
 * - Deve retornar NextResponse
 * 
 * Boas práticas Next.js 16.1:
 * - Lógica simples e focada
 * - Evitar operações pesadas
 * - Usar matcher para otimizar performance
 */
export default async function proxy(request: NextRequest): Promise<NextResponse> {
  const { pathname, searchParams } = request.nextUrl
  
  // Permitir desabilitar proxy apenas em desenvolvimento (para testes)
  if (process.env.NEXT_PUBLIC_DISABLE_MIDDLEWARE === 'true' && isDevelopment) {
    debug('Proxy desabilitado via variável de ambiente', {}, 'Proxy')
    return NextResponse.next()
  }
  
  // Ignorar rotas de API (elas têm sua própria autenticação)
  if (pathname.startsWith('/api')) {
    return NextResponse.next()
  }
  
  // Ignorar rotas estáticas
  if (isStaticRoute(pathname)) {
    return NextResponse.next()
  }
  
  // Aplicar redirecionamentos de compatibilidade
  const compatibilityRedirect = applyCompatibilityRedirects(pathname, request)
  if (compatibilityRedirect) {
    return compatibilityRedirect
  }
  
  // Limpar parâmetros de query indesejados
  const queryCleanup = cleanQueryParams(pathname, request)
  if (queryCleanup) {
    return queryCleanup
  }
  
  // Rotas públicas não requerem autenticação
  if (isPublicRoute(pathname)) {
    // Para a rota raiz (/), verificar se há sessão e redirecionar se apropriado
    if (pathname === '/') {
      return handleRootRoute(request)
    }
    
    // Para outras rotas públicas, permitir acesso sem verificação
    return NextResponse.next()
  }
  
  // Proteger rotas que requerem autenticação
  if (isProtectedRoute(pathname)) {
    return await handleProtectedRoute(pathname, request)
  }
  
  // Permitir outras rotas (não protegidas)
  return NextResponse.next()
}

/**
 * Manipula a rota raiz (/)
 * Verifica sessão e redireciona se usuário já estiver autenticado
 */
async function handleRootRoute(request: NextRequest): Promise<NextResponse> {
  const nextParam = request.nextUrl.searchParams.get('next')
  const safeNext = sanitizeRedirectPath(nextParam, request.url)
  
  // Validar autenticação usando lib/api-auth.ts
  const user = await validateAuth(request)
  
  if (user) {
    // ✅ CORREÇÃO: Se há parâmetro ?next e usuário tem permissão, redirecionar
    // Remover o parâmetro ?next da URL ao redirecionar
    if (safeNext) {
      const allowedRoles = getAllowedRoles(safeNext)
      if (allowedRoles && hasRole(user, allowedRoles)) {
        const url = new URL(safeNext, request.url)
        // Limpar parâmetros de query ao redirecionar
        url.search = ''
        debug('Redirecionando para rota solicitada (via ?next)', {
          path: safeNext,
          role: user.role
        }, 'Proxy')
        return NextResponse.redirect(url)
      }
    }
    
    // Redirecionar para rota padrão do role
    const defaultRoute = getDefaultRouteForRole(user.role)
    if (defaultRoute) {
      const url = new URL(defaultRoute, request.url)
      // Limpar parâmetros de query ao redirecionar
      url.search = ''
      debug('Redirecionando para rota padrão do role', {
        role: user.role,
        route: defaultRoute
      }, 'Proxy')
      return NextResponse.redirect(url)
    }
  }
  
  // Não autenticado ou sem rota padrão - permitir acesso à página de login
  // ✅ CORREÇÃO: Se há parâmetro ?next, manter na URL para redirecionamento após login
  // Mas apenas se não houver cookie de sessão (usuário realmente não autenticado)
  const hasSessionCookie = request.cookies.get('golffox-session')?.value
  if (!hasSessionCookie && safeNext) {
    // Manter ?next= na URL apenas se não houver sessão
    debug('Mantendo parâmetro ?next na URL para redirecionamento após login', {
      next: safeNext
    }, 'Proxy')
  }
  
  return NextResponse.next()
}

/**
 * Manipula rotas protegidas
 * Valida autenticação e autorização baseada em roles
 */
async function handleProtectedRoute(
  pathname: string,
  request: NextRequest
): Promise<NextResponse> {
  // Obter roles permitidas para esta rota
  const allowedRoles = getAllowedRoles(pathname)
  
  if (!allowedRoles) {
    // Rota protegida mas sem roles definidas - negar acesso por segurança
    warn('Rota protegida sem roles definidas', { pathname }, 'Proxy')
    return NextResponse.redirect(new URL('/unauthorized?reason=unauthorized', request.url))
  }
  
  // Validar autenticação usando lib/api-auth.ts (centralizado e consistente)
  const user = await validateAuth(request)
  
  if (!user) {
    // Não autenticado - redirecionar para login com ?next
    debug('Usuário não autenticado, redirecionando para login', { pathname }, 'Proxy')
    const loginUrl = new URL('/', request.url)
    loginUrl.searchParams.set('next', pathname)
    return NextResponse.redirect(loginUrl)
  }
  
  // Normalizar role do usuário antes de verificar
  const normalizedUserRole = normalizeRole(user.role)
  const normalizedUser: AuthenticatedUser = { ...user, role: normalizedUserRole }
  
  // Verificar se usuário tem role permitida (usando role normalizado)
  if (!hasRole(normalizedUser, allowedRoles)) {
    // Não autorizado - redirecionar para página de não autorizado
    warn('Acesso negado - role não permitida', {
      pathname,
      userRole: user.role,
      normalizedRole: normalizedUserRole,
      allowedRoles
    }, 'Proxy')
    
    const unauthorizedUrl = new URL('/unauthorized', request.url)
    unauthorizedUrl.searchParams.set('reason', 'unauthorized')
    unauthorizedUrl.searchParams.set('role', normalizedUserRole)
    return NextResponse.redirect(unauthorizedUrl)
  }
  
  // Usuário autenticado e autorizado - permitir acesso
  debug('Acesso permitido', {
    pathname,
    role: user.role
  }, 'Proxy')
  
  return NextResponse.next()
}

// ✅ Exportação já está como default acima (Next.js 16.1 best practice)

/**
 * Configuração do matcher para Next.js 16.1
 * 
 * Otimiza performance ao limitar quando o middleware é executado.
 * Next.js 16.1 suporta patterns mais complexos.
 */
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - api (API routes têm autenticação própria)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (images, etc.)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)).*)',
  ],
}
