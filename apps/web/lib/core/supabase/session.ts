"use client"

import { supabase } from './client'

import type { Session } from '@supabase/supabase-js'

/**
 * ✅ SEGURANÇA: Removida função getAccessTokenFromGolffoxCookie()
 * O access_token não é mais armazenado no cookie customizado por segurança
 * O Supabase gerencia sua própria sessão via cookie sb-${projectRef}-auth-token
 */

/**
 * Garante que a sessão do Supabase está disponível
 * Confia apenas na sessão gerenciada pelo próprio Supabase
 * Não tenta ler tokens do cookie customizado por segurança
 */
export async function ensureSupabaseSession(): Promise<Session | null> {
  if (typeof window === 'undefined') return null

  // O Supabase já gerencia sua própria sessão via cookies
  // Não precisamos mais tentar ler tokens do cookie customizado
  const { data: { session } } = await supabase.auth.getSession()
  
  return session
}

