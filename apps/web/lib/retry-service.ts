/**
 * Retry Service - Serviço de retry com backoff exponencial
 * 
 * Implementa retry automático para operações que podem falhar temporariamente
 * (ex: chamadas de API, operações de banco, etc.)
 */

import { logError, debug, warn } from './logger'

export interface RetryOptions {
  maxRetries?: number
  initialDelay?: number
  maxDelay?: number
  backoffMultiplier?: number
  retryableErrors?: string[]
  onRetry?: (attempt: number, error: Error) => void
}

export interface RetryResult<T> {
  success: boolean
  data?: T
  error?: Error
  attempts: number
}

const DEFAULT_OPTIONS: Required<Omit<RetryOptions, 'onRetry'>> = {
  maxRetries: 3,
  initialDelay: 1000, // 1 segundo
  maxDelay: 10000, // 10 segundos
  backoffMultiplier: 2,
  retryableErrors: ['ECONNRESET', 'ETIMEDOUT', 'ENOTFOUND', 'ECONNREFUSED'],
}

/**
 * Calcula delay para próxima tentativa usando backoff exponencial
 */
function calculateDelay(attempt: number, options: Required<Omit<RetryOptions, 'onRetry'>>): number {
  const delay = options.initialDelay * Math.pow(options.backoffMultiplier, attempt - 1)
  return Math.min(delay, options.maxDelay)
}

/**
 * Verifica se um erro é retryable
 */
function isRetryableError(error: Error, retryableErrors: string[]): boolean {
  const errorMessage = error.message.toLowerCase()
  const errorName = error.name.toLowerCase()
  
  return retryableErrors.some(retryableError => 
    errorMessage.includes(retryableError.toLowerCase()) ||
    errorName.includes(retryableError.toLowerCase()) ||
    (error as any).code === retryableError
  )
}

/**
 * Executa uma operação com retry automático
 * 
 * @param operation Função assíncrona a ser executada
 * @param options Opções de retry
 * @returns Resultado da operação ou erro após todas as tentativas
 * 
 * @example
 * ```typescript
 * const result = await retry(
 *   async () => await fetch('/api/data'),
 *   { maxRetries: 3, initialDelay: 1000 }
 * )
 * 
 * if (result.success) {
 *   console.log(result.data)
 * } else {
 *   console.error(result.error)
 * }
 * ```
 */
export async function retry<T>(
  operation: () => Promise<T>,
  options: RetryOptions = {}
): Promise<RetryResult<T>> {
  const opts: Required<Omit<RetryOptions, 'onRetry'>> = {
    ...DEFAULT_OPTIONS,
    ...options,
    retryableErrors: options.retryableErrors || DEFAULT_OPTIONS.retryableErrors,
  }

  let lastError: Error | undefined
  let attempts = 0

  for (let attempt = 1; attempt <= opts.maxRetries; attempt++) {
    attempts = attempt

    try {
      const data = await operation()
      
      if (attempt > 1) {
        debug('Operação bem-sucedida após retry', { attempts: attempt }, 'RetryService')
      }
      
      return {
        success: true,
        data,
        attempts,
      }
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error))
      
      // Se não é retryable, falhar imediatamente
      if (!isRetryableError(lastError, opts.retryableErrors)) {
        logError('Erro não retryable', { 
          error: lastError.message, 
          attempts: attempt 
        }, 'RetryService')
        return {
          success: false,
          error: lastError,
          attempts,
        }
      }

      // Se é a última tentativa, retornar erro
      if (attempt >= opts.maxRetries) {
        logError('Todas as tentativas de retry falharam', {
          error: lastError.message,
          attempts: attempt,
          maxRetries: opts.maxRetries
        }, 'RetryService')
        return {
          success: false,
          error: lastError,
          attempts,
        }
      }

      // Callback de retry (se fornecido)
      if (options.onRetry) {
        options.onRetry(attempt, lastError)
      }

      // Calcular delay e aguardar
      const delay = calculateDelay(attempt, opts)
      warn('Tentativa falhou, aguardando antes de retry', {
        attempt,
        maxRetries: opts.maxRetries,
        delay,
        error: lastError.message
      }, 'RetryService')

      await new Promise(resolve => setTimeout(resolve, delay))
    }
  }

  // Não deveria chegar aqui, mas TypeScript exige
  return {
    success: false,
    error: lastError || new Error('Erro desconhecido'),
    attempts,
  }
}

/**
 * Wrapper para operações que devem ter retry automático
 * 
 * @example
 * ```typescript
 * const fetchWithRetry = withRetry(
 *   async (url: string) => await fetch(url).then(r => r.json()),
 *   { maxRetries: 3 }
 * )
 * 
 * const data = await fetchWithRetry('/api/data')
 * ```
 */
export function withRetry<T extends (...args: any[]) => Promise<any>>(
  operation: T,
  options: RetryOptions = {}
): T {
  return (async (...args: Parameters<T>) => {
    const result = await retry(() => operation(...args), options)
    if (!result.success) {
      throw result.error
    }
    return result.data
  }) as T
}
