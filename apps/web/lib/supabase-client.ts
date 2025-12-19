/**
 * Helper para obter cliente Supabase apropriado baseado no contexto
 * 
 * Prefere usar cliente anon + RLS ao invés de service-role quando possível
 * Centraliza acesso ao banco seguindo princípios de segurança
 */

import { NextRequest } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { supabaseServiceRole } from './supabase-server'
import type { AuthenticatedUser } from './api-auth'
import { validateAuth } from './api-auth'

/**
 * Obtém cliente Supabase com contexto do usuário autenticado
 * Usa RLS quando possível, service-role apenas quando necessário
 */
export async function getSupabaseClient(
  request: NextRequest,
  options?: {
    /**
     * Se true, força uso de service-role (bypass RLS)
     * Use apenas para operações administrativas críticas
     */
    forceServiceRole?: boolean
  }
): Promise<ReturnType<typeof createClient>> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl) {
    throw new Error('NEXT_PUBLIC_SUPABASE_URL não configurado')
  }

  // Forçar service-role se especificado (operações administrativas)
  if (options?.forceServiceRole) {
    if (!serviceKey) {
      throw new Error('SUPABASE_SERVICE_ROLE_KEY não configurado')
    }
    return createClient(supabaseUrl, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    })
  }

  // Tentar obter usuário autenticado para usar RLS
  const user = await validateAuth(request)

  if (!user) {
    // Sem usuário autenticado - usar anon key (RLS aplicado)
    if (!supabaseAnonKey) {
      throw new Error('NEXT_PUBLIC_SUPABASE_ANON_KEY não configurado')
    }
    return createClient(supabaseUrl, supabaseAnonKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    })
  }

  // Com usuário autenticado - obter access token do request
  // Isso permite que RLS funcione corretamente com o contexto do usuário
  const authHeader = request.headers.get('authorization')
  const accessToken = authHeader?.startsWith('Bearer ') 
    ? authHeader.substring(7)
    : null

  if (accessToken) {
    // Usar token do usuário - RLS será aplicado baseado no usuário
    return createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
        global: {
          headers: {
            Authorization: `Bearer ${accessToken}`
          }
        }
      }
    })
  }

  // Fallback: anon key (RLS ainda será aplicado, mas sem contexto do usuário)
  if (!supabaseAnonKey) {
    throw new Error('NEXT_PUBLIC_SUPABASE_ANON_KEY não configurado')
  }
  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: { autoRefreshToken: false, persistSession: false }
  })
}

/**
 * Obtém cliente Supabase com service-role (bypass RLS)
 * Use apenas quando absolutamente necessário (operações administrativas)
 */
export function getSupabaseAdmin(): ReturnType<typeof createClient> {
  return supabaseServiceRole
}
