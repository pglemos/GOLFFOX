import { NextRequest } from 'next/server'
import { cookies } from 'next/headers'

export interface MockRequestOptions {
  method?: string
  url?: string
  headers?: Record<string, string>
  body?: any
  cookies?: Record<string, string>
}

/**
 * Cria uma requisição mockada do Next.js para testes
 */
export function createMockRequest(options: MockRequestOptions = {}): NextRequest {
  const {
    method = 'GET',
    url = 'http://localhost:3000/api/test',
    headers = {},
    body,
    cookies: cookieData = {},
  } = options

  const requestHeaders = new Headers()
  Object.entries(headers).forEach(([key, value]) => {
    requestHeaders.set(key, value)
  })

  const requestInit: RequestInit = {
    method,
    headers: requestHeaders,
  }

  if (body) {
    requestInit.body = typeof body === 'string' ? body : JSON.stringify(body)
    if (!requestHeaders.has('Content-Type')) {
      requestHeaders.set('Content-Type', 'application/json')
    }
  }

  const request = new Request(url, requestInit)

  // Mock cookies
  if (Object.keys(cookieData).length > 0) {
    const cookieHeader = Object.entries(cookieData)
      .map(([key, value]) => `${key}=${value}`)
      .join('; ')
    requestHeaders.set('Cookie', cookieHeader)
  }

  return new NextRequest(request)
}

/**
 * Cria uma requisição autenticada mockada
 */
export function createAuthenticatedRequest(
  user: {
    id: string
    email: string
    role: string
    companyId?: string
    transportadoraId?: string
  },
  options: Omit<MockRequestOptions, 'headers'> = {}
): NextRequest {
  const sessionCookie = Buffer.from(
    JSON.stringify({
      id: user.id,
      email: user.email,
      role: user.role,
      companyId: user.companyId,
      transportadoraId: user.transportadoraId,
      access_token: 'mock-access-token',
    })
  ).toString('base64')

  return createMockRequest({
    ...options,
    headers: {
      'x-user-id': user.id,
      'x-user-role': user.role,
      Cookie: `golffox-session=${sessionCookie}`,
      ...options.headers,
    },
  })
}

/**
 * Valida se uma resposta tem o formato esperado
 */
export function validateResponse(response: Response, expectedStatus: number) {
  expect(response.status).toBe(expectedStatus)
  return response
}

/**
 * Extrai JSON de uma resposta e valida
 */
export async function getJsonResponse<T = any>(response: Response): Promise<T> {
  const data = await response.json()
  return data as T
}

/**
 * Cria um mock de cookies do Next.js
 */
export function createMockCookies(cookieData: Record<string, string> = {}) {
  return {
    get: jest.fn((name: string) => {
      const value = cookieData[name]
      return value ? { name, value } : undefined
    }),
    set: jest.fn(),
    delete: jest.fn(),
    has: jest.fn((name: string) => name in cookieData),
    getAll: jest.fn(() =>
      Object.entries(cookieData).map(([name, value]) => ({ name, value }))
    ),
  }
}

/**
 * Helper para testar rate limiting
 */
export function createRateLimitRequest(ip: string = '127.0.0.1') {
  return createMockRequest({
    headers: {
      'x-forwarded-for': ip,
      'x-real-ip': ip,
    },
  })
}

/**
 * Helper para criar requisições com CSRF token
 */
export function createCSRFRequest(csrfToken: string, options: MockRequestOptions = {}) {
  return createMockRequest({
    ...options,
    headers: {
      'x-csrf-token': csrfToken,
      Cookie: `golffox-csrf=${csrfToken}`,
      ...options.headers,
    },
  })
}

/**
 * Helper para criar requisições de diferentes roles
 */
export const createAdminRequest = (options: MockRequestOptions = {}) =>
  createAuthenticatedRequest(
    {
      id: 'admin-1',
      email: 'admin@test.com',
      role: 'admin',
    },
    options
  )

export const createOperatorRequest = (companyId: string = 'company-1', options: MockRequestOptions = {}) =>
  createAuthenticatedRequest(
    {
      id: 'operador-1',
      email: 'operador@test.com',
      role: 'operador',
      companyId,
    },
    options
  )

export const createTransportadoraRequest = (
  transportadoraId: string = 'transportadora-1',
  options: MockRequestOptions = {}
) =>
  createAuthenticatedRequest(
    {
      id: 'transportadora-1',
      email: 'transportadora@test.com',
      role: 'transportadora',
      transportadoraId,
    },
    options
  )

