import { supabase } from './supabase'

export interface UserData {
  id: string
  email: string
  role: string
  accessToken: string
}

export class AuthManager {
  private static readonly STORAGE_KEY = 'golffox-auth'
  private static readonly COOKIE_NAME = 'golffox-session'

  static async login(email: string, password: string): Promise<{ success: boolean; user?: UserData; error?: string }> {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        return { success: false, error: error.message }
      }

      if (data.user && data.session) {
        const userRole = this.getUserRoleByEmail(data.user.email || '')
        
        const userData: UserData = {
          id: data.user.id,
          email: data.user.email || '',
          role: userRole,
          accessToken: data.session.access_token
        }

        // Salvar no localStorage
        if (typeof window !== 'undefined') {
          localStorage.setItem(this.STORAGE_KEY, JSON.stringify(userData))
          
          // Salvar cookie com configurações específicas
          const cookieValue = btoa(JSON.stringify(userData)) // Base64 encode
          const isSecure = location.protocol === 'https:'
          const secureFlag = isSecure ? '; Secure' : ''
          document.cookie = `${this.COOKIE_NAME}=${cookieValue}; path=/; max-age=3600; SameSite=Lax${secureFlag}`
          
          console.log('🍪 Cookie salvo:', this.COOKIE_NAME, 'Secure:', isSecure)
        }

        return { success: true, user: userData }
      }

      return { success: false, error: 'Falha na autenticação' }
    } catch (error: any) {
      return { success: false, error: error.message || 'Erro inesperado' }
    }
  }

  static async logout(): Promise<void> {
    try {
      await supabase.auth.signOut()
    } catch (error) {
      console.error('Erro ao fazer logout no Supabase:', error)
    }

    // Limpar dados locais
    if (typeof window !== 'undefined') {
      localStorage.removeItem(this.STORAGE_KEY)
      document.cookie = `${this.COOKIE_NAME}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`
    }
  }

  static getStoredUser(): UserData | null {
    if (typeof window === 'undefined') return null

    try {
      const stored = localStorage.getItem(this.STORAGE_KEY)
      return stored ? JSON.parse(stored) : null
    } catch {
      return null
    }
  }

  static isAuthenticated(): boolean {
    return this.getStoredUser() !== null
  }

  static hasRole(requiredRole: string): boolean {
    const user = this.getStoredUser()
    if (!user) return false

    if (requiredRole === 'admin') {
      return user.role === 'admin'
    }
    if (requiredRole === 'operator') {
      return ['admin', 'operator'].includes(user.role)
    }
    if (requiredRole === 'carrier') {
      return ['admin', 'carrier'].includes(user.role)
    }

    return true
  }

  static getRedirectUrl(role: string): string {
    switch (role) {
      case 'admin':
        return '/admin'
      case 'operator':
        return '/operator'
      case 'carrier':
        return '/carrier'
      default:
        return '/dashboard'
    }
  }

  private static getUserRoleByEmail(email: string): string {
    const demoAccounts = [
      // Conjunto A (golffox.com)
      { email: 'admin@golffox.com', role: 'admin' },
      { email: 'operator@golffox.com', role: 'operator' },
      { email: 'carrier@golffox.com', role: 'carrier' },
      { email: 'driver@golffox.com', role: 'driver' },

      // Conjunto B (Português, usados na página de login)
      { email: 'golffox@admin.com', role: 'admin' },
      { email: 'operador@empresa.com', role: 'operator' },
      { email: 'transportadora@trans.com', role: 'carrier' },
      { email: 'motorista@trans.com', role: 'driver' },
      { email: 'passageiro@empresa.com', role: 'passenger' },

      // Variantes antigas
      { email: 'operador@golffox.com', role: 'operator' },
      { email: 'transportadora@golffox.com', role: 'carrier' },
      { email: 'motorista@golffox.com', role: 'driver' }
    ]

    const account = demoAccounts.find(acc => acc.email === email)
    return account?.role || 'driver'
  }

  // Método para middleware extrair dados do cookie
  static extractUserFromCookie(cookieValue: string): UserData | null {
    try {
      const decoded = atob(cookieValue) // Base64 decode
      return JSON.parse(decoded)
    } catch {
      return null
    }
  }
}
