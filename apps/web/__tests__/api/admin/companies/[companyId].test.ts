import { PUT } from '@/app/api/admin/companies/[companyId]/route'
import { createAdminRequest } from '../../../helpers/api-test-helpers'
import { mockSupabaseClient } from '../../../helpers/mock-supabase'
import { createTestCompany } from '../../../helpers/test-data'
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

describe('PUT /api/admin/companies/[companyId]', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockSupabaseClient.clear()
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'http://localhost:54321'
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-key'
  })

  it('deve atualizar empresa', async () => {
    const company = createTestCompany()
    mockSupabaseClient.setTableData('companies', [company])

    const req = createAdminRequest({
      method: 'PUT',
      body: {
        name: 'Empresa Atualizada',
        email: 'novo@email.com',
      },
    }) as NextRequest

    const context = {
      params: Promise.resolve({ companyId: company.id }),
    }

    const response = await PUT(req, context)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.company).toBeDefined()
  })

  it('deve validar UUID do companyId', async () => {
    const req = createAdminRequest({
      method: 'PUT',
      body: {
        name: 'Empresa',
      },
    }) as NextRequest

    const context = {
      params: Promise.resolve({ companyId: 'invalid-uuid' }),
    }

    const response = await PUT(req, context)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe('company_id deve ser um UUID válido')
  })

  it('deve rejeitar se empresa não encontrada', async () => {
    mockSupabaseClient.setTableData('companies', [])

    const req = createAdminRequest({
      method: 'PUT',
      body: {
        name: 'Empresa',
      },
    }) as NextRequest

    const context = {
      params: Promise.resolve({ companyId: '00000000-0000-0000-0000-000000000001' }),
    }

    const response = await PUT(req, context)
    const data = await response.json()

    expect(response.status).toBe(404)
    expect(data.error).toBe('Empresa não encontrada')
  })

  it('deve validar CNPJ único', async () => {
    const company1 = createTestCompany({ cnpj: '12345678000100' })
    const company2 = createTestCompany({ cnpj: '98765432000100' })
    mockSupabaseClient.setTableData('companies', [company1, company2])

    const req = createAdminRequest({
      method: 'PUT',
      body: {
        cnpj: company2.cnpj, // Tentar usar CNPJ de outra empresa
      },
    }) as NextRequest

    const context = {
      params: Promise.resolve({ companyId: company1.id }),
    }

    const response = await PUT(req, context)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe('Uma empresa com este CNPJ já existe')
  })

  it('deve validar email', async () => {
    const company = createTestCompany()
    mockSupabaseClient.setTableData('companies', [company])

    const req = createAdminRequest({
      method: 'PUT',
      body: {
        email: 'invalid-email',
      },
    }) as NextRequest

    const context = {
      params: Promise.resolve({ companyId: company.id }),
    }

    const response = await PUT(req, context)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe('Email inválido')
  })
})

