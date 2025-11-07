import { createClient } from '@supabase/supabase-js'

// Inicialização lazy para evitar falhas de build quando variáveis de ambiente não estão definidas.
// Mantém API compatível: os módulos importam `supabaseServiceRole` e usam normalmente.
let _supabaseServiceRole: any | null = null

function ensureSupabaseServiceRole() {
  if (_supabaseServiceRole) return _supabaseServiceRole
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE
  if (!url || !key) {
    throw new Error('Supabase service role não configurado: defina NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY')
  }
  _supabaseServiceRole = createClient(url, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
  return _supabaseServiceRole
}

// Proxy para adiar criação até primeiro uso
export const supabaseServiceRole: any = new Proxy({}, {
  get(_target, prop) {
    const client = ensureSupabaseServiceRole()
    // @ts-ignore dinâmico
    return client[prop as keyof typeof client]
  },
  apply(_target, thisArg, argArray) {
    const client = ensureSupabaseServiceRole()
    // @ts-ignore dinâmico
    return client.apply(thisArg, argArray)
  }
})
