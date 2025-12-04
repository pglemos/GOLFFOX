import { GET } from '@/app/api/admin/kpis/route'
import { createAdminRequest } from '../../helpers/api-test-helpers'
import { mockSupabaseClient } from '../../helpers/mock-supabase'

jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => mockSupabaseClient),
}))

jest.mock('@/lib/api-auth', () => ({
  requireAuth: jest.fn(async (req: any) => {
    const userRole = req.headers.get('x-user-role')
    if (userRole !== 'admin') {
      return { json: () => ({ error: 'Forbidden' }), status: 403 }
    }
    return null
  }),
}))

describe('GET /api/admin/kpis', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockSupabaseClient.clear()
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'http://localhost:54321'
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-key'
  })

  it('deve retornar KPIs da view materializada', async () => {
    const kpisData = [
      { total_trips: 100, active_users: 50, in_progress: 10, incidents: 5 },
    ]
    mockSupabaseClient.setTableData('v_admin_kpis_materialized', kpisData)

    const req = createAdminRequest({
      method: 'GET',
    })

    const response = await GET(req)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.kpis).toEqual(kpisData)
  })

  it('deve tentar view alternativa se primeira não existir', async () => {
    const kpisData = [{ total_trips: 50 }]
    mockSupabaseClient.setTableData('v_admin_kpis', kpisData)

    // Simular erro na primeira view
    const originalFrom = mockSupabaseClient.from
    let callCount = 0
    mockSupabaseClient.from = jest.fn((table: string) => {
      callCount++
      if (callCount === 1 && table === 'v_admin_kpis_materialized') {
        return {
          select: jest.fn().mockResolvedValue({
            data: null,
            error: { code: 'PGRST205' },
          }),
        } as any
      }
      return originalFrom.call(mockSupabaseClient, table)
    })

    const req = createAdminRequest({
      method: 'GET',
    })

    const response = await GET(req)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)

    mockSupabaseClient.from = originalFrom
  })

  it('deve retornar array vazio se nenhuma view disponível', async () => {
    const req = createAdminRequest({
      method: 'GET',
    })

    const response = await GET(req)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.kpis).toEqual([])
  })
})

