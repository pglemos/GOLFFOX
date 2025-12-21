/**
 * Tipos de Erro para o sistema
 * 
 * Centraliza tipos de erro para melhor tipagem e tratamento
 */

/**
 * Erro genérico de API
 */
export interface ApiError extends Error {
  statusCode?: number
  code?: string
  details?: unknown
}

/**
 * Erro do Supabase
 */
export interface SupabaseError extends Error {
  code?: string
  details?: string
  hint?: string
  message: string
}

/**
 * Erro de validação
 */
export interface ValidationError extends Error {
  field?: string
  errors?: Array<{ field: string; message: string }>
}

/**
 * Tipo union para diferentes tipos de erro
 */
export type AppError = ApiError | SupabaseError | ValidationError | Error

/**
 * Helper para verificar se é ApiError
 */
export function isApiError(error: unknown): error is ApiError {
  return error instanceof Error && 'statusCode' in error
}

/**
 * Helper para verificar se é SupabaseError
 */
export function isSupabaseError(error: unknown): error is SupabaseError {
  return error instanceof Error && 'code' in error && 'hint' in error
}

/**
 * Helper para verificar se é ValidationError
 */
export function isValidationError(error: unknown): error is ValidationError {
  return error instanceof Error && 'field' in error
}

/**
 * Helper para converter unknown para Error
 */
export function toError(error: unknown): Error {
  if (error instanceof Error) {
    return error
  }
  if (typeof error === 'string') {
    return new Error(error)
  }
  return new Error('Erro desconhecido')
}

