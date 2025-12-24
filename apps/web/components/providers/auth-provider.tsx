"use client"

import React, { createContext, useContext, useState, useEffect, useCallback } from "react"

import { useRouter, usePathname } from "next/navigation"

import { supabase } from "@/lib/supabase"
import { logError } from "@/lib/logger"

interface User {
  id: string
  email: string
  name: string
  role: string
  avatar_url?: string
  company_id?: string | null
  transportadora_id?: string | null
  /** @deprecated use company_id */
  companyId?: string | null
}

interface AuthContextType {
  user: User | null
  loading: boolean
  refresh: () => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const pathname = usePathname()

  const loadUser = useCallback(async () => {
    try {
      setLoading(true)

      // 1. Tentar ler cookie de sessão (Estratégia "Fast")
      if (typeof document !== 'undefined') {
        const cookieMatch = document.cookie.match(/golffox-session=([^;]+)/)
        if (cookieMatch) {
          try {
            const decoded = atob(cookieMatch[1])
            const u = JSON.parse(decoded)
            if (u?.id && u?.email) {
              setUser({
                id: u.id,
                email: u.email,
                name: u.name || u.email.split('@')[0],
                role: u.role,
                avatar_url: u.avatar_url,
                company_id: u.company_id || u.companyId,
                transportadora_id: u.transportadora_id || u.transportadoraId,
                companyId: u.company_id || u.companyId
              })
              setLoading(false)
              // Não retornamos aqui para permitir validação em segundo plano
            }
          } catch (e) { }
        }
      }

      // 2. Validar/Atualizar via API (Estratégia Segura)
      const res = await fetch('/api/auth/me', { credentials: 'include' })
      if (res.ok) {
        const data = await res.json()
        if (data.success && data.user) {
          setUser(data.user)
          return
        }
      }

      // 3. Fallback: Supabase Session
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.user) {
        const { data: profile } = await supabase
          .from('users')
          .select('*')
          .eq('id', session.user.id)
          .maybeSingle()

        const p = profile
        setUser({
          id: session.user.id,
          email: session.user.email || '',
          name: p?.name || session.user.email?.split('@')[0] || 'Usuário',
          role: p?.role || 'user',
          avatar_url: p?.avatar_url,
          company_id: p?.company_id || p?.empresa_id,
          transportadora_id: p?.transportadora_id,
          companyId: p?.company_id || p?.empresa_id
        })
      } else {
        setUser(null)
      }
    } catch (error) {
      logError("[AuthProvider] Erro ao carregar usuário", { error }, 'AuthProvider')
      setUser(null)
    } finally {
      setLoading(false)
    }
  }, [])

  const signOut = async () => {
    await supabase.auth.signOut()
    // Limpar cookies via API de logout se existir
    await fetch('/api/auth/logout', { method: 'POST' }).catch(() => { })
    setUser(null)
    router.push('/')
  }

  useEffect(() => {
    loadUser()
  }, [loadUser])

  return (
    <AuthContext.Provider value={{ user, loading, refresh: loadUser, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth deve ser usado dentro de um AuthProvider")
  }
  return context
}
