import { GET } from '@/app/api/admin/usuarios-list/route'
import { createAdminRequest } from '../../helpers/api-test-helpers'
import { mockSupabaseClient } from '../../helpers/mock-supabase'

jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => mockSupabaseClient),
}))

jest.mock('@/lib/api-auth', () => ({
  requireAuth: jest.fn(async (req: any) => {
    const userRole = req.headers.get('x-user-role')
    if (userRole !== 'admin') {
      return { json: () => ({ error: 'Forbidden' }), status: 403 }
    }
    return null
  }),
}))

jest.mock('@/lib/logger', () => ({
  logError: jest.fn(),
}))

describe('GET /api/admin/usuarios-list', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockSupabaseClient.clear()
  })

  it('deve listar todos os usuários', async () => {
    const mockUsers = [
      { id: '1', email: 'user1@example.com', role: 'empresa', is_active: true },
      { id: '2', email: 'user2@example.com', role: 'transportadora', is_active: true },
    ]

    mockSupabaseClient.from.mockReturnValue({
      select: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      then: jest.fn((resolve) => {
        resolve({ data: mockUsers, error: null })
      }),
    })

    const query = mockSupabaseClient.from('users').select('*')
    query.order = jest.fn().mockResolvedValue({ data: mockUsers, error: null })

    const req = createAdminRequest({
      method: 'GET',
      url: 'http://localhost:3000/api/admin/usuarios-list',
    })

    const response = await GET(req)

    expect(response.status).toBe(200)
    const json = await response.json()
    expect(json.success).toBe(true)
    expect(json.users).toHaveLength(2)
  })

  it('deve filtrar por role', async () => {
    const mockUsers = [
      { id: '1', email: 'user1@example.com', role: 'empresa', is_active: true },
    ]

    mockSupabaseClient.from.mockReturnValue({
      select: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      eq: jest.fn().mockResolvedValue({ data: mockUsers, error: null }),
    })

    const req = createAdminRequest({
      method: 'GET',
      url: 'http://localhost:3000/api/admin/usuarios-list?role=empresa',
    })

    const response = await GET(req)

    expect(response.status).toBe(200)
    const json = await response.json()
    expect(json.success).toBe(true)
  })

  it('deve filtrar por status', async () => {
    const mockUsers = [
      { id: '1', email: 'user1@example.com', role: 'empresa', is_active: true },
    ]

    mockSupabaseClient.from.mockReturnValue({
      select: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      eq: jest.fn().mockResolvedValue({ data: mockUsers, error: null }),
    })

    const req = createAdminRequest({
      method: 'GET',
      url: 'http://localhost:3000/api/admin/usuarios-list?status=active',
    })

    const response = await GET(req)

    expect(response.status).toBe(200)
    const json = await response.json()
    expect(json.success).toBe(true)
  })

  it('deve filtrar por company_id', async () => {
    const mockUsers = [
      { id: '1', email: 'user1@example.com', role: 'empresa', company_id: 'company-123' },
    ]

    mockSupabaseClient.from.mockReturnValue({
      select: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      eq: jest.fn().mockResolvedValue({ data: mockUsers, error: null }),
    })

    const req = createAdminRequest({
      method: 'GET',
      url: 'http://localhost:3000/api/admin/usuarios-list?company_id=company-123',
    })

    const response = await GET(req)

    expect(response.status).toBe(200)
    const json = await response.json()
    expect(json.success).toBe(true)
  })

  it('deve retornar 403 se usuário não for admin', async () => {
    const req = createAdminRequest({
      method: 'GET',
      url: 'http://localhost:3000/api/admin/usuarios-list',
      headers: { 'x-user-role': 'empresa' },
    })

    const response = await GET(req)

    expect(response.status).toBe(403)
  })

  it('deve retornar 500 se houver erro no banco', async () => {
    mockSupabaseClient.from.mockReturnValue({
      select: jest.fn().mockReturnThis(),
      order: jest.fn().mockResolvedValue({
        data: null,
        error: { message: 'Database error' },
      }),
    })

    const req = createAdminRequest({
      method: 'GET',
      url: 'http://localhost:3000/api/admin/usuarios-list',
    })

    const response = await GET(req)

    expect(response.status).toBe(500)
  })
})

