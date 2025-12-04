import { GET } from '@/app/api/auth/me/route'
import { createMockRequest, createAuthenticatedRequest } from '../../helpers/api-test-helpers'
import { mockSupabaseClient } from '../../helpers/mock-supabase'
import { createTestUser } from '../../helpers/test-data'

jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => mockSupabaseClient),
}))

describe('GET /api/auth/me', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockSupabaseClient.clear()
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'http://localhost:54321'
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-key'
  })

  it('deve retornar 401 se não houver cookie de sessão', async () => {
    const req = createMockRequest({
      method: 'GET',
    })

    const response = await GET(req)
    const data = await response.json()

    expect(response.status).toBe(401)
    expect(data.success).toBe(false)
  })

  it('deve retornar 401 se cookie for inválido', async () => {
    const req = createMockRequest({
      method: 'GET',
      cookies: {
        'golffox-session': 'invalid-cookie',
      },
    })

    const response = await GET(req)
    const data = await response.json()

    expect(response.status).toBe(401)
    expect(data.success).toBe(false)
  })

  it('deve retornar dados do usuário do cookie quando banco não disponível', async () => {
    const user = createTestUser({ role: 'admin' })
    const sessionCookie = Buffer.from(
      JSON.stringify({
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      })
    ).toString('base64')

    const req = createMockRequest({
      method: 'GET',
      cookies: {
        'golffox-session': sessionCookie,
      },
    })

    // Simular falta de service key
    delete process.env.SUPABASE_SERVICE_ROLE_KEY

    const response = await GET(req)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.user).toMatchObject({
      id: user.id,
      email: user.email,
      role: user.role,
    })
  })

  it('deve buscar dados completos do banco quando disponível', async () => {
    const user = createTestUser({ 
      role: 'admin',
      company_id: 'company-1',
      transportadora_id: 'transportadora-1',
      avatar_url: 'https://example.com/avatar.jpg',
    })
    
    mockSupabaseClient.setTableData('users', [user])

    const sessionCookie = Buffer.from(
      JSON.stringify({
        id: user.id,
        email: user.email,
        role: user.role,
      })
    ).toString('base64')

    const req = createMockRequest({
      method: 'GET',
      cookies: {
        'golffox-session': sessionCookie,
      },
    })

    const response = await GET(req)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.user).toMatchObject({
      id: user.id,
      email: user.email,
      role: user.role,
      companyId: user.company_id,
      transportadora_id: user.transportadora_id,
      avatar_url: user.avatar_url,
    })
  })

  it('deve usar dados do cookie como fallback se banco falhar', async () => {
    const user = createTestUser({ role: 'admin' })
    const sessionCookie = Buffer.from(
      JSON.stringify({
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      })
    ).toString('base64')

    mockSupabaseClient.setTableData('users', [])

    const req = createMockRequest({
      method: 'GET',
      cookies: {
        'golffox-session': sessionCookie,
      },
    })

    const response = await GET(req)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.user).toMatchObject({
      id: user.id,
      email: user.email,
      role: user.role,
    })
  })

  it('deve retornar 401 se cookie não tiver dados necessários', async () => {
    const invalidCookie = Buffer.from(
      JSON.stringify({
        id: 'user-1',
        // Faltando email e role
      })
    ).toString('base64')

    const req = createMockRequest({
      method: 'GET',
      cookies: {
        'golffox-session': invalidCookie,
      },
    })

    const response = await GET(req)
    const data = await response.json()

    expect(response.status).toBe(401)
    expect(data.success).toBe(false)
  })
})

