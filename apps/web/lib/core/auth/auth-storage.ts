/**
 * Gerenciamento de armazenamento de autenticação
 * Responsável por persistir e recuperar dados de autenticação do cliente
 */

import { error } from '@/lib/logger'
import type { UserData, AuthStorageOptions } from './types'

const STORAGE_KEY = 'golffox-auth'

/**
 * Armazena dados do usuário no storage do navegador
 */
export function storeUserData(
  userData: UserData,
  options: AuthStorageOptions = {}
): void {
  if (typeof window === 'undefined') return

  const storageMode = options.storage ?? 'both'

  // ✅ Armazenar apenas dados não sensíveis no localStorage/sessionStorage
  // access_token NÃO é armazenado no cliente por segurança
  const safePayloadObj = {
    id: userData.id,
    email: userData.email,
    role: userData.role,
    name: userData.name || userData.email.split('@')[0],
    avatar_url: userData.avatar_url || null
    // access_token removido - nunca armazenar no cliente
  }
  const safePayload = JSON.stringify(safePayloadObj)

  try {
    if (storageMode === 'local' || storageMode === 'both') {
      localStorage.setItem(STORAGE_KEY, safePayload)
    }
    if (storageMode === 'session' || storageMode === 'both') {
      sessionStorage.setItem(STORAGE_KEY, safePayload)
    }
  } catch (storageErr) {
    error('[AuthStorage] Falha ao persistir sessão no storage', { error: storageErr })
  }
}

/**
 * Recupera dados do usuário do storage
 */
export function getStoredUser(): UserData | null {
  if (typeof window === 'undefined') return null

  try {
    const stored = localStorage.getItem(STORAGE_KEY) || sessionStorage.getItem(STORAGE_KEY)
    return stored ? JSON.parse(stored) : null
  } catch {
    return null
  }
}

/**
 * Remove dados do usuário do storage
 */
export function clearStoredUser(): void {
  if (typeof window === 'undefined') return

  try {
    localStorage.removeItem(STORAGE_KEY)
    sessionStorage.removeItem(STORAGE_KEY)
    sessionStorage.removeItem('golffox-auth-token')
  } catch (err) {
    error('[AuthStorage] Erro ao limpar storage', { error: err })
  }
}

/**
 * Extrai dados do usuário de um cookie (para middleware server-side)
 */
export function extractUserFromCookie(cookieValue: string): UserData | null {
  try {
    const decoded = atob(cookieValue) // Base64 decode
    return JSON.parse(decoded)
  } catch {
    return null
  }
}

