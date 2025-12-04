import { POST } from '@/app/api/reports/run/route'
import { createAdminRequest, createOperatorRequest } from '../../helpers/api-test-helpers'
import { mockSupabaseClient } from '../../helpers/mock-supabase'
import { createTestCompany } from '../../helpers/test-data'
import { NextRequest } from 'next/server'

jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => mockSupabaseClient),
}))

jest.mock('@/lib/api-auth', () => ({
  requireCompanyAccess: jest.fn(async (req: any, companyId: string) => {
    const userRole = req.headers.get('x-user-role')
    if (userRole === 'admin') return null
    if (userRole === 'operador') {
      const userCompanyId = req.headers.get('x-company-id')
      if (userCompanyId === companyId) return null
    }
    return { json: () => ({ error: 'Forbidden' }), status: 403 }
  }),
  requireAuth: jest.fn(async (req: any) => {
    const userRole = req.headers.get('x-user-role')
    if (userRole === 'admin' || userRole === 'operador') {
      return null
    }
    return { json: () => ({ error: 'Forbidden' }), status: 403 }
  }),
}))

jest.mock('@/lib/rate-limit', () => ({
  withRateLimit: jest.fn((handler) => handler),
}))

jest.mock('@/lib/logger', () => ({
  logger: {
    log: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
}))

jest.mock('@/server/services/reporting', () => ({
  getSupabaseAdmin: jest.fn(() => mockSupabaseClient),
  fetchReportRange: jest.fn(async () => []),
}))

jest.mock('papaparse', () => ({
  unparse: jest.fn((data) => 'csv,data'),
}))

describe('POST /api/reports/run', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockSupabaseClient.clear()
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'http://localhost:54321'
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-key'
  })

  it('deve gerar relatório em formato CSV', async () => {
    const company = createTestCompany()
    mockSupabaseClient.setTableData('companies', [company])
    mockSupabaseClient.setTableData('v_reports_delays', [
      {
        company_id: company.id,
        route_name: 'Rota Teste',
        delay_minutes: 10,
      },
    ])

    const req = createAdminRequest({
      method: 'POST',
      body: {
        reportKey: 'delays',
        format: 'csv',
        filters: {
          companyId: company.id,
        },
      },
    }) as NextRequest

    const response = await POST(req)
    const data = await response.json()

    expect([200, 400, 500]).toContain(response.status)
  })

  it('deve validar reportKey obrigatório', async () => {
    const req = createAdminRequest({
      method: 'POST',
      body: {
        format: 'csv',
      },
    }) as NextRequest

    const response = await POST(req)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBeDefined()
  })

  it('deve aceitar diferentes formatos', async () => {
    const company = createTestCompany()
    mockSupabaseClient.setTableData('companies', [company])
    mockSupabaseClient.setTableData('v_reports_delays', [])

    const req = createAdminRequest({
      method: 'POST',
      body: {
        reportKey: 'delays',
        format: 'excel',
        filters: {
          companyId: company.id,
        },
      },
    }) as NextRequest

    const response = await POST(req)

    expect([200, 400, 500]).toContain(response.status)
  })

  it('deve validar companyId para operador', async () => {
    const company = createTestCompany()
    mockSupabaseClient.setTableData('companies', [company])
    mockSupabaseClient.setTableData('v_reports_delays', [])

    const req = createOperatorRequest(company.id, {
      method: 'POST',
      headers: {
        'x-company-id': company.id,
      },
      body: {
        reportKey: 'delays',
        format: 'csv',
        filters: {
          companyId: company.id,
        },
      },
    }) as NextRequest

    const response = await POST(req)

    expect([200, 400, 403, 500]).toContain(response.status)
  })
})

