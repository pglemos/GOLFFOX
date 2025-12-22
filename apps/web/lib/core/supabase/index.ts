/**
 * Módulo Supabase
 * Exporta todos os clientes e helpers do Supabase
 */

// Cliente principal (client-side)
export { supabase } from './client'
export type { SupabaseClientUnion, RealtimeChannelUnion } from './client'

// Cliente server-side
export { getSupabaseAdmin, supabaseServiceRole } from './server'

// Session helpers
export { ensureSupabaseSession, getAccessTokenFromGolffoxCookie } from './session'

// Client helper
export { getSupabaseClient } from './client-helper'

