import { GET } from '@/app/api/auth/csrf/route'
import { createMockRequest } from '../../helpers/api-test-helpers'

describe('GET /api/auth/csrf', () => {
  it('deve gerar token CSRF', async () => {
    const req = createMockRequest({
      method: 'GET',
    })

    const response = await GET(req)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.token).toBeDefined()
    expect(data.csrfToken).toBeDefined()
    expect(data.token).toBe(data.csrfToken)
    expect(typeof data.token).toBe('string')
    expect(data.token.length).toBeGreaterThan(0)
  })

  it('deve criar cookie com token CSRF', async () => {
    const req = createMockRequest({
      method: 'GET',
    })

    const response = await GET(req)
    const data = await response.json()
    const setCookie = response.headers.get('Set-Cookie')

    expect(response.status).toBe(200)
    expect(setCookie).toContain('golffox-csrf=')
    expect(setCookie).toContain(data.token)
  })

  it('deve configurar cookie com opções corretas', async () => {
    const req = createMockRequest({
      method: 'GET',
      url: 'https://example.com/api/auth/csrf',
    })

    const response = await GET(req)
    const setCookie = response.headers.get('Set-Cookie')

    expect(response.status).toBe(200)
    expect(setCookie).toContain('Path=/')
    expect(setCookie).toContain('SameSite=strict')
    expect(setCookie).toContain('Secure')
    expect(setCookie).toContain('Max-Age=900') // 15 minutos
  })

  it('deve gerar tokens diferentes em requisições diferentes', async () => {
    const req1 = createMockRequest({ method: 'GET' })
    const req2 = createMockRequest({ method: 'GET' })

    const res1 = await GET(req1)
    const res2 = await GET(req2)

    const data1 = await res1.json()
    const data2 = await res2.json()

    expect(data1.token).not.toBe(data2.token)
  })

  it('deve lidar com erro ao gerar token', async () => {
    // Mock crypto.randomBytes para causar erro
    const originalRandomBytes = require('crypto').randomBytes
    jest.spyOn(require('crypto'), 'randomBytes').mockImplementation(() => {
      throw new Error('Random bytes error')
    })

    const req = createMockRequest({
      method: 'GET',
    })

    const response = await GET(req)
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data.error).toBeDefined()

    // Restore
    jest.spyOn(require('crypto'), 'randomBytes').mockImplementation(originalRandomBytes)
  })
})

