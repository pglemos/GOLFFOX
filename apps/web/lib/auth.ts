import { supabase } from './supabase'
import { debug, error } from './logger'
import { getUserRoleByEmail } from './user-role'

export interface UserData {
  id: string
  email: string
  role: string
  accessToken: string
  name?: string
  avatar_url?: string | null
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
        const userRole = getUserRoleByEmail(data.user.email || '')

        const userData: UserData = {
          id: data.user.id,
          email: data.user.email || '',
          role: userRole,
          accessToken: data.session.access_token
        }

        this.persistSession(userData, { token: data.session.access_token })

        return { success: true, user: userData }
      }

      return { success: false, error: 'Falha na autenticação' }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Erro inesperado'
      error('Erro no login', { error: err }, 'AuthManager')
      return { success: false, error: errorMessage }
    }
  }

  static async logout(): Promise<void> {
    try {
      await supabase.auth.signOut()
    } catch (err) {
      error('Erro ao fazer logout no Supabase', { error: err }, 'AuthManager')
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
    if (requiredRole === 'operador') {
      return ['admin', 'operador'].includes(user.role)
    }
    if (requiredRole === 'transportadora') {
      return ['admin', 'transportadora'].includes(user.role)
    }

    return true
  }

  static getRedirectUrl(role: string): string {
    switch (role) {
      case 'admin':
        return '/admin'
      case 'operador':
      case 'operator':
      case 'empresa':
        return '/operador'
      case 'transportadora':
      case 'carrier':
        return '/transportadora'
      default:
        // Fallback para operador se role não for reconhecido
        console.warn(`[AuthManager] Role não reconhecido: ${role}, redirecionando para /operador`)
        return '/operador'
    }
  }

  static async persistSession(userData: UserData, options?: { storage?: 'local' | 'session' | 'both'; token?: string }) {
    if (typeof window === 'undefined') return

    // ✅ Sincronizar com Supabase Auth client-side
    if (options?.token) {
      try {
        // Não aguardar para não bloquear a UI
        supabase.auth.setSession({
          access_token: options.token,
          refresh_token: options.token // Usar mesmo token se não tiver refresh
        }).then(({ error }: { error: any }) => {
          if (error) console.warn('Erro ao sincronizar sessão Supabase:', error)
          else console.log('✅ Sessão Supabase sincronizada')
        })
      } catch (e) {
        console.warn('Falha ao setar sessão Supabase:', e)
      }
    }

    const storageMode = options?.storage ?? 'both'

    // ✅ Garantir compatibilidade com backend (api-auth.ts espera access_token)
    // ✅ Incluir name e avatar_url para exibição no Topbar
    const payloadObj = {
      id: userData.id,
      email: userData.email,
      role: userData.role,
      name: userData.name || userData.email.split('@')[0],
      avatar_url: userData.avatar_url || null,
      access_token: userData.accessToken || options?.token
    }
    const payload = JSON.stringify(payloadObj)

    try {
      if (storageMode === 'local' || storageMode === 'both') {
        localStorage.setItem(this.STORAGE_KEY, payload)
      }
      if (storageMode === 'session' || storageMode === 'both') {
        sessionStorage.setItem(this.STORAGE_KEY, payload)
      }
      if (options?.token) {
        sessionStorage.setItem('golffox-auth-token', options.token)
      }
    } catch (storageErr) {
      error('Falha ao persistir sessão no storage', { error: storageErr }, 'AuthManager')
    }

    try {
      if (typeof document !== 'undefined') {
        const cookieValue = btoa(payload)
        const isSecure = window.location?.protocol === 'https:'
        document.cookie = `${this.COOKIE_NAME}=${cookieValue}; path=/; max-age=3600; SameSite=Lax${isSecure ? '; Secure' : ''}`
      }
    } catch (cookieErr) {
      error('Falha ao gravar cookie de sessão', { error: cookieErr }, 'AuthManager')
    }

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('golffox:auth', { detail: userData }))
      debug('Sessão persistida', { role: userData.role }, 'AuthManager')
    }
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
