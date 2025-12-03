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
    let tokenSource: string = 'none'

    // 1. Tentar obter token do header Authorization (Bearer token) - PRIORIDADE MÁXIMA
    const authHeader = request.headers.get('authorization')
    if (authHeader && authHeader.startsWith('Bearer ')) {
      accessToken = authHeader.substring(7)
      tokenSource = 'header'
      console.log('[AUTH] Token encontrado no header Authorization')
    }

    // 2. Tentar obter do cookie do Supabase - PRIORIDADE ALTA (token sempre válido)
    if (!accessToken) {
      const projectRef = supabaseUrl.split('//')[1]?.split('.')[0]
      if (projectRef) {
        const supabaseCookieName = `sb-${projectRef}-auth-token`
        
        if (isDevelopment) {
          const allCookies = request.cookies.getAll().map(c => c.name)
          console.log('[AUTH] Cookies disponíveis:', allCookies.join(', '))
          console.log('[AUTH] Procurando cookie do Supabase:', supabaseCookieName)
        }
        
        const supabaseCookie = request.cookies.get(supabaseCookieName)?.value

        if (supabaseCookie) {
          try {
            const tokenData = JSON.parse(supabaseCookie)
            const token = tokenData?.access_token || tokenData?.accessToken || null
            if (token) {
              accessToken = token
              tokenSource = 'supabase-cookie'
              console.log('[AUTH] ✅ Token encontrado no cookie do Supabase')
            } else {
              if (isDevelopment) {
                console.warn('[AUTH] Cookie do Supabase encontrado mas sem access_token. Chaves:', Object.keys(tokenData).join(', '))
              }
            }
          } catch (error) {
            console.warn('[AUTH] Erro ao processar cookie do Supabase:', error)
          }
        } else {
          if (isDevelopment) {
            console.log('[AUTH] Cookie do Supabase não encontrado:', supabaseCookieName)
          }
        }
      }
    }

    // 3. Como último recurso, tentar obter do cookie customizado (golffox-session)
    // Mas apenas se não encontrou em outros lugares
    if (!accessToken) {
      const golffoxSession = request.cookies.get('golffox-session')?.value

      if (golffoxSession) {
        try {
          // Decodificar cookie base64
          const decoded = Buffer.from(golffoxSession, 'base64').toString('utf-8')
          const sessionData = JSON.parse(decoded)

          // Tentar obter access_token do cookie customizado
          // Suportar tanto access_token (server-side) quanto accessToken (client-side AuthManager)
          const token = sessionData.access_token || sessionData.accessToken

          if (token) {
            accessToken = token
            tokenSource = 'custom-cookie'
            console.log('[AUTH] Token encontrado no cookie customizado (golffox-session)')
          } else {
            console.warn('[AUTH] Cookie customizado encontrado mas sem access_token. Chaves disponíveis:', Object.keys(sessionData).join(', '))
          }
        } catch (error) {
          console.error('[AUTH] Erro ao processar cookie customizado:', error)
        }
      } else {
        if (isDevelopment) {
          console.log('[AUTH] Cookie golffox-session não encontrado. Cookies disponíveis:', request.cookies.getAll().map(c => c.name).join(', '))
        }
      }
    }

    if (!accessToken) {
      console.warn('[AUTH] Token de acesso não encontrado em nenhum lugar')
      return null
    }

    // 4. Validar token com Supabase Auth
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      auth: { persistSession: false, autoRefreshToken: false }
    })

    if (isDevelopment) {
      console.log('[AUTH] Tentando validar token do Supabase. Fonte:', tokenSource, 'Token length:', accessToken?.length || 0)
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken)

    if (authError || !user) {
      console.error('[AUTH] Erro ao validar token com Supabase:', {
        message: authError?.message || 'Usuário nulo',
        status: authError?.status,
        name: authError?.name,
        tokenSource,
        tokenLength: accessToken?.length || 0
      })
      return null
    }

    // 5. SEMPRE buscar dados completos do usuário no banco de dados
    if (!serviceKey) {
      console.error('[AUTH] Service role key não configurada')
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
      console.error('[AUTH] Erro ao buscar dados do usuário no banco:', dbError)
      return null
    }

    if (!userData) {
      console.error('[AUTH] Usuário não encontrado na tabela users:', user.id)
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
