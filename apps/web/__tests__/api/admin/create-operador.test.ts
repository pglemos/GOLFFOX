import { POST } from '@/app/api/admin/criar-operador/route'
import { createAdminRequest } from '../../helpers/api-test-helpers'
import { mockSupabaseClient } from '../../helpers/mock-supabase'
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

jest.mock('@/lib/services', () => ({
  CompanyService: {
    createCompany: jest.fn(async (data: any) => ({
      id: 'company-123',
      name: data.name,
      cnpj: data.cnpj || null,
      address: data.address || null,
      phone: data.phone || null,
      email: data.email || null,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })),
  },
}))

describe('POST /api/admin/criar-operador', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockSupabaseClient.clear()
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'http://localhost:54321'
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-key'
  })

  it('deve criar empresa sem operador', async () => {
    const req = createAdminRequest({
      method: 'POST',
      body: {
        companyName: 'Nova Empresa',
        cnpj: '12345678000190',
        address: 'Rua Teste, 123',
        city: 'São Paulo',
        state: 'SP',
        zipCode: '01234567',
        companyPhone: '11999999999',
        companyEmail: 'contato@empresa.com',
      },
    }) as NextRequest

    const response = await POST(req)
    const data = await response.json()

    expect(response.status).toBe(201)
    expect(data.success).toBe(true)
    expect(data.companyId).toBeDefined()
    expect(data.company).toBeDefined()
    expect(data.company.name).toBe('Nova Empresa')
  })

  it('deve criar empresa com operador', async () => {
    // Mock de usuário criado no Supabase Auth
    mockSupabaseClient.setAuthUser({
      id: 'user-123',
      email: 'operador@empresa.com',
    })

    const req = createAdminRequest({
      method: 'POST',
      body: {
        companyName: 'Nova Empresa',
        operatorEmail: 'operador@empresa.com',
        operatorPassword: 'senha123',
        operatorName: 'Operador Teste',
        operatorPhone: '11988888888',
      },
    }) as NextRequest

    const response = await POST(req)
    const data = await response.json()

    expect(response.status).toBe(201)
    expect(data.success).toBe(true)
    expect(data.companyId).toBeDefined()
    expect(data.operador).toBeDefined()
    expect(data.userId).toBeDefined()
  })

  it('deve validar nome da empresa obrigatório', async () => {
    const req = createAdminRequest({
      method: 'POST',
      body: {
        // companyName ausente
        cnpj: '12345678000190',
      },
    }) as NextRequest

    const response = await POST(req)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBeDefined()
    expect(data.message).toContain('obrigatório')
  })

  it('deve validar email do operador se fornecido', async () => {
    const req = createAdminRequest({
      method: 'POST',
      body: {
        companyName: 'Nova Empresa',
        operatorEmail: 'email-invalido',
        operatorPassword: 'senha123',
      },
    }) as NextRequest

    const response = await POST(req)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBeDefined()
    expect(data.message).toContain('inválido')
  })

  it('deve validar senha mínima se fornecida', async () => {
    const req = createAdminRequest({
      method: 'POST',
      body: {
        companyName: 'Nova Empresa',
        operatorEmail: 'operador@empresa.com',
        operatorPassword: '123', // Muito curta
      },
    }) as NextRequest

    const response = await POST(req)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBeDefined()
    expect(data.message).toContain('mínimo')
  })

  it('deve requerer autenticação admin', async () => {
    const req = createAdminRequest({
      method: 'POST',
      headers: {
        'x-user-role': 'empresa', // Não admin
      },
      body: {
        companyName: 'Nova Empresa',
      },
    }) as NextRequest

    const response = await POST(req)

    expect(response.status).toBe(403)
  })
})

