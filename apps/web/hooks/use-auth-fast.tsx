"use client"

import { useState, useEffect, useMemo } from "react"
import { supabase } from "@/lib/supabase"
import { logError, warn } from "@/lib/logger"

interface User {
  id: string
  email: string
  name?: string
  role?: string
  avatar_url?: string
}

/**
 * Hook otimizado de autenticação que lê do cookie primeiro (síncrono)
 * e só faz chamada ao Supabase se necessário
 */
export function useAuthFast() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true

    // Leitura síncrona do cookie (instantânea)
    const getCookieUser = (): User | null => {
      if (typeof document === 'undefined') return null

      try {
        const cookieMatch = document.cookie.match(/golffox-session=([^;]+)/)
        if (cookieMatch) {
          const decoded = atob(cookieMatch[1])
          const u = JSON.parse(decoded)
          if (u?.id && u?.email) {
            return {
              id: u.id,
              email: u.email,
              name: u.name || u.email.split('@')[0],
              role: u.role || 'admin',
              avatar_url: u.avatar_url
            }
          }
        }
      } catch (err) {
        // Cookie inválido, continuar para Supabase
      }
      return null
    }

    const checkAuth = async () => {
      // Primeiro, tentar cookie (instantâneo)
      const cookieUser = getCookieUser()
      if (cookieUser && mounted) {
        setUser(cookieUser)
        setLoading(false)
        return
      }

      try {
        // Fallback rápido: perguntar ao servidor (lê cookie httpOnly)
        const res = await fetch('/api/auth/me', { credentials: 'include' })
        
        if (!mounted) return
        
        if (res.ok) {
          try {
            const data = await res.json()
            const u = data?.user

            if (u?.id && u?.role) {
              setUser({ 
                id: u.id, 
                email: u.email || '', 
                name: u.name || u.email?.split('@')[0] || '', 
                role: u.role, 
                avatar_url: u.avatar_url 
              })
              setLoading(false)
              return
            }
          } catch (parseError) {
            warn('Erro ao fazer parse da resposta de /api/auth/me', { error: parseError }, 'useAuthFast')
          }
        }
        
        // Continua para Supabase se servidor não retornou usuário válido
        const { data: { session }, error } = await supabase.auth.getSession()
        
        if (!mounted) return
        
        if (error) {
          logError('Erro ao obter sessão do Supabase', { error }, 'useAuthFast')
          setLoading(false)
          return
        }
        
        if (session?.user) {
          setUser({
            id: session.user.id,
            email: session.user.email || '',
            name: session.user.user_metadata?.name || session.user.email?.split('@')[0] || '',
            role: session.user.user_metadata?.role || 'admin',
            avatar_url: session.user.user_metadata?.avatar_url
          })
        }
        setLoading(false)
      } catch (error: unknown) {
        if (!mounted) return
        logError('Erro ao verificar autenticação', { error }, 'useAuthFast')
        setLoading(false)
      }
    }

    checkAuth()

    let isHandlingUpdate = false
    let updateTimeoutId: NodeJS.Timeout | null = null

    const handleAuthUpdate = async (event?: Event) => {
      // Debounce para evitar múltiplas chamadas simultâneas
      if (isHandlingUpdate) {
        return
      }

      isHandlingUpdate = true
      setLoading(true)

      // Limpar timeout anterior se existir
      if (updateTimeoutId) {
        clearTimeout(updateTimeoutId)
      }

      // Adicionar delay para garantir que o banco foi atualizado
      updateTimeoutId = setTimeout(async () => {
        try {
          // Forçar busca no servidor (ignorar cookie desatualizado)
          const res = await fetch('/api/auth/me', {
            credentials: 'include',
            // Forçar sem cache
            cache: 'no-store',
            headers: {
              'Cache-Control': 'no-cache',
              'Pragma': 'no-cache'
            }
          })
          
          if (!mounted) {
            isHandlingUpdate = false
            return
          }
          
          if (res.ok) {
            try {
              const data = await res.json()
              const u = data?.user
              
              if (u?.id && u?.role) {
                const newUser = {
                  id: u.id,
                  email: u.email || '',
                  name: u.name || u.email?.split('@')[0] || '',
                  role: u.role,
                  avatar_url: u.avatar_url
                }
                setUser(newUser)
                setLoading(false)
                isHandlingUpdate = false
                return
              }
            } catch (parseError) {
              warn('Erro ao fazer parse da resposta de /api/auth/me no handleAuthUpdate', { error: parseError }, 'useAuthFast')
            }
          }
          
          // Fallback para cookie se servidor falhar
          await checkAuth()
          isHandlingUpdate = false
        } catch (err: unknown) {
          logError('Erro ao buscar autenticação após update', { error: err }, 'useAuthFast')
          if (!mounted) {
            isHandlingUpdate = false
            return
          }
          await checkAuth()
          isHandlingUpdate = false
        }
      }, 500) // Debounce de 500ms para evitar loops
    }

    window.addEventListener('auth:update', handleAuthUpdate)

    return () => {
      mounted = false
      if (updateTimeoutId) {
        clearTimeout(updateTimeoutId)
      }
      window.removeEventListener('auth:update', handleAuthUpdate)
    }
  }, [])

  return { user, loading }
}

