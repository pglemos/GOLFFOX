import { GET } from '@/app/api/costs/kpis/route'
import { createAdminRequest, createOperatorRequest } from '../../../helpers/api-test-helpers'
import { mockSupabaseClient } from '../../../helpers/mock-supabase'
import { createTestCompany } from '../../../helpers/test-data'

jest.mock('@/lib/supabase-server', () => ({
  supabaseServiceRole: mockSupabaseClient,
}))

jest.mock('@/lib/api-auth', () => ({
  requireAuth: jest.fn(async (req: any, roles?: string | string[]) => {
    const userRole = req.headers.get('x-user-role')
    if (!userRole) return { json: () => ({ error: 'Unauthorized' }), status: 401 }
    const allowedRoles = Array.isArray(roles) ? roles : [roles]
    if (roles && !allowedRoles.includes(userRole)) {
      return { json: () => ({ error: 'Forbidden' }), status: 403 }
    }
    return null
  }),
  validateAuth: jest.fn(async () => ({
    id: 'user-1',
    email: 'test@test.com',
    role: 'admin',
  })),
  requireCompanyAccess: jest.fn(async (req: any, companyId: string) => ({
    user: { id: 'user-1', role: 'operador', companyId },
    error: null,
  })),
}))

jest.mock('@/lib/rate-limit', () => ({
  withRateLimit: jest.fn((handler) => handler),
}))

describe('GET /api/costs/kpis', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockSupabaseClient.clear()
    process.env.NODE_ENV = 'test'
  })

  it('deve retornar KPIs de custos para company_id', async () => {
    const company = createTestCompany()
    const kpisData = {
      company_id: company.id,
      totalCosts: 10000,
      budget: 12000,
      variance: -2000,
    }

    mockSupabaseClient.setTableData('v_costs_kpis', [kpisData])
    mockSupabaseClient.setTableData('v_costs_vs_budget', [])

    const req = createAdminRequest({
      method: 'GET',
      url: `http://localhost:3000/api/costs/kpis?company_id=${company.id}`,
    })

    const response = await GET(req)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.company_id).toBe(company.id)
    expect(data.totalCosts).toBe(10000)
  })

  it('deve exigir company_id para operador', async () => {
    const req = createOperatorRequest('company-1', {
      method: 'GET',
      url: 'http://localhost:3000/api/costs/kpis',
    })

    const response = await GET(req)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe('company_id é obrigatório')
  })

  it('deve retornar valores padrão se não houver dados', async () => {
    const company = createTestCompany()
    mockSupabaseClient.setTableData('v_costs_kpis', [])

    const req = createAdminRequest({
      method: 'GET',
      url: `http://localhost:3000/api/costs/kpis?company_id=${company.id}`,
    })

    const response = await GET(req)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.totalCosts).toBe(0)
    expect(data.budget).toBe(0)
  })

  it('deve incluir dados de budget quando disponível', async () => {
    const company = createTestCompany()
    const kpisData = {
      company_id: company.id,
      totalCosts: 10000,
      budget: 12000,
      variance: -2000,
    }
    const budgetData = {
      company_id: company.id,
      budgeted_amount: 12000,
      actual_amount: 10000,
      variance_percent: -16.67,
    }

    mockSupabaseClient.setTableData('v_costs_kpis', [kpisData])
    mockSupabaseClient.setTableData('v_costs_vs_budget', [budgetData])

    const req = createAdminRequest({
      method: 'GET',
      url: `http://localhost:3000/api/costs/kpis?company_id=${company.id}`,
    })

    const response = await GET(req)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.budget_variance).toBeDefined()
    expect(data.budget_variance.budgeted).toBe(12000)
  })
})

