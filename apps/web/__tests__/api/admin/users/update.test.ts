import { PUT } from '@/app/api/admin/users/[userId]/route'
import { createAdminRequest } from '../../../helpers/api-test-helpers'
import { mockSupabaseClient } from '../../../helpers/mock-supabase'
import { createTestUser } from '../../../helpers/test-data'

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

describe('PUT /api/admin/users/[userId]', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockSupabaseClient.clear()
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'http://localhost:54321'
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-key'
  })

  it('deve atualizar usuário com dados válidos', async () => {
    const user = createTestUser({ role: 'operador' })
    mockSupabaseClient.setTableData('users', [user])

    const req = createAdminRequest({
      method: 'PUT',
      body: {
        name: 'Nome Atualizado',
        phone: '+5511999999999',
      },
    })

    const response = await PUT(req, {
      params: Promise.resolve({ userId: user.id }),
    })
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.user.name).toBe('Nome Atualizado')
  })

  it('deve validar UUID', async () => {
    const req = createAdminRequest({
      method: 'PUT',
      body: { name: 'Teste' },
    })

    const response = await PUT(req, {
      params: Promise.resolve({ userId: 'invalid-uuid' }),
    })
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe('user_id deve ser um UUID válido')
  })

  it('deve retornar 404 se usuário não encontrado', async () => {
    const req = createAdminRequest({
      method: 'PUT',
      body: { name: 'Teste' },
    })

    const response = await PUT(req, {
      params: Promise.resolve({ userId: '00000000-0000-0000-0000-000000000000' }),
    })
    const data = await response.json()

    expect(response.status).toBe(404)
    expect(data.error).toBe('Usuário não encontrado')
  })

  it('deve validar email quando fornecido', async () => {
    const user = createTestUser()
    mockSupabaseClient.setTableData('users', [user])

    const req = createAdminRequest({
      method: 'PUT',
      body: {
        email: 'email-invalido',
      },
    })

    const response = await PUT(req, {
      params: Promise.resolve({ userId: user.id }),
    })
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe('Email inválido')
  })
})

