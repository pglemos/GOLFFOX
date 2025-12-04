import { GET } from '@/app/api/cron/refresh-costs-mv/route'
import { createMockRequest } from '../../helpers/api-test-helpers'
import { mockSupabaseClient } from '../../helpers/mock-supabase'
import { NextRequest } from 'next/server'

jest.mock('@/lib/supabase-server', () => ({
  supabaseServiceRole: mockSupabaseClient,
}))

describe('GET /api/cron/refresh-costs-mv', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockSupabaseClient.clear()
    process.env.CRON_SECRET = 'valid-cron-secret'
  })

  it('deve executar refresh de MV de custos com autenticação válida', async () => {
    mockSupabaseClient.setRPCHandler('refresh_mv_costs_monthly', async () => ({
      data: null,
      error: null,
    }))

    const req = createMockRequest({
      method: 'GET',
      headers: {
        authorization: 'Bearer valid-cron-secret',
      },
    }) as NextRequest

    const response = await GET(req)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
  })

  it('deve rejeitar sem autenticação', async () => {
    const req = createMockRequest({
      method: 'GET',
    }) as NextRequest

    const response = await GET(req)
    const data = await response.json()

    expect(response.status).toBe(401)
    expect(data.error).toBe('Unauthorized')
  })

  it('deve rejeitar se CRON_SECRET não configurado', async () => {
    delete process.env.CRON_SECRET

    const req = createMockRequest({
      method: 'GET',
    }) as NextRequest

    const response = await GET(req)
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data.error).toBe('CRON_SECRET não configurado')
  })

  it('deve lidar com erro na função RPC', async () => {
    mockSupabaseClient.setRPCHandler('refresh_mv_costs_monthly', async () => ({
      data: null,
      error: {
        message: 'Database error',
      },
    }))

    const req = createMockRequest({
      method: 'GET',
      headers: {
        authorization: 'Bearer valid-cron-secret',
      },
    }) as NextRequest

    const response = await GET(req)
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data.error).toBeDefined()
  })
})

