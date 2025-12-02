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
          fetch('http://127.0.0.1:7242/ingest/802544c4-70d0-43c7-a57c-6692b28ca17d',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'use-auth-fast.tsx:getCookieUser',message:'H3: Cookie data parsed',data:{hasAvatarUrl:!!u?.avatar_url,avatarUrl:u?.avatar_url,cookieKeys:u?Object.keys(u):[]},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'H3'})}).catch(()=>{});
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
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/802544c4-70d0-43c7-a57c-6692b28ca17d',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'use-auth-fast.tsx:checkAuth:cookieUser',message:'H1: User from cookie',data:{userId:cookieUser.id,hasAvatarUrl:!!cookieUser.avatar_url,avatarUrl:cookieUser.avatar_url},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'H1'})}).catch(()=>{});
        // #endregion
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
            // #region agent log
            fetch('http://127.0.0.1:7242/ingest/802544c4-70d0-43c7-a57c-6692b28ca17d',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'use-auth-fast.tsx:checkAuth:apiMe',message:'H2: API /api/auth/me response',data:{hasUser:!!u,hasAvatarUrl:!!u?.avatar_url,avatarUrl:u?.avatar_url,userKeys:u?Object.keys(u):[]},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'H2'})}).catch(()=>{});
            // #endregion
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

    const handleAuthUpdate = () => {
      setLoading(true)
      checkAuth()
    }

    window.addEventListener('auth:update', handleAuthUpdate)

    return () => {
      mounted = false
      window.removeEventListener('auth:update', handleAuthUpdate)
    }
  }, [])

  return { user, loading }
}

