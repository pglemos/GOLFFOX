/**
 * Error Tracking Service
 * 
 * Serviço centralizado para rastreamento de erros.
 * Usa apenas logger estruturado.
 * 
 * Uso:
 * ```typescript
 * import { trackError } from '@/lib/error-tracking'
 * 
 * try {
 *   // código
 * } catch (error) {
 *   trackError(error, { context: 'ComponentName', userId: user.id })
 * }
 * ```
 */

import { logError, debug } from './logger'

export interface ErrorContext {
  userId?: string
  userRole?: string
  url?: string
  component?: string
  action?: string
  [key: string]: unknown
}

/**
 * Rastreia um erro (sempre loga)
 * 
 * @param error Erro a ser rastreado
 * @param context Contexto adicional (userId, component, etc.)
 */
export async function trackError(error: Error | unknown, context: ErrorContext = {}) {
  // Sempre logar
  const errorMessage = error instanceof Error ? error.message : String(error)
  const errorStack = error instanceof Error ? error.stack : undefined
  
  logError('Erro rastreado', {
    error: errorMessage,
    stack: errorStack,
    ...context
  }, context.component || 'ErrorTracking')
}

/**
 * Rastreia uma mensagem (não é erro, mas informação importante)
 */
export async function trackMessage(message: string, level: 'info' | 'warning' | 'error' = 'info', context: ErrorContext = {}) {
  debug('Mensagem rastreada', { message, level, ...context }, context.component || 'ErrorTracking')
}

/**
 * Define contexto do usuário (apenas para compatibilidade, não faz nada)
 */
export async function setUserContext(userId: string, userRole?: string, email?: string) {
  // Apenas para compatibilidade - não faz nada
  debug('Contexto de usuário definido', { userId, userRole, email: email?.replace(/^(.{2}).+(@.*)$/, '$1***$2') }, 'ErrorTracking')
}

/**
 * Limpa contexto do usuário (logout) - apenas para compatibilidade
 */
export async function clearUserContext() {
  // Apenas para compatibilidade - não faz nada
  debug('Contexto de usuário limpo', {}, 'ErrorTracking')
}
