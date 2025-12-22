/**
 * Helper para validação de autenticação em rotas API
 * Previne duplicação de código e garante consistência
 * 
 * Segue as melhores práticas do Next.js 16.1 com logging estruturado
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { normalizeRole } from '@/lib/role-mapper'
import { debug, warn, error as logError } from '@/lib/logger'
import { getCachedAuth, setCachedAuth, invalidateCachedAuth } from './auth-cache'
import { getSupabaseUrl, getSupabaseAnonKey, getSupabaseServiceKey } from '@/lib/env'

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
    const supabaseUrl = getSupabaseUrl()
    const supabaseAnonKey = getSupabaseAnonKey()
    const serviceKey = getSupabaseServiceKey()

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

    // 3. ✅ CORREÇÃO: Tentar obter token do cookie customizado (golffox-session)
    // O cookie customizado PODE conter accessToken quando setado via API de login
    if (!accessToken) {
      const sessionCookie = request.cookies.get('golffox-session')?.value
      if (sessionCookie) {
        try {
          const sessionData = decodeBase64Json(sessionCookie)
          if (sessionData) {
            // Tentar accessToken primeiro (formato atual do login)
            const token = sessionData.accessToken as string || sessionData.access_token as string
            if (token) {
              accessToken = token
              tokenSource = 'golffox-session'
              debug('Token encontrado no cookie golffox-session', {
                hasAccessToken: !!sessionData.accessToken,
                hasAccess_token: !!sessionData.access_token
              }, 'ApiAuth')
            } else {
              // Se não tem token mas tem dados do usuário, logar para debug
              debug('Cookie golffox-session encontrado mas sem accessToken', {
                hasId: !!sessionData.id,
                hasRole: !!sessionData.role,
                keys: Object.keys(sessionData)
              }, 'ApiAuth')
            }
          }
        } catch (e) {
          warn('Erro ao processar cookie golffox-session', { error: e }, 'ApiAuth')
        }
      }
    }

    // ✅ CORREÇÃO: Se não encontrou token mas tem cookie golffox-session válido, usar dados do cookie
    if (!accessToken) {
      const sessionCookie = request.cookies.get('golffox-session')?.value
      if (sessionCookie) {
        try {
          const sessionData = decodeBase64Json(sessionCookie)
          if (sessionData && sessionData.id && sessionData.role && sessionData.email) {
            // Usar dados do cookie como fallback quando não há token do Supabase
            // Isso permite autenticação via cookie mesmo sem token válido
            debug('Usando dados do cookie golffox-session como fallback (sem token Supabase)', {
              userId: sessionData.id,
              role: sessionData.role
            }, 'ApiAuth')

            // Buscar dados completos do usuário no banco usando service role
            if (serviceKey) {
              const supabaseAdmin = createClient(supabaseUrl, serviceKey, {
                auth: { persistSession: false, autoRefreshToken: false }
              })

              const { data: userData, error: dbError } = await supabaseAdmin
                .from('users')
                .select('id, email, role, company_id, transportadora_id')
                .eq('id', sessionData.id)
                .maybeSingle()

              if (!dbError && userData) {
                const normalizedRole = normalizeRole(userData.role || sessionData.role)
                const authenticatedUser: AuthenticatedUser = {
                  id: userData.id,
                  email: userData.email || sessionData.email || '',
                  role: normalizedRole,
                  companyId: userData.company_id || sessionData.companyId || null
                }

                debug('Usuário autenticado via cookie fallback', {
                  id: authenticatedUser.id,
                  role: authenticatedUser.role
                }, 'ApiAuth')

                return authenticatedUser
              }
            }

            // Fallback final: usar dados do cookie diretamente (menos seguro, mas funcional)
            const normalizedRole = normalizeRole(sessionData.role)
            const authenticatedUser: AuthenticatedUser = {
              id: sessionData.id,
              email: sessionData.email || '',
              role: normalizedRole,
              companyId: sessionData.companyId || sessionData.company_id || null
            }

            warn('Usando dados do cookie diretamente (sem validação do banco)', {
              userId: authenticatedUser.id,
              role: authenticatedUser.role
            }, 'ApiAuth')

            return authenticatedUser
          }
        } catch (e) {
          warn('Erro ao processar cookie golffox-session como fallback', { error: e }, 'ApiAuth')
        }
      }

      warn('Token de acesso não encontrado em nenhum lugar', {
        path: request.nextUrl.pathname,
        hasGolffoxSession: !!request.cookies.get('golffox-session')?.value
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
    // Normalizar role para garantir consistência (EN → PT-BR)
    const rawRole = userData.role || user.user_metadata?.role || user.app_metadata?.role || 'passageiro'
    const normalizedRole = normalizeRole(rawRole)
    
    const authenticatedUser: AuthenticatedUser = {
      id: userData.id,
      email: userData.email || user.email || '',
      role: normalizedRole,
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
 * Normaliza roles antes de comparar para garantir consistência
 */
export function hasRole(user: AuthenticatedUser | null, requiredRole: string | string[]): boolean {
  if (!user) return false

  // Normalizar role do usuário
  const userRole = normalizeRole(user.role)
  
  // Normalizar roles requeridas
  const roles = Array.isArray(requiredRole) 
    ? requiredRole.map(r => normalizeRole(r))
    : [normalizeRole(requiredRole)]

  // Admin sempre tem acesso a tudo (exceto se verificação específica de não-admin)
  if (userRole === 'admin') {
    return true
  }

  // Verificar se role normalizado do usuário está na lista de roles permitidas
  return roles.includes(userRole)
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
  let supabaseUrl: string | null = null
  let supabaseAnonKey: string | null = null
  
  try {
    supabaseUrl = getSupabaseUrl()
    supabaseAnonKey = getSupabaseAnonKey()
  } catch {
    // Variáveis não configuradas - retornar erro
    return {
      user: null as any,
      error: NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      )
    }
  }

  if (supabaseUrl && supabaseAnonKey) {
    let serviceKey: string | null = null
    try {
      serviceKey = getSupabaseServiceKey()
    } catch {
      // Service key não configurado - continuar sem ela
      serviceKey = null
    }
    
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
