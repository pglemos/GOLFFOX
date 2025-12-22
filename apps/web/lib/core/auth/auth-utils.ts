/**
 * Utilitários de autenticação
 * Funções auxiliares para roles, redirects e validações
 */

import { warn } from '@/lib/logger'
import type { UserData } from './types'

/**
 * Verifica se o usuário tem a role necessária
 */
export function hasRole(user: UserData | null, requiredRole: string): boolean {
  if (!user) return false

  if (requiredRole === 'admin') {
    return user.role === 'admin'
  }
  // empresa = usuários da empresa contratante (antigo operador)
  if (requiredRole === 'empresa') {
    return ['admin', 'empresa'].includes(user.role)
  }
  // operador = gestor da transportadora (antigo transportadora)
  if (requiredRole === 'operador' || requiredRole === 'transportadora') {
    return ['admin', 'operador'].includes(user.role)
  }

  return true
}

/**
 * Obtém a URL de redirecionamento baseada na role do usuário
 */
export function getRedirectUrl(role: string): string | null {
  switch (role) {
    case 'admin':
      return '/admin'
    // Novas roles PT-BR
    case 'empresa':
      return '/empresa'
    case 'operador':
      return '/transportadora'
    case 'motorista':
    case 'passageiro':
      // Motorista e Passageiro devem usar app mobile, não painéis web
      return null
    // Compatibilidade com roles antigas (inglês) - Temporário durante migração
    case 'transportadora':
      return '/transportadora'
    default:
      // Fallback para empresa se role não for reconhecido
      warn(`Role não reconhecido, redirecionando para /empresa`, { role }, 'AuthUtils')
      return '/empresa'
  }
}

