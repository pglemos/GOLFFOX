/**
 * Helper para validação de autenticação em rotas API
 * Previne duplicação de código e garante consistência
 * 
 * Segue as melhores práticas do Next.js 16.1 com logging estruturado
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { debug, warn, error as logError } from '@/lib/logger'
import { getCachedAuth, setCachedAuth, invalidateCachedAuth } from './auth-cache'

export interface AuthenticatedUser {
  id: string
  email: string
  role: string
  companyId?: string | null
}

const isDevelopment = process.env.NODE_ENV === 'development'

function decodeBase64(raw: string): string | null {
  try {
    if (typeof Buffer !== 'undefined') {
      return Buffer.from(raw, 'base64').toString('utf-8')
    }
    if (typeof atob !== 'undefined') {
      const binary = atob(raw)
      const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0))
      return new TextDecoder().decode(bytes)
    }
  } catch {
    return null
  }
  return null
}

function decodeBase64Json(raw: string): Record<string, unknown> | null {
  const decoded = decodeBase64(raw)
  if (!decoded) return null
  try {
    const parsed = JSON.parse(decoded)
    return parsed && typeof parsed === 'object' ? (parsed as Record<string, unknown>) : null
  } catch {
    return null
  }
}

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
      logError('Supabase não configurado', {
        hasUrl: !!supabaseUrl,
        hasAnonKey: !!supabaseAnonKey
      }, 'ApiAuth')
      return null
    }

    debug('Verificando autenticação', {
      path: request.nextUrl.pathname,
      method: request.method
    }, 'ApiAuth')

    let accessToken: string | null = null
    let tokenSource: string = 'none'

    // Tentar obter token primeiro para verificar cache
    // (cache lookup será feito após obter o token)

    // 1. Tentar obter token do header Authorization (Bearer token) - PRIORIDADE MÁXIMA
    const authHeader = request.headers.get('authorization')
    if (authHeader && authHeader.startsWith('Bearer ')) {
      accessToken = authHeader.substring(7)
      tokenSource = 'header'
      debug('Token encontrado no header Authorization', {}, 'ApiAuth')
    }

    // 2. Tentar obter do cookie do Supabase - PRIORIDADE ALTA (token sempre válido)
    if (!accessToken) {
      const projectRef = supabaseUrl.split('//')[1]?.split('.')[0]
      if (projectRef) {
        const supabaseCookieName = `sb-${projectRef}-auth-token`

        debug('Procurando cookie do Supabase', {
          cookieName: supabaseCookieName,
          availableCookies: request.cookies.getAll().map(c => c.name)
        }, 'ApiAuth')

        const supabaseCookie = request.cookies.get(supabaseCookieName)?.value

        if (supabaseCookie) {
          try {
            const tokenData = JSON.parse(supabaseCookie)
            const token = tokenData?.access_token || tokenData?.accessToken || null
            if (token) {
              accessToken = token
              tokenSource = 'supabase-cookie'
              debug('Token encontrado no cookie do Supabase', {}, 'ApiAuth')
            } else {
              warn('Cookie do Supabase encontrado mas sem access_token', {
                availableKeys: Object.keys(tokenData)
              }, 'ApiAuth')
            }
          } catch (error) {
            warn('Erro ao processar cookie do Supabase', { error }, 'ApiAuth')
          }
        } else {
          debug('Cookie do Supabase não encontrado', { cookieName: supabaseCookieName }, 'ApiAuth')
        }
      }
    }

    // 3. Como último recurso, tentar obter do cookie customizado (golffox-session)
    // Mas apenas se não encontrou em outros lugares
    if (!accessToken) {
      const golffoxSession = request.cookies.get('golffox-session')?.value

      if (golffoxSession) {
        const sessionData = decodeBase64Json(golffoxSession)
        if (sessionData) {

          // Tentar obter access_token do cookie customizado
          // Suportar tanto access_token (server-side) quanto accessToken (client-side AuthManager)
          const token = (sessionData as any).access_token || (sessionData as any).accessToken

          if (token) {
            accessToken = token
            tokenSource = 'custom-cookie'
            debug('Token encontrado no cookie customizado (golffox-session)', {}, 'ApiAuth')
          } else {
            warn('Cookie customizado encontrado mas sem access_token', {
              availableKeys: Object.keys(sessionData)
            }, 'ApiAuth')
          }
        } else {
          logError('Erro ao processar cookie customizado', { error: 'decode_failed' }, 'ApiAuth')
        }
      } else {
        debug('Cookie golffox-session não encontrado', {
          availableCookies: request.cookies.getAll().map(c => c.name)
        }, 'ApiAuth')
      }
    }

    if (!accessToken) {
      warn('Token de acesso não encontrado em nenhum lugar', {
        path: request.nextUrl.pathname
      }, 'ApiAuth')
      return null
    }

    // 4. Verificar cache antes de chamar Supabase Auth
    const cachedUser = getCachedAuth(accessToken)
    if (cachedUser) {
      debug('Usuário encontrado no cache', {
        userId: cachedUser.id,
        role: cachedUser.role
      }, 'ApiAuth')
      return cachedUser
    }

    // 5. Validar token com Supabase Auth (cache miss)
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      auth: { persistSession: false, autoRefreshToken: false }
    })

    debug('Validando token do Supabase (cache miss)', {
      source: tokenSource,
      tokenLength: accessToken?.length || 0
    }, 'ApiAuth')

    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken)

    if (authError || !user) {
      logError('Erro ao validar token com Supabase', {
        message: authError?.message || 'Usuário nulo',
        status: authError?.status,
        name: authError?.name,
        tokenSource,
        tokenLength: accessToken?.length || 0
      }, 'ApiAuth')
      return null
    }

    // 5. SEMPRE buscar dados completos do usuário no banco de dados
    if (!serviceKey) {
      logError('Service role key não configurada', {}, 'ApiAuth')
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
      logError('Erro ao buscar dados do usuário no banco', {
        error: dbError,
        userId: user.id
      }, 'ApiAuth')
      return null
    }

    if (!userData) {
      logError('Usuário não encontrado na tabela users', {
        userId: user.id
      }, 'ApiAuth')
      return null
    }

    // Usar dados do banco (sempre atualizados)
    const authenticatedUser: AuthenticatedUser = {
      id: userData.id,
      email: userData.email || user.email || '',
      role: userData.role || user.user_metadata?.role || user.app_metadata?.role || 'passageiro',
      companyId: userData.company_id || null
    }

    debug('Usuário autenticado e dados obtidos do banco', {
      id: authenticatedUser.id,
      role: authenticatedUser.role,
      email: authenticatedUser.email.replace(/^(.{2}).+(@.*)$/, '$1***$2') // Mascarar email
    }, 'ApiAuth')

    // Armazenar no cache para próximas requisições
    if (accessToken) {
      setCachedAuth(accessToken, authenticatedUser)
    }

    return authenticatedUser
  } catch (error) {
    logError('Erro inesperado na autenticação', { error }, 'ApiAuth')
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

  // empresa = usuários da empresa contratante (antigo operator)
  if (roles.includes('empresa')) {
    return ['admin', 'empresa', 'operator'].includes(user.role) // Compatibilidade com role antiga
  }

  // transportadora = gestor da transportadora (antigo carrier/operador)
  if (roles.includes('transportadora')) {
    return ['admin', 'transportadora', 'operador', 'carrier'].includes(user.role) // Compatibilidade
  }

  // operador (mantido para compatibilidade, mas prefira 'transportadora')
  if (roles.includes('operador')) {
    return ['admin', 'transportadora', 'operador', 'carrier'].includes(user.role)
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
    logError('Autenticação falhou', {
      path: request.nextUrl.pathname,
      method: request.method
    }, 'ApiAuth')

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
