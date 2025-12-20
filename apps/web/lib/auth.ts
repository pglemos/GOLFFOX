import { supabase } from './supabase'
import { debug, error } from './logger'
import { getUserRoleByEmail } from './user-role'

export interface UserData {
  id: string
  email: string
  role: string
  accessToken: string
  refreshToken?: string
  name?: string
  avatar_url?: string | null
  companyId?: string | null
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
          accessToken: data.session.access_token,
          refreshToken: data.session.refresh_token,
        }

        this.persistSession(userData, {
          accessToken: data.session.access_token,
          refreshToken: data.session.refresh_token,
        })

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
      sessionStorage.removeItem(this.STORAGE_KEY)
      sessionStorage.removeItem('golffox-auth-token')

      // Limpar cookie HttpOnly via API
      try {
        await fetch('/api/auth/clear-session', {
          method: 'POST',
          credentials: 'include'
        })
      } catch (err) {
        error('Erro ao limpar cookie de sessão', { error: err }, 'AuthManager')
        // Não bloquear logout se falhar - dados locais já foram limpos
      }
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
    // empresa = usuários da empresa contratante (antigo operador)
    if (requiredRole === 'empresa') {
      return ['admin', 'empresa'].includes(user.role)
    }
    // operador = gestor da transportadora (antigo transportadora)
    if (requiredRole === 'operador' || requiredRole === 'transportadora') {
      return ['admin', 'operador'].includes(user.role)
    }

    return true
  }

  static getRedirectUrl(role: string): string | null {
    switch (role) {
      case 'admin':
        return '/admin'
      // Novas roles PT-BR
      case 'empresa':
        return '/empresa'
      case 'operador':
        return '/transportadora'
      case 'motorista':
      case 'passageiro':
        // Motorista e Passageiro devem usar app mobile, não painéis web
        return null
      // Compatibilidade com roles antigas (inglês) - Temporário durante migração
      case 'operador':
        return '/empresa'  // antigo operador → nova rota /empresa
      case 'transportadora':
      case 'transportadora':
        return '/transportadora'
      case 'motorista':
      case 'passageiro':
        return null
      default:
        // Fallback para empresa se role não for reconhecido
        console.warn(`[AuthManager] Role não reconhecido: ${role}, redirecionando para /empresa`)
        return '/empresa'
    }
  }


  static async persistSession(
    userData: UserData,
    options?: {
      storage?: 'local' | 'session' | 'both'
      token?: string
      accessToken?: string
      refreshToken?: string
    }
  ) {
    if (typeof window === 'undefined') return

    const accessToken = options?.accessToken ?? options?.token ?? userData.accessToken
    const refreshToken = options?.refreshToken ?? userData.refreshToken

    options = options ?? {}
    if (refreshToken) options.token = refreshToken

    // ✅ Sincronizar com Supabase Auth client-side
    if (accessToken && options.token) {
      try {
        // Não aguardar para não bloquear a UI
        await supabase.auth.setSession({
          access_token: accessToken,
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

    // ✅ Armazenar apenas dados não sensíveis no localStorage/sessionStorage
    // access_token NÃO é armazenado no cliente por segurança
    const safePayloadObj = {
      id: userData.id,
      email: userData.email,
      role: userData.role,
      name: userData.name || userData.email.split('@')[0],
      avatar_url: userData.avatar_url || null
      // access_token removido - nunca armazenar no cliente
    }
    const safePayload = JSON.stringify(safePayloadObj)

    try {
      if (storageMode === 'local' || storageMode === 'both') {
        localStorage.setItem(this.STORAGE_KEY, safePayload)
      }
      if (storageMode === 'session' || storageMode === 'both') {
        sessionStorage.setItem(this.STORAGE_KEY, safePayload)
      }
      // Removido: sessionStorage.setItem('golffox-auth-token') - não armazenar token no cliente
    } catch (storageErr) {
      error('Falha ao persistir sessão no storage', { error: storageErr }, 'AuthManager')
    }

    // ✅ Definir cookie HttpOnly via API server-side (seguro contra XSS)
    try {
      // Obter CSRF token
      const csrfResponse = await fetch('/api/auth/csrf', { method: 'GET', credentials: 'include' })
      if (!csrfResponse.ok) {
        throw new Error('Falha ao obter CSRF token')
      }
      const csrfData = await csrfResponse.json()
      const csrfToken = csrfData.token || csrfData.csrfToken

      // Chamar API para definir cookie HttpOnly
      const setSessionResponse = await fetch('/api/auth/set-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-csrf-token': csrfToken
        },
        credentials: 'include',
        body: JSON.stringify({
          user: {
            id: userData.id,
            email: userData.email,
            role: userData.role,
            companyId: userData.companyId || null
          },
          access_token: accessToken
        })
      })

      if (!setSessionResponse.ok) {
        const errorData = await setSessionResponse.json().catch(() => ({}))
        throw new Error(errorData.error || 'Falha ao definir cookie de sessão')
      }

      debug('Cookie de sessão definido via API (HttpOnly)', { role: userData.role }, 'AuthManager')
    } catch (cookieErr) {
      error('Falha ao definir cookie de sessão via API', { error: cookieErr }, 'AuthManager')
      // Não bloquear o fluxo se falhar - o Supabase cookie ainda pode funcionar
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
