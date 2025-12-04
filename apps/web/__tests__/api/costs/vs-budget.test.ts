import { GET } from '@/app/api/costs/vs-budget/route'
import { createAdminRequest } from '../../../helpers/api-test-helpers'
import { mockSupabaseClient } from '../../../helpers/mock-supabase'
import { createTestCompany } from '../../../helpers/test-data'
import { NextRequest } from 'next/server'

jest.mock('@/lib/supabase-server', () => ({
  supabaseServiceRole: mockSupabaseClient,
}))

describe('GET /api/costs/vs-budget', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockSupabaseClient.clear()
  })

  it('deve buscar comparação custos vs orçamento', async () => {
    const company = createTestCompany()
    mockSupabaseClient.setTableData('v_costs_vs_budget', [
      {
        company_id: company.id,
        period_month: 1,
        period_year: 2024,
        amount_budgeted: 10000,
        amount_actual: 8500,
        variance: -1500,
      },
    ])

    const req = createAdminRequest({
      method: 'GET',
      url: `http://localhost:3000/api/costs/vs-budget?company_id=${company.id}`,
    }) as NextRequest

    const response = await GET(req)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.data).toBeDefined()
    expect(Array.isArray(data.data)).toBe(true)
  })

  it('deve rejeitar sem company_id', async () => {
    const req = createAdminRequest({
      method: 'GET',
      url: 'http://localhost:3000/api/costs/vs-budget',
    }) as NextRequest

    const response = await GET(req)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe('company_id é obrigatório')
  })

  it('deve ordenar por período', async () => {
    const company = createTestCompany()
    mockSupabaseClient.setTableData('v_costs_vs_budget', [
      {
        company_id: company.id,
        period_month: 1,
        period_year: 2024,
        amount_budgeted: 10000,
        amount_actual: 8500,
      },
      {
        company_id: company.id,
        period_month: 2,
        period_year: 2024,
        amount_budgeted: 12000,
        amount_actual: 11000,
      },
    ])

    const req = createAdminRequest({
      method: 'GET',
      url: `http://localhost:3000/api/costs/vs-budget?company_id=${company.id}`,
    }) as NextRequest

    const response = await GET(req)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.data).toBeDefined()
  })
})

