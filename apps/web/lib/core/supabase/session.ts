"use client"

import { supabase } from './client'

import type { Session } from '@supabase/supabase-js'

let bootstrapPromise: Promise<Session | null> | null = null

export function getAccessTokenFromGolffoxCookie(): string | null {
  if (typeof document === 'undefined') return null

  const match = document.cookie.match(/(?:^|;\\s*)golffox-session=([^;]+)/)
  if (!match) return null

  try {
    const raw = match[1]
    let decoded: string
    try {
      decoded = atob(raw)
    } catch {
      decoded = decodeURIComponent(raw)
    }
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
      debug('[SupabaseSession] Iniciando bootstrap da sessão via cookie', {}, 'SupabaseSession')
      const { data, error } = await supabase.auth.setSession({
        access_token: token,
        refresh_token: token,
      })
      if (error) {
        warn('[SupabaseSession] Falha ao definir sessão via cookie', { error: error.message }, 'SupabaseSession')
        return null
      }
      debug('[SupabaseSession] Sessão sincronizada com sucesso via cookie', {}, 'SupabaseSession')
      return data.session
    })().finally(() => {
      bootstrapPromise = null
    })
  }

  return bootstrapPromise
}

