/**
 * Módulo Supabase
 * Exporta todos os clientes e helpers do Supabase
 */

// Cliente principal (client-side)
export { supabase } from './client'
export type { SupabaseClientUnion, RealtimeChannelUnion } from './client'

// ✅ CORREÇÃO: Não exportar server-side diretamente
// Em vez disso, criar um arquivo separado que só é importado quando necessário
// Isso evita executar código do servidor no cliente durante o build

// Para usar no servidor, importe diretamente:
// import { getSupabaseAdmin, supabaseServiceRole } from '@/lib/core/supabase/server'
//
// Não importe do index.ts no cliente!

// Session helpers
export { ensureSupabaseSession, getAccessTokenFromGolffoxCookie } from './session'

// Client helper
export { getSupabaseClient } from './client-helper'

