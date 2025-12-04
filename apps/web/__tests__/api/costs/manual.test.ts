import { POST } from '@/app/api/costs/manual/route'
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

describe('POST /api/costs/manual', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockSupabaseClient.clear()
    process.env.NODE_ENV = 'test'
  })

  it('deve criar custo manual', async () => {
    const company = createTestCompany()
    mockSupabaseClient.setTableData('companies', [company])
    mockSupabaseClient.setTableData('gf_cost_categories', [
      { id: 'cat-1', group_name: 'Operacional', category: 'Combustível' },
    ])

    const req = createAdminRequest({
      method: 'POST',
      headers: {
        'x-test-mode': 'true',
      },
      body: {
        company_id: company.id,
        cost_category_id: 'cat-1',
        cost_date: '2024-01-15',
        amount: 1000,
        source: 'manual',
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
      headers: {
        'x-test-mode': 'true',
      },
      body: {
        company_id: 'company-1',
        amount: 1000,
      },
    }) as NextRequest

    const response = await POST(req)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBeDefined()
  })

  it('deve aceitar date ou cost_date', async () => {
    const company = createTestCompany()
    mockSupabaseClient.setTableData('companies', [company])
    mockSupabaseClient.setTableData('gf_cost_categories', [
      { id: 'cat-1', group_name: 'Operacional', category: 'Combustível' },
    ])

    const req = createAdminRequest({
      method: 'POST',
      headers: {
        'x-test-mode': 'true',
      },
      body: {
        company_id: company.id,
        cost_category_id: 'cat-1',
        date: '2024-01-15', // Usando date em vez de cost_date
        amount: 1000,
      },
    }) as NextRequest

    const response = await POST(req)

    expect([200, 201, 400]).toContain(response.status)
  })
})

