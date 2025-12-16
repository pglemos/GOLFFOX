"use client"

import { useState, useEffect, useMemo } from "react"
import { supabase } from "@/lib/supabase"

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
          // #region agent log
          console.log('[DEBUG useAuthFast] 🍪 Cookie RAW data:', JSON.stringify(u, null, 2));
          console.log('[DEBUG useAuthFast] 🖼️ avatar_url status:', {
            hasAvatarUrl: !!u?.avatar_url,
            avatarUrl: u?.avatar_url,
            avatarUrlType: typeof u?.avatar_url,
            cookieKeys: u ? Object.keys(u) : []
          });
          // #endregion
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

    const checkAuth = () => {
      // Primeiro, tentar cookie (instantâneo)
      const cookieUser = getCookieUser()
      if (cookieUser && mounted) {

        setUser(cookieUser)
        setLoading(false)
        return
      }

      // Fallback rápido: perguntar ao servidor (lê cookie httpOnly)
      fetch('/api/auth/me', { credentials: 'include' })
        .then(async (res) => {
          if (!mounted) return
          if (res.ok) {
            const data = await res.json().catch(() => null)
            const u = data?.user

            if (u?.id && u?.role) {
              setUser({ id: u.id, email: u.email || '', name: u.name || u.email?.split('@')[0] || '', role: u.role, avatar_url: u.avatar_url })
              setLoading(false)
              return
            }
          }
          // Continua para Supabase
          return supabase.auth.getSession()
        })
        .then((result: any) => {
          if (!mounted || !result) return
          const { data: { session }, error } = result
          if (error) {
            console.error('Erro ao obter sessão:', error)
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
        })
        .catch(() => {
          if (!mounted) return
          setLoading(false)
        })
    }

    checkAuth()

    const handleAuthUpdate = (event?: Event) => {
      console.log('[DEBUG useAuthFast] 🔄 auth:update EVENT RECEIVED at', new Date().toISOString());
      setLoading(true)

      // Adicionar delay para garantir que o banco foi atualizado
      setTimeout(() => {
        // Forçar busca no servidor (ignorar cookie desatualizado)
        fetch('/api/auth/me', {
          credentials: 'include',
          // Forçar sem cache
          cache: 'no-store',
          headers: {
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache'
          }
        })
          .then(async (res) => {
            if (!mounted) return
            console.log('[DEBUG useAuthFast] 🔄 /api/auth/me response status:', res.status);
            if (res.ok) {
              const data = await res.json().catch(() => null)
              const u = data?.user
              console.log('[DEBUG useAuthFast] 🔄 auth:update - FULL Server response:', JSON.stringify(u, null, 2));
              console.log('[DEBUG useAuthFast] 🔄 auth:update - Avatar URL received:', u?.avatar_url);
              if (u?.id && u?.role) {
                const newUser = {
                  id: u.id,
                  email: u.email || '',
                  name: u.name || u.email?.split('@')[0] || '',
                  role: u.role,
                  avatar_url: u.avatar_url
                }
                console.log('[DEBUG useAuthFast] 🔄 Setting NEW user state:', JSON.stringify(newUser, null, 2));
                setUser(newUser)
                setLoading(false)
                return
              }
            }
            // Fallback para cookie se servidor falhar
            console.log('[DEBUG useAuthFast] ⚠️ Falling back to cookie (server failed)');
            checkAuth()
          })
          .catch((err) => {
            console.error('[DEBUG useAuthFast] ❌ Error fetching /api/auth/me:', err);
            if (!mounted) return
            checkAuth()
          })
      }, 200) // Pequeno delay para garantir propagação no banco
    }

    window.addEventListener('auth:update', handleAuthUpdate)

    return () => {
      mounted = false
      window.removeEventListener('auth:update', handleAuthUpdate)
    }
  }, [])

  return { user, loading }
}

