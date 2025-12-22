/**
 * Módulo de autenticação
 * Exporta todas as funcionalidades de autenticação de forma centralizada
 */

export { AuthManager } from './auth-manager'
export { persistSession } from './auth-session'
export { getStoredUser, clearStoredUser, storeUserData, extractUserFromCookie } from './auth-storage'
export { hasRole, getRedirectUrl } from './auth-utils'
export type { UserData, AuthStorageOptions } from './types'

