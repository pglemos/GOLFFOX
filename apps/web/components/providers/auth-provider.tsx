'use client'

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react'
import { supabase } from '@/lib/supabase'
import { ensureSupabaseSession } from '@/lib/supabase-session'

interface User {
  id: string
  email: string
  name?: string
  role?: string
  avatar_url?: string
  companyId?: string
  company_id?: string
}

interface AuthContextType {
  user: User | null
  loading: boolean
  error: string | null
  reload: () => Promise<void>
  clearCache: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

// Cache global do usuário (compartilhado entre componentes)
let cachedUser: User | null = null
let cacheTimestamp: number = 0
const CACHE_DURATION = 5 * 60 * 1000 // 5 minutos

/**
 * Provider de autenticação unificado
 * Consolida toda lógica de autenticação em um único lugar
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(cachedUser)
  const [loading, setLoading] = useState(!cachedUser)
  const [error, setError] = useState<string | null>(null)

  /**
   * Lê usuário do cookie golffox-session (mais rápido, síncrono)
   */
  const getUserFromCookie = useCallback((): User | null => {
    if (typeof document === 'undefined') return null

    try {
      const cookieMatch = document.cookie.match(/golffox-session=([^;]+)/)
      if (!cookieMatch) return null

      const decoded = atob(cookieMatch[1])
      const userData = JSON.parse(decoded)

      if (userData?.id && userData?.email) {
        return {
          id: userData.id,
          email: userData.email,
          name: userData.name || userData.email.split('@')[0],
          role: userData.role || 'user',
          avatar_url: userData.avatar_url,
          companyId: userData.companyId || userData.company_id,
          company_id: userData.companyId || userData.company_id,
        }
      }
    } catch (err) {
      // Cookie inválido ou malformado
      console.warn('⚠️ Erro ao decodificar cookie de sessão:', err)
    }

    return null
  }, [])

  /**
   * Carrega usuário usando múltiplas estratégias (cookie → API → Supabase)
   */
  const loadUser = useCallback(async (force = false): Promise<User | null> => {
    // Se temos cache válido e não é forçado, usar cache
    if (!force && cachedUser && Date.now() - cacheTimestamp < CACHE_DURATION) {
      setUser(cachedUser)
      setLoading(false)
      setError(null)
      return cachedUser
    }

    try {
      setError(null)

      // ✅ ESTRATÉGIA 1: Cookie golffox-session (mais rápido, síncrono)
      const cookieUser = getUserFromCookie()
      if (cookieUser) {
        cachedUser = cookieUser
        cacheTimestamp = Date.now()
        setUser(cookieUser)
        setLoading(false)
        return cookieUser
      }

      // ✅ ESTRATÉGIA 2: API /api/auth/me (leitura do cookie httpOnly no servidor)
      try {
        const response = await fetch('/api/auth/me', {
          credentials: 'include',
          cache: 'no-store',
        })

        if (response.ok) {
          const data = await response.json().catch(() => null)
          const u = data?.user

          if (u?.id && u?.email) {
            const userObj: User = {
              id: u.id,
              email: u.email,
              name: u.name || u.email.split('@')[0],
              role: u.role || 'user',
              avatar_url: u.avatar_url,
              companyId: u.companyId || u.company_id,
              company_id: u.companyId || u.company_id,
            }

            cachedUser = userObj
            cacheTimestamp = Date.now()
            setUser(userObj)
            setLoading(false)
            return userObj
          }
        }
      } catch (apiError) {
        // Continuar para próxima estratégia
        console.warn('⚠️ Erro ao buscar usuário via /api/auth/me:', apiError)
      }

      // ✅ ESTRATÉGIA 3: Supabase Auth (fallback mais lento)
      await ensureSupabaseSession()
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()

      if (sessionError) {
        console.error('❌ Erro ao verificar sessão Supabase:', sessionError)
      }

      if (session?.user) {
        // Buscar dados completos do usuário no banco
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('*')
          .eq('id', session.user.id)
          .maybeSingle()

        if (userError) {
          console.warn('⚠️ Erro ao buscar dados do usuário:', userError)
        }

        const userObj: User = {
          id: session.user.id,
          email: session.user.email || '',
          name: (userData as any)?.name || session.user.email?.split('@')[0] || 'Usuário',
          role: (userData as any)?.role || 'user',
          avatar_url: (userData as any)?.avatar_url || session.user.user_metadata?.avatar_url,
          companyId: (userData as any)?.company_id,
          company_id: (userData as any)?.company_id,
        }

        cachedUser = userObj
        cacheTimestamp = Date.now()
        setUser(userObj)
        setLoading(false)
        return userObj
      }

      // Sem sessão válida
      cachedUser = null
      cacheTimestamp = 0
      setUser(null)
      setLoading(false)
      return null
    } catch (err: any) {
      console.error('❌ Erro ao carregar usuário:', err)
      setError(err.message || 'Erro ao carregar autenticação')
      setLoading(false)
      return null
    }
  }, [getUserFromCookie])

  /**
   * Recarrega usuário (força nova busca)
   */
  const reload = useCallback(async () => {
    await loadUser(true)
  }, [loadUser])

  /**
   * Limpa cache do usuário
   */
  const clearCache = useCallback(() => {
    cachedUser = null
    cacheTimestamp = 0
    setUser(null)
  }, [])

  // Carregar usuário na montagem
  useEffect(() => {
    loadUser()
  }, [loadUser])

  // Escutar mudanças de sessão do Supabase
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('🔄 Auth state changed:', event)
      
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        // Recarregar usuário quando há mudança de sessão
        await loadUser(true)
      } else if (event === 'SIGNED_OUT') {
        // Limpar usuário ao fazer logout
        clearCache()
        setUser(null)
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [loadUser, clearCache])

  // Escutar eventos customizados auth:update (disparados quando há atualizações de perfil)
  useEffect(() => {
    const handleAuthUpdate = async () => {
      console.log('🔄 auth:update event received')
      // Forçar recarregamento após pequeno delay para garantir que banco foi atualizado
      setTimeout(() => {
        loadUser(true)
      }, 200)
    }

    window.addEventListener('auth:update', handleAuthUpdate)

    return () => {
      window.removeEventListener('auth:update', handleAuthUpdate)
    }
  }, [loadUser])

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        error,
        reload,
        clearCache,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

/**
 * Hook para acessar contexto de autenticação
 * @throws {Error} Se usado fora do AuthProvider
 */
export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider')
  }
  return context
}

