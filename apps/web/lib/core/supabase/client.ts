/**
 * Cliente Supabase principal (client-side)
 * Cria o cliente diretamente para evitar dependências circulares
 */

"use client"

import { createClient, SupabaseClient } from '@supabase/supabase-js'

import type { Database } from '@/types/supabase'

type SupabaseClientType = SupabaseClient<Database>

let _supabase: SupabaseClientType | null = null

function ensureSupabaseClient(): SupabaseClientType {
  if (_supabase) return _supabase
  
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  
  if (!url || !key) {
    throw new Error('Supabase não configurado: defina NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY')
  }
  
  _supabase = createClient<Database>(url, key, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
    },
  })
  
  return _supabase
}

// Proxy para adiar criação até primeiro uso e evitar dependências circulares
export const supabase = new Proxy({} as SupabaseClientType, {
  get(_target, prop: string | symbol) {
    const client = ensureSupabaseClient()
    const value = client[prop as keyof SupabaseClientType]
    // Se for uma função, bind para manter contexto
    if (typeof value === 'function') {
      return (value as (...args: unknown[]) => unknown).bind(client)
    }
    return value
  },
  apply(_target, _thisArg, argArray: unknown[]) {
    const client = ensureSupabaseClient()
    // Se o proxy for chamado como função, retornar o cliente
    return client
  }
})

export type SupabaseClientUnion = SupabaseClientType
export type RealtimeChannelUnion = ReturnType<typeof supabase.channel>
