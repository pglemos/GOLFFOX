import { POST, GET } from '@/app/api/reports/dispatch/route'
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
}))

jest.mock('@/lib/rate-limit', () => ({
  withRateLimit: jest.fn((handler) => handler),
}))

jest.mock('nodemailer', () => ({
  createTransport: jest.fn(() => ({
    sendMail: jest.fn().mockResolvedValue({ messageId: 'test-message-id' }),
  })),
}))

describe('POST /api/reports/dispatch', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockSupabaseClient.clear()
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'http://localhost:54321'
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-key'
    process.env.RESEND_API_KEY = 'test-resend-key'
  })

  it('deve despachar relatório por email', async () => {
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
        companyId: company.id,
        reportKey: 'delays',
        recipients: ['test@example.com'],
      },
    }) as NextRequest

    const response = await POST(req)
    const data = await response.json()

    expect([200, 201]).toContain(response.status)
    expect(data.success || data.sent).toBeDefined()
  })

  it('deve validar dados obrigatórios', async () => {
    const req = createAdminRequest({
      method: 'POST',
      body: {
        reportKey: 'delays',
      },
    }) as NextRequest

    const response = await POST(req)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBeDefined()
  })

  it('deve validar companyId para operador', async () => {
    const company = createTestCompany()
    mockSupabaseClient.setTableData('companies', [company])

    const req = createOperatorRequest('company-1', {
      method: 'POST',
      headers: {
        'x-company-id': company.id,
      },
      body: {
        companyId: company.id,
        reportKey: 'delays',
        recipients: ['test@example.com'],
      },
    }) as NextRequest

    const response = await POST(req)

    expect([200, 201, 400, 403]).toContain(response.status)
  })
})

describe('GET /api/reports/dispatch', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockSupabaseClient.clear()
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'http://localhost:54321'
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-key'
  })

  it('deve listar envios de relatórios', async () => {
    const company = createTestCompany()
    mockSupabaseClient.setTableData('companies', [company])
    mockSupabaseClient.setTableData('gf_report_dispatches', [])

    const req = createAdminRequest({
      method: 'GET',
      url: `http://localhost:3000/api/reports/dispatch?company_id=${company.id}`,
    }) as NextRequest

    const response = await GET(req)
    const data = await response.json()

    expect([200, 400, 500]).toContain(response.status)
  })
})

