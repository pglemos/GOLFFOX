"use client"

import { useAuth as useAuthProvider } from '@/components/providers/auth-provider'

export interface User {
  id: string
  email: string
  name?: string
  role?: string
  avatar_url?: string
}

export function useAuth() {
  const { user, loading, refresh, signOut } = useAuthProvider()

  return {
    user: user as User | null,
    loading,
    reload: refresh,
    logout: signOut,
    clearCache: () => { } // No-op, handled by provider
  }
}

