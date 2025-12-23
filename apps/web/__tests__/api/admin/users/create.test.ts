import { POST } from '@/app/api/admin/criar-usuario/route'
import { createAdminRequest } from '../../../helpers/api-test-helpers'
import { mockSupabaseClient } from '../../../helpers/mock-supabase'
import { createTestCompany, createTestUser } from '../../../helpers/test-data'

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

describe('POST /api/admin/criar-usuario', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockSupabaseClient.clear()
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'http://localhost:54321'
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-key'
    process.env.NODE_ENV = 'test'
  })

  it('deve criar usuário com dados válidos', async () => {
    const company = createTestCompany()
    mockSupabaseClient.setTableData('companies', [company])
    mockSupabaseClient.setTableData('users', [])

    mockSupabaseClient.setAuthHandler('admin', {
      listUsers: jest.fn(async () => ({
        data: { users: [] },
        error: null,
      })),
      createUser: jest.fn(async () => ({
        data: {
          user: {
            id: 'user-123',
            email: 'test@test.com',
            created_at: new Date().toISOString(),
          },
        },
        error: null,
      })),
    })

    const req = createAdminRequest({
      method: 'POST',
      body: {
        company_id: company.id,
        email: 'test@test.com',
        password: 'senha123',
        name: 'Usuário Teste',
        role: 'operador',
        cpf: '12345678900',
        address_zip_code: '12345-678',
        address_street: 'Rua Teste',
        address_number: '123',
        address_neighborhood: 'Bairro Teste',
        address_city: 'Cidade Teste',
        address_state: 'SP',
      },
    })

    const response = await POST(req)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.user.email).toBe('test@test.com')
  })

  it('deve validar company_id obrigatório', async () => {
    const req = createAdminRequest({
      method: 'POST',
      body: {
        email: 'test@test.com',
        password: 'senha123',
        name: 'Teste',
      },
    })

    const response = await POST(req)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe('company_id é obrigatório')
  })

  it('deve validar email obrigatório', async () => {
    const req = createAdminRequest({
      method: 'POST',
      body: {
        company_id: 'company-1',
        password: 'senha123',
        name: 'Teste',
      },
    })

    const response = await POST(req)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe('Email é obrigatório')
  })

  it('deve validar senha mínima', async () => {
    const req = createAdminRequest({
      method: 'POST',
      body: {
        company_id: 'company-1',
        email: 'test@test.com',
        password: '12345', // Menos de 6 caracteres
        name: 'Teste',
      },
    })

    const response = await POST(req)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe('Senha deve ter no mínimo 6 caracteres')
  })

  it('deve rejeitar email já cadastrado', async () => {
    const company = createTestCompany()
    const existingUser = createTestUser({ email: 'existing@test.com' })
    
    mockSupabaseClient.setTableData('companies', [company])
    mockSupabaseClient.setTableData('users', [existingUser])

    const req = createAdminRequest({
      method: 'POST',
      body: {
        company_id: company.id,
        email: 'existing@test.com',
        password: 'senha123',
        name: 'Teste',
        cpf: '12345678900',
        address_zip_code: '12345-678',
        address_street: 'Rua Teste',
        address_number: '123',
        address_neighborhood: 'Bairro Teste',
        address_city: 'Cidade Teste',
        address_state: 'SP',
      },
    })

    const response = await POST(req)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe('Este email já está cadastrado na tabela de usuários')
  })
})

