/**
 * Error Tracking Service
 * 
 * Serviço centralizado para rastreamento de erros.
 * Preparado para integração com Sentry, mas funciona sem ele.
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

import { logError, debug, warn } from './logger'

export interface ErrorContext {
  userId?: string
  userRole?: string
  url?: string
  component?: string
  action?: string
  [key: string]: unknown
}

let sentryInitialized = false

/**
 * Inicializa Sentry (se configurado)
 * 
 * Para usar Sentry, instale: npm install @sentry/nextjs
 * E configure NEXT_PUBLIC_SENTRY_DSN no .env.local
 */
async function initSentry() {
  if (sentryInitialized) return

  const sentryDsn = process.env.NEXT_PUBLIC_SENTRY_DSN
  
  if (!sentryDsn) {
    // Sentry não configurado - usar apenas logger
    return
  }

  try {
    // Dynamic import para não quebrar build se Sentry não estiver instalado
    const Sentry = await import('@sentry/nextjs')
    
    Sentry.init({
      dsn: sentryDsn,
      environment: process.env.NODE_ENV || 'development',
      tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
      beforeSend(event: any, hint: any) {
        // Filtrar erros conhecidos/não críticos
        if (event.exception) {
          const error = hint.originalException
          if (error instanceof Error) {
            // Ignorar erros de desenvolvimento conhecidos
            if (error.message.includes('ResizeObserver loop')) {
              return null
            }
          }
        }
        return event
      },
    })
    
    sentryInitialized = true
    debug('Sentry inicializado', { dsn: sentryDsn.substring(0, 20) + '...' }, 'ErrorTracking')
  } catch (error) {
    // Sentry não instalado ou erro na inicialização
    warn('Sentry não disponível, usando apenas logger', { error }, 'ErrorTracking')
  }
}

/**
 * Rastreia um erro (envia para Sentry se configurado, sempre loga)
 * 
 * @param error Erro a ser rastreado
 * @param context Contexto adicional (userId, component, etc.)
 */
export async function trackError(error: Error | unknown, context: ErrorContext = {}) {
  // Sempre logar (mesmo sem Sentry)
  const errorMessage = error instanceof Error ? error.message : String(error)
  const errorStack = error instanceof Error ? error.stack : undefined
  
  logError('Erro rastreado', {
    error: errorMessage,
    stack: errorStack,
    ...context
  }, context.component || 'ErrorTracking')

  // Inicializar Sentry se necessário
  await initSentry()

  // Se Sentry estiver disponível, enviar erro
  if (sentryInitialized && typeof window !== 'undefined') {
    try {
      const Sentry = await import('@sentry/nextjs')
      
      Sentry.captureException(error, {
        tags: {
          component: context.component,
          action: context.action,
        },
        user: context.userId ? {
          id: context.userId,
          role: context.userRole,
        } : undefined,
        extra: {
          url: context.url || (typeof window !== 'undefined' ? window.location.href : 'unknown'),
          ...context,
        },
      })
    } catch (sentryError) {
      // Falha ao enviar para Sentry - já logamos, então continuar
      warn('Falha ao enviar erro para Sentry', { error: sentryError }, 'ErrorTracking')
    }
  }
}

/**
 * Rastreia uma mensagem (não é erro, mas informação importante)
 */
export async function trackMessage(message: string, level: 'info' | 'warning' | 'error' = 'info', context: ErrorContext = {}) {
  debug('Mensagem rastreada', { message, level, ...context }, context.component || 'ErrorTracking')

  await initSentry()

  if (sentryInitialized && typeof window !== 'undefined') {
    try {
      const Sentry = await import('@sentry/nextjs')
      Sentry.captureMessage(message, level)
    } catch {
      // Ignorar se Sentry não disponível
    }
  }
}

/**
 * Define contexto do usuário para Sentry
 */
export async function setUserContext(userId: string, userRole?: string, email?: string) {
  await initSentry()

  if (sentryInitialized && typeof window !== 'undefined') {
    try {
      const Sentry = await import('@sentry/nextjs')
      Sentry.setUser({
        id: userId,
        role: userRole,
        email: email?.replace(/^(.{2}).+(@.*)$/, '$1***$2'), // Mascarar email
      })
    } catch {
      // Ignorar se Sentry não disponível
    }
  }
}

/**
 * Limpa contexto do usuário (logout)
 */
export async function clearUserContext() {
  if (sentryInitialized && typeof window !== 'undefined') {
    try {
      const Sentry = await import('@sentry/nextjs')
      Sentry.setUser(null)
    } catch {
      // Ignorar se Sentry não disponível
    }
  }
}
