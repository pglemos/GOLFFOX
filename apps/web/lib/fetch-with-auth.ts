/**
 * Helper para fazer requisições fetch com autenticação Supabase
 * Sempre busca o token da sessão do Supabase e inclui no header Authorization
 */

import { error as logError, debug } from './logger'
import { supabase, ensureSupabaseSession } from '@/lib/core/supabase'

/**
 * Obtém o token de acesso da sessão do Supabase
 * ✅ SEGURANÇA: Não tenta ler token do cookie customizado
 * Prioriza: 1. Sessão em memória, 2. Bootstrap da sessão do Supabase
 */
export async function getAuthToken(): Promise<string | null> {
  try {
    // 1. Tentar obter sessão atual do Supabase (rápido)
    const { data: { session } } = await supabase.auth.getSession()
    if (session?.access_token) return session.access_token

    // 2. ✅ SEGURANÇA: Não tentar ler token do cookie customizado
    // O access_token foi removido do cookie por segurança
    // O Supabase gerencia sua própria sessão via cookie sb-${projectRef}-auth-token

    // 3. Fallback final: Tentar assegurar bootstrap completo
    const guaranteedSession = await ensureSupabaseSession()
    if (guaranteedSession?.access_token) return guaranteedSession.access_token

    // Se chegamos aqui, o usuário realmente não tem sessão válida
    debug('Nenhuma sessão ativa encontrada (usuário deslogado)', {}, 'FetchWithAuth')
    return null
  } catch (err) {
    logError('Erro crítico ao obter token de autenticação', { error: err }, 'FetchWithAuth')
    return null
  }
}

/**
 * Faz uma requisição fetch com autenticação Supabase
 * Automaticamente inclui o token no header Authorization
 * Retorna erro estruturado ao invés de lançar exceção
 */
export async function fetchWithAuth(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  try {
    // Obter token da sessão do Supabase
    const token = await getAuthToken()

    // Preparar headers
    const headers = new Headers(options.headers)

    // Sempre incluir Content-Type se não estiver definido
    if (!headers.has('Content-Type') && options.body) {
      headers.set('Content-Type', 'application/json')
    }

    // Incluir token de autenticação se disponível
    if (token) {
      headers.set('Authorization', `Bearer ${token}`)
    }

    // Fazer requisição com headers atualizados
    const response = await fetch(url, {
      ...options,
      headers,
      credentials: 'include', // Sempre incluir cookies (para sessão do Supabase)
    })

    return response
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido na requisição'
    logError('Erro ao fazer requisição com autenticação', {
      url,
      error: errorMessage,
      stack: error instanceof Error ? error.stack : undefined
    }, 'FetchWithAuth')

    // Re-lançar o erro para que o chamador possa tratá-lo
    throw error
  }
}

