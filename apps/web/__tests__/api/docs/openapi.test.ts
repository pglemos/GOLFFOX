import { GET } from '@/app/api/docs/openapi/route'
import { createMockRequest } from '../../helpers/api-test-helpers'
import { NextRequest } from 'next/server'

describe('GET /api/docs/openapi', () => {
  beforeEach(() => {
    process.env.NEXT_PUBLIC_BASE_URL = 'http://localhost:3000'
  })

  it('deve retornar especificação OpenAPI', async () => {
    const req = createMockRequest({
      method: 'GET',
    }) as NextRequest

    const response = await GET(req)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.openapi).toBe('3.0.3')
    expect(data.info).toBeDefined()
    expect(data.info.title).toBe('GolfFox API')
    expect(data.paths).toBeDefined()
  })

  it('deve incluir endpoints principais', async () => {
    const req = createMockRequest({
      method: 'GET',
    }) as NextRequest

    const response = await GET(req)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.paths).toHaveProperty('/api/auth/login')
    expect(data.paths).toHaveProperty('/api/health')
    expect(data.paths).toHaveProperty('/api/reports/run')
  })

  it('deve usar base URL do ambiente', async () => {
    process.env.NEXT_PUBLIC_BASE_URL = 'https://api.example.com'

    const req = createMockRequest({
      method: 'GET',
    }) as NextRequest

    const response = await GET(req)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.servers[0].url).toBe('https://api.example.com')
  })
})

