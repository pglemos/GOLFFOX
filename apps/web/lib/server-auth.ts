/**
 * Helper para autenticação em Server Components
 * Usa cookies() do next/headers para obter dados do usuário
 */

import { cookies } from 'next/headers'
import { createClient } from '@supabase/supabase-js'
import { normalizeRole } from '@/lib/role-mapper'

export interface ServerUser {
  id: string
  email: string
  name: string
  role: string
  companyId?: string | null
  avatar_url?: string | null
}

/**
 * Obtém dados do usuário a partir dos cookies em Server Components
 * Retorna null se não autenticado
 */
export async function getServerUser(): Promise<ServerUser | null> {
  try {
    const cookieStore = await cookies()
    
    // Tentar obter do cookie customizado primeiro
    const sessionCookie = cookieStore.get('golffox-session')
    if (sessionCookie?.value) {
      try {
        const decoded = Buffer.from(sessionCookie.value, 'base64').toString('utf-8')
        const userData = JSON.parse(decoded)
        
        if (userData?.id && userData?.email && userData?.role) {
          return {
            id: userData.id,
            email: userData.email,
            name: userData.name || userData.email.split('@')[0],
            role: normalizeRole(userData.role),
            companyId: userData.companyId || userData.company_id || null,
            avatar_url: userData.avatar_url || null,
          }
        }
      } catch (err) {
        // Cookie inválido, continuar para Supabase
      }
    }

    // Fallback: Tentar obter do cookie do Supabase
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    if (!supabaseUrl) {
      return null
    }

    const projectRef = supabaseUrl.split('//')[1]?.split('.')[0]
    if (!projectRef) {
      return null
    }

    const supabaseCookieName = `sb-${projectRef}-auth-token`
    const supabaseCookie = cookieStore.get(supabaseCookieName)
    
    if (!supabaseCookie?.value) {
      return null
    }

    try {
      const tokenData = JSON.parse(supabaseCookie.value)
      const accessToken = tokenData?.access_token || tokenData?.accessToken
      
      if (!accessToken) {
        return null
      }

      // Validar token com Supabase
      const supabase = createClient(
        supabaseUrl,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
      )

      const { data: { user }, error } = await supabase.auth.getUser(accessToken)
      
      if (error || !user) {
        return null
      }

      // Buscar dados completos do usuário no banco
      const supabaseAdmin = createClient(
        supabaseUrl,
        process.env.SUPABASE_SERVICE_ROLE_KEY || ''
      )

      const { data: userData } = await supabaseAdmin
        .from('users')
        .select('id, email, name, role, company_id, transportadora_id, avatar_url')
        .eq('id', user.id)
        .maybeSingle()

      const rawRole = userData?.role || user.user_metadata?.role || user.app_metadata?.role || 'passageiro'
      
      return {
        id: user.id,
        email: user.email || userData?.email || '',
        name: userData?.name || user.user_metadata?.name || user.email?.split('@')[0] || 'Usuário',
        role: normalizeRole(rawRole),
        companyId: userData?.company_id || null,
        avatar_url: userData?.avatar_url || user.user_metadata?.avatar_url || null,
      }
    } catch (err) {
      return null
    }
  } catch (err) {
    return null
  }
}

/**
 * Verifica se o usuário tem uma role específica
 */
export function hasServerRole(user: ServerUser | null, requiredRole: string | string[]): boolean {
  if (!user) return false

  const roles = Array.isArray(requiredRole) 
    ? requiredRole.map(r => normalizeRole(r))
    : [normalizeRole(requiredRole)]

  // Admin sempre tem acesso
  if (user.role === 'admin') {
    return true
  }

  return roles.includes(user.role)
}

