"use client"

import { useState, useEffect, useMemo } from "react"
import { supabase } from "@/lib/supabase"

interface User {
  id: string
  email: string
  name?: string
  role?: string
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
              role: u.role || 'admin'
            }
          }
        }
      } catch (err) {
        // Cookie inválido, continuar para Supabase
      }
      return null
    }

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
            setUser({ id: u.id, email: u.email || '', name: u.email?.split('@')[0] || '', role: u.role })
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
            role: session.user.user_metadata?.role || 'admin'
          })
        }
        setLoading(false)
      })
      .catch(() => {
        if (!mounted) return
        setLoading(false)
      })

    return () => {
      mounted = false
    }
  }, [])

  return { user, loading }
}

