"use client"

import { useCallback } from 'react'

import { trackError, type ErrorContext } from '@/lib/error-tracking'
import { logError } from '@/lib/logger'
import { notifyError } from '@/lib/toast'

export interface UseErrorHandlerOptions {
  /** Mostrar toast de erro ao usuário (padrão: true) */
  showToast?: boolean
  /** Mensagem de erro customizada para o toast */
  errorMessage?: string
  /** Contexto adicional para logging */
  context?: ErrorContext
  /** Callback executado quando erro ocorre */
  onError?: (error: Error) => void
  /** Se true, re-lança o erro após tratamento (padrão: false) */
  rethrow?: boolean
}

/**
 * Hook para tratamento centralizado de erros
 * 
 * @example
 * ```tsx
 * const handleError = useErrorHandler({
 *   context: { component: 'MyComponent', action: 'saveData' },
 *   errorMessage: 'Erro ao salvar dados'
 * })
 * 
 * try {
 *   await saveData()
 * } catch (error) {
 *   handleError(error)
 * }
 * ```
 */
export function useErrorHandler(options: UseErrorHandlerOptions = {}) {
  const {
    showToast = true,
    errorMessage,
    context = {},
    onError,
    rethrow = false,
  } = options

  const handleError = useCallback(
    async (error: unknown) => {
      const errorObj = error instanceof Error ? error : new Error(String(error))
      
      // Logging estruturado
      logError('Erro tratado pelo useErrorHandler', {
        error: errorObj.message,
        stack: errorObj.stack,
        ...context
      }, context.component || 'useErrorHandler')

      // Error tracking
      await trackError(errorObj, {
        ...context,
        url: typeof window !== 'undefined' ? window.location.href : undefined,
        timestamp: new Date().toISOString(),
      })

      // Feedback ao usuário
      if (showToast) {
        notifyError(errorObj, errorMessage)
      }

      // Callback customizado
      if (onError) {
        onError(errorObj)
      }

      // Re-lançar se necessário
      if (rethrow) {
        throw errorObj
      }
    },
    [showToast, errorMessage, context, onError, rethrow]
  )

  return handleError
}

/**
 * Wrapper para operações assíncronas com tratamento automático de erro
 * 
 * @example
 * ```tsx
 * const safeOperation = useSafeAsync({
 *   context: { component: 'MyComponent' },
 *   errorMessage: 'Erro ao executar operação'
 * })
 * 
 * const result = await safeOperation(async () => {
 *   return await fetchData()
 * })
 * ```
 */
export function useSafeAsync<T>(
  options: UseErrorHandlerOptions = {}
) {
  const handleError = useErrorHandler(options)

  return useCallback(
    async (operation: () => Promise<T>): Promise<T | null> => {
      try {
        return await operation()
      } catch (error) {
        await handleError(error)
        return null
      }
    },
    [handleError]
  )
}

