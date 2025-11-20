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

/**
 * Valida autenticação via cookie ou header Authorization
 * Retorna usuário autenticado ou null
 */
export async function validateAuth(request: NextRequest): Promise<AuthenticatedUser | null> {
  try {
    // Tentar obter do cookie primeiro
    const sessionCookie = request.cookies.get('golffox-session')?.value
    
    console.log('🔍 validateAuth - Verificando autenticação', {
      hasCookie: !!sessionCookie,
      cookieLength: sessionCookie?.length || 0,
      path: request.nextUrl.pathname,
      method: request.method
    })
    
    if (sessionCookie) {
      try {
        // Tentar decodificar como base64 primeiro (formato do /api/auth/login)
        let decoded: string
        try {
          decoded = Buffer.from(sessionCookie, 'base64').toString('utf-8')
          console.log('✅ Cookie decodificado como base64')
        } catch (base64Error) {
          // Se falhar, tentar como URI encoded (formato do /api/auth/set-session)
          try {
            decoded = decodeURIComponent(sessionCookie)
            console.log('✅ Cookie decodificado como URI encoded')
          } catch (uriError) {
            // Tentar decodificar diretamente (pode já estar em formato JSON)
            decoded = sessionCookie
            console.log('✅ Usando cookie diretamente (já está em formato texto)')
          }
        }
        
        const userData = JSON.parse(decoded)
        
        console.log('📦 Dados do cookie:', {
          hasId: !!userData?.id,
          hasRole: !!userData?.role,
          role: userData?.role,
          hasEmail: !!userData?.email,
          hasCompanyId: !!userData?.companyId
        })
        
        if (userData?.id && userData?.role) {
          // Buscar email e companyId do banco se não estiverem no cookie
          const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
          const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
          
          if (supabaseUrl && serviceKey && (!userData.email || !userData.companyId)) {
            try {
              const supabaseAdmin = createClient(supabaseUrl, serviceKey, {
                auth: { persistSession: false, autoRefreshToken: false }
              })
              
              const { data: userFromDb } = await supabaseAdmin
                .from('users')
                .select('email, company_id')
                .eq('id', userData.id)
                .maybeSingle()
              
              const authenticatedUser = {
                id: userData.id,
                email: userData.email || userFromDb?.email || '',
                role: userData.role,
                companyId: userData.companyId || userFromDb?.company_id || null
              }
              
              console.log('✅ Usuário autenticado via cookie (com busca no banco):', {
                id: authenticatedUser.id,
                role: authenticatedUser.role
              })
              
              return authenticatedUser
            } catch (dbError) {
              // Se falhar ao buscar do banco, usar dados do cookie mesmo
              console.warn('⚠️ Erro ao buscar dados do usuário do banco:', dbError)
            }
          }
          
          const authenticatedUser = {
            id: userData.id,
            email: userData.email || '',
            role: userData.role,
            companyId: userData.companyId || null
          }
          
          console.log('✅ Usuário autenticado via cookie:', {
            id: authenticatedUser.id,
            role: authenticatedUser.role
          })
          
          return authenticatedUser
        } else {
          console.warn('⚠️ Cookie encontrado mas dados inválidos:', {
            hasId: !!userData?.id,
            hasRole: !!userData?.role
          })
        }
      } catch (parseError) {
        console.error('❌ Erro ao decodificar cookie de sessão:', parseError)
        // Continuar para tentar outros métodos de autenticação
      }
    } else {
      console.warn('⚠️ Cookie de sessão não encontrado')
    }
    
    // Fallback: tentar validar sessão Supabase diretamente via cookies
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    
    if (supabaseUrl && supabaseAnonKey) {
      // Procurar por cookies de sessão do Supabase
      const supabaseCookies = [
        ...request.cookies.getAll().map(c => c.name).filter(name => 
          name.includes('sb-') && name.includes('-auth-token')
        )
      ]
      
      if (supabaseCookies.length > 0) {
        try {
          // Tentar usar o cliente Supabase para validar a sessão
          const supabase = createClient(supabaseUrl, supabaseAnonKey, {
            auth: { persistSession: false, autoRefreshToken: false }
          })
          
          // Verificar se há um access token nos cookies
          const accessTokenCookie = request.cookies.get(`sb-${supabaseUrl.split('//')[1]?.split('.')[0]}-auth-token`)?.value
          
          if (accessTokenCookie) {
            try {
              const tokenData = JSON.parse(accessTokenCookie)
              const accessToken = tokenData?.access_token || tokenData?.accessToken
              
              if (accessToken) {
                const { data: { user }, error: userError } = await supabase.auth.getUser(accessToken)
                
                if (!userError && user) {
                  // Buscar role do usuário
                  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
                  let userData = null
                  
                  if (serviceKey) {
                    const supabaseAdmin = createClient(supabaseUrl, serviceKey, {
                      auth: { persistSession: false, autoRefreshToken: false }
                    })
                    
                    const { data } = await supabaseAdmin
                      .from('users')
                      .select('role, company_id')
                      .eq('id', user.id)
                      .maybeSingle()
                    
                    userData = data
                  }
                  
                  const role = userData?.role || user.user_metadata?.role || user.app_metadata?.role || 'passenger'
                  const companyId = userData?.company_id || user.user_metadata?.company_id || user.app_metadata?.company_id || null
                  
                  return {
                    id: user.id,
                    email: user.email || '',
                    role,
                    companyId
                  }
                }
              }
            } catch (tokenError) {
              // Ignorar erro e continuar
              console.warn('Erro ao processar token do Supabase:', tokenError)
            }
          }
        } catch (supabaseError) {
          // Ignorar erro e continuar para outros métodos
          console.warn('Erro ao validar sessão Supabase:', supabaseError)
        }
      }
    }
    
    // Fallback: tentar header Authorization (Bearer token ou HTTP Basic Auth)
    const authHeader = request.headers.get('authorization')
    if (authHeader) {
      // HTTP Basic Auth (para compatibilidade com testes)
      if (authHeader.startsWith('Basic ')) {
        const basicAuth = authHeader.substring(6)
        const decoded = Buffer.from(basicAuth, 'base64').toString('utf-8')
        const [username, password] = decoded.split(':')
        
        // Validar credenciais via login - usar anon key para autenticação
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
        const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
        const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
        
        if (supabaseUrl && supabaseAnonKey) {
          const supabase = createClient(supabaseUrl, supabaseAnonKey, {
            auth: { persistSession: false, autoRefreshToken: false }
          })
          
          // Tentar fazer login com as credenciais usando anon key
          const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
            email: username,
            password: password
          })
          
          if (authError || !authData?.user) return null
          
          // Buscar role do usuário - usar service role para bypass RLS se disponível
          let userData = null
          if (serviceKey) {
            const supabaseAdmin = createClient(supabaseUrl, serviceKey, {
              auth: { persistSession: false, autoRefreshToken: false }
            })
            
            const { data } = await supabaseAdmin
              .from('users')
              .select('role, company_id')
              .eq('id', authData.user.id)
              .maybeSingle()
            
            userData = data
          } else {
            // Tentar com anon key (pode falhar devido a RLS)
            const { data } = await supabase
              .from('users')
              .select('role, company_id')
              .eq('id', authData.user.id)
              .maybeSingle()
            
            userData = data
          }
          
          const role = userData?.role || authData.user.user_metadata?.role || authData.user.app_metadata?.role || 'passenger'
          const companyId = userData?.company_id || authData.user.user_metadata?.company_id || authData.user.app_metadata?.company_id || null
          
          return {
            id: authData.user.id,
            email: authData.user.email || username,
            role,
            companyId
          }
        }
      }
      
      // Bearer token
      if (authHeader.startsWith('Bearer ')) {
        const token = authHeader.substring(7)
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
        const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
        const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
        
        if (supabaseUrl && supabaseAnonKey) {
          // Primeiro, validar o token com Supabase Auth
          const supabase = createClient(supabaseUrl, supabaseAnonKey, {
            auth: { persistSession: false, autoRefreshToken: false }
          })
          
          const { data: { user }, error } = await supabase.auth.getUser(token)
          if (error || !user) return null
          
          // Buscar role do usuário - usar service role para bypass RLS se disponível
          let userData = null
          if (serviceKey) {
            // Usar service role para bypass RLS
            const supabaseAdmin = createClient(supabaseUrl, serviceKey, {
              auth: { persistSession: false, autoRefreshToken: false }
            })
            
            const { data } = await supabaseAdmin
              .from('users')
              .select('role, company_id')
              .eq('id', user.id)
              .maybeSingle()
            
            userData = data
          } else {
            // Tentar com anon key (pode falhar devido a RLS)
            const { data } = await supabase
              .from('users')
              .select('role, company_id')
              .eq('id', user.id)
              .maybeSingle()
            
            userData = data
          }
          
          // Se não encontrou na tabela users, usar metadados do auth como fallback
          if (!userData) {
            const role = user.user_metadata?.role || user.app_metadata?.role || 'passenger'
            return {
              id: user.id,
              email: user.email || '',
              role,
              companyId: user.user_metadata?.company_id || user.app_metadata?.company_id || null
            }
          }
          
          return {
            id: user.id,
            email: user.email || '',
            role: userData.role,
            companyId: userData.company_id || null
          }
        }
      }
    }
    
    return null
  } catch (error) {
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
  
  if (roles.includes('operator')) {
    return ['admin', 'operator'].includes(user.role)
  }
  
  if (roles.includes('carrier')) {
    return ['admin', 'carrier'].includes(user.role)
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
  // ✅ NUNCA pular validação em produção - apenas em testes explícitos
  const isTestMode = request.headers.get('x-test-mode') === 'true'
  const isDevelopment = process.env.NODE_ENV === 'development'
  const isVercelProduction = process.env.VERCEL === '1' && process.env.VERCEL_ENV === 'production'
  
  // Permitir bypass APENAS em desenvolvimento local (não em Vercel)
  if ((isTestMode || isDevelopment) && !isVercelProduction) {
    console.log('⚠️ Bypass de autenticação ativo (modo desenvolvimento/teste)')
    return null
  }
  
  const user = await validateAuth(request)
  
  if (!user) {
    // Log detalhado para debug em produção
    const sessionCookie = request.cookies.get('golffox-session')?.value
    console.error('❌ Autenticação falhou', {
      hasCookie: !!sessionCookie,
      cookieLength: sessionCookie?.length || 0,
      isVercel: process.env.VERCEL === '1',
      env: process.env.VERCEL_ENV || 'development',
      path: request.nextUrl.pathname
    })
    
    return NextResponse.json(
      { 
        error: 'Não autorizado', 
        message: 'Usuário não autenticado',
        details: 'Faça login antes de acessar este endpoint. Se você já fez login, tente fazer logout e login novamente.'
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
  const isTestMode = request.headers.get('x-test-mode') === 'true'
  const isDevelopment = process.env.NODE_ENV === 'development'
  if (isTestMode || isDevelopment) {
    return {
      user: {
        id: 'test-user',
        email: 'test@golffox.local',
        role: 'admin',
        companyId,
      },
      error: null,
    }
  }
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
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      auth: { persistSession: false, autoRefreshToken: false }
    })
    
    // Usar service role para verificar mapeamento (bypass RLS)
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

