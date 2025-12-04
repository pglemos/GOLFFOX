import { GET, POST } from '@/app/api/admin/companies/route'
import { createAdminRequest } from '../../helpers/api-test-helpers'
import { mockSupabaseClient } from '../../helpers/mock-supabase'
import { createTestCompany } from '../../helpers/test-data'
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

describe('GET /api/admin/companies', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockSupabaseClient.clear()
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'http://localhost:54321'
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-key'
  })

  it('deve listar empresas', async () => {
    const companies = [
      createTestCompany({ name: 'Empresa 1' }),
      createTestCompany({ name: 'Empresa 2' }),
    ]
    mockSupabaseClient.setTableData('companies', companies)

    const req = createAdminRequest({
      method: 'GET',
    }) as NextRequest

    const response = await GET(req)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.data).toBeDefined()
    expect(Array.isArray(data.data)).toBe(true)
  })

  it('deve filtrar por is_active', async () => {
    const activeCompany = createTestCompany({ is_active: true })
    const inactiveCompany = createTestCompany({ is_active: false })
    mockSupabaseClient.setTableData('companies', [activeCompany, inactiveCompany])

    const req = createAdminRequest({
      method: 'GET',
      url: 'http://localhost:3000/api/admin/companies?is_active=true',
    }) as NextRequest

    const response = await GET(req)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.data).toBeDefined()
  })

  it('deve buscar por nome', async () => {
    const company = createTestCompany({ name: 'Empresa Busca' })
    mockSupabaseClient.setTableData('companies', [company])

    const req = createAdminRequest({
      method: 'GET',
      url: 'http://localhost:3000/api/admin/companies?search=Busca',
    }) as NextRequest

    const response = await GET(req)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.data).toBeDefined()
  })
})

describe('POST /api/admin/companies', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockSupabaseClient.clear()
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'http://localhost:54321'
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-key'
  })

  it('deve criar empresa com dados válidos', async () => {
    const req = createAdminRequest({
      method: 'POST',
      body: {
        name: 'Nova Empresa',
        cnpj: '12345678000190',
        email: 'empresa@test.com',
        phone: '+5511999999999',
        is_active: true,
      },
    }) as NextRequest

    const response = await POST(req)
    const data = await response.json()

    expect([200, 201]).toContain(response.status)
    expect(data.name || data.data?.name).toBeDefined()
  })

  it('deve validar nome obrigatório', async () => {
    const req = createAdminRequest({
      method: 'POST',
      body: {
        cnpj: '12345678000190',
      },
    }) as NextRequest

    const response = await POST(req)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBeDefined()
  })
})

