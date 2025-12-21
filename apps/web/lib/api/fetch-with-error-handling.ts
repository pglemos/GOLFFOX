import { notifyError, notifySuccess } from "@/lib/toast"
import type { AsyncResult } from "@/lib/types/api"

export interface FetchErrorHandlingOptions<T = unknown> {
    successMessage?: string
    errorMessages?: Record<number, string>
    showSuccessToast?: boolean
    showErrorToast?: boolean
    onSuccess?: (data: T) => void
    onError?: (error: Error) => void
}

/**
 * Função utilitária para fazer fetch com tratamento padronizado de erros
 * 
 * @example
 * const result = await fetchWithErrorHandling('/api/endpoint', {
 *   method: 'POST',
 *   body: JSON.stringify(data),
 *   errorMessages: {
 *     401: 'Sessão expirada. Por favor, faça login novamente.',
 *     403: 'Você não tem permissão para esta ação.',
 *     404: 'Recurso não encontrado.',
 *   }
 * })
 * 
 * if (result.success) {
 *   console.log(result.data)
 * } else {
 *   console.error(result.error)
 * }
 */
export async function fetchWithErrorHandling<T = unknown>(
    url: string,
    init?: RequestInit,
    options: FetchErrorHandlingOptions<T> = {}
): Promise<AsyncResult<T, Error>> {
    const {
        successMessage,
        errorMessages = {},
        showSuccessToast = false,
        showErrorToast = true,
        onSuccess,
        onError,
    } = options

    try {
        const response = await fetch(url, init)

        if (!response.ok) {
            let errorMessage = 'Erro ao processar requisição'
            let errorDetails = ''

            try {
                const errorData = await response.json()
                errorMessage = errorData.error || errorData.message || errorMessage
                errorDetails = errorData.details ? JSON.stringify(errorData.details) : ''
            } catch (parseError) {
                // Se não conseguir fazer parse do JSON, usar mensagem padrão
            }

            // Mensagens específicas por status code
            if (errorMessages[response.status]) {
                errorMessage = errorMessages[response.status]
            } else {
                switch (response.status) {
                    case 401:
                        errorMessage = 'Sessão expirada. Por favor, faça login novamente.'
                        break
                    case 403:
                        errorMessage = 'Você não tem permissão para esta ação. Contacte o administrador.'
                        break
                    case 404:
                        errorMessage = 'Recurso não encontrado.'
                        break
                    case 400:
                        errorMessage = errorDetails ? `Dados inválidos: ${errorDetails}` : errorMessage
                        break
                    case 500:
                        errorMessage = errorDetails 
                            ? `Erro no servidor: ${errorMessage}\n\n${errorDetails}` 
                            : `Erro no servidor: ${errorMessage}`
                        break
                    default:
                        if (errorDetails) {
                            errorMessage = `${errorMessage}\n\nDetalhes: ${errorDetails}`
                        }
                }
            }

            const error = new Error(errorMessage)
            
            if (showErrorToast) {
                notifyError(error, errorMessage)
            }
            
            if (onError) {
                onError(error)
            }

            return { success: false, error }
        }

        const data = await response.json()

        if (showSuccessToast && successMessage) {
            notifySuccess(successMessage)
        }

        if (onSuccess) {
            onSuccess(data)
        }

        return { success: true, data: data as T }
    } catch (error: unknown) {
        const errorObj = error instanceof Error ? error : new Error('Erro desconhecido')
        
        if (showErrorToast) {
            notifyError(errorObj, 'Erro ao processar requisição')
        }
        
        if (onError) {
            onError(errorObj)
        }

        return { success: false, error: errorObj }
    }
}

/**
 * Hook-like função para fazer fetch com estado de loading
 * Útil para componentes que precisam de estado de loading
 */
export async function fetchWithLoading<T>(
    url: string,
    init?: RequestInit,
    options: FetchErrorHandlingOptions<T> = {}
): Promise<AsyncResult<T, Error>> {
    return fetchWithErrorHandling<T>(url, init, options)
}

