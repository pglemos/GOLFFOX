import { createClient, SupabaseClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceRoleKey) {
  throw new Error(
    'Supabase service role não configurado. Verifique NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY no ambiente.'
  )
}

/**
 * Cliente Supabase com service role key para bypass de RLS
 * 
 * ATENÇÃO: Use apenas em API routes do servidor.
 * Nunca exponha a service role key no cliente.
 */
export const supabaseServiceRole: SupabaseClient<Record<string, unknown>> = createClient<Record<string, unknown>>(
  supabaseUrl,
  supabaseServiceRoleKey,
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false
    },
    global: {
      headers: {
        'x-client-info': 'golffox-web-service-role@1.0.0'
      }
    },
    db: {
      schema: 'public'
    }
  }
)

