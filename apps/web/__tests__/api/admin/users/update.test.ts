import { PUT } from '@/app/api/admin/usuarios/[userId]/route'
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

jest.mock('@/lib/next-cache', () => ({
  invalidateEntityCache: jest.fn(async () => {}),
}))

describe('PUT /api/admin/usuarios/[userId]', () => {
  const userId = '123e4567-e89b-12d3-a456-426614174000'

  beforeEach(() => {
    jest.clearAllMocks()
    mockSupabaseClient.clear()
  })

  it('deve atualizar usuário com sucesso', async () => {
    const existingUser = {
      id: userId,
      email: 'user@example.com',
    }

    mockSupabaseClient.from.mockReturnValue({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({
        data: existingUser,
        error: null,
      }),
      update: jest.fn().mockReturnThis(),
    })

    const updateData = {
      name: 'Novo Nome',
      email: 'newemail@example.com',
      phone: '11999999999',
    }

    // Mock do update
    const mockUpdate = {
      eq: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({
        data: { ...existingUser, ...updateData },
        error: null,
      }),
    }

    mockSupabaseClient.from().update.mockReturnValue(mockUpdate)

    const req = createAdminRequest({
      method: 'PUT',
      url: `http://localhost:3000/api/admin/usuarios/${userId}`,
      body: updateData,
    })

    const response = await PUT(req, {
      params: Promise.resolve({ userId }),
    })

    expect(response.status).toBe(200)
    const json = await response.json()
    expect(json.success).toBe(true)
    expect(json.user.name).toBe('Novo Nome')
  })

  it('deve retornar 400 se userId não for UUID válido', async () => {
    const invalidUserId = 'invalid-id'

    const req = createAdminRequest({
      method: 'PUT',
      url: `http://localhost:3000/api/admin/usuarios/${invalidUserId}`,
      body: { name: 'Test' },
    })

    const response = await PUT(req, {
      params: Promise.resolve({ userId: invalidUserId }),
    })

    expect(response.status).toBe(400)
    const json = await response.json()
    expect(json.error).toContain('UUID válido')
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
      method: 'PUT',
      url: `http://localhost:3000/api/admin/usuarios/${userId}`,
      body: { name: 'Test' },
    })

    const response = await PUT(req, {
      params: Promise.resolve({ userId }),
    })

    expect(response.status).toBe(404)
    const json = await response.json()
    expect(json.error).toContain('não encontrado')
  })

  it('deve retornar 400 se email for inválido', async () => {
    const existingUser = {
      id: userId,
      email: 'user@example.com',
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
      method: 'PUT',
      url: `http://localhost:3000/api/admin/usuarios/${userId}`,
      body: { email: 'invalid-email' },
    })

    const response = await PUT(req, {
      params: Promise.resolve({ userId }),
    })

    expect(response.status).toBe(400)
    const json = await response.json()
    expect(json.error).toContain('Email inválido')
  })

  it('deve retornar 403 se usuário não for admin', async () => {
    const req = createAdminRequest({
      method: 'PUT',
      url: `http://localhost:3000/api/admin/usuarios/${userId}`,
      body: { name: 'Test' },
      headers: { 'x-user-role': 'empresa' },
    })

    const response = await PUT(req, {
      params: Promise.resolve({ userId }),
    })

    expect(response.status).toBe(403)
  })
})
