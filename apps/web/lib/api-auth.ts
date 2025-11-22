/**
 * Helper para validação de autenticação em rotas API
 * Previne duplicação de código e garante consistência
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export interface AuthenticatedUser {
  id: string
  email: string
  role: string
  companyId?: string | null
}

const isDevelopment = process.env.NODE_ENV === 'development'

/**
 * Valida autenticação SEMPRE buscando dados do Supabase
 * NUNCA usa cookies customizados sem validar token
 * Retorna usuário autenticado ou null
 */
export async function validateAuth(request: NextRequest): Promise<AuthenticatedUser | null> {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseAnonKey) {
      console.error('❌ Supabase não configurado')
      return null
    }

    if (isDevelopment) {
      console.log('🔍 validateAuth - Verificando autenticação', {
        path: request.nextUrl.pathname,
        method: request.method
      })
    }

    let accessToken: string | null = null

    // 1. Tentar obter token do header Authorization (Bearer token)
    const authHeader = request.headers.get('authorization')
    if (authHeader && authHeader.startsWith('Bearer ')) {
      accessToken = authHeader.substring(7)
      if (isDevelopment) console.log('✅ Token encontrado no header Authorization')
    }

    // 2. Se não houver no header, tentar obter do cookie customizado (golffox-session)
    if (!accessToken) {
      const golffoxSession = request.cookies.get('golffox-session')?.value

      if (golffoxSession) {
        try {
          // Decodificar cookie base64
          const decoded = Buffer.from(golffoxSession, 'base64').toString('utf-8')
          const sessionData = JSON.parse(decoded)

          if (isDevelopment) {
            console.log('🔍 Cookie customizado decodificado:', {
              hasAccessToken: !!sessionData.access_token,
              hasId: !!sessionData.id,
              role: sessionData.role
            })
          }

          // Tentar obter access_token do cookie customizado
          if (sessionData.access_token) {
            accessToken = sessionData.access_token
            if (isDevelopment) console.log('✅ Token encontrado no cookie customizado (golffox-session)')
          }
        } catch (error) {
          if (isDevelopment) console.warn('⚠️ Erro ao processar cookie customizado:', error)
        }
      }
    }

    // 3. Se ainda não encontrou, tentar obter do cookie do Supabase
    if (!accessToken) {
      // Procurar cookie de sessão do Supabase
      const projectRef = supabaseUrl.split('//')[1]?.split('.')[0]
      if (projectRef) {
        const supabaseCookieName = `sb-${projectRef}-auth-token`
        const supabaseCookie = request.cookies.get(supabaseCookieName)?.value

        if (supabaseCookie) {
          try {
            const tokenData = JSON.parse(supabaseCookie)
            accessToken = tokenData?.access_token || tokenData?.accessToken || null
            if (accessToken && isDevelopment) {
              console.log('✅ Token encontrado no cookie do Supabase')
            }
          } catch (error) {
            if (isDevelopment) console.warn('⚠️ Erro ao processar cookie do Supabase:', error)
          }
        }
      }
    }

    if (!accessToken) {
      if (isDevelopment) console.warn('⚠️ Token de acesso não encontrado')
      return null
    }

    // 4. Validar token com Supabase Auth
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      auth: { persistSession: false, autoRefreshToken: false }
    })

    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken)

    if (authError || !user) {
      console.error('❌ Erro ao validar token com Supabase:', authError)
      return null
    }

    if (isDevelopment) console.log('✅ Token validado com Supabase, user ID:', user.id)

    // 5. SEMPRE buscar dados completos do usuário no banco de dados
    if (!serviceKey) {
      console.error('❌ Service role key não configurada')
      return null
    }

    const supabaseAdmin = createClient(supabaseUrl, serviceKey, {
      auth: { persistSession: false, autoRefreshToken: false }
    })

    // Buscar TODOS os dados do usuário do banco
    const { data: userData, error: dbError } = await supabaseAdmin
      .from('users')
      .select('id, email, role, company_id, transportadora_id')
      .eq('id', user.id)
      .maybeSingle()

    if (dbError) {
      console.error('❌ Erro ao buscar dados do usuário no banco:', dbError)
      return null
    }

    if (!userData) {
      console.error('❌ Usuário não encontrado na tabela users:', user.id)
      return null
    }

    // Usar dados do banco (sempre atualizados)
    const authenticatedUser: AuthenticatedUser = {
      id: userData.id,
      email: userData.email || user.email || '',
      role: userData.role || user.user_metadata?.role || user.app_metadata?.role || 'passenger',
      companyId: userData.company_id || null
    }

    if (isDevelopment) {
      console.log('✅ Usuário autenticado e dados obtidos do banco:', {
        id: authenticatedUser.id,
        role: authenticatedUser.role
      })
    }

    return authenticatedUser
  } catch (error) {
    console.error('❌ Erro inesperado na autenticação:', error)
    return null
  }
}

