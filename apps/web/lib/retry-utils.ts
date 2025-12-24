/**
 * Utilitários de Retry com Exponential Backoff
 * 
 * Implementa estratégias de retry robustas para chamadas de rede.
 */

import { debug, error as logError, warn } from './logger'

// ============================================================================
// TIPOS
// ============================================================================

/**
 * Opções de configuração do retry
 */
export interface RetryOptions {
  /** Número máximo de tentativas (incluindo a primeira) */
  maxAttempts?: number
  
  /** Delay inicial em ms (default: 1000) */
  initialDelay?: number
  
  /** Fator de multiplicação do delay a cada tentativa (default: 2) */
  backoffFactor?: number
  
  /** Delay máximo em ms (default: 30000) */
  maxDelay?: number
  
  /** Jitter aleatório para evitar thundering herd (default: true) */
  jitter?: boolean
  
  /** Fator de jitter (0-1, default: 0.1) */
  jitterFactor?: number
  
  /** Função para determinar se deve fazer retry baseado no erro */
  shouldRetry?: (error: Error, attempt: number) => boolean
  
  /** Callback antes de cada retry */
  onRetry?: (error: Error, attempt: number, delay: number) => void
  
  /** Códigos HTTP que devem fazer retry (default: [408, 429, 500, 502, 503, 504]) */
  retryableStatusCodes?: number[]
  
  /** Timeout para cada tentativa em ms (default: 30000) */
  timeout?: number
  
  /** Nome da operação para logs */
  operationName?: string
}

/**
 * Resultado do retry
 */
export interface RetryResult<T> {
  data: T
  attempts: number
  totalTime: number
}

/**
 * Erro de retry com informações adicionais
 */
export class RetryError extends Error {
  public readonly attempts: number
  public readonly lastError: Error
  public readonly totalTime: number

  constructor(message: string, attempts: number, lastError: Error, totalTime: number) {
    super(message)
    this.name = 'RetryError'
    this.attempts = attempts
    this.lastError = lastError
    this.totalTime = totalTime
  }
}

// ============================================================================
// CONSTANTES
// ============================================================================

const DEFAULT_OPTIONS: Required<Omit<RetryOptions, 'onRetry' | 'operationName'>> = {
  maxAttempts: 3,
  initialDelay: 1000,
  backoffFactor: 2,
  maxDelay: 30000,
  jitter: true,
  jitterFactor: 0.1,
  shouldRetry: () => true,
  retryableStatusCodes: [408, 429, 500, 502, 503, 504],
  timeout: 30000,
}

// ============================================================================
// UTILITÁRIOS
// ============================================================================

/**
 * Calcula o delay com exponential backoff e jitter
 */
function calculateDelay(
  attempt: number,
  initialDelay: number,
  backoffFactor: number,
  maxDelay: number,
  jitter: boolean,
  jitterFactor: number
): number {
  // Exponential backoff: initialDelay * (backoffFactor ^ (attempt - 1))
  let delay = Math.min(
    initialDelay * Math.pow(backoffFactor, attempt - 1),
    maxDelay
  )

  // Adicionar jitter para evitar thundering herd
  if (jitter) {
    const jitterAmount = delay * jitterFactor
    delay = delay + (Math.random() * jitterAmount * 2 - jitterAmount)
  }

  return Math.round(delay)
}

/**
 * Aguarda um delay
 */
const wait = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms))

/**
 * Verifica se um erro HTTP é retryable
 */
export function isRetryableHttpError(
  status: number,
  retryableStatusCodes: number[] = DEFAULT_OPTIONS.retryableStatusCodes
): boolean {
  return retryableStatusCodes.includes(status)
}

/**
 * Verifica se um erro de rede é retryable
 */
export function isRetryableNetworkError(error: Error): boolean {
  const message = error.message.toLowerCase()
  const retryableMessages = [
    'network request failed',
    'failed to fetch',
    'network error',
    'timeout',
    'econnreset',
    'econnrefused',
    'enotfound',
    'etimedout',
    'socket hang up',
  ]
  return retryableMessages.some((msg) => message.includes(msg))
}

// ============================================================================
// FUNÇÃO PRINCIPAL
// ============================================================================

