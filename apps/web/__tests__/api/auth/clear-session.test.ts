import { POST } from '@/app/api/auth/clear-session/route'
import { createMockRequest } from '../../helpers/api-test-helpers'

describe('POST /api/auth/clear-session', () => {
  it('deve limpar sessão e retornar sucesso', async () => {
    const sessionCookie = Buffer.from(
      JSON.stringify({
        id: 'user-1',
        email: 'test@test.com',
        role: 'admin',
      })
    ).toString('base64')

    const req = createMockRequest({
      method: 'POST',
      cookies: {
        'golffox-session': sessionCookie,
      },
    })

    const response = await POST(req)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.ok).toBe(true)
    expect(data.cleared).toBe(true)
    expect(data.user).toMatchObject({
      id: 'user-1',
      email: 'test@test.com',
      role: 'admin',
    })

    const setCookie = response.headers.get('Set-Cookie')
    expect(setCookie).toContain('golffox-session=')
    expect(setCookie).toContain('Max-Age=0')
  })

  it('deve limpar cookie mesmo sem sessão existente', async () => {
    const req = createMockRequest({
      method: 'POST',
    })

    const response = await POST(req)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.ok).toBe(true)
    expect(data.cleared).toBe(true)
    expect(data.user).toBeNull()

    const setCookie = response.headers.get('Set-Cookie')
    expect(setCookie).toContain('golffox-session=')
  })

  it('deve limpar cookie auxiliar golffox-auth', async () => {
    const req = createMockRequest({
      method: 'POST',
      cookies: {
        'golffox-session': 'session-value',
        'golffox-auth': 'auth-value',
      },
    })

    const response = await POST(req)
    const setCookie = response.headers.get('Set-Cookie')

    expect(response.status).toBe(200)
    expect(setCookie).toContain('golffox-auth=')
    expect(setCookie).toContain('Max-Age=0')
  })

  it('deve lidar com cookie inválido graciosamente', async () => {
    const req = createMockRequest({
      method: 'POST',
      cookies: {
        'golffox-session': 'invalid-base64',
      },
    })

    const response = await POST(req)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.ok).toBe(true)
    expect(data.user).toBeNull()
  })

  it('deve retornar erro em caso de exceção', async () => {
    // Mock para causar erro
    const originalUrl = URL
    global.URL = jest.fn().mockImplementation(() => {
      throw new Error('URL error')
    }) as any

    const req = createMockRequest({
      method: 'POST',
    })

    const response = await POST(req)
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data.error).toBeDefined()

    global.URL = originalUrl
  })
})

