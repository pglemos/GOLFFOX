import { supabase } from './supabase'
import { debug, error, warn } from './logger'
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
      error('[AuthManager] Erro no login', { error: err })
      return { success: false, error: errorMessage }
    }
  }

  static async logout(): Promise<void> {
    try {
      await supabase.auth.signOut()
    } catch (err) {
      error('[AuthManager] Erro ao fazer logout no Supabase', { error: err })
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
        error('[AuthManager] Erro ao limpar cookie de sessão', { error: err })
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
        warn(`Role não reconhecido, redirecionando para /empresa`, { role }, 'AuthManager')
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
  ): Promise<void> {
    try {
      debug('Iniciando persistSession', {
        hasWindow: typeof window !== 'undefined',
        hasSupabase: !!supabase,
        hasSupabaseAuth: !!supabase?.auth
      }, 'AuthManager')
      
      if (typeof window === 'undefined') {
        debug('window is undefined, retornando', {}, 'AuthManager')
        return Promise.resolve()
      }

      // ✅ VALIDAÇÃO: Garantir que supabase é um objeto válido
      if (!supabase) {
        warn('supabase não está definido', {}, 'AuthManager')
        // Continuar com o resto da função mesmo se Supabase não estiver disponível
      } else if (typeof supabase !== 'object' || supabase === null) {
        error('supabase não é um objeto válido', { type: typeof supabase }, 'AuthManager')
        // Continuar com o resto da função mesmo se Supabase não estiver disponível
      } else if (!supabase.auth) {
        warn('Supabase auth não está disponível, pulando sincronização de sessão', {}, 'AuthManager')
        // Continuar com o resto da função mesmo se Supabase não estiver disponível
      } else if (typeof supabase.auth !== 'object' || supabase.auth === null) {
        warn('supabase.auth não é um objeto válido', { type: typeof supabase.auth }, 'AuthManager')
        // Continuar com o resto da função mesmo se Supabase não estiver disponível
      }

    const accessToken = options?.accessToken ?? options?.token ?? userData.accessToken
    const refreshToken = options?.refreshToken ?? userData.refreshToken

    options = options ?? {}
    if (refreshToken) options.token = refreshToken

    // ✅ Sincronizar com Supabase Auth client-side
    if (accessToken && options.token) {
      try {
        // ✅ VALIDAÇÃO EXTRA: Verificar se supabase.auth existe e é um objeto válido
        if (!supabase || !supabase.auth || typeof supabase.auth !== 'object') {
          warn('supabase.auth não está disponível, pulando setSession', {}, 'AuthManager')
        } else {
          // ✅ VALIDAÇÃO: Garantir que setSession é uma função antes de chamar
          const setSessionFn = supabase.auth.setSession
          
          if (setSessionFn && typeof setSessionFn === 'function') {
            try {
              // ✅ CORREÇÃO: Verificar se o Supabase está realmente inicializado
              // O erro "initializePromise" ocorre quando o cliente ainda está inicializando
              // Vamos tentar uma abordagem mais segura: verificar se o objeto auth está completo
              let isReady = false
              
              if (supabase.auth && typeof supabase.auth.getSession === 'function') {
                try {
                  // Tentar obter sessão atual para verificar se está inicializado
                  // Se getSession funcionar sem erro, o Supabase está pronto
                  await Promise.race([
                    supabase.auth.getSession(),
                    new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 100))
                  ])
                  isReady = true
                } catch (initCheckErr: any) {
                  // Se getSession falhar ou timeout, o Supabase ainda não está pronto
                  if (initCheckErr?.message?.includes('initializePromise') || 
                      initCheckErr?.message?.includes('undefined') ||
                      initCheckErr?.message === 'timeout') {
                    debug('Supabase ainda inicializando, pulando setSession', {
                      error: initCheckErr?.message
                    }, 'AuthManager')
                    // Sair do bloco try sem chamar setSession
                    return
                  }
                  // Se for outro erro, tentar mesmo assim
                  isReady = true
                }
              } else {
                // Se não tiver getSession, assumir que está pronto
                isReady = true
              }
              
              if (!isReady) {
                return
              }
              
              // Aguardar um pouco mais para garantir que o Supabase está totalmente inicializado
              await new Promise(resolve => setTimeout(resolve, 200))
              
              // ✅ CORREÇÃO: Usar try-catch interno para capturar erros de setSession
              try {
                const result = await setSessionFn({
                  access_token: accessToken,
                  refresh_token: options.token // Usar mesmo token se não tiver refresh
                })
                
                if (result?.error) {
                  warn('Erro ao sincronizar sessão Supabase', { error: result.error }, 'AuthManager')
                } else {
                  debug('Sessão Supabase sincronizada', {}, 'AuthManager')
                }
              } catch (setSessionErr: any) {
                // Capturar erros específicos do setSession
                if (setSessionErr?.message?.includes('initializePromise') || 
                    setSessionErr?.message?.includes('Cannot read properties of undefined')) {
                  debug('Supabase ainda inicializando durante setSession', { 
                    error: setSessionErr?.message 
                  }, 'AuthManager')
                } else {
                  warn('Erro ao chamar setSession', { error: setSessionErr }, 'AuthManager')
                }
              }
            } catch (sessionErr: any) {
              // Ignorar erros de inicialização do Supabase - não crítico
              if (sessionErr?.message?.includes('initializePromise') || 
                  sessionErr?.message?.includes('Cannot read properties of undefined')) {
                debug('Supabase ainda inicializando, pulando setSession', { 
                  error: sessionErr?.message 
                }, 'AuthManager')
              } else {
                warn('Erro ao chamar setSession', { error: sessionErr }, 'AuthManager')
              }
            }
          } else {
            warn('supabase.auth.setSession não está disponível ou não é uma função', {
              type: typeof setSessionFn
            }, 'AuthManager')
          }
        }
      } catch (e) {
        warn('Falha ao setar sessão Supabase', { error: e }, 'AuthManager')
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
      error('[AuthManager] Falha ao persistir sessão no storage', { error: storageErr })
    }

    // ✅ Definir cookie HttpOnly via API server-side (seguro contra XSS)
    try {
      // Obter CSRF token
      const csrfResponse = await fetch('/api/auth/csrf', { 
        method: 'GET', 
        credentials: 'include',
        cache: 'no-store' // Evitar cache do token CSRF
      })
      
      if (!csrfResponse.ok) {
        throw new Error(`Falha ao obter CSRF token: ${csrfResponse.status}`)
      }
      
      const csrfData = await csrfResponse.json()
      // A API retorna { success: true, data: { token, csrfToken } }
      const csrfToken = csrfData?.data?.token || csrfData?.data?.csrfToken || csrfData.token || csrfData.csrfToken

      if (!csrfToken) {
        throw new Error('CSRF token não encontrado na resposta')
      }

      // Chamar API para definir cookie HttpOnly
      const setSessionResponse = await fetch('/api/auth/set-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-csrf-token': csrfToken
        },
        credentials: 'include', // ✅ CRÍTICO: Incluir cookies na requisição
        cache: 'no-store',
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
        const errorMsg = errorData.error || `Falha ao definir cookie de sessão: ${setSessionResponse.status}`
        throw new Error(errorMsg)
      }

      debug('[AuthManager] Cookie de sessão definido via API (HttpOnly)', { role: userData.role })
    } catch (cookieErr) {
      error('[AuthManager] Falha ao definir cookie de sessão via API', { error: cookieErr })
      // Não bloquear o fluxo se falhar - o Supabase cookie ainda pode funcionar
      // Mas logar o erro para debug
    }

      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('golffox:auth', { detail: userData }))
        debug('[AuthManager] Sessão persistida', { role: userData.role })
      }

      debug('persistSession concluído com sucesso', {}, 'AuthManager')
      return Promise.resolve()
    } catch (err: any) {
      error('persistSession - Erro inesperado', {
        error: err,
        message: err?.message,
        stack: err?.stack?.substring(0, 500),
        name: err?.name
      }, 'AuthManager')
      // Retornar Promise resolvida mesmo em caso de erro para não quebrar o fluxo
      return Promise.resolve()
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
