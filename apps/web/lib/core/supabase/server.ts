import { createClient, SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/supabase'

// Inicialização lazy para evitar falhas de build quando variáveis de ambiente não estão definidas.
// Mantém API compatível: os módulos importam `supabaseServiceRole` e usam normalmente.
type SupabaseClientType = SupabaseClient<Database>

let _supabaseServiceRole: SupabaseClientType | null = null

function ensureSupabaseServiceRole(): SupabaseClientType {
  // ✅ CORREÇÃO: Verificar se está no servidor antes de tentar acessar variáveis de ambiente
  if (typeof window !== 'undefined') {
    // No cliente, retornar um objeto mock que não quebra a aplicação
    throw new Error('supabaseServiceRole não pode ser usado no cliente. Use apenas no servidor.')
  }

  if (_supabaseServiceRole) return _supabaseServiceRole
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  // Padronizar para SUPABASE_SERVICE_ROLE_KEY; aceitar SUPABASE_SERVICE_ROLE como fallback controlado
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE
  if (!url || !key) {
    throw new Error('Supabase service role não configurado: defina NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY')
  }
  _supabaseServiceRole = createClient<Database>(url, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
  return _supabaseServiceRole
}

// Proxy para adiar criação até primeiro uso
// Usa Proxy para manter compatibilidade com uso dinâmico do cliente Supabase
// ✅ CORREÇÃO: Verificar se está no servidor antes de criar proxy
export const supabaseServiceRole = typeof window === 'undefined' 
  ? new Proxy({} as SupabaseClientType, {
      get(_target, prop: string | symbol) {
        const client = ensureSupabaseServiceRole()
        const value = client[prop as keyof SupabaseClientType]
        // Se for uma função, bind para manter contexto
        if (typeof value === 'function') {
          return (value as (...args: unknown[]) => unknown).bind(client)
        }
        return value
      },
      apply(_target, _thisArg, argArray: unknown[]) {
        const client = ensureSupabaseServiceRole()
        // Se o proxy for chamado como função, retornar o cliente
        return client
      }
    })
  : ({} as SupabaseClientType) // No cliente, retornar objeto vazio (não deve ser usado)

export function getSupabaseAdmin(): SupabaseClientType {
  // ✅ CORREÇÃO: Verificar se está no servidor
  if (typeof window !== 'undefined') {
    throw new Error('getSupabaseAdmin não pode ser usado no cliente. Use apenas no servidor.')
  }
  return ensureSupabaseServiceRole()
}
