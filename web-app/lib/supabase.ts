import { createClient } from '@supabase/supabase-js'

const envUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const envAnon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

let supabase: any

if (envUrl && envAnon) {
  // Criar cliente com configurações otimizadas
  supabase = createClient(envUrl, envAnon, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true
    },
    global: {
      headers: {
        'x-client-info': 'golffox-web@1.0.0'
      }
    },
    db: {
      schema: 'public'
    }
  })

  // Removido: interceptação global do fetch.
  // Motivo: alterar globalThis.fetch mascara erros reais (ex.: net::ERR_ABORTED),
  // dificulta o diagnóstico e pode afetar requisições não-Supabase (HMR, rotas internas).
  // Agora deixamos o cliente Supabase operar com o fetch padrão do ambiente.

} else {
  // Fallback seguro: permite que a UI funcione sem backend configurado
  // Supabase não configurado. Defina NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY no ambiente.
  supabase = {
    auth: {
      getSession: async () => ({ data: { session: null }, error: null }),
      signInWithPassword: async () => ({ data: null, error: new Error('Supabase não configurado') }),
      signOut: async () => ({ error: null }),
    },
    from: () => ({
      select: () => ({
        eq: () => ({
          eq: () => ({ data: null, error: new Error('Supabase não configurado'), count: 0 })
        }),
        gte: () => ({ data: null, error: new Error('Supabase não configurado'), count: 0 }),
        data: null, 
        error: new Error('Supabase não configurado'), 
        count: 0 
      }),
    }),
  }
}

export { supabase }
export type Database = any // Ajustar com tipos gerados do Supabase quando disponíveis
