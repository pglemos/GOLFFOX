/**
 * API Response Helpers
 * Padroniza respostas de API para consistência
 */

import { NextResponse } from 'next/server'
import { ZodError } from 'zod'

import { formatError } from './error-utils'

export interface ApiResponse<T = unknown> {
  success: boolean
  data?: T
  error?: string
  message?: string
  count?: number
  limit?: number
  offset?: number
}

/**
 * Resposta de sucesso
 */
export function successResponse<T>(
  data: T,
  status: number = 200,
  options?: {
    message?: string
    count?: number
    limit?: number
    offset?: number
  }
): NextResponse<ApiResponse<T>> {
  const response: ApiResponse<T> = {
    success: true,
    data,
    ...options
  }

  return NextResponse.json(response, { status })
}

/**
 * Resposta de erro
 */
export function errorResponse(
  error: unknown,
  status: number = 500,
  defaultMessage: string = 'Erro ao processar requisição'
): NextResponse<ApiResponse> {
  const errorMessage = formatError(error, defaultMessage)

  const response: ApiResponse = {
    success: false,
    error: errorMessage,
    message: errorMessage
  }

  return NextResponse.json(response, { status })
}


/**
 * Resposta de validação (400)
 */
export function validationErrorResponse(
  messageOrError: string | ZodError,
  details?: Record<string, unknown>
): NextResponse<ApiResponse> {
  let message: string
  let errorDetails: Record<string, unknown> | undefined = details

  if (messageOrError instanceof ZodError) {
    // Extrair mensagens de erro do ZodError
    const issues = messageOrError.errors.map(e => `${e.path.join('.')}: ${e.message}`).join('; ')
    message = issues || 'Erro de validação'
    errorDetails = { ...details, zodErrors: messageOrError.errors }
  } else {
    message = messageOrError
  }

  const response: ApiResponse = {
    success: false,
    error: 'Erro de validação',
    message,
    ...errorDetails
  }

  return NextResponse.json(response, { status: 400 })
}

/**
 * Resposta não autorizada (401)
 */
export function unauthorizedResponse(message: string = 'Não autorizado'): NextResponse<ApiResponse> {
  const response: ApiResponse = {
    success: false,
    error: 'Unauthorized',
    message
  }

  return NextResponse.json(response, { status: 401 })
}

/**
 * Resposta de acesso negado (403)
 */
export function forbiddenResponse(message: string = 'Acesso negado'): NextResponse<ApiResponse> {
  const response: ApiResponse = {
    success: false,
    error: 'Forbidden',
    message
  }

  return NextResponse.json(response, { status: 403 })
}

/**
 * Resposta não encontrado (404)
 */
export function notFoundResponse(message: string = 'Recurso não encontrado'): NextResponse<ApiResponse> {
  const response: ApiResponse = {
    success: false,
    error: 'Not Found',
    message
  }

  return NextResponse.json(response, { status: 404 })
}

