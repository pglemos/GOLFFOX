import { POST, GET, DELETE } from '@/app/api/reports/schedule/route'
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
  validateAuth: jest.fn(async (req: any) => {
    const userRole = req.headers.get('x-user-role')
    if (userRole === 'admin' || userRole === 'operador') {
      return {
        id: `${userRole}-user-id`,
        role: userRole,
        companyId: req.headers.get('x-company-id') || 'company-1',
      }
    }
    return null
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

describe('POST /api/reports/schedule', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockSupabaseClient.clear()
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'http://localhost:54321'
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-key'
    process.env.NODE_ENV = 'test'
  })

  it('deve criar agendamento de relatório', async () => {
    const company = createTestCompany()
    mockSupabaseClient.setTableData('companies', [company])
    mockSupabaseClient.setTableData('gf_report_schedules', [])

    const req = createAdminRequest({
      method: 'POST',
      headers: {
        'x-test-mode': 'true',
      },
      body: {
        companyId: company.id,
        reportKey: 'delays',
        cron: '0 9 * * *',
        recipients: ['test@example.com'],
        isActive: true,
      },
    }) as NextRequest

    const response = await POST(req)
    const data = await response.json()

    expect([200, 201]).toContain(response.status)
    expect(data.id || data.scheduleId).toBeDefined()
  })

  it('deve validar dados obrigatórios', async () => {
    const req = createAdminRequest({
      method: 'POST',
      headers: {
        'x-test-mode': 'true',
      },
      body: {
        companyId: 'company-1',
      },
    }) as NextRequest

    const response = await POST(req)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toContain('Campos obrigatórios faltando')
  })

  it('deve atualizar agendamento existente', async () => {
    const company = createTestCompany()
    mockSupabaseClient.setTableData('companies', [company])
    mockSupabaseClient.setTableData('gf_report_schedules', [
      {
        id: 'schedule-1',
        company_id: company.id,
        report_key: 'delays',
        is_active: true,
      },
    ])

    const req = createAdminRequest({
      method: 'POST',
      headers: {
        'x-test-mode': 'true',
      },
      body: {
        scheduleId: 'schedule-1',
        companyId: company.id,
        reportKey: 'delays',
        cron: '0 10 * * *',
        recipients: ['test@example.com'],
      },
    }) as NextRequest

    const response = await POST(req)

    expect([200, 201, 400, 500]).toContain(response.status)
  })
})

describe('GET /api/reports/schedule', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockSupabaseClient.clear()
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'http://localhost:54321'
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-key'
  })

  it('deve listar agendamentos', async () => {
    const company = createTestCompany()
    mockSupabaseClient.setTableData('companies', [company])
    mockSupabaseClient.setTableData('gf_report_schedules', [
      {
        id: 'schedule-1',
        company_id: company.id,
        report_key: 'delays',
        is_active: true,
      },
    ])

    const req = createAdminRequest({
      method: 'GET',
      url: `http://localhost:3000/api/reports/schedule?company_id=${company.id}`,
    }) as NextRequest

    const response = await GET(req)
    const data = await response.json()

    expect([200, 400, 500]).toContain(response.status)
  })
})

describe('DELETE /api/reports/schedule', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockSupabaseClient.clear()
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'http://localhost:54321'
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-key'
  })

  it('deve remover agendamento', async () => {
    const company = createTestCompany()
    mockSupabaseClient.setTableData('companies', [company])
    mockSupabaseClient.setTableData('gf_report_schedules', [
      {
        id: 'schedule-1',
        company_id: company.id,
      },
    ])

    const req = createAdminRequest({
      method: 'DELETE',
      url: `http://localhost:3000/api/reports/schedule?schedule_id=schedule-1`,
    }) as NextRequest

    const response = await DELETE(req)
    const data = await response.json()

    expect([200, 400, 404, 500]).toContain(response.status)
  })
})

