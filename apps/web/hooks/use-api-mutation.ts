/**
 * Hook useApiMutation
 * 
 * Padroniza chamadas de API com:
 * - Estado de loading automático
 * - Tratamento de erros centralizado
 * - Notificações de sucesso/erro
 * - Suporte a retry
 * - Tipagem forte
 */

import { useState, useCallback, useRef } from 'react'

import { formatError } from '@/lib/error-utils'
import { debug, error as logError } from '@/lib/logger'
import { notifySuccess, notifyError } from '@/lib/toast'
import type { ApiResponse } from '@/types/entities'

/**
 * Opções de configuração para a mutação
 */
export interface MutationOptions<TData, TVariables> {
  /** URL da API (ou função que retorna URL baseada nas variáveis) */
  url: string | ((variables: TVariables) => string)
  
  /** Método HTTP (default: POST) */
  method?: 'POST' | 'PUT' | 'PATCH' | 'DELETE'
  
  /** Headers adicionais */
  headers?: Record<string, string>
  
  /** Callback de sucesso */
  onSuccess?: (data: TData, variables: TVariables) => void | Promise<void>
  
  /** Callback de erro */
  onError?: (error: Error, variables: TVariables) => void
  
  /** Mostrar notificação de sucesso */
  showSuccessToast?: boolean
  
  /** Mensagem de sucesso customizada */
  successMessage?: string
  
  /** Chave i18n para mensagem de sucesso */
  successI18nKey?: { ns: string; key: string }
  
  /** Mostrar notificação de erro (default: true) */
  showErrorToast?: boolean
  
  /** Mensagem de erro customizada */
  errorMessage?: string
  
  /** Timeout em ms (default: 30000) */
  timeout?: number
  
  /** Número de tentativas de retry (default: 0) */
  retryCount?: number
  
  /** Delay entre retries em ms (default: 1000) */
  retryDelay?: number
  
  /** Incluir credentials (default: true) */
  credentials?: RequestCredentials
}

/**
 * Estado retornado pelo hook
 */
export interface MutationState<TData> {
  /** Dados retornados pela API */
  data: TData | null
  
  /** Erro da última execução */
  error: Error | null
  
  /** Se está executando */
  loading: boolean
  
  /** Se já foi executado pelo menos uma vez */
  isExecuted: boolean
  
  /** Se a última execução foi bem-sucedida */
  isSuccess: boolean
  
  /** Se a última execução falhou */
  isError: boolean
}

/**
 * Retorno do hook
 */
export interface UseMutationReturn<TData, TVariables> extends MutationState<TData> {
  /** Executar a mutação */
  mutate: (variables: TVariables) => Promise<TData | null>
  
  /** Executar a mutação (async) */
  mutateAsync: (variables: TVariables) => Promise<TData>
  
  /** Resetar estado */
  reset: () => void
}

/**
 * Delay com Promise
 */
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

/**
 * Hook para mutações de API padronizadas
 */
