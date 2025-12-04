import { POST } from '@/app/api/auth/set-session/route'
import { createMockRequest, createCSRFRequest } from '../../helpers/api-test-helpers'

jest.mock('@/lib/logger', () => ({
  debug: jest.fn(),
  error: jest.fn(),
}))

describe('POST /api/auth/set-session', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    process.env.NODE_ENV = 'test'
  })

  it('deve criar sessão com dados válidos', async () => {
    const req = createMockRequest({
      method: 'POST',
      headers: {
        'x-test-mode': 'true',
      },
      body: {
        user: {
          id: 'user-1',
          email: 'test@test.com',
          role: 'admin',
          companyId: 'company-1',
        },
        access_token: 'token-123',
      },
    })

    const response = await POST(req)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.ok).toBe(true)
    
    const setCookie = response.headers.get('Set-Cookie')
    expect(setCookie).toContain('golffox-session=')
  })

  it('deve validar CSRF em produção', async () => {
    process.env.NODE_ENV = 'production'

    const req = createMockRequest({
      method: 'POST',
      headers: {
        'x-csrf-token': 'wrong-token',
      },
      body: {
        user: {
          id: 'user-1',
          email: 'test@test.com',
          role: 'admin',
        },
      },
    })

    const response = await POST(req)
    const data = await response.json()

    expect(response.status).toBe(403)
    expect(data.error).toBe('csrf_failed')
  })

  it('deve aceitar CSRF válido', async () => {
    const req = createCSRFRequest('test-csrf-token', {
      method: 'POST',
      body: {
        user: {
          id: 'user-1',
          email: 'test@test.com',
          role: 'admin',
        },
      },
    })

    const response = await POST(req)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.ok).toBe(true)
  })

  it('deve rejeitar payload inválido', async () => {
    const req = createMockRequest({
      method: 'POST',
      headers: {
        'x-test-mode': 'true',
      },
      body: {
        user: {
          id: 'user-1',
          // Faltando email e role
        },
      },
    })

    const response = await POST(req)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe('invalid_user_payload')
  })

  it('deve criar cookie seguro em HTTPS', async () => {
    const req = createMockRequest({
      method: 'POST',
      url: 'https://example.com/api/auth/set-session',
      headers: {
        'x-test-mode': 'true',
        'x-forwarded-proto': 'https',
      },
      body: {
        user: {
          id: 'user-1',
          email: 'test@test.com',
          role: 'admin',
        },
      },
    })

    const response = await POST(req)
    const setCookie = response.headers.get('Set-Cookie')

    expect(response.status).toBe(200)
    expect(setCookie).toContain('Secure')
  })

  it('deve lidar com erro inesperado', async () => {
    const req = createMockRequest({
      method: 'POST',
      headers: {
        'x-test-mode': 'true',
      },
      body: null, // Causa erro ao fazer JSON.parse
    })

    // Mock para causar erro
    const originalJson = Request.prototype.json
    Request.prototype.json = jest.fn().mockRejectedValue(new Error('Parse error'))

    const response = await POST(req)
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data.error).toBeDefined()

    // Restore
    Request.prototype.json = originalJson
  })

  it('não deve incluir access_token no cookie por segurança', async () => {
    const req = createMockRequest({
      method: 'POST',
      headers: {
        'x-test-mode': 'true',
      },
      body: {
        user: {
          id: 'user-1',
          email: 'test@test.com',
          role: 'admin',
        },
        access_token: 'token-123',
      },
    })

    const response = await POST(req)
    const setCookie = response.headers.get('Set-Cookie')
    const cookieValue = setCookie?.match(/golffox-session=([^;]+)/)?.[1]

    expect(response.status).toBe(200)
    if (cookieValue) {
      const decoded = Buffer.from(cookieValue, 'base64').toString('utf-8')
      const sessionData = JSON.parse(decoded)
      expect(sessionData.access_token).toBeUndefined()
    }
  })
})

