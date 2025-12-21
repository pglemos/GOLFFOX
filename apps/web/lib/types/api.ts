/**
 * Tipos utilitários para APIs
 * 
 * Tipos genéricos para respostas de API e operações assíncronas
 */

/**
 * Resposta genérica de API
 */
export interface ApiResponse<T = unknown> {
  data?: T
  error?: string
  message?: string
  statusCode?: number
}

/**
 * Resultado de operação assíncrona
 */
export type AsyncResult<T, E = Error> = 
  | { success: true; data: T }
  | { success: false; error: E }

/**
 * Resposta paginada
 */
export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

/**
 * Parâmetros de paginação
 */
export interface PaginationParams {
  page?: number
  pageSize?: number
}

/**
 * Filtros genéricos para APIs
 */
export interface ApiFilters {
  search?: string
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
  [key: string]: unknown
}

