/**
 * Gerenciador principal de autenticação
 * Responsável por login, logout e operações principais de autenticação
 */

import { error } from '@/lib/logger'
import { supabase } from '@/lib/supabase'
import { getUserRoleByEmail } from '@/lib/user-role'

import { persistSession } from './auth-session'
import { getStoredUser, clearStoredUser } from './auth-storage'
import { hasRole, getRedirectUrl } from './auth-utils'

import type { UserData, AuthStorageOptions } from './types'

/**
 * Classe principal para gerenciamento de autenticação
 */
export class AuthManager {
  /**
   * Realiza login do usuário
   */
  static async login(
    email: string,
    password: string
  ): Promise<{ success: boolean; user?: UserData; error?: string }> {
    try {
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password
      })

      if (authError) {
        return { success: false, error: authError.message }
      }

      if (data.user && data.session) {
        const userRole = getUserRoleByEmail(data.user.email || '')

        const userData: UserData = {
          id: data.user.id,
          email: data.user.email || '',
          role: userRole,
          accessToken: data.session.access_token,
          refreshToken: data.session.refresh_token
        }

        await this.persistSession(userData, {
          accessToken: data.session.access_token,
          refreshToken: data.session.refresh_token
        })

        return { success: true, user: userData }
      }

      return { success: false, error: 'Falha na autenticação' }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Erro inesperado'
      error('[AuthManager] Erro no login', { error: err })
      return { success: false, error: errorMessage }
    }
  }

  /**
   * Realiza logout do usuário
   */
  static async logout(): Promise<void> {
    try {
      await supabase.auth.signOut()
    } catch (err) {
      error('[AuthManager] Erro ao fazer logout no Supabase', { error: err })
    }

    // Limpar dados locais
    clearStoredUser()

    // Limpar cookie HttpOnly via API
    try {
      await fetch('/api/auth/clear-session', {
        method: 'POST',
        credentials: 'include'
      })
    } catch (err) {
      error('[AuthManager] Erro ao limpar cookie de sessão', { error: err })
      // Não bloquear logout se falhar - dados locais já foram limpos
    }
  }

  /**
   * Obtém o usuário armazenado
   */
  static getStoredUser(): UserData | null {
    return getStoredUser()
  }

  /**
   * Verifica se o usuário está autenticado
   */
  static isAuthenticated(): boolean {
    return this.getStoredUser() !== null
  }

  /**
   * Verifica se o usuário tem a role necessária
   */
  static hasRole(requiredRole: string): boolean {
    const user = this.getStoredUser()
    return hasRole(user, requiredRole)
  }

  /**
   * Obtém a URL de redirecionamento baseada na role
   */
  static getRedirectUrl(role: string): string | null {
    return getRedirectUrl(role)
  }

  /**
   * Persiste a sessão do usuário
   */
  static async persistSession(
    userData: UserData,
    options?: AuthStorageOptions
  ): Promise<void> {
    return persistSession(userData, options)
  }
}

// Re-exportar tipos para compatibilidade
export type { UserData, AuthStorageOptions } from './types'

