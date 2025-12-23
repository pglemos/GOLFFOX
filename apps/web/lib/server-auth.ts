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

    // Usar cookie customizado golffox-session
    const sessionCookie = cookieStore.get('golffox-session')
    if (!sessionCookie?.value) {
      // Sem cookie de sessão, usuário não autenticado
      return null
    }

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
    } catch {
      // Cookie inválido
      return null
    }

    return null
  } catch {
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

