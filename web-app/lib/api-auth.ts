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
    
    if (sessionCookie) {
      const decoded = Buffer.from(sessionCookie, 'base64').toString('utf-8')
      const userData = JSON.parse(decoded)
      
      if (userData?.id && userData?.role) {
        // Validar token com Supabase se disponível
        if (userData.accessToken) {
          const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
          const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
          
          if (supabaseUrl && supabaseAnonKey) {
            const supabase = createClient(supabaseUrl, supabaseAnonKey, {
              auth: { persistSession: false, autoRefreshToken: false }
            })
            
            const { error } = await supabase.auth.getUser(userData.accessToken)
            if (error) return null
          }
        }
        
        return {
          id: userData.id,
          email: userData.email || '',
          role: userData.role,
          companyId: userData.companyId || null
        }
      }
    }
    
    // Fallback: tentar header Authorization
    const authHeader = request.headers.get('authorization')
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7)
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
      const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      
      if (supabaseUrl && supabaseAnonKey) {
        const supabase = createClient(supabaseUrl, supabaseAnonKey, {
          auth: { persistSession: false, autoRefreshToken: false }
        })
        
        const { data: { user }, error } = await supabase.auth.getUser(token)
        if (error || !user) return null
        
        // Buscar role do usuário
        const { data: userData } = await supabase
          .from('users')
          .select('role, company_id')
          .eq('id', user.id)
          .single()
        
        if (!userData) return null
        
        return {
          id: user.id,
          email: user.email || '',
          role: userData.role,
          companyId: userData.company_id || null
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
  const user = await validateAuth(request)
  
  if (!user) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    )
  }
  
  if (requiredRole && !hasRole(user, requiredRole)) {
    return NextResponse.json(
      { error: 'Forbidden - Insufficient permissions' },
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

