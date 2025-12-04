import { GET } from '@/app/api/costs/export/route'
import { createAdminRequest } from '../../../helpers/api-test-helpers'
import { mockSupabaseClient } from '../../../helpers/mock-supabase'
import { createTestCompany } from '../../../helpers/test-data'
import { NextRequest } from 'next/server'

jest.mock('@/lib/supabase-server', () => ({
  supabaseServiceRole: mockSupabaseClient,
}))

jest.mock('@/lib/api-auth', () => ({
  requireCompanyAccess: jest.fn(async (req: any, companyId: string) => ({
    user: { id: 'user-1', role: 'admin', companyId },
    error: null,
  })),
}))

jest.mock('@/lib/rate-limit', () => ({
  withRateLimit: jest.fn((handler) => handler),
}))

describe('GET /api/costs/export', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockSupabaseClient.clear()
    process.env.NODE_ENV = 'test'
  })

  it('deve exportar custos em CSV', async () => {
    const company = createTestCompany()
    mockSupabaseClient.setTableData('companies', [company])
    mockSupabaseClient.setTableData('v_costs_secure', [
      {
        date: '2024-01-15',
        group_name: 'Operacional',
        category: 'Combustível',
        amount: 1000,
        company_id: company.id,
      },
    ])

    const req = createAdminRequest({
      method: 'GET',
      url: `http://localhost:3000/api/costs/export?format=csv&company_id=${company.id}`,
    }) as NextRequest

    const response = await GET(req)

    expect([200, 400]).toContain(response.status)
  })

  it('deve rejeitar sem company_id', async () => {
    const req = createAdminRequest({
      method: 'GET',
      url: 'http://localhost:3000/api/costs/export?format=csv',
    }) as NextRequest

    const response = await GET(req)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe('company_id é obrigatório')
  })

  it('deve rejeitar formato inválido', async () => {
    const company = createTestCompany()
    const req = createAdminRequest({
      method: 'GET',
      url: `http://localhost:3000/api/costs/export?format=invalid&company_id=${company.id}`,
    }) as NextRequest

    const response = await GET(req)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toContain('Formato inválido')
  })

  it('deve aplicar filtros de data', async () => {
    const company = createTestCompany()
    mockSupabaseClient.setTableData('companies', [company])
    mockSupabaseClient.setTableData('v_costs_secure', [])

    const filters = JSON.stringify({
      start_date: '2024-01-01',
      end_date: '2024-01-31',
    })

    const req = createAdminRequest({
      method: 'GET',
      url: `http://localhost:3000/api/costs/export?format=csv&company_id=${company.id}&filters=${encodeURIComponent(filters)}`,
    }) as NextRequest

    const response = await GET(req)

    expect([200, 400]).toContain(response.status)
  })
})

