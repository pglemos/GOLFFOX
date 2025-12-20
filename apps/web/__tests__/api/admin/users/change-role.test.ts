import { POST } from '@/app/api/admin/users/change-role/route'
import { createAdminRequest } from '../../../helpers/api-test-helpers'
import { mockSupabaseClient } from '../../../helpers/mock-supabase'
import { NextRequest } from 'next/server'

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

jest.mock('@/lib/rate-limit', () => ({
  applyRateLimit: jest.fn(async () => null),
}))

jest.mock('@/lib/role-mapper', () => ({
  normalizeRole: jest.fn((role: string) => {
    const roleMap: Record<string, string> = {
      'operador': 'empresa',
      'transportadora': 'transportadora',
      'motorista': 'motorista',
      'passageiro': 'passageiro',
      'admin': 'admin',
      'empresa': 'empresa',
      'transportadora': 'transportadora',
      'motorista': 'motorista',
      'passageiro': 'passageiro',
    }
    return roleMap[role.toLowerCase()] || role
  }),
  isValidRole: jest.fn((role: string) => {
    const validRoles = ['admin', 'empresa', 'transportadora', 'motorista', 'passageiro']
    return validRoles.includes(role.toLowerCase())
  }),
}))

describe('POST /api/admin/users/change-role', () => {
  const userId = '123e4567-e89b-12d3-a456-426614174000'

  beforeEach(() => {
    jest.clearAllMocks()
    mockSupabaseClient.clear()
  })

  it('deve alterar papel do usuário com sucesso', async () => {
    const existingUser = {
      id: userId,
      email: 'user@example.com',
      role: 'empresa',
      name: 'Test User',
    }

    const updatedUser = {
      ...existingUser,
      role: 'transportadora',
    }

    mockSupabaseClient.from.mockReturnValue({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn()
        .mockResolvedValueOnce({
          data: existingUser,
          error: null,
        })
        .mockResolvedValueOnce({
          data: updatedUser,
          error: null,
        }),
      update: jest.fn().mockReturnThis(),
      insert: jest.fn().mockResolvedValue({ data: null, error: null }),
    })

    const req = createAdminRequest({
      method: 'POST',
      url: 'http://localhost:3000/api/admin/users/change-role',
      body: {
        userId,
        newRole: 'transportadora',
      },
    })

    const response = await POST(req)

    expect(response.status).toBe(200)
    const json = await response.json()
    expect(json.success).toBe(true)
    expect(json.data.user.role).toBe('transportadora')
  })

  it('deve retornar 400 se userId não for UUID válido', async () => {
    const req = createAdminRequest({
      method: 'POST',
      url: 'http://localhost:3000/api/admin/users/change-role',
      body: {
        userId: 'invalid-id',
        newRole: 'transportadora',
      },
    })

    const response = await POST(req)

    expect(response.status).toBe(400)
  })

  it('deve retornar 400 se newRole for inválido', async () => {
    const req = createAdminRequest({
      method: 'POST',
      url: 'http://localhost:3000/api/admin/users/change-role',
      body: {
        userId,
        newRole: 'invalid-role',
      },
    })

    const response = await POST(req)

    expect(response.status).toBe(400)
  })

  it('deve retornar 404 se usuário não existir', async () => {
    mockSupabaseClient.from.mockReturnValue({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({
        data: null,
        error: { message: 'Not found' },
      }),
    })

    const req = createAdminRequest({
      method: 'POST',
      url: 'http://localhost:3000/api/admin/users/change-role',
      body: {
        userId,
        newRole: 'transportadora',
      },
    })

    const response = await POST(req)

    expect(response.status).toBe(404)
  })

  it('deve retornar 400 se papel já for o mesmo', async () => {
    const existingUser = {
      id: userId,
      email: 'user@example.com',
      role: 'transportadora',
      name: 'Test User',
    }

    mockSupabaseClient.from.mockReturnValue({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({
        data: existingUser,
        error: null,
      }),
    })

    const req = createAdminRequest({
      method: 'POST',
      url: 'http://localhost:3000/api/admin/users/change-role',
      body: {
        userId,
        newRole: 'transportadora',
      },
    })

    const response = await POST(req)

    expect(response.status).toBe(400)
    const json = await response.json()
    expect(json.error).toContain('já possui este papel')
  })

  it('deve retornar 403 se usuário não for admin', async () => {
    const req = createAdminRequest({
      method: 'POST',
      url: 'http://localhost:3000/api/admin/users/change-role',
      body: {
        userId,
        newRole: 'transportadora',
      },
      headers: { 'x-user-role': 'empresa' },
    })

    const response = await POST(req)

    expect(response.status).toBe(403)
  })
})