/**
 * Executa uma função com retry e exponential backoff
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<RetryResult<T>> {
  const config = { ...DEFAULT_OPTIONS, ...options }
  const {
    maxAttempts,
    initialDelay,
    backoffFactor,
    maxDelay,
    jitter,
    jitterFactor,
    shouldRetry,
    onRetry,
    timeout,
    operationName,
  } = config

  const startTime = Date.now()
  let lastError: Error = new Error('Unknown error')
  let attempt = 0

  while (attempt < maxAttempts) {
    attempt++

    try {
      // Executar com timeout
      const result = await Promise.race([
        fn(),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('Timeout')), timeout)
        ),
      ])

      const totalTime = Date.now() - startTime

      if (attempt > 1) {
        debug(
          `${operationName || 'Operation'} succeeded after ${attempt} attempts`,
          { totalTime },
          'RetryUtils'
        )
      }

      return {
        data: result,
        attempts: attempt,
        totalTime,
      }
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error))

      // Verificar se deve fazer retry
      if (attempt >= maxAttempts || !shouldRetry(lastError, attempt)) {
        break
      }

      // Calcular delay
      const delay = calculateDelay(
        attempt,
        initialDelay,
        backoffFactor,
        maxDelay,
        jitter,
        jitterFactor
      )

      logWarn(
        `${operationName || 'Operation'} failed, retrying in ${delay}ms (attempt ${attempt}/${maxAttempts})`,
        { error: lastError.message },
        'RetryUtils'
      )

      // Callback de retry
      if (onRetry) {
        onRetry(lastError, attempt, delay)
      }

      // Aguardar antes do próximo retry
      await wait(delay)
    }
  }

  const totalTime = Date.now() - startTime

  logError(
    `${operationName || 'Operation'} failed after ${attempt} attempts`,
    { error: lastError.message, totalTime },
    'RetryUtils'
  )

  throw new RetryError(
    `${operationName || 'Operation'} failed after ${attempt} attempts: ${lastError.message}`,
    attempt,
    lastError,
    totalTime
  )
}

// ============================================================================
// FUNÇÕES ESPECIALIZADAS
// ============================================================================

/**
 * Executa fetch com retry
 */
export async function fetchWithRetry(
  url: string,
  init?: RequestInit,
  options?: RetryOptions
): Promise<Response> {
  const fetchFn = async () => {
    const response = await fetch(url, init)

    // Verificar se precisa fazer retry baseado no status
    if (!response.ok) {
      const retryableStatusCodes = options?.retryableStatusCodes || DEFAULT_OPTIONS.retryableStatusCodes
      if (isRetryableHttpError(response.status, retryableStatusCodes)) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }
    }

    return response
  }

  const result = await withRetry(fetchFn, {
    ...options,
    operationName: options?.operationName || `fetch ${url}`,
    shouldRetry: (error, attempt) => {
      // Retry em erros de rede
      if (isRetryableNetworkError(error)) {
        return true
      }

      // Verificar shouldRetry customizado
      if (options?.shouldRetry) {
        return options.shouldRetry(error, attempt)
      }

      return true
    },
  })

  return result.data
}

/**
 * Executa fetch e parse JSON com retry
 */
export async function fetchJsonWithRetry<T>(
  url: string,
  init?: RequestInit,
  options?: RetryOptions
): Promise<T> {
  const response = await fetchWithRetry(url, init, options)
  return response.json() as Promise<T>
}

/**
 * Preset para chamadas de API críticas
 */
export function retryApiCall<T>(
  fn: () => Promise<T>,
  operationName: string
): Promise<RetryResult<T>> {
  return withRetry(fn, {
    maxAttempts: 3,
    initialDelay: 1000,
    backoffFactor: 2,
    operationName,
    onRetry: (error, attempt, delay) => {
      warn(`[${operationName}] Retry ${attempt}: ${error.message}. Next attempt in ${delay}ms`, { operationName, attempt, delay, error: error.message }, 'RetryUtils')
    },
  })
}

/**
 * Preset para conexões realtime (mais agressivo)
 */
export function retryRealtimeConnection<T>(
  fn: () => Promise<T>,
  operationName: string
): Promise<RetryResult<T>> {
  return withRetry(fn, {
    maxAttempts: 5,
    initialDelay: 500,
    backoffFactor: 1.5,
    maxDelay: 10000,
    operationName,
    onRetry: (error, attempt, delay) => {
      warn(`[${operationName}] Reconnection attempt ${attempt}: ${error.message}`, { operationName, attempt, error: error.message }, 'RetryUtils')
    },
  })
}

/**
 * Preset para operações que não devem falhar (mais tentativas)
 */
export function retryWithPersistence<T>(
  fn: () => Promise<T>,
  operationName: string
): Promise<RetryResult<T>> {
  return withRetry(fn, {
    maxAttempts: 10,
    initialDelay: 2000,
    backoffFactor: 1.5,
    maxDelay: 60000,
    jitter: true,
    jitterFactor: 0.2,
    operationName,
    onRetry: (error, attempt, delay) => {
      logWarn(`[${operationName}] Persistent retry ${attempt}: ${error.message}`, {}, 'RetryUtils')
    },
  })
}

export default withRetry