/**
 * Valida se o usuário tem role específica
 */
export function hasRole(user: AuthenticatedUser | null, requiredRole: string | string[]): boolean {
  if (!user) return false

  const roles = Array.isArray(requiredRole) ? requiredRole : [requiredRole]

  if (roles.includes('admin')) {
    return user.role === 'admin'
  }

  if (roles.includes('operador')) {
    return ['admin', 'operador'].includes(user.role)
  }

  if (roles.includes('transportadora')) {
    return ['admin', 'transportadora'].includes(user.role)
  }

  return roles.includes(user.role)
}

/**
 * Middleware helper para rotas API que requerem autenticação
 * Retorna resposta de erro ou null se autenticado
 */
export async function requireAuth(
  request: NextRequest,
  requiredRole?: string | string[]
): Promise<NextResponse | null> {
  // ❌ REMOVIDO BYPASS DE DESENVOLVIMENTO INSEGURO

  const user = await validateAuth(request)

  if (!user) {
    if (isDevelopment) {
      console.error('❌ Autenticação falhou para:', request.nextUrl.pathname)
    }

    return NextResponse.json(
      {
        error: 'Não autorizado',
        message: 'Usuário não autenticado',
        details: 'Faça login antes de acessar este endpoint.'
      },
      { status: 401 }
    )
  }

  if (requiredRole && !hasRole(user, requiredRole)) {
    const roles = Array.isArray(requiredRole) ? requiredRole : [requiredRole]
    return NextResponse.json(
      {
        error: 'Acesso negado',
        message: `Acesso permitido apenas para: ${roles.join(', ')}. Seu role atual: ${user.role}`,
        allowedRoles: roles,
        currentRole: user.role
      },
      { status: 403 }
    )
  }

  return null
}

/**
 * Middleware helper para rotas API que requerem acesso a company específica
 */
export async function requireCompanyAccess(
  request: NextRequest,
  companyId: string
): Promise<{ user: AuthenticatedUser; error: NextResponse | null }> {
  // ❌ REMOVIDO BYPASS DE DESENVOLVIMENTO INSEGURO

  const user = await validateAuth(request)

  if (!user) {
    return {
      user: null as any,
      error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
  }

  // Admin tem acesso a todas as empresas
  if (user.role === 'admin') {
    return { user, error: null }
  }

  // Verificar se usuário tem acesso à empresa via gf_user_company_map
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (supabaseUrl && supabaseAnonKey) {
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (serviceKey) {
      const supabaseAdmin = createClient(supabaseUrl, serviceKey, {
        auth: { persistSession: false, autoRefreshToken: false }
      })

      const { data: mapping } = await supabaseAdmin
        .from('gf_user_company_map')
        .select('company_id')
        .eq('user_id', user.id)
        .eq('company_id', companyId)
        .single()

      if (!mapping) {
        return {
          user: null as any,
          error: NextResponse.json(
            { error: 'Forbidden - No access to this company' },
            { status: 403 }
          )
        }
      }
    }
  }

  return { user, error: null }
}
