import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  const pathname = req.nextUrl.pathname
  
  // Rotas públicas - não precisam de autenticação
  const publicRoutes = ['/', '/login', '/unauthorized']
  const isPublicRoute = publicRoutes.includes(pathname) || pathname.startsWith('/api/')
  
  // Se é rota pública, permitir acesso
  if (isPublicRoute) {
    return NextResponse.next()
  }
  
  const isAdminRoute = pathname.startsWith('/admin')
  const isOperatorRoute = pathname.startsWith('/operator')
  const isCarrierRoute = pathname.startsWith('/carrier')
  
  // Se não é rota protegida, permitir acesso
  if (!isAdminRoute && !isOperatorRoute && !isCarrierRoute) {
    return NextResponse.next()
  }
  
  // Criar cliente Supabase para middleware
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  
  if (!supabaseUrl || !supabaseAnonKey) {
    // Se não tem env vars, permitir mas será validado no client
    return NextResponse.next()
  }
  
  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  })

  // Tentar obter sessão dos cookies do Supabase
  // Supabase armazena sessão em cookie específico
  const cookies = req.cookies.getAll()
  const supabaseProjectRef = supabaseUrl.split('//')[1]?.split('.')[0]
  const authCookieName = `sb-${supabaseProjectRef}-auth-token`
  const authCookie = cookies.find(c => c.name === authCookieName)?.value
  
  let user = null
  let userRole: string | null = null
  
  if (authCookie) {
    try {
      const cookieData = JSON.parse(decodeURIComponent(authCookie))
      if (cookieData?.access_token) {
        const { data: { user: authUser } } = await supabase.auth.getUser(cookieData.access_token)
        if (authUser) {
          user = authUser
          // Buscar role do usuário na tabela users
          const { data: userData } = await supabase
            .from('users')
            .select('role')
            .eq('id', authUser.id)
            .single()
          
          userRole = userData?.role || authUser.user_metadata?.role || null
        }
      }
    } catch (error) {
      // Cookie inválido ou parse error
      console.error('Middleware auth error:', error)
    }
  }

  // Se não está autenticado e tenta acessar rota protegida
  if (!user && (isAdminRoute || isOperatorRoute || isCarrierRoute)) {
    const redirectUrl = new URL('/login', req.url)
    redirectUrl.searchParams.set('next', pathname)
    return NextResponse.redirect(redirectUrl)
  }

  // Se está autenticado, verificar role
  if (user && userRole) {
    // Regras de autorização
    if (isAdminRoute && userRole !== 'admin') {
      const redirectUrl = new URL('/unauthorized', req.url)
      redirectUrl.searchParams.set('reason', 'admin_only')
      redirectUrl.searchParams.set('role', userRole)
      return NextResponse.redirect(redirectUrl)
    }

    if (isOperatorRoute && !['operator', 'admin'].includes(userRole)) {
      const redirectUrl = new URL('/unauthorized', req.url)
      redirectUrl.searchParams.set('reason', 'operator_access_required')
      redirectUrl.searchParams.set('role', userRole)
      return NextResponse.redirect(redirectUrl)
    }

    if (isCarrierRoute && !['carrier', 'admin'].includes(userRole)) {
      const redirectUrl = new URL('/unauthorized', req.url)
      redirectUrl.searchParams.set('reason', 'carrier_access_required')
      redirectUrl.searchParams.set('role', userRole)
      return NextResponse.redirect(redirectUrl)
    }
  } else if (user && !userRole) {
    // Usuário autenticado mas sem role definido - redirecionar para login
    const redirectUrl = new URL('/login', req.url)
    redirectUrl.searchParams.set('error', 'no_role')
    return NextResponse.redirect(redirectUrl)
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
