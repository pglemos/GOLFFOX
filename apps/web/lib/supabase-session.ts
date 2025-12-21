"use client"

import type { Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'

let bootstrapPromise: Promise<Session | null> | null = null

function getAccessTokenFromGolffoxCookie(): string | null {
  if (typeof document === 'undefined') return null

  const match = document.cookie.match(/(?:^|;\\s*)golffox-session=([^;]+)/)
  if (!match) return null

  try {
    const decoded = atob(match[1])
    const parsed = JSON.parse(decoded)
    const token = parsed?.access_token || parsed?.accessToken
    return typeof token === 'string' && token.length > 0 ? token : null
  } catch {
    return null
  }
}

export async function ensureSupabaseSession(): Promise<Session | null> {
  if (typeof window === 'undefined') return null

  const { data: { session } } = await supabase.auth.getSession()
  if (session) return session

  const token = getAccessTokenFromGolffoxCookie()
  if (!token) return null

  if (!bootstrapPromise) {
    bootstrapPromise = (async () => {
      const { data, error } = await supabase.auth.setSession({
        access_token: token,
        refresh_token: token,
      })
      if (error) {
        console.warn('Failed to set Supabase session from golffox-session cookie', { error })
        return null
      }
      return data.session
    })().finally(() => {
      bootstrapPromise = null
    })
  }

  return bootstrapPromise
}

