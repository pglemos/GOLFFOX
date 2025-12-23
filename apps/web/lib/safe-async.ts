/**
 * Safe Async Utilities
 * 
 * Utilitários para executar operações assíncronas de forma segura
 * com timeout, retry automático e tratamento de erros
 */

import { trackError, type ErrorContext } from './error-tracking'
import { logError } from './logger'
import { retry, type RetryOptions, type RetryResult } from './retry-service'

export interface SafeAsyncOptions<T> extends RetryOptions {
  /** Timeout em milissegundos (padrão: 30000 = 30s) */
  timeout?: number
  /** Contexto para logging e tracking */
  context?: ErrorContext
  /** Se true, re-lança o erro após tratamento (padrão: false) */
  rethrow?: boolean
  /** Mensagem de erro customizada */
  errorMessage?: string
}

/**
 * Executa uma operação assíncrona de forma segura com timeout e retry
 * 
 * @example
 * ```typescript
 * const result = await safeAsync(
 *   async () => await fetch('/api/data').then(r => r.json()),
 *   { timeout: 10000, maxRetries: 3 }
 * )
 * 
 * if (result.success) {
 *   console.log(result.data)
 * } else {
 *   console.error(result.error)
 * }
 * ```
 */
export async function safeAsync<T>(
  operation: () => Promise<T>,
  options: SafeAsyncOptions<T> = {}
): Promise<RetryResult<T>> {
  const {
    timeout = 30000,
    context = {},
    rethrow = false,
    errorMessage,
    ...retryOptions
  } = options

  // Wrapper com timeout
  const operationWithTimeout = async (): Promise<T> => {
    return new Promise<T>((resolve, reject) => {
      const timer = setTimeout(() => {
        const timeoutError = new Error(errorMessage || `Operação excedeu timeout de ${timeout}ms`)
        timeoutError.name = 'TimeoutError'
        reject(timeoutError)
      }, timeout)

      operation()
        .then((result) => {
          clearTimeout(timer)
          resolve(result)
        })
        .catch((error) => {
          clearTimeout(timer)
          reject(error)
        })
    })
  }

  try {
    const result = await retry(operationWithTimeout, retryOptions)

    if (!result.success && result.error) {
      // Logging e tracking de erro
      logError('Operação assíncrona falhou', {
        error: result.error.message,
        stack: result.error.stack,
        attempts: result.attempts,
        ...context
      }, context.component || 'SafeAsync')

      await trackError(result.error, {
        ...context,
        attempts: result.attempts,
        timeout,
      })

      if (rethrow) {
        throw result.error
      }
    }

    return result
  } catch (error: unknown) {
    const errorObj = error instanceof Error ? error : new Error(String(error))
    
    logError('Erro inesperado em safeAsync', {
      error: errorObj.message,
      stack: errorObj.stack,
      ...context
    }, context.component || 'SafeAsync')

    await trackError(errorObj, context)

    if (rethrow) {
      throw errorObj
    }

    return {
      success: false,
      error: errorObj,
      attempts: 1,
    }
  }
}

/**
 * Executa uma operação assíncrona e retorna null em caso de erro
 * Útil quando você quer continuar mesmo se a operação falhar
 * 
 * @example
 * ```typescript
 * const data = await safeAsyncOrNull(
 *   async () => await fetch('/api/data').then(r => r.json())
 * )
 * 
 * if (data) {
 *   console.log('Dados carregados:', data)
 * } else {
 *   console.log('Falha ao carregar dados (não crítico)')
 * }
 * ```
 */
export async function safeAsyncOrNull<T>(
  operation: () => Promise<T>,
  options: SafeAsyncOptions<T> = {}
): Promise<T | null> {
  const result = await safeAsync(operation, {
    ...options,
    showToast: false, // Não mostrar toast para operações não críticas
  })

  return result.success ? result.data! : null
}

/**
 * Executa múltiplas operações assíncronas em paralelo de forma segura
 * Retorna apenas as que foram bem-sucedidas
 * 
 * @example
 * ```typescript
 * const results = await safeAsyncAll([
 *   () => fetch('/api/data1').then(r => r.json()),
 *   () => fetch('/api/data2').then(r => r.json()),
 *   () => fetch('/api/data3').then(r => r.json()),
 * ])
 * 
 * console.log(`${results.length} de 3 operações foram bem-sucedidas`)
 * ```
 */
export async function safeAsyncAll<T>(
  operations: Array<() => Promise<T>>,
  options: SafeAsyncOptions<T> = {}
): Promise<T[]> {
  const results = await Promise.allSettled(
    operations.map(op => safeAsync(op, options))
  )

  return results
    .filter((result): result is PromiseFulfilledResult<RetryResult<T>> => 
      result.status === 'fulfilled' && result.value.success
    )
    .map(result => result.value.data!)
}

/**
 * Executa uma operação assíncrona com retry automático e retorna o resultado
 * ou lança exceção se falhar após todas as tentativas
 * 
 * @example
 * ```typescript
 * try {
 *   const data = await safeAsyncOrThrow(
 *     async () => await fetch('/api/data').then(r => r.json()),
 *     { maxRetries: 3 }
 *   )
 *   console.log(data)
 * } catch (error) {
 *   console.error('Falha após todas as tentativas:', error)
 * }
 * ```
 */
export async function safeAsyncOrThrow<T>(
  operation: () => Promise<T>,
  options: SafeAsyncOptions<T> = {}
): Promise<T> {
  const result = await safeAsync(operation, {
    ...options,
    rethrow: true,
  })

  if (!result.success) {
    throw result.error!
  }

  return result.data!
}

