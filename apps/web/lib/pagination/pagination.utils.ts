/**
 * Pagination Utilities
 * Helpers para trabalhar com paginação
 */

export interface PaginationParams {
  page?: number
  limit?: number
  offset?: number
}

export interface PaginationMeta {
  page: number
  limit: number
  total: number
  totalPages: number
  hasNext: boolean
  hasPrev: boolean
}

/**
 * Normalizar parâmetros de paginação
 */
export function normalizePagination(params: PaginationParams): {
  page: number
  limit: number
  offset: number
} {
  const page = Math.max(1, params.page || 1)
  const limit = Math.min(100, Math.max(1, params.limit || 10))
  const offset = params.offset !== undefined ? params.offset : (page - 1) * limit

  return { page, limit, offset }
}

/**
 * Calcular metadados de paginação
 */
export function calculatePaginationMeta(
  total: number,
  page: number,
  limit: number
): PaginationMeta {
  const totalPages = Math.ceil(total / limit)

  return {
    page,
    limit,
    total,
    totalPages,
    hasNext: page < totalPages,
    hasPrev: page > 1
  }
}

/**
 * Extrair parâmetros de paginação de URLSearchParams
 */
export function extractPaginationFromQuery(searchParams: URLSearchParams): PaginationParams {
  const page = searchParams.get('page') ? parseInt(searchParams.get('page')!) : undefined
  const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : undefined
  const offset = searchParams.get('offset') ? parseInt(searchParams.get('offset')!) : undefined

  return { page, limit, offset }
}

