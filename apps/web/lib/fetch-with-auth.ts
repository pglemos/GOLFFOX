/**
 * Helper para fazer requisições fetch com autenticação Supabase
 * Sempre busca o token da sessão do Supabase e inclui no header Authorization
 */

import { supabase } from './supabase'
import { error as logError, warn } from './logger'

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
 */
export async function fetchWithAuth(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
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
  return fetch(url, {
    ...options,
    headers,
    credentials: 'include', // Sempre incluir cookies (para sessão do Supabase)
  })
}

