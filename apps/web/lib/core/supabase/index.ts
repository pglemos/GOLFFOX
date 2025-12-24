/**
 * Módulo Supabase
 * Exporta todos os clientes e helpers do Supabase
 */

// Cliente principal (client-side)
export { supabase } from './client'
export type { SupabaseClientUnion, RealtimeChannelUnion } from './client'

// ✅ CORREÇÃO: Exportar getSupabaseAdmin do server para compatibilidade
// Mas apenas quando necessário (server-side)
// Usar re-export direto para evitar problemas de análise estática do Turbopack
export type { SupabaseClient } from '@supabase/supabase-js'
export { getSupabaseAdmin } from './server'

// Session helpers
export { ensureSupabaseSession } from './session'

// Client helper
export { getSupabaseClient } from './client-helper'

