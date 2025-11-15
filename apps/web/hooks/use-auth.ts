"use client"

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

interface User {
  id: string
  email: string
  name?: string
  role?: string
}

// Cache global do usuário (compartilhado entre componentes)
let cachedUser: User | null = null
let cacheTimestamp: number = 0
const CACHE_DURATION = 5 * 60 * 1000 // 5 minutos

export function useAuth() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(cachedUser)
  const [loading, setLoading] = useState(!cachedUser)

  const loadUser = useCallback(async (force = false) => {
    // Se temos cache válido e não é forçado, usar cache
    if (!force && cachedUser && Date.now() - cacheTimestamp < CACHE_DURATION) {
      setUser(cachedUser)
      setLoading(false)
      return cachedUser
    }

    try {
      // ✅ PRIMEIRO: Tentar obter do cookie de sessão customizado (mais rápido)
      if (typeof document !== 'undefined') {
        const cookieMatch = document.cookie.match(/golffox-session=([^;]+)/)
        if (cookieMatch) {
          try {
            const decoded = atob(cookieMatch[1])
            const userData = JSON.parse(decoded)
            if (userData?.id && userData?.email) {
              const userObj: User = {
                id: userData.id,
                email: userData.email,
                name: userData.name || userData.email.split('@')[0],
                role: userData.role
              }
              
              // Atualizar cache
              cachedUser = userObj
              cacheTimestamp = Date.now()
              setUser(userObj)
              setLoading(false)
              return userObj
            }
          } catch (cookieErr) {
            console.warn('⚠️ Erro ao decodificar cookie de sessão:', cookieErr)
          }
        }
      }

      // ✅ FALLBACK: Tentar obter sessão do Supabase Auth (mais lento)
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      
      if (sessionError) {
        console.error('Erro ao verificar sessão Supabase:', sessionError)
      }
      
      if (!session) {
        // Se não há sessão Supabase e não há cookie, redirecionar para login
        if (typeof document !== 'undefined' && !document.cookie.includes('golffox-session')) {
          router.push("/")
          return null
        }
        // Se há cookie mas não há sessão Supabase, continuar com cookie
        setLoading(false)
        return null
      }

      // Buscar dados completos do usuário no banco (se necessário)
      const { data: userData, error: userError } = await supabase
        .from("users")
        .select("*")
        .eq("id", session.user.id)
        .maybeSingle()

      if (userError) {
        console.warn('⚠️ Erro ao buscar dados do usuário:', userError)
      }

      const userObj: User = {
        id: session.user.id,
        email: session.user.email || '',
        name: (userData as any)?.name || session.user.email?.split('@')[0] || 'Usuário',
        role: (userData as any)?.role || 'user'
      }

      // Atualizar cache
      cachedUser = userObj
      cacheTimestamp = Date.now()
      setUser(userObj)
      setLoading(false)
      return userObj
    } catch (err: any) {
      console.error('❌ Erro ao obter usuário:', err)
      setLoading(false)
      return null
    }
  }, [router])

  useEffect(() => {
    loadUser()
  }, [loadUser])

  const clearCache = useCallback(() => {
    cachedUser = null
    cacheTimestamp = 0
    setUser(null)
  }, [])

  return {
    user,
    loading,
    reload: () => loadUser(true),
    clearCache
  }
}

