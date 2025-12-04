import { PUT } from '@/app/api/admin/users/[userId]/route'
import { createAdminRequest } from '../../../helpers/api-test-helpers'
import { mockSupabaseClient } from '../../../helpers/mock-supabase'
import { createTestUser } from '../../../helpers/test-data'
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

describe('PUT /api/admin/users/[userId]', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockSupabaseClient.clear()
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'http://localhost:54321'
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-key'
  })

  it('deve atualizar usuário', async () => {
    const user = createTestUser()
    mockSupabaseClient.setTableData('users', [user])

    const req = createAdminRequest({
      method: 'PUT',
      body: {
        name: 'Nome Atualizado',
        phone: '+5511999999999',
      },
    }) as NextRequest

    const context = {
      params: Promise.resolve({ userId: user.id }),
    }

    const response = await PUT(req, context)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.user).toBeDefined()
  })

  it('deve validar UUID do userId', async () => {
    const req = createAdminRequest({
      method: 'PUT',
      body: {
        name: 'Nome',
      },
    }) as NextRequest

    const context = {
      params: Promise.resolve({ userId: 'invalid-uuid' }),
    }

    const response = await PUT(req, context)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe('user_id deve ser um UUID válido')
  })

  it('deve rejeitar se usuário não encontrado', async () => {
    mockSupabaseClient.setTableData('users', [])

    const req = createAdminRequest({
      method: 'PUT',
      body: {
        name: 'Nome',
      },
    }) as NextRequest

    const context = {
      params: Promise.resolve({ userId: '00000000-0000-0000-0000-000000000001' }),
    }

    const response = await PUT(req, context)
    const data = await response.json()

    expect(response.status).toBe(404)
    expect(data.error).toBe('Usuário não encontrado')
  })

  it('deve validar email', async () => {
    const user = createTestUser()
    mockSupabaseClient.setTableData('users', [user])

    const req = createAdminRequest({
      method: 'PUT',
      body: {
        email: 'invalid-email',
      },
    }) as NextRequest

    const context = {
      params: Promise.resolve({ userId: user.id }),
    }

    const response = await PUT(req, context)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe('Email inválido')
  })

  it('deve atualizar múltiplos campos', async () => {
    const user = createTestUser()
    mockSupabaseClient.setTableData('users', [user])

    const req = createAdminRequest({
      method: 'PUT',
      body: {
        name: 'Nome Atualizado',
        phone: '+5511999999999',
        cpf: '12345678900',
        is_active: false,
        role: 'operador',
      },
    }) as NextRequest

    const context = {
      params: Promise.resolve({ userId: user.id }),
    }

    const response = await PUT(req, context)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
  })

  it('deve atualizar endereço', async () => {
    const user = createTestUser()
    mockSupabaseClient.setTableData('users', [user])

    const req = createAdminRequest({
      method: 'PUT',
      body: {
        address_zip_code: '01310-100',
        address_street: 'Avenida Paulista',
        address_number: '1000',
        address_neighborhood: 'Bela Vista',
        address_city: 'São Paulo',
        address_state: 'SP',
      },
    }) as NextRequest

    const context = {
      params: Promise.resolve({ userId: user.id }),
    }

    const response = await PUT(req, context)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
  })

  it('deve lidar com erro na atualização', async () => {
    const user = createTestUser()
    mockSupabaseClient.setTableData('users', [user])
    mockSupabaseClient.setTableError('users', {
      message: 'Database error',
    })

    const req = createAdminRequest({
      method: 'PUT',
      body: {
        name: 'Nome',
      },
    }) as NextRequest

    const context = {
      params: Promise.resolve({ userId: user.id }),
    }

    const response = await PUT(req, context)
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data.error).toBe('Erro ao atualizar usuário')
  })
})