export function useApiMutation<TData = unknown, TVariables = unknown>(
  options: MutationOptions<TData, TVariables>
): UseMutationReturn<TData, TVariables> {
  const {
    url,
    method = 'POST',
    headers: customHeaders = {},
    onSuccess,
    onError,
    showSuccessToast = false,
    successMessage,
    successI18nKey,
    showErrorToast = true,
    errorMessage,
    timeout = 30000,
    retryCount = 0,
    retryDelay = 1000,
    credentials = 'include',
  } = options

  const [state, setState] = useState<MutationState<TData>>({
    data: null,
    error: null,
    loading: false,
    isExecuted: false,
    isSuccess: false,
    isError: false,
  })

  const abortControllerRef = useRef<AbortController | null>(null)

  /**
   * Resetar estado
   */
  const reset = useCallback(() => {
    // Cancelar requisição em andamento
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
    
    setState({
      data: null,
      error: null,
      loading: false,
      isExecuted: false,
      isSuccess: false,
      isError: false,
    })
  }, [])

  /**
   * Executar requisição com retry
   */
  const executeWithRetry = async (
    finalUrl: string,
    body: string,
    headers: Record<string, string>,
    signal: AbortSignal,
    attempt: number = 0
  ): Promise<Response> => {
    try {
      const response = await fetch(finalUrl, {
        method,
        headers,
        body: method !== 'DELETE' ? body : undefined,
        signal,
        credentials,
      })

      // Retry em caso de erro 5xx
      if (response.status >= 500 && attempt < retryCount) {
        debug(`Retrying request (attempt ${attempt + 1}/${retryCount})`, { url: finalUrl }, 'useApiMutation')
        await delay(retryDelay * (attempt + 1)) // Exponential backoff simples
        return executeWithRetry(finalUrl, body, headers, signal, attempt + 1)
      }

      return response
    } catch (error) {
      // Retry em caso de erro de rede
      if (attempt < retryCount && !(error instanceof DOMException && error.name === 'AbortError')) {
        debug(`Retrying request after network error (attempt ${attempt + 1}/${retryCount})`, { url: finalUrl }, 'useApiMutation')
        await delay(retryDelay * (attempt + 1))
        return executeWithRetry(finalUrl, body, headers, signal, attempt + 1)
      }
      throw error
    }
  }

  /**
   * Executar mutação (retorna null em caso de erro)
   */
  const mutate = useCallback(async (variables: TVariables): Promise<TData | null> => {
    try {
      return await mutateAsync(variables)
    } catch {
      return null
    }
  }, [])

  /**
   * Executar mutação (throws em caso de erro)
   */
  const mutateAsync = useCallback(async (variables: TVariables): Promise<TData> => {
    // Cancelar requisição anterior se existir
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }

    // Criar novo AbortController
    const abortController = new AbortController()
    abortControllerRef.current = abortController

    // Timeout
    const timeoutId = setTimeout(() => abortController.abort(), timeout)

    setState(prev => ({
      ...prev,
      loading: true,
      error: null,
      isError: false,
    }))

    try {
      // Resolver URL
      const finalUrl = typeof url === 'function' ? url(variables) : url

      // Preparar headers
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...customHeaders,
      }

      // Preparar body
      const body = JSON.stringify(variables)

      debug(`Executing ${method} ${finalUrl}`, { variables }, 'useApiMutation')

      // Executar requisição
      const response = await executeWithRetry(
        finalUrl,
        body,
        headers,
        abortController.signal
      )

      clearTimeout(timeoutId)

      // Parse response
      const responseData = await response.json() as ApiResponse<TData>

      if (!response.ok) {
        const errorMsg = responseData.error || responseData.message || `HTTP ${response.status}`
        throw new Error(errorMsg)
      }

      // Extrair dados (suporte a { success: true, data: ... } ou resposta direta)
      const data = responseData.data !== undefined ? responseData.data : responseData as unknown as TData

      setState({
        data,
        error: null,
        loading: false,
        isExecuted: true,
        isSuccess: true,
        isError: false,
      })

      // Notificação de sucesso
      if (showSuccessToast) {
        if (successI18nKey) {
          notifySuccess('', { i18n: successI18nKey })
        } else {
          notifySuccess(successMessage || 'Operação realizada com sucesso')
        }
      }

      // Callback de sucesso
      if (onSuccess) {
        await onSuccess(data, variables)
      }

      return data
    } catch (error) {
      clearTimeout(timeoutId)

      const err = error instanceof Error ? error : new Error(String(error))

      // Ignorar erros de abort (timeout ou cancelamento manual)
      if (err.name === 'AbortError') {
        setState(prev => ({
          ...prev,
          loading: false,
        }))
        throw new Error('Requisição cancelada ou timeout')
      }

      logError('API mutation failed', { error: err.message, url }, 'useApiMutation')

      setState({
        data: null,
        error: err,
        loading: false,
        isExecuted: true,
        isSuccess: false,
        isError: true,
      })

      // Notificação de erro
      if (showErrorToast) {
        notifyError(formatError(err, errorMessage || 'Erro na operação'))
      }

      // Callback de erro
      if (onError) {
        onError(err, variables)
      }

      throw err
    }
  }, [url, method, customHeaders, onSuccess, onError, showSuccessToast, successMessage, successI18nKey, showErrorToast, errorMessage, timeout, retryCount, retryDelay, credentials])

  return {
    ...state,
    mutate,
    mutateAsync,
    reset,
  }
}

/**
 * Versão simplificada para mutações simples
 */
export function useSimpleMutation<TData = unknown>(
  url: string,
  options?: Partial<MutationOptions<TData, Record<string, unknown>>>
) {
  return useApiMutation<TData, Record<string, unknown>>({
    url,
    ...options,
  })
}

/**
 * Hook para DELETE requests
 */
export function useDeleteMutation<TData = { success: boolean }>(
  urlOrBuilder: string | ((id: string) => string),
  options?: Partial<Omit<MutationOptions<TData, { id: string }>, 'url' | 'method'>>
) {
  return useApiMutation<TData, { id: string }>({
    url: typeof urlOrBuilder === 'string' 
      ? (vars) => `${urlOrBuilder}?id=${vars.id}`
      : (vars) => urlOrBuilder(vars.id),
    method: 'DELETE',
    showSuccessToast: true,
    successMessage: 'Item excluído com sucesso',
    ...options,
  })
}

export default useApiMutation

