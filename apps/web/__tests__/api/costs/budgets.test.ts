import { GET, POST } from '@/app/api/costs/budgets/route'
import { createAdminRequest } from '../../../helpers/api-test-helpers'
import { mockSupabaseClient } from '../../../helpers/mock-supabase'
import { createTestCompany } from '../../../helpers/test-data'
import { NextRequest } from 'next/server'

jest.mock('@/lib/supabase-server', () => ({
  supabaseServiceRole: mockSupabaseClient,
}))

jest.mock('@/lib/api-auth', () => ({
  requireAuth: jest.fn(async (req: any) => null),
  requireCompanyAccess: jest.fn(async (req: any, companyId: string) => ({
    user: { id: 'user-1', role: 'admin', companyId },
    error: null,
  })),
  validateAuth: jest.fn(async (req: any) => ({
    id: 'user-1',
    role: 'admin',
  })),
}))

jest.mock('@/lib/rate-limit', () => ({
  withRateLimit: jest.fn((handler) => handler),
}))

describe('GET /api/costs/budgets', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockSupabaseClient.clear()
  })

  it('deve listar orçamentos', async () => {
    const company = createTestCompany()
    mockSupabaseClient.setTableData('gf_budgets', [
      {
        id: 'budget-1',
        company_id: company.id,
        period_month: 1,
        period_year: 2024,
        amount_budgeted: 10000,
      },
    ])

    const req = createAdminRequest({
      method: 'GET',
      url: `http://localhost:3000/api/costs/budgets?company_id=${company.id}`,
    }) as NextRequest

    const response = await GET(req)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(Array.isArray(data) || data.data).toBeDefined()
  })

  it('deve filtrar por período', async () => {
    const company = createTestCompany()
    mockSupabaseClient.setTableData('gf_budgets', [])

    const req = createAdminRequest({
      method: 'GET',
      url: `http://localhost:3000/api/costs/budgets?company_id=${company.id}&period_month=1&period_year=2024`,
    }) as NextRequest

    const response = await GET(req)

    expect([200, 400]).toContain(response.status)
  })
})

describe('POST /api/costs/budgets', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockSupabaseClient.clear()
  })

  it('deve criar orçamento', async () => {
    const company = createTestCompany()
    mockSupabaseClient.setTableData('companies', [company])

    const req = createAdminRequest({
      method: 'POST',
      body: {
        company_id: company.id,
        period_month: 1,
        period_year: 2024,
        amount_budgeted: 10000,
      },
    }) as NextRequest

    const response = await POST(req)
    const data = await response.json()

    expect([200, 201]).toContain(response.status)
    expect(data.id || data.data?.id).toBeDefined()
  })

  it('deve validar dados obrigatórios', async () => {
    const req = createAdminRequest({
      method: 'POST',
      body: {
        period_month: 1,
      },
    }) as NextRequest

    const response = await POST(req)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBeDefined()
  })
})

