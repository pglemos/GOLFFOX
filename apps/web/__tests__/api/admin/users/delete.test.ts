import { DELETE, POST } from '@/app/api/admin/usuarios/delete/route'
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
  withRateLimit: jest.fn((handler) => handler),
}))

jest.mock('@/lib/next-cache', () => ({
  invalidateEntityCache: jest.fn(async () => {}),
}))

describe('DELETE /api/admin/usuarios/delete', () => {
  const userId = '123e4567-e89b-12d3-a456-426614174000'

  beforeEach(() => {
    jest.clearAllMocks()
    mockSupabaseClient.clear()
  })

  it('deve deletar usuário com sucesso via query param', async () => {
    mockSupabaseClient.from.mockReturnValue({
      update: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),
      select: jest.fn().mockResolvedValue({
        data: { id: userId },
        error: null,
      }),
    })

    const req = createAdminRequest({
      method: 'DELETE',
      url: `http://localhost:3000/api/admin/usuarios/delete?id=${userId}`,
    })

    const response = await DELETE(req)

    expect(response.status).toBe(200)
    const json = await response.json()
    expect(json.success).toBe(true)
  })

  it('deve deletar usuário com sucesso via body', async () => {
    mockSupabaseClient.from.mockReturnValue({
      update: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),
      select: jest.fn().mockResolvedValue({
        data: { id: userId },
        error: null,
      }),
    })

    const req = createAdminRequest({
      method: 'POST',
      url: 'http://localhost:3000/api/admin/usuarios/delete',
      body: { id: userId },
    })

    const response = await POST(req)

    expect(response.status).toBe(200)
    const json = await response.json()
    expect(json.success).toBe(true)
  })

  it('deve retornar 400 se userId não for fornecido', async () => {
    const req = createAdminRequest({
      method: 'DELETE',
      url: 'http://localhost:3000/api/admin/usuarios/delete',
    })

    const response = await DELETE(req)

    expect(response.status).toBe(400)
    const json = await response.json()
    expect(json.error).toContain('obrigatório')
  })

  it('deve retornar 500 se houver erro ao deletar', async () => {
    mockSupabaseClient.from.mockReturnValue({
      update: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),
      select: jest.fn().mockResolvedValue({
        data: null,
        error: { message: 'Database error' },
      }),
    })

    const req = createAdminRequest({
      method: 'DELETE',
      url: `http://localhost:3000/api/admin/usuarios/delete?id=${userId}`,
    })

    const response = await DELETE(req)

    expect(response.status).toBe(500)
  })

  it('deve retornar 403 se usuário não for admin', async () => {
    const req = createAdminRequest({
      method: 'DELETE',
      url: `http://localhost:3000/api/admin/usuarios/delete?id=${userId}`,
      headers: { 'x-user-role': 'empresa' },
    })

    const response = await DELETE(req)

    expect(response.status).toBe(403)
  })
})
