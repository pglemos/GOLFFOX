/**
 * Utilitários de autenticação
 * Funções auxiliares para roles, redirects e validações
 */

import { warn } from '@/lib/logger'
import type { UserData } from './types'

/**
 * Verifica se o usuário tem a role necessária
 * Atualizado em 2025-01-29: suporta novos roles (gestor_empresa, gestor_transportadora)
 * e mantém compatibilidade temporária com roles antigas
 */
export function hasRole(user: UserData | null, requiredRole: string): boolean {
  if (!user) return false

  if (requiredRole === 'admin') {
    return user.role === 'admin'
  }
  // gestor_empresa = Gestor da Empresa Contratante
  if (requiredRole === 'gestor_empresa' || requiredRole === 'empresa') {
    return ['admin', 'gestor_empresa', 'empresa'].includes(user.role)
  }
  // gestor_transportadora = Gestor da Transportadora
  if (requiredRole === 'gestor_transportadora' || requiredRole === 'operador' || requiredRole === 'transportadora') {
    return ['admin', 'gestor_transportadora', 'operador', 'transportadora'].includes(user.role)
  }

  return true
}

/**
 * Obtém a URL de redirecionamento baseada na role do usuário
 * Atualizado em 2025-01-29: suporta novos roles
 */
export function getRedirectUrl(role: string): string | null {
  switch (role) {
    case 'admin':
      return '/admin'
    // Novos roles
    case 'gestor_empresa':
      return '/empresa'
    case 'gestor_transportadora':
      return '/transportadora'
    case 'motorista':
    case 'passageiro':
      // Motorista e Passageiro devem usar app mobile, não painéis web
      return null
    // Compatibilidade temporária com roles antigas (remover após período de transição)
    case 'empresa':
      return '/empresa'
    case 'operador':
    case 'transportadora':
      return '/transportadora'
    default:
      // Fallback para empresa se role não for reconhecido
      warn(`Role não reconhecido, redirecionando para /empresa`, { role }, 'AuthUtils')
      return '/empresa'
  }
}

