/**
 * Helper para fazer requisições fetch com autenticação Supabase
 * Sempre busca o token da sessão do Supabase e inclui no header Authorization
 */

import { error as logError, warn } from './logger'
import { supabase } from './supabase'

/**
 * Obtém o token de acesso da sessão do Supabase
 */
export async function getAuthToken(): Promise<string | null> {
  try {
    const { data: { session }, error } = await supabase.auth.getSession()
    
    if (error) {
      logError('Erro ao obter sessão do Supabase', { error }, 'FetchWithAuth')
      return null
    }
    
    if (!session?.access_token) {
      warn('Nenhuma sessão ativa do Supabase', {}, 'FetchWithAuth')
      return null
    }
    
    return session.access_token
  } catch (err) {
    logError('Erro ao obter token de autenticação', { error: err }, 'FetchWithAuth')
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

