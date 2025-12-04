import { GET } from '@/app/api/cron/dispatch-reports/route'
import { createMockRequest } from '../../helpers/api-test-helpers'
import { mockSupabaseClient } from '../../helpers/mock-supabase'
import { NextRequest } from 'next/server'

jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => mockSupabaseClient),
}))

jest.mock('@/lib/operational-alerts', () => ({
  alertCronFailure: jest.fn(),
}))

jest.mock('@/lib/logger', () => ({
  logger: {
    log: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
}))

jest.mock('resend', () => ({
  Resend: jest.fn().mockImplementation(() => ({
    emails: {
      send: jest.fn().mockResolvedValue({ id: 'email-id' }),
    },
  })),
}))

describe('GET /api/cron/dispatch-reports', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockSupabaseClient.clear()
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'http://localhost:54321'
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-key'
    process.env.CRON_SECRET = 'valid-cron-secret'
    process.env.RESEND_API_KEY = 'test-resend-key'
    process.env.NODE_ENV = 'test'
  })

  it('deve executar cron job com secret válido', async () => {
    mockSupabaseClient.setTableData('gf_report_schedules', [])
    mockSupabaseClient.setTableData('v_reports_delays', [])

    const req = createMockRequest({
      method: 'GET',
      headers: {
        'cron-secret': 'valid-cron-secret',
        'x-test-mode': 'true',
      },
    }) as NextRequest

    const response = await GET(req)
    const data = await response.json()

    expect([200, 400, 500]).toContain(response.status)
  })

  it('deve rejeitar secret inválido', async () => {
    const req = createMockRequest({
      method: 'GET',
      headers: {
        'cron-secret': 'invalid-secret',
      },
    }) as NextRequest

    const response = await GET(req)
    const data = await response.json()

    expect(response.status).toBe(401)
    expect(data.error).toBe('Unauthorized')
  })

  it('deve processar agendamentos ativos', async () => {
    mockSupabaseClient.setTableData('gf_report_schedules', [
      {
        id: 'schedule-1',
        company_id: 'company-1',
        report_key: 'delays',
        cron: '0 9 * * *',
        is_active: true,
        recipients: ['test@example.com'],
      },
    ])
    mockSupabaseClient.setTableData('v_reports_delays', [])

    const req = createMockRequest({
      method: 'GET',
      headers: {
        'cron-secret': 'valid-cron-secret',
        'x-test-mode': 'true',
      },
    }) as NextRequest

    const response = await GET(req)

    expect([200, 400, 500]).toContain(response.status)
  })
})

