/**
 * Cache de autenticação para validateAuth
 * 
 * Cache em memória para reduzir chamadas ao Supabase Auth.
 * TTL curto (30-60s) para balancear performance e segurança.
 * 
 * ⚠️ Edge Runtime: Cache em memória é efêmero e compartilhado entre requisições
 * no mesmo worker. Não usar para dados críticos de segurança.
 */

import crypto from 'crypto'

import type { AuthenticatedUser } from './api-auth'

interface CacheEntry {
  user: AuthenticatedUser
  expires: number
}

// Cache em memória (Map é thread-safe no Node.js/Edge Runtime)
const authCache = new Map<string, CacheEntry>()

// TTL padrão: 30 segundos (balance entre performance e segurança)
const DEFAULT_TTL_MS = 30 * 1000

// TTL estendido para desenvolvimento: 60 segundos
const DEV_TTL_MS = 60 * 1000

const isDevelopment = process.env.NODE_ENV === 'development'
const CACHE_TTL = isDevelopment ? DEV_TTL_MS : DEFAULT_TTL_MS

/**
 * Gera hash do token para usar como chave de cache
 */
function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex').substring(0, 16)
}

/**
 * Limpa entradas expiradas do cache
 */
function cleanupExpiredEntries(): void {
  const now = Date.now()
  for (const [key, entry] of authCache.entries()) {
    if (entry.expires < now) {
      authCache.delete(key)
    }
  }
}

/**
 * Obtém usuário autenticado do cache (se válido)
 */
export function getCachedAuth(token: string): AuthenticatedUser | null {
  const tokenHash = hashToken(token)
  const cached = authCache.get(tokenHash)

  if (!cached) {
    return null
  }

  // Verificar se expirou
  if (cached.expires < Date.now()) {
    authCache.delete(tokenHash)
    return null
  }

  return cached.user
}

/**
 * Armazena usuário autenticado no cache
 */
export function setCachedAuth(token: string, user: AuthenticatedUser, ttl?: number): void {
  const tokenHash = hashToken(token)
  const expires = Date.now() + (ttl || CACHE_TTL)

  authCache.set(tokenHash, {
    user,
    expires,
  })

  // Limpar entradas expiradas periodicamente (apenas uma vez a cada 100 chamadas)
  if (authCache.size % 100 === 0) {
    cleanupExpiredEntries()
  }
}

/**
 * Remove entrada do cache (útil em logout)
 */
export function invalidateCachedAuth(token: string): void {
  const tokenHash = hashToken(token)
  authCache.delete(tokenHash)
}

/**
 * Limpa todo o cache (útil em testes ou reset completo)
 */
export function clearAuthCache(): void {
  authCache.clear()
}

/**
 * Obtém estatísticas do cache (útil para debugging)
 */
export function getCacheStats(): { size: number; entries: Array<{ hash: string; expiresAt: number }> } {
  const entries = Array.from(authCache.entries()).map(([hash, entry]) => ({
    hash,
    expiresAt: entry.expires,
  }))

  return {
    size: authCache.size,
    entries,
  }
}
