/**
 * Tipos compartilhados de autenticação
 */

export interface UserData {
  id: string
  email: string
  role: string
  accessToken: string
  refreshToken?: string
  name?: string
  avatar_url?: string | null
  company_id?: string | null
  transportadora_id?: string | null
  // Usado para sinalizar sincronização concluída
  isSynced?: boolean
}

export interface AuthStorageOptions {
  storage?: 'local' | 'session' | 'both'
  token?: string
  accessToken?: string
  refreshToken?: string
}

